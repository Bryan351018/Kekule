/**
 * Manages tab switching and preserving current tab against refreshes
 * @module helpers/tab_manager
 */


// Find the iframe that is displayed on the main page
let frame = document.getElementById("main-frame");

// Find the <title element>
let titleEl = document.getElementById("browser-tab-title");

// The frame name stored in the session
const sessionFrameName = sessionStorage.getItem("mainFrameName");

/**
 * Set the main display frame to display chemicals, apparatuses, inventories, or more.
 * @param {"chemicals"|"apparatuses"|"inventories"|undefined} name The name of the frame to set.
 */
function setMainFrame(name)
{
    // If the parameter is not specified, the name defaults to the value in sessionStorage
    if (name || sessionFrameName)
        frame.setAttribute("src", `./frames/${name ?? sessionFrameName}.html`);
    else
    {
        throw Error("Main frame name not specified, and not found in session storage.");
    }
}

// Set the frame on page load
// if (!sessionFrameName)
// {
//     sessionStorage.setItem("mainFrameName", "chemicals");
//     titleEl.innerText = "Kekule: Chemicals";
// }
// setMainFrame();



// ---- Attach event handlers ----

// Abstraction
/**
 * Attach an "onclick" handler to a chemical/apparatus/inventory tab for initialization.
 * @param {string} elId ID of the HTML element to bind to
 * @param {string} name Name of the frame file to load
 * @param {string} dispName Display name of the frame file, as used in the <title> element
 */
function attachTabHandler(elId, name, dispName)
{
    document.getElementById(elId).onclick = () => 
    {
        setMainFrame(name);
        sessionStorage.setItem("mainFrameName", name);
        titleEl.innerText = `Kekule: ${dispName}`;

        console.log(elId, name)
    }
}

// Call the functions
attachTabHandler("chemicals-tab", "chemicals", "Chemicals");
attachTabHandler("apparatuses-tab", "apparatuses", "Apparatuses");
attachTabHandler("inventories-tab", "inventories", "Inventories");

// Set the main frame and titles
if (!sessionFrameName)
{
    document.getElementById("chemicals-tab").click();
}
else
{
    document.getElementById(`${sessionFrameName}-tab`).click();
}
