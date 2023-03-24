/**
 * All classes defined in Kekule
 * @module app_core/kekule
 */

import { HistoryTree } from "./history_tree.mjs";
import { GHSC } from "../ghs_data/ghs_data.mjs";
import { compRecs, sortedAdd, MapTools } from "./utilities.mjs";


/**
 * Help construct a classed object from a class-less object.
 * @param {object} _this The "this" object pointer of a class.
 * @param {object} initDict The class-less object to initialize the classed object from.
 */
function initObj(_this, initDict)
{
    // If an initialization dictionary is given
    if (initDict)
    {
        // For each property given
        for (const key of Object.keys(initDict))
        {
            // {<Property name>: {constructor: <Class>, isArray: <Boolean>}};

            // If the class's init list exists
            if (_this.initList)
            {
                // If init steps exist for a particular property
                if (_this.initList[key])
                {
                    // If the property is an array of objects
                    if (Array.isArray(initDict[key]))
                    {
                        // Clear the array
                        if (_this[key])
                        {
                            _this[key].splice(0);
                        }
                        else
                        {
                            _this[key] = [];
                        }

                        // Iteration
                        for (const obj of initDict[key])
                        {
                            _this[key].push(new _this.initList[key].constructor(obj))
                        }
                    }
                    // If the property is an object
                    else
                    {
                        // Catch for BigInt
                        try
                        {
                            _this[key] = new _this.initList[key].constructor(initDict[key]);
                        }
                        catch (e)
                        {
                            if (e instanceof TypeError)
                            {
                                // Initialize a BigInt
                                _this[key] = _this.initList[key].constructor(initDict[key]);
                            }
                            else
                            {
                                throw e;
                            }
                        }
                    }
                }
                else
                {
                    // Non-class assignment
                    _this[key] = structuredClone(initDict[key]);
                }
            }
            else
            {
                // Non-class assignment
                _this[key] = structuredClone(initDict[key]);
            }
        }
    }
}

/** Class representing an abstract record that contains a name and a "Last Edited" date. */
class Record
{
    /**
     * Date of the edit
     * @type {string}
     */
    editDate;

    // Name of the record
    #name;

    /**
     * Set name of the record
     * @param {string} value The value to set
     */
    set name(value)
    {
        this.#name = value;
        this.editDate = new Date().toLocaleString();
        
        // TODO: register edit to history
    }

    /**
     * Get name of the record
     * @returns {string} The name of the record
     */
    get name()
    {
        return this.#name;
    }

    constructor(dict)
    {
        initObj(this, dict);
    }
}

/** Class representing an abstract sub-item that contains tags. */
class SubItem extends Record
{
    /**
     * Tags assigned to this sub-item.
     * @type {Array<Tag>}
     */
    tags = [];

    /**
     * The initialization list for this class, to help with deserialization.
     * @type {Object<string,Object<object,boolean>>}
     */
    initList = {tags: {constructor: Tag, isArray: true}};

    constructor(dict)
    {
        super(dict);
        initObj(this, dict)
    }
}

/** Class representing an abstract item that contains sub-items. */
class Item extends Record
{
    /**
     * The list of sub-items assigned to this item.
     * @type {Array<SubItem>}
     */
    subitems = [];

    /**
     * Notes recorded on this item.
     * @type {string}
     */
    notes = "";

    /**
     * BigInt-based base-36 sequential ID assigned to the item.
     * @type {string}
     */
    ID;

    /**
     * Add a sub-item to the end of the list of sub-items.
     * @param {SubItem} item Item to add
     */
    addSubItem(item)
    {
        sortedAdd(item, this.subitems, compRecs);

        // TODO: register adding to history
    }

    /**
     * Remove a sub-item in the list of sub-items.
     * @param {number} index The index of the sub-item to remove
     */
    removeSubItem(index)
    {
        this.subitems.splice(index, 1);

        // TODO: register removing to history
    }

    /**
     * The initialization list for this class, to help with deserialization.
     * @type {Object<string,Object<object,boolean>>}
     */
    initList = {subitems: {constructor: SubItem, isArray: true}};

    constructor(dict)
    {
        super(dict);
        initObj(this, dict);
    }
}

/** Class representing an action that can be done and undone. */
class Action
{
    // Initialization list not included, as it will not be deserialized
    // (same is true for AddAction, EditAction, and DeleteAction)

