/**
 * Holds the current inventory, manages inventory opens/saves, and imports/exports. Also manages inventory serialization and deserialization.
 * @module app_core/base
 */

import { Inventory } from "./kekule.mjs";
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
        const hiddenProperties = ["name"];

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
        else if (typeof obj == "object")
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
     * @param
     */
    static importChemCSV(obj)
    {

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

// Try to set the inventory to IndexedDB
async function setInv(inventory, name)
{
    console.log(InventoryTools.serialize(inventory));
    await IDB_set("current_inventory", InventoryTools.serialize(inventory));
}

// Wait to load inventory
async function refreshInv()
{
    current_inventory = await getInv();
}

// IDB_set("current_inventory", null);
refreshInv();

export { refreshInv, setInv, current_inventory, InventoryTools };
