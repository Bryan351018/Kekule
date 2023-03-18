/**
 * Helps the display of chemicals in the chemicals tab
 * @module helpers/chemicals_display
 */

import { Inventory, Apparatus, SpecificApparatus, Tag, AddAction } from "../app_core/kekule.mjs";
import { current_inventory } from "../app_core/base.mjs";

// Get chemicals table
let appaTable = document.getElementById("apparatuses-table");

// Testing data
let a = new Apparatus();
a.name = "Beaker";
let a1 = new SpecificApparatus();
a1.name = "Beaker";
a1.specifications = "250mL ± 5%";
let a1t = new Tag();
a1t.name = "A1";
a1t.color = "#55004F";
a1.tags.push(a1t);
a.addSubItem(a1);
current_inventory.appaHistories.doAction(new AddAction(a, current_inventory));

/**
 * Update the apparatuses display table from the current inventory.
 */
function updateDisplay() {
    console.log("Updating display");

    // Flush display table
    appaTable.innerHTML = "";

    // Current table row
    let row;

    // Current table column
    let col;

    // Number of subitems
    let numSubitems;

    // Count HTML node
    let countNodeEl;

    // Count Text node
    let countTextNode;

    // Current badge
    let cur_badge;

    // Badges tracking set
    let badges_set = new Set();

    // Subitem tracking table body element
    let subitemTableBodyEl;

    // Subitem tracking table row element
    let subitemTableRowEl;

    // Subitem tracking table column element
    let subitemTableColEl;

    /**
     * Inline function to append column
     * @param {string} element 
     * @param {Object<string,string>} param 
     * @param {any} val 
     */
    function addCol(element, param, val) {
        // (create)
        col = document.createElement(element);

        for (const [key, val] of Object.entries(param)) {
            col.setAttribute(key, val);
        }

        // (set)
        if (val instanceof Node) {
            col.appendChild(val);
        }
        else if (typeof val == "string") {
            col.innerHTML = val;
        }

        // (append)
        if (typeof val != "undefined") {
            row.appendChild(col);
        }
    }

    /**
     * Inline function to append subitem column
     * @param {string} element
     * @param {Object<string,string>} param 
     * @param {any} val 
     */
    function addSubItemCol(element, param, val) {
        // (create)
        subitemTableColEl = document.createElement(element);

        for (const [key, val] of Object.entries(param)) {
            subitemTableColEl.setAttribute(key, val);
        }

        // (set)
        if (val instanceof Node) {
            subitemTableColEl.appendChild(val);
        }
        else if (typeof val == "string") {
            subitemTableColEl.innerHTML = val;
        }

        // (append)
        if (typeof val != "undefined") {
            subitemTableRowEl.appendChild(subitemTableColEl);
        }
    }

    // Create row for each item in the list
    for (let item of current_inventory.apparatuses) {
        console.log(item);

        // Create table row
        row = document.createElement("tr");

        // 1. Amount of subitems
        numSubitems = item.subitems.length;

        countTextNode = document.createTextNode(`▶ ${numSubitems}`);

        // If there are subitems
        if (numSubitems > 0) {
            countNodeEl = document.createElement("a");
            countNodeEl.setAttribute("data-bs-toggle", "collapse");
            countNodeEl.setAttribute("href", `#specAppa-${item.ID}`);
            countNodeEl.setAttribute("role", "button");
            countNodeEl.setAttribute("aria-expanded", "false");
            countNodeEl.setAttribute("aria-controls", `specAppa-${item.ID}`);
            countNodeEl.appendChild(countTextNode)
        }
        // If there are no subitems
        else {
            countNodeEl = countTextNode;
        }
        addCol("th", { "scope": "row" }, countNodeEl);


        // 2. Apparatus name
        addCol("td", {}, document.createTextNode(item.name));

        // 3. Badges
        // Pass with only 2 arguments to set up but not append
        addCol("td", {});
        // Track tags
        if (item.subitems) {
            for (const iteml1 of item.subitems) {
                for (const tag of iteml1.tags) {
                    badges_set.add(tag);
                }
            }
        }
        // Create tag displays
        for (const tag of badges_set) {
            cur_badge = document.createElement("span");
            cur_badge.classList.add("badge", "rounded-pill");
            cur_badge.style.backgroundColor = tag.color;
            cur_badge.appendChild(document.createTextNode(tag.name));
            col.appendChild(cur_badge);
        }
        // Append entire column
        row.appendChild(col);
        // Clear badges set
        badges_set.clear();

        // 4. Last edited date
        addCol("td", {}, item.editDate);

        // Append table row
        appaTable.appendChild(row);

        // PART B: Subitems table display

        // If there are subitems
        if (numSubitems > 0) {
            // Create table body
            subitemTableBodyEl = document.createElement("tbody");

            // For each subitem
            for (const subitem of item.subitems) {
                // Create row
                subitemTableRowEl = document.createElement("tr");

                // 1. Count of specific apparatus
                addSubItemCol("th", { scope: "row" }, `▷[${subitem.count}]`);

                // 2. Subitem name
                addSubItemCol("td", {}, subitem.name);

                // 3. Specifications
                addSubItemCol("td", {}, subitem.specifications);

                // 4. Tags
                addSubItemCol("td", {});

                // Track tags
                for (const tag of subitem.tags) {
                    badges_set.add(tag);
                }

                // Create tag displays
                for (const tag of badges_set) {
                    cur_badge = document.createElement("span");
                    cur_badge.classList.add("badge", "rounded-pill");
                    cur_badge.style.backgroundColor = tag.color;
                    cur_badge.appendChild(document.createTextNode(tag.name));
                    subitemTableColEl.appendChild(cur_badge);
                }
                // Append entire column
                subitemTableRowEl.appendChild(subitemTableColEl);
                // Clear badges set
                badges_set.clear();

                // 5. Last edited date
                addSubItemCol("td", {}, subitem.editDate);


                // Append row to table body
                subitemTableBodyEl.appendChild(subitemTableRowEl);
            }

            // Append subitem table section to item table
            appaTable.innerHTML += `<tr class="collapse" id="specAppa-${item.ID}">
            <td colspan="4"><div class="card card-body border-info">
            <table class="table mb-0"><thead><tr><th scope="col">Count</th>
            <th scope="col">Name</th><th scope="col">Specifications</th><th scope="col">Tags</th>
            <th scope="col">Last edited</th></tr></thead>${subitemTableBodyEl.innerHTML}</table></div></td></tr>`
        }
    }
}

updateDisplay();
