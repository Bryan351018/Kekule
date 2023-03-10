/**
 * All classes defined in Kekule
 * @module app_core/kekule
 */

import { HistoryTree } from "./history_tree.mjs";
import { GHSC } from "../ghs_data/ghs_data.mjs";
import { compRecs, sortedAdd } from "./utilities.mjs";

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
}

/** Class representing an abstract sub-item that contains tags. */
class SubItem extends Record
{
    /**
     * Tags assigned to this sub-item.
     * @type {Array<Tag>}
     */
    tags = [];
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
     * UUID assigned to the item.
     * @type {string}
     */
    UUID;

    /**
     * Add a sub-item to the end of the list of sub-items.
     * @param {SubItem} item Item to add
     */
    addSubItem(item)
    {
        this.subitems.push(item);

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
}

/** Class representing an action that can be done and undone. */
class Action
{
    /**
     * Integral index of the action performed, on the Item array level.
     * @type {number}
     */
    majorLocation = NaN;

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
     * @param {Item | SubItem} obj The object to add.
     * @param {Inventory} source The source inventory to perform the action.
     * @param {number?} majorLoc The major location inside an Item array, if the object added is a SubItem
     */
    constructor(obj, source, majorLoc)
    {
        super(source);
        this.added = obj;
        if (obj instanceof SubItem)
        {
            this.majorLocation = majorLoc;
        }
    }

    // Unperform the adding
    unperform()
    {
        // Delete chemical
        if (this.added instanceof Chemical)
        {
            this.source.chemicals.splice(this.majorLocation, 1);
        }
        // Delete specific chemical
        else if (this.added instanceof SpecificChemical)
        {
            this.source.chemicals[this.majorLocation].subitems[this.minorLocation].splice(this.minorLocation, 1);
        }
        // Delete apparatus
        else if (this.added instanceof Apparatus)
        {
            this.source.apparatuses.splice(this.majorLocation, 1);
        }
        // Delete specific apparatus
        else if (this.added instanceof SpecificApparatus)
        {
            this.source.apparatuses[this.majorLocation].subitems[this.minorLocation].splice(this.minorLocation, 1);
        }
        else
        {
            throw EvalError("Invalid type of added object.");
        }
    }

    // Perform the adding
    perform()
    {
        // Add chemical
        if (this.added instanceof Chemical)
        {
            this.majorLocation = sortedAdd(this.added, this.source.chemicals, compRecs);
        }
        // Add specific chemical
        else if (this.added instanceof SpecificChemical)
        {
            this.minorLocation = sortedAdd(this.added, this.source.chemicals[this.majorLocation], compRecs);
        }
        // Add apparatus
        else if (this.added instanceof Apparatus)
        {
            this.majorLocation = sortedAdd(this.added, this.source.apparatuses, compRecs);
        }
        // Add specific apparatus
        else if (this.added instanceof SpecificApparatus)
        {
            this.minorLocation = sortedAdd(this.added, this.source.apparatuses[this.majorLocation], compRecs);
        }
        else
        {
            throw EvalError("Invalid type of added object.");
        }
    }
}

/** Class representing an action of editing a data record. */
class EditAction extends Action
{
    /**
     * The item or subitem before the edit
     * @type {Item | SubItem}
     */
    from;
    /**
     * The item or subitem after the edit
     * @type {Item | SubItem}
     */
    to;
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
     */
    constructor(obj)
    {
        super();
        this.deleted = obj;
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
     * The RGB color of the tag
     */
    color;
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
    NFPADiamond;
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
}

/** Class representing a GHS Pictogram. */
class GHSPictogram
{
    // The identifier (1 to 9) of this GHS pictogram
    #identifier;

    /**
     * Create a GHS pictogram from a numeric identifier from 1 to 9.
     * @param {number} id The identifier to set to.
     */
    constructor(id)
    {
        this.#identifier = id;
    }

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
}

/** Class representing an apparatus. */
class Apparatus extends Item
{
    // Nothing is in here! Everything is inherited from "Item".
}

/** Class representing a specific apparatus. */
class SpecificApparatus extends SubItem
{
    count;
    specifications = "";
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
     * The map of UUIDs to "Chemical" object references
     * @type {Map<string, Chemical>}
     */
    chemicalsMap = new Map();

    /** 
     * The list of aparatuses
     * @type {Array<Apparatus>}
    */
    apparatuses = [];

    /**
     * The map of UUIDs to "Apparatus" object references
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
     * Create an inventory.
     */
    constructor(){}

    /**
     * Compare between two inventories
     * @param {Inventory} a the first inventory
     * @param {Inventory} b the second inventory
     * @return {Object<Array<Action>, Array<Action>>} the list of actions to apply to the first inventory to get the second inventory
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

    addChemical(item)
    {
        this.chemHistories.doAction(new AddAction(item));
    }

    addApparatus(item)
    {
        this.appaHistories.doAction(new AddAction(item));
    }

    removeChemical(index)
    {
        
    }

    removeApparatus(index)
    {
        
    }
}

export
{
    Action, AddAction, EditAction, DeleteAction, Tag,
    Chemical, SpecificChemical, Container, GHSPictogram, GHSCode,
    Apparatus, SpecificApparatus,
    Inventory,
    Record
}
