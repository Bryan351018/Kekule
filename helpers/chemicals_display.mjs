/**
 * Helps the display of chemicals in the chemicals tab
 * @module helpers/chemicals_display
 */

// import { Inventory, Chemical, SpecificChemical, Container, Tag, AddAction } from "../app_core/kekule.mjs";
import { refreshInv, current_inventory } from "../app_core/base.mjs";
import { parseFormula } from "./chemical_editor.mjs";
import { getSearchSuggestions } from "../app_core/web_lookup.mjs";
import { ROOT_URL } from "../app_core/root_url.mjs";

// Get chemicals table
let chemTable = document.getElementById("chemicals-table");

// Main form
let formEl = document.getElementById("main-form");

// Search element
let searchEl = document.getElementById("search-textfield");

// Button to add a chemical
let addEl = document.getElementById("add-chemical");

// Chemical suggestions
let suggestionListEl = document.getElementById("chemical-suggestions");

// Testing data
// let a = new Chemical();
// a.name = "Hydrochloric acid";
// a.formula = "HCl";
// let a1 = new SpecificChemical();
// a1.name = "Hydrochloric acid";
// a1.specifications = "5 M";
// let a1c = new Container();
// a1c.count = 5;
// a1c.capacityUnit = "mL";
// a1c.unitCapacity = 90;
// a1c.remaining = 250;
// a1.containers.push(a1c);
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

// var current_inventory = new Inventory({
//     chemicals: 
//     [
//         {
//             name: "Copper sulfate heptahydrate",
//             formula: "CuSO4*7H2O"
//         },
//         {
//             name: "Hydrochloric acid",
//             formula: "HCl",
//             subitems: 
//             [
//                 {
//                     name: "Hydrochloric acid",
//                     specifications: "5 M",
//                     containers:
//                     [
//                         {
//                             count: 5,
//                             capacityUnit: "mL",
//                             remaining: 250
//                         }
//                     ],
//                     tags:
//                     [
//                         {
//                             name: "test",
//                             color: "#005B00"
//                         },
//                         {
//                             name: "test2",
//                             color: "#AA5B00"
//                         }
//                     ]
//                 }
//             ]
//         },
//         {
//             name: "Unknown #1"
//         }
//     ]
// });
await refreshInv();

/**
 * Update the chemicals display table from the current inventory.
 * @param {string} criteria The common substring of the chemicals shown.
 * @returns {boolean} Whether the table displayed any match.
 */
