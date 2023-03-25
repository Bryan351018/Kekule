/**
 * Controls display of various stats in the Kekule inventories page
 * @module helpers/inventories_display
 */

// import { Chemical, SpecificChemical, Apparatus, SpecificApparatus, Tag, AddAction } from "../app_core/kekule.mjs";
import { current_inventory, refreshInv, InventoryTools, setInv, resetInv, getName } from "../app_core/base.mjs";
import { initDocRef, requestDownload, requestOpen } from "../app_core/utilities.mjs";

// Initialize the document reference of the inventory frame
initDocRef(document);

// Refresh inventory
await refreshInv();

// // Testing data
// let a = new Chemical();
// a.name = "Hydrochloric acid";
// a.formula = "HCl";
// let a1 = new SpecificChemical();
// let a1t = new Tag();
// a1t.name = "test";
// a1t.color = "#005B00";
// let a2t = new Tag();
// a2t.name = "test2";
// a2t.color = "#AA5B00";
// a1.tags.push(a1t);
// a1.tags.push(a2t);
// a.addSubItem(a1);
// current_inventory.chemHistories.doAction(new AddAction(a, current_inventory));
// let b = new Chemical();
// b.name = "Copper sulfate heptahydrate";
// b.formula = "CuSO4*7H2O";
// current_inventory.chemHistories.doAction(new AddAction(b, current_inventory));
// let c = new Chemical();
// c.name = "Unknown #1";
// current_inventory.chemHistories.doAction(new AddAction(c, current_inventory));
// let Aa = new Apparatus();
// Aa.name = "Beaker";
// let Aa1 = new SpecificApparatus();
// Aa1.name = "Beaker";
// Aa1.specifications = "250mL ± 5%";
// let Aa1t = new Tag();
// Aa1t.name = "A1";
// Aa1t.color = "#55004F";
// Aa1.tags.push(Aa1t);
// Aa.addSubItem(Aa1);
// current_inventory.appaHistories.doAction(new AddAction(Aa, current_inventory));

/**
 * Update the inventory display.
 */
async function updateDisplay() {
    // Refresh inventory
    await refreshInv();

    // Inventory name
    document.getElementById("inv-name").innerText = await getName();

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
    requestOpen(".aki", (files) => {
        console.log(files[0]);
        
        files[0].text().then(async function(str){
            console.log(str);

            // Open inventory
            setInv(InventoryTools.deserialize(str), files[0].name);

            // Update display
            await updateDisplay();
        })
    });
});

// New inventory
document.getElementById("inv-new").addEventListener("click", async function(){
    if (confirm("This will erase the current inventory stored in the browser. Are you sure that all changes were saved?"))
    {
        // Reset inventory
        await resetInv();

        // Update display
        await updateDisplay();
    }
})

await updateDisplay();
