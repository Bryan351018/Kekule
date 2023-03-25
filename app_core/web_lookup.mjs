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
 * Get the color contrast between two colors.
 * @param {string} c1 The first color, in hexadecimal format, but without the "#" prefix.
 * @param {string} c2 The second color, in hexadecimal format, but without the "#" prefix.
 * @returns {number} The contrast ratio.
 */
async function getContrast(c1, c2)
{
    let result = await fetch(`https://webaim.org/resources/contrastchecker/?fcolor=${c1}&bcolor=${c2}&api`);
    let str_ratio = (await result.json()).ratio;
    return (Number(str_ratio));
}

export {getCIDAndFormula, getHazards, getContrast, getSearchSuggestions}
