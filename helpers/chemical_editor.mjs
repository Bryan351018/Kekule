/**
 * Manages chemical editor widgets
 * @module helpers/chemical_editor
 */

import { getCIDAndFormula, getHazards, getContrast } from "../app_core/web_lookup.mjs";
import { GHSC } from "../ghs_data/ghs_data.mjs";
import { current_inventory, setInv, refreshInv } from "../app_core/base.mjs";
import { Chemical, SpecificChemical, Container, Tag, AddAction, EditAction, DeleteAction, GHSPictogram, GHSCode } from "../app_core/kekule.mjs";
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

// Tag editor dialog components
let tagEditorSource; // Unwrapped <div> element, for attaching event handler
let tagEditorModal; // Bootstrap-wrapped element, for JavaScript interfacing

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

/**
 * Toggles editing of an object.
 * @param {string} id The ID of the object to edit.
 * @param {boolean} isSpecChem Set to true if the edited object is a SpecificChemical, and false if it is a Container.
 * @param {Element} rowEl The HTML <tr> or <ul> element containing the editor.
 */
async function requestEdit(id, isSpecChem, rowEl)
{
    console.log(`requestEdit called, ID=${id}, isSpecChem=${isSpecChem}`);
    console.log(rowEl);

    // Update inline tag displays
    async function updateInlineTagDisps(specId)
    {
        // Row collection element
        let tagColEl = rowEl.childNodes[4];

        // Remove all tag displays (except the add tag display).
        // While loop used as the children list updates as deletion happens
        while (tagColEl.firstChild?.hasAttribute("binded"))
        {
            tagColEl.removeChild(tagColEl.firstChild);
        }

        // For each tag
        let tagIndexCounter = 0;
        for (let curTag of chem.subitems[specId].tags)
        {
            // The visual tag node to add
            let cur_span;

            // Add the tag in display
            // Create new <span> element for tag display
            cur_span = document.createElement("span");
            cur_span.classList.add("badge", "rounded-pill");
            cur_span.setAttribute("binded", tagIndexCounter);

            // Set Foreground color
            const blackRatio = await getContrast("000000", curTag.color.replace("#", ""));
            const whiteRatio = await getContrast("FFFFFF", curTag.color.replace("#", ""));

            if (blackRatio > whiteRatio)
            {
                cur_span.style.color = "#000000";
            }
            else
            {
                cur_span.style.color = "#FFFFFF";
            }

            // Background color (tag color)
            cur_span.style.backgroundColor = curTag.color;

            // Tag name
            cur_span.appendChild(document.createTextNode(curTag.name));

            // Set click handler for each tag
            cur_span.onclick = () => {
                // If the editing mode is on
                if (rowEl.hasAttribute("editing"))
                {
                    console.log("Attempting edit");

                    // Tag editor handling (add tag)
                    // tagnode.onclick = () => {
                        document.getElementById("tag-delete").removeAttribute("disabled");
                        console.log(tagEditorModal);

                        // Set tag name and color
                        document.getElementById("tag-name").value = curTag.name;
                        document.getElementById("tag-color").value = curTag.color;


                        // Testing
                        tagEditorSource.addEventListener("hide.bs.modal", () => {
                            console.log("Dialog closed");
                        })

                        // When changes are saved in the tag editor
                        document.getElementById("tag-save").onclick = () => {
                            const name = document.getElementById("tag-name").value;
                            const color = document.getElementById("tag-color").value;

                            console.log(name, color);

                            // Save changes to inventory for name and color
                            current_inventory.chemHistories.doAction(new EditAction(
                                current_inventory,
                                curTag,
                                "name",
                                name
                            ));

                            current_inventory.chemHistories.doAction(new EditAction(
                                current_inventory,
                                curTag,
                                "color",
                                color
                            ));

                            // Update inline tag display
                            updateInlineTagDisps(specId);

                            tagEditorModal.hide();
                        };

                        // When the tag is being deleted
                        document.getElementById("tag-delete").onclick = () => {
                            // Remove tag in inventory
                            current_inventory.chemHistories.doAction(new DeleteAction(
                                curTag,
                                current_inventory,
                                chem.subitems[specId],
                                Number(cur_span.getAttribute("binded"))
                            ));

                            // TODO: update inline tag display
                            updateInlineTagDisps(specId);

                            tagEditorModal.hide();
                        };


                        tagEditorModal.show();
                }
            };

            tagColEl.insertBefore(cur_span, tagColEl.lastChild);

            tagIndexCounter++;
        }

        // for (let tagNode of rowEl.childNodes[4])
        // {

        // }
    }

    // Editing specific chemical
    if (isSpecChem)
    {
        // If currently editing, save changes and turn off editing mode
        if (rowEl.getAttribute("editing"))
        {
            // Save changes
            reg(chem.subitems[Number(id)], "name", rowEl.childNodes[1].textContent);
            reg(chem.subitems[Number(id)], "specifications", rowEl.childNodes[2].textContent);

            // Switch interface
            let nodeCounter = 0;
            for (let node of rowEl.childNodes)
            {
                // Do things only in nodes 1-2 (0-indexed)
                if (nodeCounter >= 1 && nodeCounter <= 2)
                {
                    node.setAttribute("contenteditable", "false");
                }

                // Remove the add tag interface
                if (nodeCounter == 4)
                {
                    node.removeChild(node.lastChild);
                }

                nodeCounter++;
            }

            rowEl.removeAttribute("editing");
            rowEl.classList.remove("table-info");
        }
        // If currently not editing, turn on editing mode
        else
        {
            // Update tag displays
            updateInlineTagDisps(Number(id));

            let nodeCounter = 0;
            for (let node of rowEl.childNodes)
            {
                // Do things only in nodes 1-2 (0-indexed)
                if (nodeCounter >= 1 && nodeCounter <= 2)
                {
                    node.setAttribute("contenteditable", "true");
                }

                // And 4 (for the tag editing)
                if (nodeCounter == 4)
                {
                    // Create new <span> element for addinng a tag
                    let addTagEl = document.createElement("span");
                    addTagEl.classList.add("badge", "rounded-pill");
                    addTagEl.style.backgroundColor = "#000000";
                    addTagEl.style.color = "#FFFFFF";
                    addTagEl.textContent = "+";

                    // Tag editor handling (add tag)
                    addTagEl.onclick = () => {
                        document.getElementById("tag-delete").setAttribute("disabled", "");
                        console.log(tagEditorModal);

                        // Testing
                        tagEditorSource.addEventListener("hide.bs.modal", () => {
                            console.log("Dialog closed");
                        })

                        // When changes are saved in the tag editor
                        document.getElementById("tag-save").onclick = async function () {
                            const name = document.getElementById("tag-name").value;
                            const color = document.getElementById("tag-color").value;

                            console.log(name, color);

                            // Add the tag in inventory
                            current_inventory.chemHistories.doAction(new AddAction(
                                new Tag({name: name, color: color}),
                                current_inventory,
                                chem.subitems[Number(id)]
                            ));

                            // TODO: Update inline tag display
                            updateInlineTagDisps(Number(id));

                            tagEditorModal.hide();
                        };

                        tagEditorModal.show();

                        
                    };

                    node.appendChild(addTagEl);
                }

                nodeCounter++;
            }

            rowEl.setAttribute("editing", "true");
            rowEl.classList.add("table-info");
        }

        await refreshMasterTagsDisp(chem);
    }
    // Editing container
    else
    {
        // If currently editing, save changes and turn off editing mode
        if (rowEl.getAttribute("editing"))
        {
            // Get container index
            let containerInd = Number(rowEl.parentElement.getAttribute("binded"));

            // Save changes
            reg(chem.subitems[containerInd].containers[Number(id)], "count", Number(rowEl.childNodes[0].textContent));
            reg(chem.subitems[containerInd].containers[Number(id)], "unitCapacity", Number(rowEl.childNodes[1].textContent.split(" ")[0]));
            reg(chem.subitems[containerInd].containers[Number(id)], "remaining", Number(rowEl.childNodes[3].textContent.split(" ")[0]));
            reg(chem.subitems[containerInd].containers[Number(id)], "capacityUnit", rowEl.childNodes[1].textContent.split(" ")[1]);

            // Switch interface
            for (let node of rowEl.children)
            {
                // Make all nodes non-editable
                if (node.hasAttribute("contenteditable"))
                {
                    node.setAttribute("contenteditable", "false");
                }
            }

            await updateSubItems();

            rowEl.removeAttribute("editing");
            rowEl.classList.remove("list-group-item-info");
        }
        // If currently not editing, turn on editing mode
        else
        {
            // Switch interface
            for (let node of rowEl.children)
            {
                // Make all nodes editable
                if (node.hasAttribute("contenteditable"))
                {
                    node.setAttribute("contenteditable", "true");
                }
            }

            rowEl.setAttribute("editing", "true");
            rowEl.classList.add("list-group-item-info");
        }
    }

    
}