    /**
     * Integral index or string ID of the action performed, on the Item array level.
     * @type {number|string}
     */
    majorLocation = NaN;

    /**
     * Object that the actionn was being performed on.
     * @type {Item | SubItem}
     */
    majorObj = null;

    /**
     * Integral index of the action performed, on the SubItem array level.
     * @type {number}
     */
    minorLocation = NaN;

    /**
     * Source inventory of which the action is performed on.
     * @type {Inventory}
     */
    source;

    /**
     * Un-perform an action
     */
    unperform()
    {
        // throw an error here (function not overloaded)
        throw ReferenceError("unperform() is not overloaded.");
    }

    /**
     * Perform an action
     */
    perform()
    {
        // throw an error here (function not overloaded)
        throw ReferenceError("perform() is not overloaded.");
    }

    // Shorthand for the full sortedAdd implementation
    #halfAdd(item, source)
    {
        return sortedAdd(item, source, compRecs);
    }

    // Shorthand for item/subitem adding
    _add(item)
    {
        // Add chemical
        if (item instanceof Chemical)
        {
            this.majorLocation = this.#halfAdd(item, this.source.chemicals);
            MapTools.register(this.source.chemicalsMap, item, this.source);
        }
        // Add specific chemical
        else if (item instanceof SpecificChemical)
        {
            this.minorLocation = this.#halfAdd(item, this.majorObj);
        }
        // Add container
        else if (item instanceof Container)
        {
            this.majorObj.containers.push(item);
        }
        // Add apparatus
        else if (item instanceof Apparatus)
        {
            this.majorLocation = this.#halfAdd(item, this.source.apparatuses);
            MapTools.register(this.source.apparatusesMap, item, this.source);
        }
        // Add specific apparatus
        else if (item instanceof SpecificApparatus)
        {
            this.minorLocation = this.#halfAdd(item, this.majorObj);
        }
        else
        {
            throw EvalError("Invalid type of added object.");
        }
    }

    // Shorthand for item/subitem deleting
    _delete(item)
    {
        // Delete chemical
        if (item instanceof Chemical)
        {
            this.source.chemicals.splice(this.majorLocation, 1);
            MapTools.deregister(this.source.chemicalsMap, item);
        }
        // Delete specific chemical
        else if (item instanceof SpecificChemical)
        {
            this.majorObj.subitems.splice(this.minorLocation, 1);
        }
        // Delete container
        else if (item instanceof Container)
        {
            // Delete from the back
            this.majorObj.containers.splice(this.minorLocation, 1);
        }
        // Delete apparatus
        else if (item instanceof Apparatus)
        {
            this.source.apparatuses.splice(this.majorLocation, 1);
            MapTools.deregister(this.source.apparatusesMap, item);
        }
        // Delete specific apparatus
        else if (item instanceof SpecificApparatus)
        {
            this.majorObj.subitems.splice(this.minorLocation, 1);
        }
        else
        {
            throw EvalError("Invalid type of added object.");
        }
    }

    get performFullAdd()
    {
        return this._add;
    }

    get performFullDelete()
    {
        return this._delete;
    }

    /**
     * Create an action.
     * @param {Inventory} source The source inventory to perform the action.
     */
    constructor(source)
    {
        this.source = source;
    }
}

/** Class representing an action of adding a data record. */
class AddAction extends Action
{
    /**
     * The item or subitem that was added
     * @type {Item | SubItem}
     */
    added;

    /**
     * Create an AddAction.
     * @param {Item | SubItem | Container} obj The object to add.
     * @param {Inventory} source The source inventory to perform the action.
     * @param {Item | SubItem | null} majorObj The major location inside an Item array, if the object added is a SubItem or a Container
     */
    constructor(obj, source, majorObj)
    {
        super(source);
        this.added = obj;
        if (obj instanceof SubItem)
        {
            this.majorObj = majorObj;
        }
        else if (obj instanceof Container)
        {
            // Containers are always appended
            this.majorObj = majorObj;
        }
    }

    // Unperform the adding
    unperform()
    {
        this.performFullDelete(this.added);
    }

    // Perform the adding
    perform()
    {
        this.performFullAdd(this.added);
    }
}

/** Class representing an action of editing a data record. */
class EditAction extends Action
{
    /**
     * The property of the object being edited
     * @type {string}
     */
    property;

