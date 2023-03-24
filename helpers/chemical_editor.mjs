/**
 * Manages chemical editor widgets
 * @module helpers/chemical_editor
 */

import { getCIDAndFormula, getHazards, getContrast } from "../app_core/web_lookup.mjs";
import { GHSC } from "../ghs_data/ghs_data.mjs";
import { current_inventory, setInv, refreshInv } from "../app_core/base.mjs";
import { Chemical, SpecificChemical, Container, Tag, AddAction, EditAction, DeleteAction } from "../app_core/kekule.mjs";
import { ROOT_URL } from "../app_core/root_url.mjs";

// Refresh inventory
await refreshInv();

// Close button
let closeBtn = document.getElementById("close-button");

// Delete chemical button
let delBtn = document.getElementById("chemical-delete");

// Notes element
let notesEl = document.getElementById("notes");

// Chemical name display element
let nameDispEl = document.getElementById("name-display");
// Chemical name editing element
let nameEditEl = document.getElementById("name-editor")

// Molecular formula display element
let formulaDispEl = document.getElementById("formula-display");
// Molecular formula editing element
let formulaEditEl = document.getElementById("formula-editor");

// Molecular structure edit element
let molStructEl = document.getElementById("molecular-structure")

// List of tags (top)
let tagsEl = document.getElementById("tags");

// Subitems table body
let subitemsTableEl = document.getElementById("subitems");

// LCSS elements
let lcssEl = document.getElementById("lcss");
let wasteEl = document.getElementById("waste");

// GHS signal
let ghs_signal = document.getElementById("ghs-signal");

// GHS pictogram list
let ghs_pictograms = document.getElementById("ghs-pictograms");

// GHS hazard statement list
let ghs_list = document.getElementById("ghs-hazards");

// NFPA 704 diamond
let nfpaDiamond = document.getElementById("nfpa-diamond");
// Values of the diamond
let nfpa_health = document.getElementById("nfpa-health");
let nfpa_fire = document.getElementById("nfpa-fire");
let nfpa_instability = document.getElementById("nfpa-instability");
let nfpa_special = document.getElementById("nfpa-special");

// Ghost chemical
let chem = new Chemical();

//If this module is used inside the chemical editor
// (As opposed to the chemicals main display table)
if (nameEditEl && formulaEditEl) {
    // Attach event handler for chemical name
    nameEditEl.addEventListener("input", (event) => {
        nameDispEl.innerText = event.target.value;
    })
    // Attach event handler for molecular formula
    formulaEditEl.addEventListener("input", (event) => {
        formulaEditEl.value = parseFormula(event.target.value, "inline");
        formulaDispEl.innerHTML = parseFormula(event.target.value, "html");
    })
}
else {
    console.debug("Editing elements not found, assuming use outside editor")
}

/** Function for parsing a molecular formula
 * @param {string} formula The molecular formula
 * @param {"inline"|"html"} format The format of the output
 * @returns {string} The formatted molecular formula
 */
function parseFormula(formula, format) {
    // Preferred bullet operator
    const bullet = "\u2022";

    // List of allowed bullet characters for hydrated compounds
    const bullets = ['*', '`', '.', bullet];

    // Initialize result string
    var result = "";

    // Coefficients allowed flag
    // (used for hydrated compounds like CuSO4 * 7H2O)
    var coeffAllowed = false;

    // Subscript base
    const subs_base = 0x2080;

    switch (format) {
        // Inline parsing
        case "inline":
            // For each character in the molecular formula
            for (const char of formula) {
                // If a bullet operator is found
                if (bullets.includes(char)) {
                    coeffAllowed = true;
                    result += bullet;
                    continue;
                }

                // Check if character is a letter (e.g. part of an element symbol)
                if (char.toLowerCase() != char.toUpperCase()) {
                    coeffAllowed = false;
                    result += char;
                    continue;
                }

                // Numbers
                else {
                    // If number is part of a coefficient in hydrated compounds
                    if (coeffAllowed) {
                        // Add number as-is to result
                        result += char;
                        continue;
                    }
                    // If number is part of a subscript
                    else {
                        // Add subscript version to result, if not already in subscript form
                        if (!Number.isNaN(parseInt(char))) {
                            result += String.fromCharCode(subs_base + parseInt(char));
                        }
                        else {
                            result += char;
                        }
                        continue;
                    }
                }
            }

            return result;

        // HTML parsing
        case "html":
            // In subscript flag
            var subs = false;

            // For each character in the molecular formula
            for (const char of formula) {
                // If a bullet operator is found
                if (bullets.includes(char)) {
                    subs = false;
                    result += "</sub>";

                    coeffAllowed = true;
                    result += bullet;
                    continue;
                }

                // Check if character is a letter (e.g. part of an element symbol)
                if (char.toLowerCase() != char.toUpperCase()) {
                    // If the previous character was a subscript
                    if (subs) {
                        subs = false;
                        result += "</sub>";
                    }

                    coeffAllowed = false;
                    result += char;
                    continue;
                }

                // Numbers
                else {
                    // If number is part of a coefficient in hydrated compounds
                    if (coeffAllowed) {
                        // Add number as-is to result
                        result += char;
                        continue;
                    }
                    // If number is part of a subscript
                    else {
                        // If this is the first subscript digit
                        if (!subs) {
                            subs = true;
                            result += "<sub>";
                        }

                        // Add subscript version to result

                        // If number is not formatted as Unicode subscript
                        if (!Number.isNaN(parseInt(char))) {
                            result += char;
                        }
                        // If number is formatted as Unicode subscript
                        else {
                            result += (char.charCodeAt(0) - subs_base).toString();
                        }

                        continue;
                    }
                }
            }

            // If the last character was a subscript
            if (subs) {
                subs = false;
                result += "</sub>";
            }

            return result;

        // Default error case
        default:
            throw TypeError(`${format} is not a valid chemical formula parsing format.`);
    }
}

