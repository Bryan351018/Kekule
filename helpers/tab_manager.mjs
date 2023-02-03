/**
 * Manages tab switching and preserving current tab against refreshes
 * @module helpers/tab_manager
 */


// Find the iframe that is displayed on the main page
let frame = document.getElementById("main-frame");

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
        throw Error("Main frame name not specified, and not found in session storage.");
}

// Set the frame on page load
if (sessionFrameName)
    setMainFrame();
else
    sessionStorage.setItem("mainFrameName", "chemicals");


// ---- Attach event handlers ----

// Abstraction
function attachTabHandler(elId, name)
{
    document.getElementById(elId).onclick = () => 
    {
        setMainFrame(name);
        sessionStorage.setItem("mainFrameName", name);
        console.log(elId, name)
    }
}

// Call the functions
attachTabHandler("chemicals-tab", "chemicals");
attachTabHandler("apparatuses-tab", "apparatuses");
attachTabHandler("inventories-tab", "inventories");