    /**
     * The property value before the edit
     * @type {any}
     */
    from;
    /**
     * The property value after the edit
     * @type {any}
     */
    to;

    /**
     * Create an EditAction.
     * @param {Inventory} source The source inventory to perform the action.
     * @param {Item | SubItem | Container} majorObj The Object that is being edited
     * @param {string} property The string of the property name to edit
     * @param {any} to The value of the edit
     */
    constructor(source, majorObj, property, to)
    {
        super(source);
        this.majorObj = majorObj;
        this.property = property;
        this.from = majorObj[this.property];
        this.to = to;
    }

    // Unperform the action
    unperform()
    {
        this.majorObj[this.property] = this.from;
    }

    // Performm the action
    perform()
    {
        this.majorObj[this.property] = this.to;
    }
}

/** Class representing an action of deleting a data record. */
class DeleteAction extends Action
{
    /**
     * The item or subitem that was deleted
     * @type {Item | SubItem}
     */
    deleted;

    /**
     * Create an DeleteAction.
     * @param {Item | SubItem} obj The object to delete.
     * @param {Inventory} source The source inventory to perform the action.
     * @param {Item | SubItem | null} majorObj The major location inside an Item array, if the object deleted is a SubItem or a Container
     * @param {number} minorLoc The minor location, if the object deleted is a SubItem
     */
    constructor(obj, source, majorObj, minorLoc)
    {
        super(source);
        this.deleted = obj;
        

        // Find the major location
        if (obj instanceof Chemical)
        {
            this.majorLocation = this.source.chemicals.findIndex((item) => item.ID == obj.ID);
        }
        else if (obj instanceof SpecificChemical || obj instanceof SpecificApparatus)
        {
            this.minorLocation = minorLoc;
            this.majorObj = majorObj;
        }
        else if (obj instanceof Container)
        {
            this.minorLocation = minorLoc;
            this.majorObj = majorObj;
        }
        else if (obj instanceof Apparatus)
        {
            this.majorLocation = this.source.apparatuses.findIndex((item) => {item.ID == obj.ID});
        }
        else
        {
            throw TypeError(`Attempted to create a DeleteAction on an invalid object.`)
        }
    }

    // Unperform the deletion
    unperform()
    {
        this.performFullAdd(this.deleted);
    }

    // Perform the deletion
    perform()
    {
        this.performFullDelete(this.deleted);
    }
}

/** Class representing a tag that has a name and a color. */
class Tag
{
    #name;

    /**
     * Set name of the tag
     * @param {string} value The value to set
     */
    set name(value)
    {
        this.#name = value;

        // TODO: register edit to history
    }

    get name()
    {
        return this.#name;
    }

    /**
     * The RGB color of the tag, represented as "#" with a hexademical value
     * @type {string}
     */
    color;

    constructor(dict)
    {
        initObj(this, dict);
    }
}

/** Class representing a chemical. */
class Chemical extends Item
{
    /**
     * The molecular formula of the chemical.
     * @type {string}
     */
    formula = "";

    /**
     * The list of GHS pictograms assigned to this chemical.
     * @type {Array<GHSPictogram>}
     */
    GHSPictograms = [];

    /**
     * The list of GHS hazard and precautionary codes assigned to this chemical.
     * @type {Array<GHSCode>}
     */
    GHSCodes = [];

    /**
     * The NFPA 704 Diamond attached to this chemical.
     * @type {NFPADiamond}
     */
    NFPADiamond = new NFPADiamond();

    // 
    /**
     * Sub-items are of type SpecificChemical (redeclaration)
     * @type {Array<SpecificChemical>}
     */
    subitems = [];

    /**
     * The initialization list for this class, to help with deserialization.
     * @type {Object<string,Object<object,boolean>>}
     */
    initList = 
    {
        GHSPictograms: {constructor: GHSPictogram, isArray: true},
        GHSCodes: {constructor: GHSCode, isArray: true},
        NFPADiamond: {constructor: NFPADiamond, isArray: false},
        subitems: {constructor: SpecificChemical, isArray: true}
    };

    constructor(dict)
    {
        super(dict);
        initObj(this, dict);
    }
}

/** Class representing a specific chemical. */
class SpecificChemical extends SubItem
{
    /**
     * The containers assigned to this specific chemical.
     * @type {Array<Container>}
     */
    containers = [];