/**
 * Update the display of subitems
 */
function updateSubItems()
{
    // Clear table
    subitemsTableEl.replaceChildren();

    // HTML code for buttons
    const buttonsMarkup = `<button type="button" class="btn btn-primary"><i class="bi bi-pencil"></i></button>
    <button type="button" class="btn btn-primary"><i class="bi bi-trash"></i></button>`;

    // Current <tr>, for table row
    let cur_tr;

    // Current <a>, for link on the count number to show each subitem
    let cur_a;

    // Current <th> / <td>, for table column
    let cur_col;

    // Current <span>, for tags or editable sections
    let cur_span;

    // Current <ul>, for list of containers
    let cur_ul;

    // Current <li>, for each container
    let cur_li;

    /**
     * Inline function to append subitem column
     * @param {string} element
     * @param {Object<string,string>} param 
     * @param {any} val 
     */
    function addSubItemCol(element, param, val) {
        // (create)
        cur_col = document.createElement(element);

        for (const [key, val] of Object.entries(param)) {
            cur_col.setAttribute(key, val);
        }

        // (set)
        if (val instanceof Node) {
            cur_col.appendChild(val);
        }
        else if (typeof val == "string") {
            cur_col.innerHTML = val;
        }

        // (append)
        if (typeof val != "undefined") {
            cur_tr.appendChild(cur_col);
        }
    }

    // Iterate the subitems
    for (const subitem_ind in chem.subitems)
    {
        // Subitems display
        cur_tr = document.createElement("tr");

        // 1. Count
        cur_col = document.createElement("th");

        // Create an anchor
        cur_a = document.createElement("a");
        cur_a.setAttribute("data-bs-toggle", "collapse");
        cur_a.setAttribute("href", `container-${subitem_ind}`);
        cur_a.setAttribute("role", "button");

        // Put the text into the anchor
        cur_a.appendChild(document.createTextNode(`▷[${chem.subitems[subitem_ind].containers.length}]`));

        cur_tr.appendChild(cur_col);

        // 2. Chemical name
        addSubItemCol("td", {contenteditable: "false"}, chem.subitems[subitem_ind].name);

        // 3. Specifications
        addSubItemCol("td", {contenteditable: "false"}, chem.subitems[subitem_ind].specifications);

        // 4. Amount left
        let amtCounter = 0;
        let unitTracked = false;
        let amtUnitTracker;
        let amtDisp;
        let unitIsConsistent;

        // Amount counting loop
        if (chem.subitems[subitem_ind].containers) {
            for (const iteml2 of chem.subitems[subitem_ind].containers) {
                amtCounter += iteml2.remaining;

                // If checked flag is false
                if (!unitTracked) {
                    // Keep an eye on the first unit
                    amtUnitTracker = iteml2.capacityUnit;
                    // Set the tracked flag to true
                    unitTracked = true;
                }
                // Otherwise, if the unit is different, break out of the loop
                else if (iteml2.capacityUnit != amtUnitTracker) {
                    unitIsConsistent = false;
                }
            }
        }

        // (add column)
        // If units are consistent
        if (unitIsConsistent) {
            // unitTracked put here to display "NONE" if there are no containers
            if (amtCounter > 0 && unitTracked) {
                amtDisp = amtCounter + " " + amtUnitTracker;
            }
            else {
                cur_tr.classList.add("table-warning");
                amtDisp = "NONE";
            }
        }
        // If units aren't consistent
        else {
            if (amtCounter > 0) {
                amtDisp = "PRESENT";
            }
            else {
                cur_tr.classList.add("table-warning");
                amtDisp = "NONE";
            }
        }

        addSubItemCol("td", {contenteditable: "false"}, amtDisp);

        // 5. Tags
        for (const tag of chem.subitems[subitem_ind].tags)
        {
            // Create new <span> element for tag display
            cur_span = document.createElement("span");
            cur_span.classList.add("badge", "rounded-pill");

            // Set Foreground color
            if (getContrast("000000", tag.color.replace("#", "")) > getContrast("FFFFFF"), tag.color.replace("#", ""))
            {
                cur_span.style.color = "#000000";
            }
            else
            {
                cur_span.style.color = "#FFFFFF";
            }

            // Background color (tag color)
            cur_span.style.backgroundColor = tag.color;

            // Tag name
            cur_span.appendChild(document.createTextNode(tag.name));

            cur_col.appendChild(cur_span);

        }
        cur_tr.appendChild(cur_col);

        // 6. Buttons
        cur_tr.innerHTML += buttonsMarkup;

        // Append #1
        subitemsTableEl.appendChild(cur_tr);


        // List of containers
        cur_tr = document.createElement("tr");
        cur_tr.classList.add("collapse", "show");
        cur_tr.id = `container-${subitem_ind}`;

        cur_col = document.createElement("td");
        cur_col.setAttribute("colspan", "10");

        cur_ul = document.createElement("ul");
        cur_ul.classList.add("list-group");

        for (const container of chem.subitems[subitem_ind].containers)
        {
            cur_li = document.createElement("li");
            
            // a. count
            cur_span = document.createElement("span");
            cur_span.classList.add("badge", "bg-secondary", "container-editable");
            cur_span.appendChild(document.createTextNode(container.count));

            cur_li.appendChild(cur_span);

            // b. container size
            cur_span = document.createElement("span");
            cur_span.classList.add("container-editable");
            cur_span.appendChild(document.createTextNode(container.unitCapacity + container.capacityUnit));

            cur_li.appendChild(cur_span);

            // c. message
            cur_li.appendChild(document.createTextNode(" container(s), "));

            // d. amount left
            cur_span = document.createElement("span");
            cur_span.classList.add("container-editable");
            cur_span.appendChild(document.createTextNode(container.remaining + container.capacityUnit));

            cur_li.appendChild(cur_span);

            // e. message
            cur_li.appendChild(document.createTextNode(" left"));

            // d. edit and delete buttons
            cur_li.innerHTML += buttonsMarkup;


            cur_ul.appendChild(cur_li);
        }

        // Append #2
        subitemsTableEl.appendChild(cur_tr);

        // Add button
        let addbutton = document.createElement("button");
        addbutton.classList.add("btn", "btn-primary");
        addbutton.appendChild(document.createTextNode("+"));
        cur_tr.appendChild(addbutton);
        subitemsTableEl.appendChild(addbutton);
    }

    cur_tr = document.createElement("tr");

    // Add button
    let addbutton = document.createElement("button");
    addbutton.classList.add("btn", "btn-primary");
    addbutton.appendChild(document.createTextNode("+"));
    cur_tr.appendChild(addbutton);
    subitemsTableEl.appendChild(addbutton);
}

