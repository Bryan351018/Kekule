/**
 * Controls display of various stats in the Kekule inventories page
 * @module helpers/inventories_display
 */

import { current_inventory, InventoryTools } from "../app_core/base.mjs";
import { requestDownload } from "../app_core/utilities.mjs";

/**
 * Update the inventory display.
 */
function updateDisplay() {
    // Chemical entries
    document.getElementById("inv-attr-chemcount").innerText = current_inventory.chemicals.length;
    // Specific chemical entries (TODO)
    // Apparatus entries
    document.getElementById("inv-attr-appacount").innerText = current_inventory.apparatuses.length;
    // Specific apparatus entries (TODO)
    // Chemical history tree size
    document.getElementById("inv-attr-chemtreesize").innerText = current_inventory.chemHistories.size;
    // Apparatus history tree size
    document.getElementById("inv-attr-appatreesize").innerText = current_inventory.appaHistories.size;
    // Inventory version
    document.getElementById("inv-attr-version").innerText = `${current_inventory.majorVer}.${current_inventory.minorVer}`;
}

// Setting up event handlers
document.getElementById("inv-save").addEventListener("click", () => 
{
    requestDownload(new File([InventoryTools.serialize(current_inventory)]), "test.aki");
});

updateDisplay();
