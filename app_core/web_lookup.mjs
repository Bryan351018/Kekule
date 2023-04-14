/**
 * Manages chemical info lookups on PubChem and color contrast lookup
 * @module app_core/web_lookup
 */

/**
 * Gets a chemical's CID and molecular formula on PubChem through PUG-REST.
 * @param {string} name The name of the substance.
 * @returns {object} The result.
 */
async function getCIDAndFormula(name)
{
    let info = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${name}/property/MolecularFormula/JSON`);
    return (await info.json());
}

/**
 * Gets a chemical's GHS and NFPA 704 hazard information on PubChem through PUG View.
 * @param {string|number} cid The CID of the substance.
 * @returns {object} The result.
 */
async function getHazards(cid)
{
    let info = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=Safety%20and%20Hazards`);
    return (await info.json());
}

/**
 * Gets autocomplete search suggestions of a chemical on PubChem through its Auto-Complete Search Service.
 * @param {string} name The name of the chemical.
 * @returns {Array<string>} The autocomplete suggestions.
 */
async function getSearchSuggestions(name)
{
    // Maximum number of search results to return
    const limit = 10;

    let info = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${name}/json?limit=${limit}`);
    let packaged = await info.json();

    // If there are results
    if (packaged.total > 0)
    {
        return packaged.dictionary_terms.compound;
    }
    // If there are no results
    else
    {
        return [];
    }
}

/**
 * Calculates relative luminance, used to calculate color contrast
 * @param {number} r Red value
 * @param {number} g Green value
 * @param {number} b Blue value
 */
function luminance(r, g, b)
{
    // Convert 8-bit values to float
    let fr = r / 255;
    let fg = g / 255;
    let fb = b / 255;

    // Calculate calibrated intensities
    let R = fr <= 0.03928 ? fr / 12.92 : ((fr + 0.055) / 1.055) ** 2.4;
    let G = fg <= 0.03928 ? fg / 12.92 : ((fg + 0.055) / 1.055) ** 2.4;
    let B = fb <= 0.03928 ? fb / 12.92 : ((fb + 0.055) / 1.055) ** 2.4;

    // Give result
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Get the color contrast between two colors.
 * @param {string} c1 The first color, in hexadecimal format, but without the "#" prefix.
 * @param {string} c2 The second color, in hexadecimal format, but without the "#" prefix.
 * @returns {number} The contrast ratio.
 */
async function getContrast(c1, c2)
{
    // let result = await fetch(`https://webaim.org/resources/contrastchecker/?fcolor=${c1}&bcolor=${c2}&api`);
    // let str_ratio = (await result.json()).ratio;
    // return (Number(str_ratio));

    // Office calculation

    // RGB values
    let c1r = parseInt(c1.substring(0, 2), 16);
    let c1g = parseInt(c1.substring(2, 4), 16);
    let c1b = parseInt(c1.substring(4, 6), 16);

    let c2r = parseInt(c2.substring(0, 2), 16);
    let c2g = parseInt(c2.substring(2, 4), 16);
    let c2b = parseInt(c2.substring(4, 6), 16);

    // Relative luminousities
    let c1L = luminance(c1r, c1g, c1b);
    let c2L = luminance(c2r, c2g, c2b);

    return (Math.max(c1L, c2L) + 0.05) / (Math.min(c1L, c2L) + 0.05)
}

export {getCIDAndFormula, getHazards, getContrast, getSearchSuggestions}
