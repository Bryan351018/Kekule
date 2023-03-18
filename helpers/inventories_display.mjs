/**
 * Controls display of various stats in the Kekule inventories page
 * @module helpers/inventories_display
 */

import { Chemical, SpecificChemical, Tag, AddAction } from "../app_core/kekule.mjs";
import { current_inventory, InventoryTools } from "../app_core/base.mjs";
import { initDocRef, requestDownload, requestOpen } from "../app_core/utilities.mjs";

// Initialize the document reference of the inventory frame
initDocRef(document);

// Testing data
let a = new Chemical();
a.name = "Hydrochloric acid";
a.formula = "HCl";
let a1 = new SpecificChemical();
let a1t = new Tag();
a1t.name = "test";
a1t.color = "#005B00";
let a2t = new Tag();
a2t.name = "test2";
a2t.color = "#AA5B00";
a1.tags.push(a1t);
a1.tags.push(a2t);
a.addSubItem(a1);
current_inventory.chemHistories.doAction(new AddAction(a, current_inventory));
let b = new Chemical();
b.name = "Copper sulfate heptahydrate";
b.formula = "CuSO4*7H2O";
current_inventory.chemHistories.doAction(new AddAction(b, current_inventory));
let c = new Chemical();
c.name = "Unknown #1";
current_inventory.chemHistories.doAction(new AddAction(c, current_inventory));

/**
 * Update the inventory display.
 */
function updateDisplay() {
    // Chemical entries
    document.getElementById("inv-attr-chemcount").innerText = current_inventory.chemicals.length;

    // Specific chemical entries
    let specChemCounter = 0;
    for (const chemical of current_inventory.chemicals)
    {
        specChemCounter += chemical.subitems.length;
    }
    document.getElementById("inv-attr-specchemcount").innerText = specChemCounter;

    // Apparatus entries
    document.getElementById("inv-attr-appacount").innerText = current_inventory.apparatuses.length;
    // Specific apparatus entries (TODO)
    let specAppaCounter = 0;
    for (const apparatus of current_inventory.apparatuses)
    {
        specAppaCounter += apparatus.subitems.length;
    }
    document.getElementById("inv-attr-specappacount").innerText = specAppaCounter;

    // Chemical history tree size
    document.getElementById("inv-attr-chemtreesize").innerText = current_inventory.chemHistories.size;
    // Apparatus history tree size
    document.getElementById("inv-attr-appatreesize").innerText = current_inventory.appaHistories.size;
    // Inventory version
    document.getElementById("inv-attr-version").innerText = `${current_inventory.majorVer}.${current_inventory.minorVer}`;
}

// Setting up event handlers

// Saving file
document.getElementById("inv-save").addEventListener("click", () => 
{
    const fileName = "inventory.aki";
    requestDownload(new File([InventoryTools.serialize(current_inventory)], fileName), fileName);
});

// Opening file
document.getElementById("inv-open").addEventListener("click", () => 
{
    requestOpen(".aki");
});

updateDisplay();
