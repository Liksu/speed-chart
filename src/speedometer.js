import Tree from './tree.js';
import {merge} from './utils.js';
window.merge = merge;

// default plugins
import Background from './plugins/background.js'
import Ticks from './plugins/ticks.js'
import Needle from './plugins/needle.js'

const knownPlugins = Object.assign(['background', 'ticks', 'needle'], {
    background: Background,
    ticks: Ticks,
    needle: Needle
});

/**
 * @typedef {Object} settings
 * @property {String} selector
 * @property {Element|String} element
 * @property {Object} geometry
 * @property {Number} geometry.maxRadius
 * @property {Object} geometry.center
 * @property {Number} geometry.center.x
 * @property {Number} geometry.center.y
 * @property {Object} geometry.size
 * @property {Number} geometry.size.width
 * @property {Number} geometry.size.height
 * @property {Number|Array|Object} alpha
 * @property {Number} alpha.start
 * @property {Number} alpha.end
 * @property {Number} alpha.angle
 * @property {Number|Array|Object|Function} norma
 * @property {Number} norma.min
 * @property {Number} norma.max
 * @property {Number} norma.coefficient
 * @property {Number} value - init value
 * @property {Boolean} multiValues
 * @property {Object.<string, string>} colors
 * @property {Object} construct
 * @property {Array<String>} plugins
 */

const defaultConstruct = {
    background: true,
    ticks: true,
    needle: true
};


/**
 * @type {settings}
 */
const defaultConfig = {
    geometry: {
        margin: 5,
//        size: {width: 0, height: 0} // will be calculated
    },
    construct: defaultConstruct,
    colors: {
        defaultRGBA: 'rgba(0, 0, 0, 0)'
    }
};

const mainId = 'main';

/**
 * @class Speedometer
 * @property {settings} settings
 * @property {Element} element
 * @property {Object} defaults
 * @property {Number} value
 * @property {Object.<string, number>} values
 */
export default class Speedometer {
    static get defaults() {
        return {
            config: defaultConfig,
            construct: defaultConstruct,
            plugins: knownPlugins
        };
    }

    static resetPlugins(newOrder) {
        knownPlugins.length = 0;
        if (newOrder && newOrder instanceof Array) {
            newOrder.forEach(plugin => {
                if (String(plugin) === plugin) {
                    plugin = {name: plugin};
                }
                Speedometer.register(plugin.name, plugin.construct);
            });
        }
    }

    static register(name, constructor, storeOnly = false) {
        if (!storeOnly) knownPlugins.push(name);
        if (constructor) knownPlugins[name] = constructor;
    }

    /**
     * @param {Element|String|settings} [element]
     * @param {settings} [settings]
     */
    constructor(element, settings) {
        // if selector passed as element
        if (String(element) === element) element = document.querySelector(element);

        // restore settings
        if (!settings) {
            if (!element || element instanceof Element) settings = {};
            else {
                settings = element;
                element = null;
            }
        }

        // restore element
        if (!element) {
            if (settings.element instanceof Element) {
                element = settings.element;
            } else if (settings.selector || settings.element) {
                element = document.querySelector(settings.selector || settings.element);
            }
        }

        settings = merge(defaultConfig, settings);
        Object.assign(this, {settings, element});

        this._value = settings.value != null ? settings.value : 0;
        this._values = {};
        this.update();
    }

