/**
 * Holds the current inventory, manages inventory opens/saves, and imports/exports. Also manages inventory serialization and deserialization.
 * @module app_core/base
 */

import { Inventory } from "./kekule.mjs";
import { get as IDB_get, set as IDB_set } from "../libs/idb-keyval.mjs";

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
        if (inv instanceof Inventory) {
            resolve(inv);
        }
        // If there is no stored inventory
        else {
            resolve(new Inventory());
        }
    });
}

/** Class containing whole-inventory methods like serialization, deserialization, importing, and exporting. */
class InventoryTools
{

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
            chemicals: inventory.chemicals,
            apparatuses: inventory.apparatuses,
            chemHistories: inventory.chemHistories,
            appaHistories: inventory.appaHistories,
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

        
    }
}

// Wait to load inventory
current_inventory = await getInv();

export { current_inventory, InventoryTools };