    /**
     * The text descriptions of this specific chemical.
     * @type {string}
     */
    specifications = "";

    /**
     * The initialization list for this class, to help with deserialization.
     * @type {Object<string,Object<object,boolean>>}
     */
    initList = {containers: {constructor: Container, isArray: true}};

    constructor(dict)
    {
        super(dict);
        initObj(this, dict);
    }
}

/** Class representing a container. */
class Container
{
    /**
     * The number of this container.
     * @type {number}
     */
    count;

    /**
     * The numeric part of the capacity for one container.
     * @type {number}
     */
    unitCapacity;

    /**
     * The total remaining amount for this container.
     * @type {number}
     */
    remaining;

    /**
     * The unit part of the capacity for one container.
     * @type {string}
     */
    capacityUnit;

    constructor(dict)
    {
        initObj(this, dict);
    }
}

/** Class representing a GHS Pictogram. */
class GHSPictogram
{
    // The identifier (1 to 9) of this GHS pictogram
    #identifier;

    /**
     * Set the identifier of this GHS pictogram.
     * @param {number} value The identifier to set to.
     */
    set identifier(value)
    {
        if (value >= 1 && value <= 9)
            this.#identifier = value;
        else
            throw RangeError(`${value} is not a valid GHS pictogram identifier.`);
    }

    /**
     * Get the identifier of this GHS pictogram.
     * @returns {number} The identifier.
     */
    get identifier()
    {
        return this.#identifier;
    }

    /**
     * Get the SVG path from PubChem that corresponds to this GHS pictogram.
     * @returns {string} The SVG URL.
     */
    get image()
    {
        return `https://pubchem.ncbi.nlm.nih.gov/images/ghs/GHS0${this.#identifier}.svg`;
    }

    /**
     * Get the description text that corresponds to this GHS pictogram.
     * @returns {"Explosives" | "Flammables" | "Oxidizers" | "Compressed Gases" | "Corrosives" | "Acute Toxidity" | "Irritant" | "Health Hazard" | "Environmental Hazard"} The description text.
     */
    get text()
    {
        switch (this.#identifier)
        {
            case 1:
                return "Explosives";

            case 2:
                return "Flammables";

            case 3:
                return "Oxidizers";

            case 4:
                return "Compressed Gases";

            case 5:
                return "Corrosives";

            case 6:
                return "Acute Toxidity";

            case 7:
                return "Irritant";

            case 8:
                return "Health Hazard";

            case 9:
                return "Environmental Hazard";

            default:
                throw RangeError(`${this.#identifier} is not a valid GHS pictogram identifier.`);
        }
    }

    /**
     * Create a GHS pictogram from a numeric identifier from 1 to 9.
     * @param {Object<string, nummber>} dict The number in the form of {identifier: NUMBER}.
     */
    constructor(dict)
    {
        initObj(this, dict);
    }
}

/** Class representing a GHS Hazard or Precautionary Code. */
class GHSCode
{
    /**
     * The letter prefix ("H" or "P") of the code.
     * @type {"H" | "P"}
     */
    #prefix = "";

    /**
     * The numeric/alphanumeric component of the code.
     * @type {string}
     */
    #numeric;

