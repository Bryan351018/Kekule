/**
 * Holds the current inventory, manages inventory opens/saves, and imports/exports. Also manages inventory serialization and deserialization.
 * @module app_core/base
 */

import { Chemical, Inventory, SpecificChemical, Container, Tag, AddAction } from "./kekule.mjs";
import { get as IDB_get, set as IDB_set } from "../libs/idb-keyval.mjs";
// import { parse as CSVRead, unparse as CSVWrite } from "../libs/papaparse.js";

/** Class containing whole-inventory methods like serialization, deserialization, importing, and exporting. */
class InventoryTools
{

    /**
     * Converts private properties of an object to public properties.
     * @param {any} obj The object to convert.
     * @returns {any} The converted object.
     */
    static exposePrivates(obj)
    {
        // Specify hidden properties here that exposePrivates need to know.
        const hiddenProperties = ["name", "code", "identifier"];

        let tempobj;

        // If the value is an array
        if (Array.isArray(obj))
        {
            tempobj = [];
            for (const val of obj)
            {
                tempobj.push(this.exposePrivates(val));
            }
        }
        // If the value is another object
        else if (typeof obj == "object" && obj !== null)
        {
            tempobj = {};
            for (const k of Object.keys(Object.getOwnPropertyDescriptors(obj)).concat(hiddenProperties))
            {
                if (typeof obj[k] != "function" && typeof obj[k] != "undefined")
                {
                    tempobj[k] = this.exposePrivates(obj[k]);
                }
            }
        }
        // If the value is not an object
        else
        {
            tempobj = obj;
        }

        return tempobj;
    }

    /**
     * Convert an inventory object in memory to a JSON string.
     * @param {Inventory} inventory The inventory to serialize.
     * @returns {string} The JSON string representing the inventory.
     */
    static serialize(inventory)
    {
        // Temporary object to store things
        let tempobj = 
        {
            majorVer: inventory.majorVer,
            minorVer: inventory.minorVer,
            chemicals: this.exposePrivates(inventory.chemicals),
            apparatuses: this.exposePrivates(inventory.apparatuses),
            nextID: inventory.nextID.toString(10) // ID is converted to base-10 string for compatibility
        };

        // Serialize
        return JSON.stringify(tempobj);
    }

    /**
     * Attempt to convert a JSON string to an inventory object in memory.
     * @param {string} str The JSON string to parse.
     * @returns {Inventory?} The resulting inventory, or null if the deserialization was unsuccessful.
     */
    static deserialize(str)
    {
        // Create temporary object
        let tempobj = JSON.parse(str);

        // Version check (The inventory should have a major version that is not greater than 1)
        if (!tempobj.majorVer || tempobj.majorVer > 1)
        {
            return null;
        }

        // Create fresh inventory without item maps
        let freshInv = new Inventory(tempobj);

        // Generate item maps
        for (let chemical of freshInv.chemicals)
        {
            freshInv.chemicalsMap.set(chemical.ID, chemical);
        }
        for (let apparatus of freshInv.apparatuses)
        {
            freshInv.apparatusesMap.set(apparatus.ID, apparatus);
        }

        // Return inventory
        return freshInv;
    }

    /**
     * Convert a CSV file containing chemical data into an inventory.
     * @param {object} obj The source object.
     * @returns {Inventory} The converted invenntory.
     */
    static importChemCSV(obj)
    {
        let curInv = new Inventory();

        let skipflag = false;

        let initialName = "";

        // Current chemical
        let cur_chem = new Chemical();

        // Tag collection
        let tagCol = new Set();

        for (const row of obj)
        {
            // Skip the first row
            if (!skipflag)
            {
                skipflag = true;
                continue;
            }

            // If initial name is empty
            if (!initialName)
            {
                initialName = row[0];
            }

            // New chemical
            if (row[0] !== initialName)
            {
                // Add chemical to inventory
                curInv.chemHistories.doAction(new AddAction(cur_chem, curInv));

                // Reset chemical
                cur_chem = new Chemical();
                tagCol.clear();

                // Set matching name
                initialName = row[0];
            }
            // New specific chemical
            cur_chem.name = row[0];

            // If both tag and container size info are present
            if (row[1] && row[2])
            {
                let newTag = [new Tag({
                    name: row[1],
                    color: "#000000"
                })];

                curInv.chemHistories.doAction(new AddAction(
                    new SpecificChemical({
                        name: row[0],
                        containers: [
                            new Container({
                                count: 1,
                                unitCapacity: Number(row[2].split(" ")[0]),
                                remaining: Number(row[2].split(" ")[0]),
                                capacityUnit: row[2].split(" ")[1]
                            })
                        ],
                        specifications: "",
                        tags: newTag
                    }),
                    curInv,
                    cur_chem
                ));

                tagCol.add(row[1]);
            }
            // If at least one of them is absent
            else
            {
                curInv.chemHistories.doAction(new AddAction(
                    new SpecificChemical({
                        name: row[0],
                        containers: [],
                        specifications: "",
                        tags: []
                    }),
                    curInv,
                    cur_chem
                ));
            }
        }

        // Last time for correction

        // Add chemical to inventory
        curInv.chemHistories.doAction(new AddAction(cur_chem, curInv));

        // Reset chemical
        cur_chem = new Chemical();

        // Return inventory
        return curInv;
    }
}

/**
 * The current inventory.
 * @type {Inventory}
 */
var current_inventory;

// Try to get the inventory from IndexedDB
async function getInv() {
    // Wait to try and get the inventory from IndexedDB
    let inv = await IDB_get("current_inventory");

    // Return it
    return new Promise((resolve) => {
        // If there is a stored inventory
        if (inv) {
            resolve(InventoryTools.deserialize(inv));
        }
        // If there is no stored inventory
        else {
            resolve(new Inventory());
        }
    });
}

// Get inventory's name.
async function getName()
{
    let name = await IDB_get("inventory_name");

    // Return it
    return new Promise((resolve) => {
        // If there is a name
        if (name) {
            resolve(name);
        }
        // If there is no name
        else {
            resolve("<browser storage>");
        }
    });
}

// Try to set the inventory to IndexedDB
async function setInv(inventory, name)
{
    console.log(InventoryTools.serialize(inventory));
    await IDB_set("current_inventory", InventoryTools.serialize(inventory));

    // If there is an inventory name, set it
    if (name)
    {
        await IDB_set("inventory_name", name);
    }
}

// Reset the inventory.
async function resetInv()
{
    await setInv(new Inventory(), "<browser storage>");
}

// Wait to load inventory
async function refreshInv()
{
    current_inventory = await getInv();
}

// IDB_set("current_inventory", null);
refreshInv();

export { refreshInv, setInv, resetInv, current_inventory, InventoryTools, getName };