/**
 * Requests deletinng of an object.
 * @param {string} id The ID of the object to edit.
 * @param {boolean} isSpecChem Set to true if the edited object is a SpecificChemical, and false if it is a Container.
 * @param {Element} rowEl The HTML <tr> or <ul> element containing the editor.
 */
async function requestDelete(id, isSpecChem, rowEl)
{
    console.log(`requestDelete called, ID=${id}, isSpecChem=${isSpecChem}`);
    console.log(rowEl);

    if (isSpecChem)
    {
        current_inventory.chemHistories.doAction(new DeleteAction(chem.subitems[id], current_inventory, chem, id));
    }
    else
    {
        const rootID = Number(rowEl.parentElement.getAttribute("binded"));
        current_inventory.chemHistories.doAction(new DeleteAction(chem.subitems[rootID].containers[id], current_inventory, chem.subitems[rootID]));
    }

    await updateSubItems();

    await refreshMasterTagsDisp(chem);
}

/**
 * Update the display of subitems
 */
async function updateSubItems()
{
    // Clear table
    subitemsTableEl.replaceChildren();

    // Element collection for buttons
    function getButtonsMarkup(id, isSpecChem, rowEl)
    {
        let baseTd = document.createElement("td"); // Base column
        let btn; // Buttonn element
        let iEl; // Icon element

        // Button 1 (edit)
        btn = document.createElement("button");
        btn.setAttribute("type", "button");
        btn.classList.add("btn", "btn-primary");
        btn.setAttribute("binded", id);
        btn.addEventListener("click", async function(){await requestEdit(id, isSpecChem, rowEl)});
        
        iEl = document.createElement("i");
        iEl.classList.add("bi", "bi-pencil");

        btn.appendChild(iEl);
        baseTd.appendChild(btn);

        // Button 2 (delete)
        btn = document.createElement("button");
        btn.setAttribute("type", "button");
        btn.classList.add("btn", "btn-primary");
        btn.setAttribute("binded", id);
        btn.addEventListener("click", async function(){await requestDelete(id, isSpecChem, rowEl)});
        
        iEl = document.createElement("i");
        iEl.classList.add("bi", "bi-trash");

        btn.appendChild(iEl);
        baseTd.appendChild(btn);

        return baseTd;
    }

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
        cur_a.setAttribute("href", `#container-${subitem_ind}`);
        cur_a.setAttribute("role", "button");

        // Put the text into the anchor
        cur_a.appendChild(document.createTextNode(`▷[${chem.subitems[subitem_ind].containers.length}]`));

        cur_col.appendChild(cur_a);
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
        let unitIsConsistent = true;

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
        addSubItemCol("td", {});

        let counter = 0;
        for (const tag of chem.subitems[subitem_ind].tags)
        {
            // Create new <span> element for tag display
            cur_span = document.createElement("span");
            cur_span.classList.add("badge", "rounded-pill");
            cur_span.setAttribute("binded", counter);

            // Set Foreground color
            const blackRatio = await getContrast("000000", tag.color.replace("#", ""));
            const whiteRatio = await getContrast("FFFFFF", tag.color.replace("#", ""));

            if (blackRatio > whiteRatio)
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

            counter++;
        }
        cur_tr.appendChild(cur_col);

        // 6. Buttons
        cur_tr.appendChild(getButtonsMarkup(subitem_ind, true, cur_tr));

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
        cur_ul.setAttribute("binded", subitem_ind);

        for (const container_ind in chem.subitems[subitem_ind].containers)
        {
            let container = chem.subitems[subitem_ind].containers[container_ind];

            cur_li = document.createElement("li");
            cur_li.classList.add("list-group-item");
            
            // a. count
            cur_span = document.createElement("span");
            cur_span.classList.add("badge", "bg-secondary", "container-editable");
            cur_span.setAttribute("contenteditable", "false");
            cur_span.appendChild(document.createTextNode(container.count));

            cur_li.appendChild(cur_span);

            // b. container size
            cur_span = document.createElement("span");
            cur_span.classList.add("container-editable");
            cur_span.setAttribute("contenteditable", "false");
            cur_span.appendChild(document.createTextNode(container.unitCapacity + " " + container.capacityUnit));

            cur_li.appendChild(cur_span);

            // c. message
            cur_li.appendChild(document.createTextNode(" container(s), "));

            // d. amount left
            cur_span = document.createElement("span");
            cur_span.classList.add("container-editable");
            cur_span.setAttribute("contenteditable", "false");
            cur_span.appendChild(document.createTextNode(container.remaining + " " + container.capacityUnit));

            cur_li.appendChild(cur_span);

            // e. message
            cur_li.appendChild(document.createTextNode(" left"));

            // f. edit and delete buttons
            cur_li.appendChild(getButtonsMarkup(container_ind, false, cur_li));

            cur_ul.appendChild(cur_li);
        }

        // Add button (add container)
        let addbutton = document.createElement("button");
        addbutton.classList.add("btn", "btn-primary");
        addbutton.setAttribute("binded", subitem_ind);
        addbutton.appendChild(document.createTextNode("+ (container)"));
        // Add event listener
        addbutton.addEventListener("click", () => {
            current_inventory.chemHistories.doAction(new AddAction(new Container({
                count: 1,
                unitCapacity: 50,
                remaining: 50,
                capacityUnit: "mL"
            }), current_inventory, chem.subitems[subitem_ind]));

            // Refresh display
            updateSubItems();
        })

        // Append to list
        cur_ul.appendChild(addbutton);


        // Append #2
        cur_tr.appendChild(cur_ul);
        subitemsTableEl.appendChild(cur_tr);
    }

    cur_tr = document.createElement("tr");

    // Add button (add subitem)
    // Create
    let addbutton = document.createElement("button");
    addbutton.classList.add("btn", "btn-primary");
    addbutton.appendChild(document.createTextNode("+ (specific chemical)"));

    // Attach event listener
    addbutton.addEventListener("click", async function(){
        // Add a subitem
        current_inventory.chemHistories.doAction(new AddAction(new SpecificChemical({
            name: nameDispEl.innerText, // Name
            specifications: "1 M", // Specs
            tags: [new Tag({name: "Example", color: "#000000"})]
        }), current_inventory, chem));
        // Refresh display
        updateSubItems();

        // Refresh tags display
        await refreshMasterTagsDisp(chem);
    })

    // Append to page
    // cur_tr.appendChild(addbutton);
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