    /**
     * @private
     * @param {settings} settings
     */
    init(settings = this.settings) {
        const geometry = settings.geometry;

        // get dimensions
        let {width, height} = geometry.size || window.getComputedStyle(this.element);
        width = parseFloat(String(width));
        height = parseFloat(String(height));

        if (!geometry.size) geometry.size = {};
        Object.assign(geometry.size, {width, height});

        // init tree
        const svg = {
            _id: mainId,
            tag: 'svg',
            opt: {viewBox: `0 0 ${width} ${height}`, width, height},
            sub: []
        };

        this.tree = new Tree(svg);

        // calc center
        if (!geometry.center) geometry.center = {};
        let {center: {x, y}, maxRadius} = geometry;
        if (x == null) x = Math.floor(width / 2);
        if (y == null) y = Math.floor(height / 2);
        if (maxRadius == null) maxRadius = Math.min(x, y);
        Object.assign(geometry, {center: {x, y}, maxRadius});

        // calc arcs
        if (settings.alpha == null) settings.alpha = -0;

        let {start, end, angle} = settings.alpha;
        if (settings.alpha instanceof Array) {
            [start, end] = settings.alpha;
            angle = end - start;
        } else if (typeof settings.alpha === 'number') {
            angle = 360 - Math.abs(settings.alpha);

            if (Object.is(settings.alpha, -0)) {
                start = 0;
                end = angle;
            } else {
                end = angle / 2;
                start = -end;
            }
        }
        settings.alpha = {start, end, angle};

        // calc value correction
        if (this._originalNorma) settings.norma = this._originalNorma;
        if (settings.norma instanceof Function) {
            this._originalNorma = settings.norma;
            settings.norma = settings.norma(settings);
        }
        if (settings.norma == null) settings.norma = {};

        let {min = 0, max = 100} = settings.norma;
        if (settings.norma instanceof Array) {
            [min, max] = settings.norma;
        } else if (typeof settings.norma === 'number') {
            max = settings.norma;
        }

        const coefficient = settings.alpha.angle / (max - min);
        settings.norma = {min, max, coefficient};
    }

    /**
     * @private
     *
     */
    processPlugins() {
        const settings = this.settings.construct;
        const constructs = {...settings}; // only to catch unused parts
        const value = this.settings.value != null && this.settings.value;

        const plugins = this.settings.plugins || knownPlugins;
        plugins.forEach(pluginName => {
            delete constructs[pluginName];
            if (this._values[pluginName] == null) {
                const pluginValue = settings[pluginName] && settings[pluginName].value != null && settings[pluginName].value;
                this._values[pluginName] = pluginValue || value || this.settings.norma.min;
            }

            let subTree = settings[pluginName];
            if (subTree === null) return;

            if (knownPlugins[pluginName] instanceof Function) {
                subTree = new knownPlugins[pluginName](this, settings[pluginName], pluginName);
            }

            if (subTree) {
                if (!(subTree instanceof Array) && !subTree._id) subTree._id = pluginName;
                this.tree.append(mainId, subTree);
                if (subTree.pushSubTree) this.tree.append(mainId, subTree.pushSubTree); // allow easily add subTree after plugin's subTree
            }
        });

        const unused = Object.keys(constructs);
    }

    /**
     * @private
     * @param {Element} parent
     */
    draw(parent = this.element) {
        this._drawn = true;
        parent.innerHTML = '';
        const element = this.tree.compile(null, parent);

        this.tree.find(mainId).sub.forEach(sub => {
            if (sub.afterDraw) sub.afterDraw(element);
        });
    }

    /**
     * @public
     * @param {settings} [newSettings]
     */
    update(newSettings) {
        if (newSettings != null) {
            this.settings = merge(this.settings, newSettings);
        }

        this.init();
        this.processPlugins();
        this.draw();

        if (this.settings.multiValues) {
            this.values = this._values;
        } else {
            this.value = this._value;
        }
    }

    /**
     * @public
     */
    get value() {
        return this._value;
    }

    /**
     * @public
     */
    set value(newValue) {
        if (this.settings.multiValues) {
            this.values = Object.keys(this._values).reduce((values, key) => ({...values, [key]: newValue}), {});
            return void 0;
        }

        this._value = newValue;
        if (newValue > this.settings.norma.max) newValue = this.settings.norma.max;
        if (newValue < this.settings.norma.min) newValue = this.settings.norma.min;

        const degree = newValue * this.settings.norma.coefficient;
        this.tree.find(mainId).sub.forEach(sub => {
            if (sub.update) sub.update(degree, newValue);
        });
    }

    /**
     * @public
     */
    get values() {
        return this._values;
    }

    /**
     * @public
     * @param {Object.<string, number>} newValues
     */
    set values(newValues) {
        Object.entries(newValues).forEach(([key, value]) => {
            this._values[key] = value;
            if (value > this.settings.norma.max) value = this.settings.norma.max;
            if (value < this.settings.norma.min) value = this.settings.norma.min;
            const degree = value * this.settings.norma.coefficient;
            const sub = this.tree.find(key);
            if (sub && sub.update) sub.update(degree, value);
        });
    }
}