function updateDisplay(criteria) {
    console.log("Updating display");

    // Flush display table
    chemTable.innerHTML = "";

    // Result matched flag
    let matched = false;

    // Current table row
    let row;

    // Current table column
    let col;

    // Current chemical amount left
    let amtCounter = 0;

    // Current chemical final amount display
    let amtDisp;

    // Current specific chemical amount left
    let specAmtCounter = 0;

    // Current chemical counter

    // Number of subitems
    let numSubitems;

    // <a> node on the chemical names to allow chemical editing
    let anchorNode;

    // Count HTML node
    let countNodeEl;

    // Count Text node
    let countTextNode;

    // Is in unit tracking mode (to check unit consistancy)
    let unitTracked = false;

    // Unit is consistent
    let unitIsConsistent = true;

    // Current chemical container unit
    let amtUnitTracker = "";

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
    for (let item of current_inventory.chemicals) {
        console.log(item);

        // If criteria is not met, skip current display
        if (criteria && !item.name.includes(criteria))
        {
            continue;
        }

        // If this line is executed, there is a match
        matched = true;

        // Create table row
        row = document.createElement("tr");

        // 1. Amount of subitems
        numSubitems = item.subitems.length;

        countTextNode = document.createTextNode(`▶ ${numSubitems}`);

        // If there are subitems
        if (numSubitems > 0) {
            countNodeEl = document.createElement("a");
            countNodeEl.setAttribute("data-bs-toggle", "collapse");
            countNodeEl.setAttribute("href", `#specChem-${item.ID}`);
            countNodeEl.setAttribute("role", "button");
            countNodeEl.setAttribute("aria-expanded", "false");
            countNodeEl.setAttribute("aria-controls", `specChem-${item.ID}`);
            countNodeEl.appendChild(countTextNode)
        }
        // If there are no subitems
        else {
            countNodeEl = countTextNode;
        }
        addCol("th", { "scope": "row" }, countNodeEl);


        // 2. Chemical name
        anchorNode = document.createElement("a");
        anchorNode.setAttribute("href", `/frames/chemical_editor.html?id=${item.ID}`);
        anchorNode.setAttribute("target", "_top");
        anchorNode.appendChild(document.createTextNode(item.name));
        addCol("td", {}, anchorNode);

        // 3. Molecular formula
        addCol("td", {}, parseFormula(item.formula, "html"));

        // 4. Amount left
        // (count)
        amtCounter = 0;

        // Amount counting loop
        if (item.subitems) {
            for (const iteml1 of item.subitems) {
                if (iteml1.containers) {
                    for (const iteml2 of iteml1.containers) {
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
            }
        }

        // (add column)
        // If units are consistent
        if (unitIsConsistent) {
            // unitTracked put here to display "NONE" if there are no containers
            if (amtCounter > 0 && unitTracked) {
                amtDisp = amtCounter + " " + amtUnitTracker
            }
            else {
                row.classList.add("table-warning")
                amtDisp = "NONE";
            }
        }
        // If units aren't consistent
        else {
            if (amtCounter > 0) {
                amtDisp = "PRESENT";
            }
            else {
                row.classList.add("table-warning")
                amtDisp = "NONE";
            }
        }
        addCol("td", {}, amtDisp)

        // 5. Badges
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

        // 6. Last edited date
        addCol("td", {}, item.editDate);

        // Append table row
        chemTable.appendChild(row);



        // PART B: Subitems table display

        // If there are subitems
        if (numSubitems > 0) {
            // Create table body
            subitemTableBodyEl = document.createElement("tbody");

            // For each subitem
            for (const subitem of item.subitems) {
                // Create row
                subitemTableRowEl = document.createElement("tr");

                // 1. Amount of containers
                addSubItemCol("th", { scope: "row" }, `▷[${subitem.containers.length}]`);

                // 2. Subitem name
                addSubItemCol("td", {}, subitem.name);

                // 3. Specifications
                addSubItemCol("td", {}, subitem.specifications);

                // 4. Amount Left
                specAmtCounter = 0;
                unitIsConsistent = true; // Re-using the consistency flag
                unitTracked = false; // Re-using the tracking flag
                // Sum up the amount and check the unit
                for (const container of subitem.containers) {
                    specAmtCounter += container.remaining;

                    // If checked flag is false
                    if (!unitTracked) {
                        // Keep an eye on the first unit
                        amtUnitTracker = container.capacityUnit;
                        // Set the tracked flag to true
                        unitTracked = true;
                    }
                    // Otherwise, if the unit is different, break out of the loop
                    else if (container.capacityUnit != amtUnitTracker) {
                        unitIsConsistent = false;
                    }
                }

                if (unitIsConsistent) {
                    // unitTracked put here to display "NONE" if there are no containers
                    if (specAmtCounter > 0 && unitTracked) {
                        amtDisp = specAmtCounter + " " + amtUnitTracker
                    }
                    else {
                        subitemTableRowEl.classList.add("table-warning")
                        amtDisp = "NONE";
                    }
                }
                // If units aren't consistent
                else {
                    if (specAmtCounter > 0) {
                        amtDisp = "PRESENT";
                    }
                    else {
                        subitemTableRowEl.classList.add("table-warning")
                        amtDisp = "NONE";
                    }
                }

                addSubItemCol("td", {}, amtDisp);

                // 5. Tags

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

                // 6. Last edited date
                addSubItemCol("td", {}, subitem.editDate);


                // Append row to table body
                subitemTableBodyEl.appendChild(subitemTableRowEl);
            }

            // Append subitem table section to item table
            chemTable.innerHTML += `<tr class="collapse" id="specChem-${item.ID}">
            <td colspan="4"><div class="card card-body border-info">
            <table class="table mb-0"><thead><tr><th scope="col">Count</th>
            <th scope="col">Name</th><th scope="col">Specifications</th><th scope="col">Amount left</th>
            <th scope="col">Tags</th><th scope="col">Last edited</th></tr></thead>${subitemTableBodyEl.innerHTML}</table></div></td></tr>`
        }
    }

    return matched;
}

/**
 * Update the chemicals suggestion list from the current inventory.
 * @param {string} criteria The common substring of the chemicals shown.
 */
function updateList(criteria)
{
    getSearchSuggestions(criteria).then((suggestions) => 
    {
        // Clear the suggestion list
        suggestionListEl.replaceChildren();

        // Current <option> element
        let cur_opt_el;

        for (const option of suggestions)
        {
            cur_opt_el = document.createElement("option");
            cur_opt_el.setAttribute("value", option);

            suggestionListEl.appendChild(cur_opt_el);
        }
    });
}

updateDisplay();

// Prevent form submission
formEl.addEventListener("submit", (event) => 
{
    event.preventDefault();
});

// Refresh chemical display
searchEl.addEventListener("change", (event) =>
{
    console.log(event.target.value);

    // Update display, and update suggestion list if nothing is found
    if (!updateDisplay(event.target.value))
    {
        updateList(event.target.value);
    }
});

// Add a chemical if the "add" button is clicked
addEl.addEventListener("click", (event) => 
{
    // Redirect to add page
    event.preventDefault();
    window.location.replace(`${ROOT_URL}/frames/chemical_editor.html?add=${encodeURI(searchEl.value)}`);
});