// Get URL parameters
let GETparams = new URLSearchParams(decodeURI(window.location.search));

// Name used for adding elements
let addName = GETparams.get("add");

// ID used for editing elements
let editID = GETparams.get("id");

console.log(`Add name: ${addName}`);
console.log(`Edit ID: ${editID}`);

// Add or edit mode
if (addName || editID)
{
    // Handle tag editing
    // tagsEl

    // const tagEditorModal = new bootstrap.Modal(document.getElementById("tagEditorModal"));
    // console.log(tagEditorModal);
    // tagEditorModal.show();
}

// Add mode
if (addName) {
    // Set the molecular display tab
    molStructEl.setAttribute("src", `https://pubchem.ncbi.nlm.nih.gov/compound/${addName}#section=2D-Structure&embed=true`)

    // Set chemical names
    nameEditEl.setAttribute("value", addName);
    nameDispEl.textContent = addName;

    // Look up PubChem for data
    let substanceInfo = await getCIDAndFormula(addName);

    // If no error occured
    if (!("Fault" in substanceInfo)) {
        let cid = substanceInfo.PropertyTable.Properties[0].CID;
        let formula = substanceInfo.PropertyTable.Properties[0].MolecularFormula;

        // Set chemical formula
        formulaEditEl.value = parseFormula(formula, "inline");
        formulaDispEl.innerHTML = parseFormula(formula, "html");

        // Set LCSS
        lcssEl.setAttribute("href", `https://pubchem.ncbi.nlm.nih.gov/compound/${addName}#datasheet=LCSS`);
        wasteEl.setAttribute("href", `https://pubchem.ncbi.nlm.nih.gov/compound/${addName}#datasheet=LCSS&section=Cleanup-and-Disposal&fullscreen=true`);

        // Get safety information
        let haz_info = await getHazards(cid);

        // If there are hazard records available
        if (!("Fault" in haz_info)) {
            console.log(haz_info);
            let ghs_info = haz_info.Record.Section[0].Section[0].Section[0].Information;
            let nfpa_info = haz_info.Record.Section[0].Section[0].Section[2]?.Information;
            console.log("GHS info:");
            console.log(ghs_info);
            console.log("NFPA 704 info:");
            console.log(nfpa_info);

            // If GHS info exists:

            if (ghs_info) {
                // If GHS signal exist
                if (ghs_info[1].Name == "Signal")
                {
                    ghs_signal.textContent = ghs_info[1].Value.StringWithMarkup[0].String;
                }

                // If GHS pictograms exist
                if (ghs_info[0].Name == "Pictogram(s)")
                {
                    // Current pictogram
                    let cur_pic_1; // First container
                    let cur_pic_2; // Second container
                    let cur_pic_img; // Image
                    for (const pic of ghs_info[0].Value.StringWithMarkup[0].Markup)
                    {
                        // Pre-packing
                        cur_pic_1 = document.createElement("div");
                        cur_pic_1.classList.add("col");
                        cur_pic_2 = document.createElement("div");
                        cur_pic_2.classList.add("card");
                        cur_pic_img = document.createElement("img");
                        cur_pic_img.classList.add("ghs-pictogram");

                        // Adding the image
                        cur_pic_img.setAttribute("src", pic.URL);
                        cur_pic_img.setAttribute("alt", pic.Extra);

                        // Post-packing
                        cur_pic_2.appendChild(cur_pic_img);
                        cur_pic_2.appendChild(document.createTextNode(pic.Extra));
                        cur_pic_1.appendChild(cur_pic_2);
                        ghs_pictograms.appendChild(cur_pic_1);
                    }
                }

                // If GHS codes exist
                if (ghs_info[2].Name == "GHS Hazard Statements") {
                    // Current code list item
                    let cur_li;

                    // H codes
                    for (const code of ghs_info[2].Value.StringWithMarkup) {
                        cur_li = document.createElement("li");
                        cur_li.classList.add("list-group-item");
                        // Danger statements
                        if (code.String.includes("[Danger"))
                        {
                            cur_li.classList.add("list-group-item-danger");
                        }
                        // Warning statements
                        else
                        {
                            cur_li.classList.add("list-group-item-warning");
                        }
                        
                        cur_li.textContent = code.String;
                        ghs_list.appendChild(cur_li);
                    }

                    // P codes
                    for (const code of ghs_info[3].Value.StringWithMarkup[0].String.replace("and ", "").split(", ")) {
                        // console.log(code);
                        // console.log(GHSC.P[code]);
                        cur_li = document.createElement("li");
                        cur_li.classList.add("list-group-item", "list-group-item-info");
                        cur_li.textContent = `${code}: ${GHSC.P[code] ?? "(unknown)"}`;
                        ghs_list.appendChild(cur_li);
                    }
                }
            }

            // If NFPA info exists:
            if (nfpa_info && nfpa_info[0].Name == "NFPA 704 Diamond") {
                //Set NFPA 704 diamond
                nfpaDiamond.setAttribute("src", nfpa_info[0].Value.StringWithMarkup[0].Markup[0].URL);
                nfpaDiamond.setAttribute("alt", nfpa_info[0].Value.StringWithMarkup[0].Markup[0].Extra);

                nfpa_health.textContent = nfpa_info[1].Value.StringWithMarkup[0].String;
                nfpa_fire.textContent = nfpa_info[2].Value.StringWithMarkup[0].String;
                nfpa_instability.textContent = nfpa_info[3].Value.StringWithMarkup[0].String;

                if (nfpa_info[4]?.Name == "NFPA Specific Notice") {
                    nfpa_special.textContent = nfpa_info[4].Value.StringWithMarkup[0].String;
                }
                else {
                    nfpa_special.textContent = "NONE";
                }
            }
        }

    }

    // When the close button is clicked, add chemical
    closeBtn.addEventListener("click", () =>
    {
        console.log("Text content:");
        
        // Set key properties of the cheical
        chem.name = nameDispEl.textContent; // Name
        chem.formula = formulaDispEl.textContent.replace("•", "*"); // Formula
        chem.notes = notesEl.value; // Note
        
        current_inventory.chemHistories.doAction(new AddAction(chem, current_inventory));
        setInv(current_inventory);

        window.location.replace(ROOT_URL);
    })
}
// Edit mode
else if (editID) {
    // Item currently being viewed
    let viewingItem = current_inventory.chemicalsMap.get(editID);

    // Set the molecular display tab
    molStructEl.setAttribute("src", `https://pubchem.ncbi.nlm.nih.gov/compound/${viewingItem.name}#section=2D-Structure&embed=true`)

    // Set LCSS
    lcssEl.setAttribute("href", `https://pubchem.ncbi.nlm.nih.gov/compound/${viewingItem.name}#datasheet=LCSS`);
    wasteEl.setAttribute("href", `https://pubchem.ncbi.nlm.nih.gov/compound/${viewingItem.name}#datasheet=LCSS&section=Cleanup-and-Disposal&fullscreen=true`);

    // Displaying:

    // 1. chemical name
    nameEditEl.setAttribute("value", viewingItem.name);
    nameDispEl.textContent = viewingItem.name;

    // 2. chemical formula
    formulaEditEl.value = parseFormula(viewingItem.formula, "inline");
    formulaDispEl.innerHTML = parseFormula(viewingItem.formula, "html");

    // 3. tags
    let curTagEl; // Current tag element
    
    for (const subitem of viewingItem.subitems)
    {
        for (const tag of subitem.tags)
        {
            curTagEl = document.createElement("span");
            curTagEl.classList.add("badge", "rounded-pill");

            if (getContrast("000000", tag.color.replace("#", "")) > getContrast("FFFFFF", tag.color.replace("#", "")))
            {
                curTagEl.style.color = "#000000";
            }
            else
            {
                curTagEl.style.color = "#FFFFFF";
            }

            curTagEl.appendChild(document.createTextNode(tag.name));

            tagsEl.appendChild(curTagEl);
        }
    }
    
    // 4. notes
    notesEl.value = viewingItem.notes;

    // 5. Subitems
    updateSubItems();

    // When the close button is clicked, save chemical
    closeBtn.addEventListener("click", () =>
    {

        // Determine what properties to edit

        /**
         * Attempt to perform an edit
         * @param {Item | SubItem | Container} majorObj The Object that is being edited
         * @param {string} property The string of the property name to edit
         * @param {any} to The value of the edit
         */
        function reg(majorObj, property, to)
        {
            if (majorObj[property] != to)
            {
                current_inventory.chemHistories.doAction(new EditAction(current_inventory, majorObj, property, to));
            }
        }

        // 1. Name
        reg(viewingItem, "name", nameDispEl.textContent);

        // 2. Molecular formula
        reg(viewingItem, "formula", formulaDispEl.textContent.replace("•", "*"));

        // 3. tags

        // 4. Notes
        reg(viewingItem, "notes", notesEl.value);

        // Save changes
        setInv(current_inventory);

        // Redirect to home page
        window.location.replace(ROOT_URL);
    })

    // When the delete button is clicked, ask for confirmation and delete chemical
    delBtn.addEventListener("click", () =>
    {
        if (confirm("Deleting this chemical will cause URLs to this page to break. Do you want to proceed?"))
        {
            // Deletion
            current_inventory.chemHistories.doAction(new DeleteAction(viewingItem, current_inventory));
            // Set inventory
            setInv(current_inventory);

            // Redirect to home page
            window.location.replace(ROOT_URL);
        }
    })
}
// Use outside editor
else {
    console.debug("Chemical editor neither in add mode nor in edit mode; assuming use outside editor.");
}


export { parseFormula }
