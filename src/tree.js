/**
 * @typedef  {Object}    node
 * @property {String}         tag
 * @property {String|Number} [_id]
 * @property {Object}        [opt]
 * @property {String|Number} [val]
 * @property {Boolean}       [sav]
 * @property {Array<node>}   [sub]
 * @property {Element}       [el]
 */

export default class Tree {
    constructor(initialTree, xmlns = 'http://www.w3.org/2000/svg') {
        this.xmlns = xmlns;
        this.tree = initialTree || {};
    }

    /**
     * Create dom element from node object
     * @param {node} node
     * @param {Element} [parent]
     * @returns {Element}
     */
    createNode(node, parent) {
        const el = node.tag instanceof Element ? node.tag : document.createElementNS(this.xmlns, node.tag);
        if (!node.tag) return null;

        if (node.val != null) {
            el.innerHTML = node.val;
        }
        if (node.opt) {
            Object.entries(node.opt).forEach(([key, value]) => {
                el.setAttributeNS(null, key, value);
            });
        }
        if (parent) parent.appendChild(el);
        return el;
    }

    compile(node = this.tree, parent = null) {
        if (!node) node = this.tree;
        if (!node.tag) return null;

        if (node._id) {
            if (!node.opt) node.opt = {};
            node.opt['x-id'] = node._id;
        }

        const el = this.createNode(node, parent);
        if (node.sav) node._el = el;
        if (node.sub) node.sub.forEach(sub => {
            if (sub instanceof Element) el.appendChild(sub);
            else sub && this.compile(sub, el);
        });

        return el;
    }

    recompile(oldNode = this.tree, newNode = oldNode) {
        if (!oldNode._el) {
            console.error('Trying to recompile node without stored element');
            return;
        }

        const oldElement = oldNode._el;
        const newElement = this.compile(newNode);
        return oldElement.parentElement.replaceChild(newElement, oldElement);
    }

    /**
     * works not really correct, need rework
     * has issue with returning found value from deep like '/main/hours/line', will return hours node instead of line
     * has issue with partial selectors like 'hours/line' instead of full '/main/hours/line'
     * best usage for now is to find plugin by id
     *
     * @param selector - id of node or path from root like '/main/...', if node has _id it will be used to compare with selector, otherwise - tag
     * @param [tree]
     * @param [path]
     * @returns {null|{}}
     */
    find(selector, tree = this.tree, path = '') {
        if (tree._id == selector) return tree;
        const treePath = path + '/' + (tree._id || tree.tag || '');
        if (treePath === selector) return tree;
        if (tree.sub) {
            return tree.sub.filter(subTree => typeof subTree === 'object')
                .find(subTree => this.find(selector, subTree, treePath)) || null;
        }
        return null;
    }

    /**
     * init code, not finished
     * should return tree node by xpath
     *
     * @param selector
     * @param tree
     * @returns {*[]|*|{}}
     */
    q(selector, tree = this.tree) {
        if (tree._id == selector) return tree;
        if (this._cache[selector]) return this._cache[selector][0];
        const path = String(selector).split('/');
        const catches = path.map(value => this._cache[value]);
        //catches.reduce(() => {}, );
        return catches;
    }

    append(element, subTree, before = false) {
        // selector passed
        if (element && subTree && String(element) === element) {
            element = this.find(element);
        }

        // element not passed
        if (element && subTree == null && element instanceof Object) {
            subTree = element;
            element = this.tree;
        }

        if (element) {
            if (!element.sub) element.sub = [];
            if (subTree instanceof Tree) subTree = subTree.tree;
            if (!(subTree instanceof Array)) subTree = [subTree];
            const method = before ? 'unshift' : 'push';
            element.sub[method](...subTree);
        }

        return element;
    }

    prepend(element, subTree) {
        return this.append(element, subTree, true);
    }
}
