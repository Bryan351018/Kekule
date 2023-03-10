/**
 * Holds the current inventory and manages inventory imports/exports
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
IDB_get("current_inventory").then((inv) => {
    // If there is a stored inventory
    if (inv instanceof Inventory)
    {
        // Set it
        current_inventory = inv;
    }
    // If there is no stored inventory
    else
    {
        current_inventory = new Inventory();
    }
})

export { current_inventory };
