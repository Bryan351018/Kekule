/**
 * Manages chemical editor widgets
 * @module helpers/chemical_editor
 */

// Chemical name display element
let nameDispEl = document.getElementById("name-display");
// Chemical name editing element
let nameEditEl = document.getElementById("name-editor")

// Molecular formula display element
let formulaDispEl = document.getElementById("formula-display");
// Molecular formula editing element
let formulaEditEl = document.getElementById("formula-editor");

//If this module is used inside the chemical editor
// (As opposed to the chemicals main display table)
if (nameEditEl && formulaEditEl)
{
    // Attach event handler for chemical name
    nameEditEl.addEventListener("input", (event) =>
    {
        nameDispEl.innerText = event.target.value;
    }) 
    // Attach event handler for molecular formula
    formulaEditEl.addEventListener("input", (event) => 
    {
        formulaEditEl.value = parseFormula(event.target.value, "inline");
        formulaDispEl.innerHTML = parseFormula(event.target.value, "html");
    })
}
else
{
    console.debug("Editing elements not found, assuming use outside editor")
}

/** Function for parsing a molecular formula
 * @param {string} formula The molecular formula
 * @param {"inline"|"html"} format The format of the output
 * @returns {string} The formatted molecular formula
 */
function parseFormula(formula, format)
{
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

    switch (format)
    {
        // Inline parsing
        case "inline":
            // For each character in the molecular formula
            for (const char of formula)
            {
                // If a bullet operator is found
                if (bullets.includes(char))
                {
                    coeffAllowed = true;
                    result += bullet;
                    continue;
                }

                // Check if character is a letter (e.g. part of an element symbol)
                if (char.toLowerCase() != char.toUpperCase())
                {
                    coeffAllowed = false;
                    result += char;
                    continue;
                }

                // Numbers
                else
                {
                    // If number is part of a coefficient in hydrated compounds
                    if (coeffAllowed)
                    {
                        // Add number as-is to result
                        result += char;
                        continue;
                    }
                    // If number is part of a subscript
                    else
                    {
                        // Add subscript version to result, if not already in subscript form
                        if (!Number.isNaN(parseInt(char)))
                        {
                            result += String.fromCharCode(subs_base + parseInt(char));
                        }
                        else
                        {
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
            for (const char of formula)
            {
                // If a bullet operator is found
                if (bullets.includes(char))
                {
                    subs = false;
                    result += "</sub>";

                    coeffAllowed = true;
                    result += bullet;
                    continue;
                }

                // Check if character is a letter (e.g. part of an element symbol)
                if (char.toLowerCase() != char.toUpperCase())
                {
                    // If the previous character was a subscript
                    if (subs)
                    {
                        subs = false;
                        result += "</sub>";
                    }

                    coeffAllowed = false;
                    result += char;
                    continue;
                }

                // Numbers
                else
                {
                    // If number is part of a coefficient in hydrated compounds
                    if (coeffAllowed)
                    {
                        // Add number as-is to result
                        result += char;
                        continue;
                    }
                    // If number is part of a subscript
                    else
                    {
                        // If this is the first subscript digit
                        if (!subs)
                        {
                            subs = true;
                            result += "<sub>";
                        }

                        // Add subscript version to result

                        // If number is not formatted as Unicode subscript
                        if (!Number.isNaN(parseInt(char)))
                        {
                            result += char;
                        }
                        // If number is formatted as Unicode subscript
                        else
                        {
                            result += (char.charCodeAt(0) - subs_base).toString();
                        }
                        
                        continue;
                    }
                }
            }

            // If the last character was a subscript
            if (subs)
            {
                subs = false;
                result += "</sub>";
            }

            return result;
        
        // Default error case
        default:
            throw TypeError(`${format} is not a valid chemical formula parsing format.`);
    }
}



export { parseFormula }
