/**
 * Some useful algorithms used in Kekule, such as sorted insertion
 * @module app_core/utilities
 */

import { Record } from "./kekule.mjs";

/**
 * Add an element into an array, so that the array is sorted. Returns the location of the added element after operation.
 * @param {object} element The element to add.
 * @param {Array<object>} target The array to add to.
 * @param {(a: object, b: object) => number} comp A function that takes 2 arguments, 'a' and 'b', that returns a negative value if 'a' comes before 'b', a positive value if 'a' comes after 'b', and zero if 'a' comes in the same place as 'b'.
 * @returns {number} The location that the element was added.
 */
function sortedAdd(element, target, comp)
{
    // Implementing "binary search" to see where the element fits

    // If the target array is empty
    if (target.length == 0)
    {
        target.push(element);
        return 0;
    }

    // Minimum index
    let min_ind = 0;

    // Maximum index
    let max_ind = target.length - 1;

    // Current index
    let cur_ind;

    // Current element
    let cur_el;

    // While there are elements still left to search
    while (max_ind - min_ind > 1)
    {
        // Update the current index
        cur_ind = Math.trunc((min_ind + max_ind) / 2);
        // Update the current element
        cur_el = target[cur_ind];

        // console.debug(`Min-max-avg indices: ${min_ind}, ${max_ind}, ${cur_ind}`);

        // If the element to add...

        // Comes before
        if (comp(element, cur_el) < 0)
        {
            // console.debug(`${element} comes before ${cur_el} at index ${cur_ind}`);
            max_ind = cur_ind;
        }
        // Comes after
        else if (comp(element, cur_el) > 0)
        {
            // console.debug(`${element} comes after ${cur_el} at index ${cur_ind}`);
            min_ind = cur_ind;
        }
        // In the same place
        else
        {
            // Perform the insertion right away!
            // console.debug(`${element} comes in the same location as ${cur_el} at index ${cur_ind}`);
            target.splice(cur_ind, 0, element);
            return cur_ind;
        }
    }

    // console.debug(`FINAL Min-max-avg indices: ${min_ind}, ${max_ind}, ${cur_ind}`);

    // Get final comparison results of the min and max
    let min_res = comp(element, target[min_ind]);
    let max_res = comp(element, target[max_ind]);

    // Element is after min index
    if (min_res > 0)
    {
        // Element is after max index:
        // (Element should be appended to the end of the array)
        if (max_res > 0)
        {
            target.push(element);
            return target.length - 1;
        }
        // Element is before max index:
        // (Element should be added between the min and max indices)
        else
        {
            target.splice(max_ind, 0, element);
            return max_ind;
        }
    }
    // Element is before min index
    else
    {
        // Element is after max index:
        // (Error condition, theoretically cannot happen)
        if (max_res > 0)
        {
            throw EvalError("Min index > Max index during sorted element insertion.")
        }
        // Element is before max index:
        // (Element should be appended to the start of the array)
        else
        {
            target.unshift(element);
            return 0;
        }
    }
}

/**
 * Compares two Item or SubItem objects. Designed for use in sortedAdd().
 * @param {Record} a The first object.
 * @param {Record} b The second object.
 * @returns {number} The result for use in sortedAdd().
 */
function compRecs(a, b)
{
    // String comparisons are based on Unicode code points (numerical value represented by a character)
    return (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1);
}

export { sortedAdd, compRecs}
