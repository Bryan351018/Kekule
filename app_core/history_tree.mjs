/**
 * A tree-like data structure to store action histories,
 * so undo/redo funcationalities are supported
 * @module app_core/history_tree
 */

import {Action} from "./kekule.mjs";

// A branch of a tree
class Branch
{
    // Is flagged
    flagged = false;

    // Attached action
    /**@type {Action} */
    action;

    // Attached lower-level node
    /**@type {Node} */
    descNode = null;

    /**
     * @param {Action} action 
     * @param {Node} descNode 
     */
    constructor(action, descNode)
    {
        this.action = action;
        this.descNode = descNode;
    }
}

// A node of a tree
class Node
{
    // Branches of the tree, which is of type [Branch].
    /**@type {Array<Branch>} */
    connections = [];

    /**@type {Node} */
    parentNode = null;

    /**@type {Branch} */
    parentBranch = null;

    constructor(parentNode)
    {
        this.parentNode = parentNode;
    }
}

// Unflag all descendent branches of the current node
/**@param {Node} cur_node */
function unflagDescendents(cur_node)
{
    // Type check
    if (!(cur_node instanceof Node))
    {
        throw TypeError("Attempted to unflag descendents of a non-node.")
    }

    // Base case
    if (!cur_node)
        return;
    
    // Recursion
    for (var branch of cur_node.connections) 
    {
        branch.flagged = false;
        unflagDescendents(branch.action);
    }
}

/** Class representing a history tree that supports doing new actions, undoing actions, redoing actions, and seeing its tree size. */
class HistoryTree
{
    // The current node of the tree
    /**@type {Node} */
    #cur_node;

    
    // Size of the history tree, declared with # to prevent accidental writing
    #size = 0;

    /**
     * The number of nodes in the history tree.
     * @type {number}
     */
    get size()
    {
        return this.#size;
    }

    /**
     * Do a new action.
     * @param {Action} action The action to execute.
     */
    doAction(action)
    {
        // Type check
        if (action instanceof Action)
        {
            // Execute the action
            action.perform();

            // Unflag all descendents of the currennt node
            unflagDescendents(this.#cur_node);
            // Create a node
            var newNode = new Branch(action, new Node(this.#cur_node));
            newNode.descNode.parentBranch = newNode;

            // Push the branch into the array of branches
            this.#cur_node.connections.push(newNode);

            // Switch the current node
            this.#cur_node = this.#cur_node.connections[this.#cur_node.connections.length - 1];

            // Increase the tree size
            this.#size++;
        }
        else
        {
            throw TypeError("Attempted to do a new action that is not of type \"action\".");
        }
    }

    /**
     * Check if the undo command can be executed.
     * @returns {boolean} The result.
     */
    undoable()
    {
        return this.#cur_node.parentNode == null;
    }

    /**
     * Undo the most recent action.
     */
    undo()
    {
        // Look for the highest numbered unflagged child
        for (var i = this.#cur_node.connections.length; i >= 0; i--)
        {
            // If such a child is found
            if (!this.#cur_node.connections[i].flagged)
            {
                // Execute the forward action
                this.#cur_node.connections[i].action.perform();

                // Flag it
                this.#cur_node.connections[i].flagged = true;

                // Switch the current node
                this.#cur_node = this.#cur_node.connections[i].descNode;

                // Exit the undo function
                return;
            }
        }

        // If there is a parent
        if (this.#cur_node.parentNode)
        {
            // Execute the reverse action
            this.#cur_node.parentBranch.action.unperform();

            // Switch the current node
            this.#cur_node = this.#cur_node.parentNode;
        }
    }

    /**
     * Check if the redo command can be executed.
     * @returns {boolean} The result.
     */
    redoable()
    {
        return this.#cur_node.connections.length > 0 || this.#cur_node.parentBranch.flagged;
    }

    /**
     * Redo the most recent action.
     */
    redo()
    {
        // Look for the lowest numbered flagged child
        for (var i in this.#cur_node.connections)
        {
            // If such a child is found
            if (this.#cur_node.connections[i].flagged)
            {
                // Execute the forward action
                this.#cur_node.connections[i].action.perform();

                // Unflag it
                this.#cur_node.connections[i].flagged = false;

                // Switch the current node
                this.#cur_node = this.#cur_node.connections[i].descNode;

                // Exit the redo function
                return;
            }
        }

        // See if parent branch is flagged
        if (this.#cur_node.parentBranch.flagged)
        {
            // Execute the reverse action
            this.#cur_node.parentBranch.action.unperform();

            // Unflag it
            this.#cur_node.parentBranch.flagged = false;

            // Go to parent node
            this.#cur_node = this.#cur_node.parentNode;
        }
    }

    /**
     * Create an empty history tree.
     */
    constructor(){}
}

export {HistoryTree}