/**
 * Refresh master tags display.
 * @param {Chemical} item The item being viewed.
 */
async function refreshMasterTagsDisp(item)
{
    // Clear tags display element
    tagsEl.replaceChildren();

    let curTagEl; // Current tag element
    
    let curTagSet = new Set(); // Current tag set

    for (const subitem of item.subitems)
    {
        for (const tag of subitem.tags)
        {
            // If the tag already exists (and has been rendered), skip rendering
            // Avoids rendering the same tag multiple times
            if (curTagSet.has(tag.name))
            {
                continue;
            }

            curTagSet.add(tag.name);

            curTagEl = document.createElement("span");
            curTagEl.classList.add("badge", "rounded-pill");

            curTagEl.style.backgroundColor = tag.color;

            if (await getContrast("000000", tag.color.replace("#", "")) > await getContrast("FFFFFF", tag.color.replace("#", "")))
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
}

// Add or edit mode
if (addName || editID)
{
    // Handle tag editing
    // tagsEl

    // Initialize dialog box
    tagEditorSource = document.getElementById("tagEditorModal");
    tagEditorModal = new bootstrap.Modal(tagEditorSource);
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

                    chem.GHSSignal = ghs_info[1].Value.StringWithMarkup[0].String;
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

                        // Create a GHS pictogram object
                        chem.GHSPictograms.push(new GHSPictogram({identifier: Number(pic.URL[48])}));

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

                        // Create a GHS hazard H code object
                        chem.GHSCodes.push(new GHSCode({code: code.String.split(":")[0]}));
                    }

                    // P codes
                    for (const code of ghs_info[3].Value.StringWithMarkup[0].String.replace("and ", "").split(", ")) {
                        // console.log(code);
                        // console.log(GHSC.P[code]);
                        cur_li = document.createElement("li");
                        cur_li.classList.add("list-group-item", "list-group-item-info");
                        cur_li.textContent = `${code}: ${GHSC.P[code] ?? "(unknown)"}`;
                        ghs_list.appendChild(cur_li);

                        // Create a GHS hazard P code object
                        chem.GHSCodes.push(new GHSCode({code: code}));
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

                // Construct NFPA 704 diamond in inventory
                let diamondArgs = nfpa_info[0].Value.StringWithMarkup[0].Markup[0].Extra.split("-");
                chem.NFPADiamond.healthRating = Number(diamondArgs[0]);
                chem.NFPADiamond.fireRating = Number(diamondArgs[1]);
                chem.NFPADiamond.instabilityRating = Number(diamondArgs[2]);
                chem.NFPADiamond.specialConsiderations = diamondArgs[3];
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

        window.location.replace(ROOT_URL + "/");
    })
}
// Edit mode
else if (editID) {
    // Item currently being viewed
    let viewingItem = current_inventory.chemicalsMap.get(editID);
    chem = viewingItem;

    console.debug(chem);

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
    await refreshMasterTagsDisp(viewingItem);
    
    // 4. notes
    notesEl.value = viewingItem.notes;

    // 5. Subitems
    updateSubItems();

    // 6a. GHS signal
    ghs_signal.textContent = chem.GHSSignal;

    // 6b. GHS pictograms
    for (const pic of chem.GHSPictograms)
    {
        console.log(pic);

        let cur_pic_1, cur_pic_2, cur_pic_img;

        // Pre-packing
        cur_pic_1 = document.createElement("div");
        cur_pic_1.classList.add("col");
        cur_pic_2 = document.createElement("div");
        cur_pic_2.classList.add("card");
        cur_pic_img = document.createElement("img");
        cur_pic_img.classList.add("ghs-pictogram");

        // Adding the image
        cur_pic_img.setAttribute("src", pic.image);
        cur_pic_img.setAttribute("alt", pic.text);

        // Post-packing
        cur_pic_2.appendChild(cur_pic_img);
        cur_pic_2.appendChild(document.createTextNode(pic.text));
        cur_pic_1.appendChild(cur_pic_2);
        ghs_pictograms.appendChild(cur_pic_1);
    }

    // 7. GHS Hazard statements
    // Current code list item
    let cur_li;

    for (const code of chem.GHSCodes)
    {
        cur_li = document.createElement("li");
        cur_li.classList.add("list-group-item");

        // H code
        if (code.code[0] == "H")
        {
            cur_li.classList.add("list-group-item-danger");
        }
        // P code
        else
        {
            cur_li.classList.add("list-group-item", "list-group-item-info");
        }

        cur_li.textContent = code.code + ": " + code.text;

        ghs_list.appendChild(cur_li);
    }

    // 8. NFPA 704 diamond
    nfpaDiamond.setAttribute("src", chem.NFPADiamond.image);
    nfpaDiamond.setAttribute("alt", chem.NFPADiamond.chainedString);

    nfpa_health.textContent = chem.NFPADiamond.healthRating + " - " + chem.NFPADiamond.getHealthMsg();
    nfpa_fire.textContent = chem.NFPADiamond.fireRating + " - " + chem.NFPADiamond.getFireMsg();
    nfpa_instability.textContent = chem.NFPADiamond.instabilityRating + " - " + chem.NFPADiamond.getInstabilityMsg();
    if (chem.NFPADiamond.getSpecHazardMsg() !== "NONE")
    {
        nfpa_special.textContent = chem.NFPADiamond.specialConsiderations + " - " + chem.NFPADiamond.getSpecHazardMsg();
    }
    else
    {
        nfpa_special.textContent = "NONE";
    }


    // When the close button is clicked, save chemical
    closeBtn.addEventListener("click", () =>
    {

        // Determine what properties to edit

        // 1. Name
        reg(viewingItem, "name", nameDispEl.textContent);

        // 2. Molecular formula
        reg(viewingItem, "formula", formulaDispEl.textContent.replace("•", "*"));

        // 3. tags (already saved)

        // 4. Notes
        reg(viewingItem, "notes", notesEl.value);

        // Save changes
        setInv(current_inventory);

        // Redirect to home page
        window.location.replace(ROOT_URL + "/");
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
            window.location.replace(ROOT_URL + "/");
        }
    })
}
// Use outside editor
else {
    console.debug("Chemical editor neither in add mode nor in edit mode; assuming use outside editor.");
}


export { parseFormula }
