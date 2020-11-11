import Tree from './tree.js';
import {merge, pickFirst, deepCopy, fixValue, isObject} from './utils.js';
// window.merge = merge;

// default plugins
import BackgroundPlugin from './plugins/background.js'
import TicksPlugin from './plugins/ticks.js'
import NeedlePlugin from './plugins/needle.js'

const knownPlugins = Object.assign(['background', 'ticks', 'needle'], {
    background: BackgroundPlugin,
    ticks: TicksPlugin,
    needle: NeedlePlugin
});

/**
 * @typedef {Object} settings
 * @property {String} selector
 * @property {Element|String} element
 * @property {Element|String} appendTo
 * @property {Object} geometry
 * @property {Number} geometry.maxRadius
 * @property {Number} geometry.innerRadius
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
 * @property {Array<String|Object>} pushPlugins
 */

/**
 * @typedef {Object} updValue
 * @property {Number} degree
 * @property {Number} value
 * @property {Number} boundedValue
 */
/**
 * @typedef {Object} updValues
 * @property {updValue} from
 * @property {updValue} to
 */

const defaultConstruct = {
    /* wont need to always process default constructs */
    // background: true,
    // ticks: true,
    // needle: true
};


/**
 * @type {settings}
 */
const defaultConfig = {
    geometry: {
        margin: 5,
        innerRadius: 0,
//        size: {width: 0, height: 0} // will be calculated
    },
    construct: defaultConstruct,
    colors: {
        defaultRGBA: 'rgba(0, 0, 0, 0)'
    }
};

const mainId = 'main';

/**
 * @class SpeedChart
 * @property {settings} settings
 * @property {Element} element
 * @property {Object} defaults
 * @property {Number} value
 * @property {Object.<string, number>} values
 */
export default class SpeedChart {
    static get defaults() {
        return {
            config: defaultConfig,
            construct: defaultConstruct,
            plugins: knownPlugins,
            size: {width: 200, height: 200}
        };
    }

    static resetPlugins(newOrder) {
        knownPlugins.length = 0;
        if (newOrder && newOrder instanceof Array) {
            newOrder.forEach(plugin => {
                if (String(plugin) === plugin) {
                    plugin = {name: plugin};
                }
                SpeedChart.register(plugin.name, plugin.construct);
            });
        }
    }

    static register(name, constructor, storeOnly = false) {
        if (!storeOnly) knownPlugins.push(name);
        if (constructor) knownPlugins[name] = constructor;
    }

    /**
     * @private
     * @param {settings} settings - will be modified
     */
    static pushPluginsFix(settings) {
        if (settings.pushPlugins && settings.pushPlugins instanceof Array) {
            settings.plugins = [...(settings.plugins || []), ...settings.pushPlugins];
            delete settings.pushPlugins;
        }
    }

    /**
     * @param {Element|String} element
     * @param {Boolean} allowFragment
     * @returns {Element}
     */
    static getElement(element, allowFragment = true) {
        // if (element instanceof Element) return element;
        if (String(element) === element) element = document.querySelector(element);
        if (!element) {
            if (allowFragment) element = document.createDocumentFragment();
            else {
                const tag = document.createElement('div');
                tag.className = 'speedchart-container';
                element = tag;
            }
        }
        return element;
    }

    static fixParameters(element, settings) {
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

            if (!element) {
                element = document.createDocumentFragment();
            }
        }