    /**
     * Get the description text from PubChem that corresponds to this code.
     * @returns {string} The description text.
     */
    get text()
    {
        if (this.#prefix == "H")
        {
            return GHSC.H[this.#prefix + this.#numeric];
        }
        else if (this.#prefix == "P")
        {
            return GHSC.P[this.#prefix + this.#numeric];
        }
        else
        {
            throw EvalError(`${this.#prefix} is not a valid GHS prefix.`);
        }
    }

    /**
     * Set the prefix and numeric components of this code from a full string.
     * @param {string} value The full string to interpret.
     */
    set code(value)
    {
        // If the argument is a string
        if (typeof value === "string")
        {
            // If the string has a valid prefix
            if (value[0] === "H" || value[0] === "P")
            {
                this.#prefix = value[0];
                this.#numeric = value.slice(1);
            }
            else
            {
                throw TypeError(`"${value}" is not a valid GHS hazard or precautionary code.`);
            }
        }
        else
        {
            throw TypeError(`"${value}" is not a valid GHS hazard or precautionary code.`);
        }
    }

    /**
     * Get the full string of this code.
     * @returns {string} The full string.
     */
    get code()
    {
        return this.#prefix + this.#numeric;
    }

    constructor(dict)
    {
        initObj(this, dict);
    }
}

/** Class representing an NFPA 704 diamond. */
class NFPADiamond
{
    /**
     * Health rating.
     * @type {0|1|2|3|4}
     */
    healthRating;
    /**
     * Fire rating.
     * @type {0|1|2|3|4}
     */
    fireRating;
    /**
     * Instability rating.
     * @type {0|1|2|3|4}
     */
    instabilityRating;
    /**
     * Specific hazard (e.g. OX, SA, W)
     * @type {string}
     */
    specialConsiderations;

    getHealthMsg()
    {

    }

    getFireMsg()
    {
        
    }

    getInstabilityMsg()
    {
        
    }

    getSpecHazardMsg()
    {
        
    }

    constructor(dict)
    {
        initObj(this, dict);
    }
}

/** Class representing an apparatus. */
class Apparatus extends Item
{
    // Nothing is in here! Everything is inherited from "Item".

    /**
     * Sub-items are of type SpecificApparatus (redeclaration)
     * @type {Array<SpecificApparatus>}
     */
    subitems = [];

    /**
     * The initialization list for this class, to help with deserialization.
     * @type {Object<string,Object<object,boolean>>}
     */
    initList = {subitems: {constructor: SpecificApparatus, isArray: true}};

    constructor(dict)
    {
        super(dict);
        initObj(this, dict);
    }
}

/** Class representing a specific apparatus. */
class SpecificApparatus extends SubItem
{
    /**
     * The count of this specific apparatus.
     * @type {number}
     */
    count = 0;

    /**
     * The specifications of this specific apparatus.
     * @type {string}
     */
    specifications = "";

    constructor(dict)
    {
        super(dict);
        initObj(this, dict);
    }
}

/** Class representing an inventory that contains chemicals, apparatuses, and miscallenous information like history. */
class Inventory
{
    /** 
     * The major version
     * @type {number}
    */
    majorVer = 1;

    /** 
     * The minor version
     * @type {number}
    */
    minorVer = 0;

    /** 
     * The list of chemicals
     * @type {Array<Chemical>}
    */
    chemicals = [];

    /**
     * The map of IDs to chemical references to the "chemicals" array
     * @type {Map<string, Chemical>}
     */
    chemicalsMap = new Map();

    /** 
     * The list of aparatuses
     * @type {Array<Apparatus>}
    */
    apparatuses = [];

    /**
     * The map of IDs to apparatus references to the "apparatuses" array
     * @type {Map<string, Apparatus>}
     */
    apparatusesMap = new Map();

    /** 
     * The list of chemical histories
     * @type {HistoryTree}
    */
    chemHistories = new HistoryTree();

    /** 
     * The list of apparatus histories
     * @type {HistoryTree}
    */
    appaHistories = new HistoryTree();

    /**
     * The next avilable sequential ID to assign to a new Item (Chemical or Apparatus)
     * @type {BigInt}
     */
    nextID = 0n;

    /**
     * Create an inventory.
     * @param {object?} dict Optional dictionary to create the inventory from
     */
    constructor(dict)
    {
        initObj(this, dict);
    }

    /**
     * Compare between two inventories
     * @param {Inventory} a the first inventory
     * @param {Inventory} b the second inventory
     * @return {Array<Action>} the list of actions to apply to the first inventory to get the second inventory
     */
    static compare(a, b)
    {

    }

    getChemicalsCSV()
    {

    }

    getApparatusesCSV()
    {

    }

    importChemicalsCSV()
    {

    }

    importApparatusesCSV()
    {

    }

    /**
     * The initialization list for this class, to help with deserialization.
     * @type {Object<string,Object<object,boolean>>}
     */
    initList = 
    {
        chemicals: {constructor: Chemical, isArray: true},
        apparatuses: {constructor: Apparatus, isArray: true},
        nextID: {constructor: BigInt, isArray: false}
    };
}

export
{
    Action, AddAction, EditAction, DeleteAction, Tag,
    Chemical, SpecificChemical, Container, GHSPictogram, GHSCode,
    Apparatus, SpecificApparatus,
    Inventory,
    Record, Item
}