        return {settings, element};
    }

    get commonConfig() {
        return null;
    }

    /**
     * @param {Element|String|settings} [element]
     * @param {settings} [settings]
     */
    constructor(element, settings) {
        const fixed = SpeedChart.fixParameters(element, settings);
        settings = fixed.settings;
        element = fixed.element;

        if (this.commonConfig) settings = merge(this.commonConfig, settings);
        settings = merge(defaultConfig, settings);
        SpeedChart.pushPluginsFix(settings);
        Object.assign(this, {settings, element});

        this._value = settings.value != null ? settings.value : 0;
        this._values = {};

        this.userSettings = deepCopy(settings);

        this.remake();

        if (settings.appendTo) {
            settings.appendTo = SpeedChart.getElement(settings.appendTo, false);
            if (!(this.element instanceof Element)) {
                const tag = SpeedChart.getElement(null, false);
                tag.appendChild(this.element);
                this.element = tag;
            }
            settings.appendTo.appendChild(this.element);
        }
    }

    /**
     * @private
     * @param {settings} settings
     */
    init(settings = this.settings) {
        const geometry = settings.geometry;

        // get dimensions
        let {width, height} = geometry.size || (this.element instanceof Element ? window.getComputedStyle(this.element) : SpeedChart.defaults.size);
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
        let {center: {x, y}, maxRadius, innerRadius} = geometry;
        if (x == null) x = Math.floor(width / 2);
        if (y == null) y = Math.floor(height / 2);
        if (maxRadius == null || maxRadius <= 1) maxRadius = Math.min(x, y) * (maxRadius || 1);
        if (innerRadius != null) {
            if (Math.abs(innerRadius) < 1) innerRadius = maxRadius * innerRadius;
            if (innerRadius < 0) innerRadius = maxRadius + innerRadius;
        }
        Object.assign(geometry, {center: {x, y}, maxRadius, innerRadius});

        // calc arcs
        if (settings.alpha == null) settings.alpha = -0;
        settings.alpha = this.processAlpha();

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

        // extract constructors from plugins and leave only name sequence
        plugins.forEach((pluginName, i) => {
            if (typeof pluginName === 'object') {
                let {name, constructor} = pluginName;
                if (pluginName instanceof Array) [name, constructor] = pluginName;
                if (typeof constructor === 'string') constructor = knownPlugins[constructor];
                knownPlugins[name] = constructor;
                plugins[i] = name;
            }
        });

        // try to find constructors in constructs
        Object.entries(settings)
            .filter(([name, config]) => config.hasOwnProperty('constructor'))
            .forEach(([name, config]) => {
                switch (typeof config.constructor) {
                    case 'string':
                        knownPlugins[name] = knownPlugins[config.constructor];
                        break;
                    case 'function':
                        knownPlugins[name] = config.constructor;
                        break;
                }

                if (!plugins.includes(name) && knownPlugins[name] instanceof Function) {
                    plugins.push(name);
                }

                delete config.constructor;
            });

        // for final found plugins sequence
        plugins.forEach(pluginName => {
            delete constructs[pluginName];

            // set value
            if (this._values[pluginName] == null) {
                const pluginValue = settings[pluginName] && settings[pluginName].value != null && settings[pluginName].value;
                this._values[pluginName] = pluginValue || value || this.settings.norma.min;
            }

            // get sub-tree (it is possible to place sub-tree right into constructs)
            let subTree = settings[pluginName];
            if (subTree === null) return;

            this.processPluginConfig(subTree);

            // but if there are constructor for this plugin, it should return new sub-tree
            if (knownPlugins[pluginName] instanceof Function) {
                subTree = new knownPlugins[pluginName](this, settings[pluginName], pluginName);
            }

            // store sub-tree into main tree
            if (subTree) {
                if (!(subTree instanceof Array) && !subTree._id) subTree._id = pluginName;
                this.tree.append(mainId, subTree);
                if (subTree.pushSubTree) this.tree.append(mainId, subTree.pushSubTree); // allow easily add subTree after plugin's subTree
            }
        });

        const unusedKnownPlugins = Object.keys(constructs);
        if (unusedKnownPlugins.length) {
            console.warn('Unused constructs:', unusedKnownPlugins.join(', '));
        }
    }

    processAlpha(settings = this.settings) {
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

        return {start, end, angle};
    }

    /**
     * Fix plugins config (change values by link, inside config)
     * @param {settings} config
     */
    processPluginConfig(config) {
        if (!isObject(config)) return;

        function deep(partConfig, condition, processor) {
            const keys = Object.keys(partConfig);

            // process object properties
            keys.filter(key => condition(key, partConfig))
                .forEach(key => processor(key, partConfig));

            // go deeper
            keys.filter(key => isObject(partConfig[key]) || partConfig[key] instanceof Array)
                .forEach(key => {
                    deep(partConfig[key], condition, processor);
                });
        }

        // fix alpha
        deep(
            config,
            key => key === 'alpha$',
            (key, partConfig) => {
                partConfig.alpha = this.processAlpha({alpha: partConfig.alpha$});
                delete partConfig.alpha$;
            }
        );

        // re-calculate *$ keys depends on maxRadius
        deep(
            config,
            (key, partConfig) => /\$$/.test(key) && !isObject(partConfig[key]),
            (key, partConfig) => {
                const fixedKey = key.replace(/\$$/, '');
                partConfig[fixedKey] = fixValue(partConfig[key], this.settings.geometry.maxRadius);
                delete partConfig[key];
            }
        );

        // execute functions
        deep(
            config,
            (key, partConfig) => (partConfig === config ? key !== 'update' : true) && partConfig[key] instanceof Function,
            (key, partConfig) => {
                partConfig[key] = partConfig[key](this.settings, config, partConfig);
            }
        );
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
    remake(newSettings) {
        if (newSettings != null) {
            this.settings = merge(this.userSettings, newSettings);
            SpeedChart.pushPluginsFix(this.settings);
            this.userSettings = deepCopy(this.settings); // store updated userSettings
        }

        this.init();
        this.processPlugins();
        this.draw();

        if (this.settings.multiValues) {
            this.values = this._values;
        } else {
            this.value = this._value;
        }

        if (this.afterRemake) this.afterRemake();

        return this;
    }

    translate(value = this._value) {
        let boundedValue = value;
        if (value > this.settings.norma.max) boundedValue = this.settings.norma.max;
        if (value < this.settings.norma.min) boundedValue = this.settings.norma.min;

        return {
            degree: boundedValue * this.settings.norma.coefficient,
            boundedValue,
            value
        };
    }

    /**
     * @param {number|Array<number>|updValues} newValue - in case of array - [to, from] order
     * @returns {updValues|null}
     */
    makeUpdValue(newValue = 0, originalValue = newValue) {
        const _originalValue = deepCopy(originalValue);
        let to = pickFirst(newValue.to, newValue[0], newValue, this.settings.norma.min, 0);
        let from = pickFirst(newValue.from, newValue[1], this.settings.norma.min, 0);

        if (to.degree == null) to = this.translate(pickFirst(to.value, to));
        if (from.degree == null) from = this.translate(pickFirst(from.value, from));

        const updValues = {from, to, _originalValue};
        if (typeof newValue === 'object') Object.assign(newValue, updValues);
        else newValue = updValues;

        return newValue;
    }

    /**
     * @public
     */
    update(newValue) {
        if (newValue == null) return;

        if (this.settings.multiValues) {
            this.values = newValue;
        } else {
            this.value = newValue;
        }

        return this;
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
        const updValue = this.makeUpdValue(newValue);

        this.tree.find(mainId).sub.forEach(sub => {
            if (sub.update) sub.update(updValue);
        });
    }

    /**
     * @public
     */
    get values() {
        if (!this._valuesProxy) {
            this._valuesProxy = new Proxy(this._values, {
                set: (target, name, value) => {
                    this.values = {[name]: value};
                }
            });
        }

        return this._valuesProxy;
    }

    /**
     * @public
     * @param {Object.<string, number>} newValues
     */
    set values(newValues) {
        Object.entries(newValues).forEach(([key, value]) => {
            this._values[key] = value;
            const sub = this.tree.find(key);
            if (sub && sub.update) {
                const updValue = value instanceof Array
                    ? value.map(item => this.makeUpdValue(item && item.value || item, item))
                    : this.makeUpdValue(value);

                sub.update(updValue);
            }
        });
    }
}
