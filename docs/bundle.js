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

class Tree {
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

/**
 * @typedef {Array<Number>} RGB
 * @extends Array
 * @property {Number} r
 * @property {Number} g
 * @property {Number} b
 * @property {Number} [a]
 */

/**
 *
 * @param color
 * @returns {RGB}
 */
function color2rgb(color) {
    const fragment = document.createElement('div');
    fragment.style.backgroundColor = color;
    document.body.appendChild(fragment);
    const rgb = window.getComputedStyle(fragment)
        .backgroundColor
        .match(/([\d.]+)/g)
        .map(string => Number(string));
    fragment.remove();
    [rgb.r, rgb.g, rgb.b, rgb.a] = rgb;
    return rgb;
}

function rgb2hex(rgb) {
    return '#' + rgb.slice(0, 3).map(c => c.toString(16).padStart(2, '0')).join('');
}

function rgb2rgba(rgb) {
    return (rgb.length === 4 ? 'rgba' : 'rgb') + '(' + rgb.join(', ') + ')';
}

function colorShift(startColorRGB, endColorRGB, percent) {
    const r = startColorRGB.r + percent * (endColorRGB.r - startColorRGB.r);
    const g = startColorRGB.g + percent * (endColorRGB.g - startColorRGB.g);
    const b = startColorRGB.b + percent * (endColorRGB.b - startColorRGB.b);

    return [r, g, b];
}

function polar2cart(cx, cy, r, deg) {
    const rad = (deg - 90) * Math.PI / 180;

    return {
        x: cx + (r * Math.cos(rad)),
        y: cy + (r * Math.sin(rad))
    }
}

function tick(cx, cy, r, deg, length) {
    const {x: x1, y: y1} = polar2cart(cx, cy, r, deg);
    const {x: x2, y: y2} = polar2cart(cx, cy, r + length, deg);
    return {x1, y1, x2, y2};
}

function _arc(cx, cy, r, degStart, degEnd, reverse = false) {
    const start = polar2cart(cx, cy, r, degStart - 0.0001);
    const end = polar2cart(cx, cy, r, degEnd + 0.0001);

    const largeArc = Number(degEnd - degStart > 180);
    let sweep = Number(degEnd - degStart < 360);
    if (reverse) sweep = 1 - sweep;

    const to = reverse ? start : end;

    return {
        line: ['A', r, r, 0, largeArc, sweep, to.x, to.y],
        start,
        end
    };
}

function arc(cx, cy, r, degStart, degEnd) {
    const {line, start} = _arc(cx, cy, r, degStart, degEnd);
    return ['M', start.x, start.y, ...line].join(' ');
}

function sector(cx, cy, degStart, degEnd, innerRadius, outerRadius, linecap = 'butt') {
    const big = _arc(cx, cy, outerRadius, degStart, degEnd);
    const small = _arc(cx, cy, innerRadius, degStart, degEnd, true);

    let rightSide = ['L', small.end.x, small.end.y];
    let leftSide = ['Z'];

    if (linecap === 'round') {
        const capRadius = (outerRadius - innerRadius) / 2;
        rightSide = ['A', capRadius, capRadius, 0, 1, 1, small.end.x, small.end.y];
        leftSide = ['A', capRadius, capRadius, 0, 1, 1, big.start.x, big.start.y];
    }

    return [
        'M', big.start.x, big.start.y,
        ...big.line,
        ...rightSide,
        ...small.line,
        ...leftSide
    ].join(' ');
}

function sectorPath(cx, cy, degStart, degEnd, innerRadius, outerRadius, opt) {
    return {
        tag: 'path',
        opt: Object.assign({},
            opt,
            {
                d: sector(cx, cy, degStart, degEnd, innerRadius, outerRadius, opt['stroke-linecap'])
            }
        )
    };
}

function generateSectorPath(settings, opt) {
    const {geometry, alpha} = settings;

    return sectorPath(
        geometry.center.x, geometry.center.y,
        alpha.start, alpha.end,
        geometry.innerRadius, geometry.maxRadius - geometry.margin,
        opt
    );
}

function deepCopy(some) {
    // primitives, functions, dates
    if (typeof some !== 'object' || some == null || some instanceof Date) return some;
    // arrays
    if (some instanceof Array) {
        return some.map(item => deepCopy(item));
    }
    // objects
    return Object.keys(some).reduce((result, key) => ({...result, [key]: deepCopy(some[key])}), {});
}

function merge(base, extra) {
    if (extra === undefined) return deepCopy(base);
    if (typeof extra !== 'object' || extra === null) return deepCopy(extra);
    if (base instanceof Array || extra instanceof Array) return deepCopy(extra);
    if (typeof base !== typeof extra || base == null) return deepCopy(extra);
    // else both objects
    return Object.keys(Object.assign({}, base, extra))
        .reduce((result, key) => ({...result, [key]: merge(base[key], extra[key])}), {});
}

function safeMerge(base, extra) {
    if (arguments.length > 2) {
        const args = Array.from(arguments).slice(2);
        while (args.length) {
            base = safeMerge(base, extra);
            extra = args.shift();
        }
    }

    if (base && typeof base === 'object' && (typeof extra !== 'object' || extra === null)) return deepCopy(base);

    return merge(base, extra);
}

function pickFirst(...values) {
    return values.find(item => item != null);
}

function fixValue(value, border, ifNull = value) {
    if (value == null) value = ifNull;
    else {
        if (value && Math.abs(value) < 1) value *= border;
        if (value < 0 || Object.is(value, -0)) value += border;
    }
    return value;
}

function getClockTime() {
    const now = new Date();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    let hours = now.getHours();
    if (hours >= 12) hours -= 12;
    hours = (hours + minutes / 60) * 5; // 5 because we need 12 instead of 60 (60/12==5)

    return {hours, minutes, seconds};
}

function getSector({
    degEnd,
    degStart,
    center: {x, y},
    alpha: {start},
    geometry: {innerRadius, maxRadius, margin},
    cap
}) {
    return sector(
        x, y,
        degStart + start, degEnd + start,
        innerRadius, maxRadius - margin,
        (degEnd - degStart < 360) && cap
    );
}

function isObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
}

function clearObject(object) {
    const properties = Object.getOwnPropertyNames(object);
    let i = properties.length;
    while (i--) {
        delete object[properties[i]];
    }
}

var utils = /*#__PURE__*/Object.freeze({
    __proto__: null,
    color2rgb: color2rgb,
    rgb2hex: rgb2hex,
    rgb2rgba: rgb2rgba,
    colorShift: colorShift,
    polar2cart: polar2cart,
    tick: tick,
    _arc: _arc,
    arc: arc,
    sector: sector,
    sectorPath: sectorPath,
    generateSectorPath: generateSectorPath,
    deepCopy: deepCopy,
    merge: merge,
    safeMerge: safeMerge,
    pickFirst: pickFirst,
    fixValue: fixValue,
    getClockTime: getClockTime,
    getSector: getSector,
    isObject: isObject,
    clearObject: clearObject
});

const defaultConfig = {
    extra: 3, // degree add to alpha
    border: true, // draw white path inside background (margin)
    hole: false // inner radius of center hole in background
};

class BackgroundPlugin {
    constructor(speedometer, options) {
        const {geometry, alpha, colors} = safeMerge(speedometer.settings, options);

        options = safeMerge(defaultConfig, {
            outer: geometry.margin,
            back: colors.background || 'black'
        }, options);

        options.hole = fixValue(options.hole, geometry.innerRadius);

        const subTree = [];

        if (options.back) subTree.push({
            tag: 'path',
            opt: {
                fill: options.back,
                d: options.hole
                    ? sector(geometry.center.x, geometry.center.y, alpha.start - options.extra, alpha.end + options.extra, options.hole, geometry.maxRadius)
                    : arc(geometry.center.x, geometry.center.y, geometry.maxRadius, alpha.start - options.extra, alpha.end + options.extra)
            }
        });

        if (options.border) subTree.push({
            tag: 'path',
            opt: {
                fill: 'none',
                stroke: 'white',
                'stroke-width': 2,
                d: arc(geometry.center.x, geometry.center.y, geometry.maxRadius - geometry.margin, alpha.start, alpha.end)
            }
        });

        return subTree;
    }
}

class TicksPlugin {
    constructor(speedometer, options = {}) {
        const {geometry, alpha, colors, construct: {ticks}} = safeMerge(speedometer.settings, options);

// prepare inner (small) ticks

        let innerTicks = [];

        if (options.innerTicks) {
            let ticksCount = options.max * options.innerTicks.count + options.max + 1;
            const stepDeg = alpha.angle / (ticksCount - 1);
            while (ticksCount--) {
                const neMain = ticksCount % (options.innerTicks.count + 1);
                if (!ticksCount || !neMain) continue;
                const long = ticksCount % (options.innerTicks.highlight || (ticksCount + 0.42)) ? 7 : 14;
                innerTicks.push({
                    tag: 'line',
                    opt: {
                        ...tick(geometry.center.x, geometry.center.y, geometry.maxRadius - long - geometry.margin - 4, alpha.end - stepDeg * ticksCount, long),
                        stroke: options.innerTicks.color || '#999999',
                        'stroke-width': 2
                    }
                });
            }
        }

// prepare main (big) ticks

        const mainTicks = [];
        let mainTicksCount = options.max + 1;
        const mainStepDeg = alpha.angle / (mainTicksCount - 1);
        while (mainTicksCount--) {
            mainTicks.unshift({
                tag: 'line',
                opt: {
                    ...tick(geometry.center.x, geometry.center.y, geometry.maxRadius - 20 - geometry.margin - 4, alpha.end - mainStepDeg * mainTicksCount, 20),
                    stroke: options.color || '#FFFFFF',
                    'stroke-width': 4
                }
            });
        }
//
// // prepare digits
//
        const digits = [];
        let digitsCount = options.max + 1;
        const digitStepDeg = alpha.angle / (digitsCount - 1);
        while (digitsCount--) {
            const {x, y} = polar2cart(geometry.center.x, geometry.center.y, geometry.maxRadius - 55, alpha.end - digitStepDeg * digitsCount);
            const val = options.max - digitsCount;
            digits.push({
                tag: 'text',
                val: val || options.zeroText || '',
                opt: {
                    x,
                    y,
                    'alignment-baseline': 'middle',
                    'text-anchor': 'middle',
                    fill: options.color || 'white',
                    'font-size': val ? '30px' : (options.zeroTextSize || '20px'),
                    'font-family': 'sans-serif'
                }
            });
        }

        if (options.hideText) {
            digits.splice(0, digits.length);
        }

        return {
            tag: 'g',
            sub: [
                {
                    tag: 'g',
                    _id: 'innerTicks',
                    sub: innerTicks
                },
                {
                    tag: 'g',
                    _id: 'mainTicks',
                    sub: mainTicks
                },
                {
                    tag: 'g',
                    _id: 'digits',
                    sub: digits
                }
            ]
        }
    }
}

const pinDefaultConfig = {
    radius: 10,
    color: 'white',
    overlap: false
};

const defaultConfig$1 = {
    pin: false,
    radius: 0,
    length: 2 / 3,
    color: 'red',
    width: 5
};

class NeedlePlugin {
    constructor(speedometer, options) {
        const {geometry: {center, maxRadius}, alpha} = speedometer.settings;
        this.center = center;

        const config = safeMerge(defaultConfig$1, options);

        this.needle = {
            tag: 'line',
            sav: true,
            opt: {
                id: 'needle',
                stroke: config.color,
                'stroke-width': config.width + 'px',
                ...tick(center.x, center.y, config.radius, alpha.start, config.length >= 1 ? config.length : maxRadius * config.length)
            }
        };

        const subTree = {
            tag: 'g',
            sub: [this.needle]
        };

        if (config.pin) {
            if (typeof config.pin === 'number' && config.pin) config.pin = {radius: config.pin};
            const pinConfig = safeMerge(pinDefaultConfig, config.pin);
            const pin = {
                tag: 'circle',
                opt: {cx: center.x, cy: center.y, r: pinConfig.radius, fill: pinConfig.color}
            };
            subTree.sub[pinConfig.overlap ? 'push' : 'unshift'](pin);
        }


        Object.assign(this, subTree);
    }

    updateDegree(degree = 0) {
        return this.update({to: {degree}});
    }

    update({to: {degree}}) {
        this.needle._el.setAttributeNS(null, 'transform', `rotate(${degree} ${this.center.x} ${this.center.y})`);
    }
}

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
const defaultConfig$2 = {
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
class SpeedChart {
    static get defaults() {
        return {
            config: defaultConfig$2,
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
        if (!fixed.settings.selector && String(element) === element) fixed.settings.selector = element;
        settings = fixed.settings;
        element = fixed.element;

        if (this.commonConfig) settings = merge(this.commonConfig, settings);
        settings = merge(defaultConfig$2, settings);
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
            let name = this.constructor.name;
            if (this.settings.selector) name += ' ' + this.settings.selector;
            console.warn(`${name} contains unused constructs:`, unusedKnownPlugins.join(', '));
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
            (key, partConfig) => /\$$/.test(key) && !isObject(partConfig[key]) && !(partConfig[key] instanceof Function),
            (key, partConfig) => {
                const fixedKey = key.replace(/\$$/, '');
                partConfig[fixedKey] = fixValue(partConfig[key], this.settings.geometry.maxRadius);
                delete partConfig[key];
            }
        );

        // execute functions
        deep(
            config,
            (key, partConfig) => /\$$/.test(key) && partConfig[key] instanceof Function,
            (key, partConfig) => {
                const fixedKey = key.replace(/\$$/, '');
                partConfig[fixedKey] = partConfig[key](this.settings, config, partConfig);
                delete partConfig[key];
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
        if (isObject(newValue)) this.processPluginConfig(newValue);
        if (isObject(_originalValue)) this.processPluginConfig(_originalValue);

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

class AnimatedSpeedChart extends SpeedChart {
    constructor(...params) {
        super(...params);
        this.animationLastRunTime = 0;
        if (this.settings.run) this.start();
    }

    start() {
        this.settings.run = true;
        this.nextStep();
    }

    stop() {
        this.settings.run = false;
        this.nextStep();
    }

    /**
     * Update image on each animation step
     * @abstract
     */
    step() {
        return void 0;
    }

    nextStep(timestamp = 0) {
        if (this.settings.run) {
            this.animationRequestID = window.requestAnimationFrame(this.nextStep.bind(this));
        } else {
            window.cancelAnimationFrame(this.animationRequestID);
            return void 0;
        }

        if (this.settings.delay && timestamp - this.animationLastRunTime < this.settings.delay) {
            return void 0;
        }

        this.animationLastRunTime = timestamp;
        this.step(timestamp);
    }

    get isRun() {
        return this.settings.run;
    }
}

const defaultConfig$3 = {
    inner: true,
    radius: null,
    color: 'blue',
    sizes: {
        width: 12,
        height: 18,
        notch: 3,
        stick: null,
        stickWidth: 3
    },
    spin: null // {around: 'center'|'peak'|'notch'|'zero'|{x,y}, degree: number | value: number}
};

class ArrowPlugin {
    constructor(speedometer, options) {
        const {geometry, alpha} = safeMerge(speedometer.settings, options);
        this.center = geometry.center;
        this.alpha = alpha;

        this.options = options = safeMerge(defaultConfig$3, options);
        const border = options.inner ? geometry.innerRadius : geometry.maxRadius;
        options.radius = fixValue(options.radius, border, border);

        const direction = options.inner ? 1 : -1;

        const A = {x: this.center.x, y: this.center.y - options.radius};
        const B = {x: A.x - options.sizes.width / 2, y: A.y + options.sizes.height * direction};
        const C = {x: A.x + options.sizes.width / 2, y: B.y};
        const N = {x: A.x, y: B.y - options.sizes.notch * direction};

        this.spin = '';
        if (options.spin) {
            let {degree} = options.spin;
            if (degree == null) {
                degree = (options.spin.value || 0) * speedometer.settings.norma.coefficient;
            }

            let around = options.spin.around || 'center';
            if (typeof around !== 'object') {
                if (around instanceof Function) around = around(speedometer, options, {A, B, C, N});
                else around = {
                    peak: A,
                    notch: N,
                    zero: this.center,
                    center: {
                        x: A.x,
                        y: A.y + Math.abs(Math.max(B.y, N.y) - A.y) / 2 * direction
                    }
                }[around];
            }

            this.spin = `rotate(${degree} ${around.x} ${around.y})`;
        }

        this.arrow = {
            tag: 'path',
            sav: true,
            opt: {
                fill: options.color,
                transform: `rotate(${alpha.start} ${this.center.x} ${this.center.y}) ${this.spin}`,
                d: [
                    'M', A.x, A.y,
                    'L', B.x, B.y,
                    'L', N.x, N.y,
                    'L', C.x, C.y,
                    'Z'
                ].join(' ')
            }
        };

        const stickLength = fixValue(options.sizes.stick, border, 0);
        if (stickLength) {
            this.stick = {
                tag: 'line',
                sav: true,
                opt: {
                    'stroke-width': options.sizes.stickWidth,
                    stroke: options.color,
                    x1: N.x,
                    x2: N.x,
                    y1: N.y,
                    y2: N.y + stickLength * direction
                }
            };
        }

        const subTree = {
            tag: 'g',
            sub: [
                this.stick,
                this.arrow
            ]
        };

        Object.assign(this, subTree);
    }

    update({to: {degree: deg}}) {
        const params = [null, 'transform', `rotate(${deg + this.alpha.start} ${this.center.x} ${this.center.y}) ${this.spin}`];
        this.arrow._el.setAttributeNS(...params);
        if (this.stick) this.stick._el.setAttributeNS(...params);
    }
}

const defaultConfig$4 = {
    color: '#669',
    bgColor: '#cccccc'
};

class GaugePlugin {
    constructor(speedometer, options) {
        this.geometry = speedometer.settings.geometry;
        this.alpha = speedometer.settings.alpha;
        this.options = safeMerge(defaultConfig$4, options);

        this.progress = {
            tag: 'path',
            sav: true,
            opt: {
                class: 'progress',
                fill: this.options.color
            }
        };

        this.background = {
            tag: 'path',
            opt: {
                d: this.getSector(this.alpha.angle),
                class: 'background',
                fill: this.options.bgColor,
            }
        };

        const subTree = {
            tag: 'g',
            opt: {class: 'gauge'},
            sub: [this.background, this.progress]
        };

        Object.assign(this, subTree);
    }

    getSector(degEnd, degStart = 0) {
        return sector(
            this.geometry.center.x, this.geometry.center.y,
            degStart + this.alpha.start, degEnd + this.alpha.start,
            this.geometry.innerRadius, this.geometry.maxRadius - this.geometry.margin,
            (degEnd - degStart < 360) && this.options.cap
        );
    }

    update({to: {degree: degEnd}, from: {degree: degStart}}) {
        const sector = this.getSector(degEnd, degStart || 0);
        this.progress._el.setAttributeNS(null, 'd', sector);
    }

    afterDraw() {}
}

const defaultConfig$5 = {
    plugins: []
};

class MaskPlugin {
    constructor(speedometer, options, name) {
        const {geometry, alpha, norma} = speedometer.settings;
        this.options = safeMerge(defaultConfig$5, options);

        this.visible = {
            tag: 'path',
            opt: {fill: 'white', _id: 'visible'},
            sav: true
        };

        const subTree = {
            tag: 'mask',
            opt: {id: name},
            sub: [
                {
                    tag: 'rect',
                    _id: 'masked',
                    opt: {
                        x: 0,
                        y: 0,
                        width: geometry.size.width,
                        height: geometry.size.height,
                        fill: 'black'
                    }
                },
                this.visible
            ]
        };

        Object.assign(this, {geometry, alpha, speedometer, name, norma}, subTree);
    }

    update({to: {degree: deg}}) {
        const d = sector(
            this.geometry.center.x, this.geometry.center.y,
            this.alpha.start, deg + this.alpha.start,
            this.geometry.innerRadius, this.geometry.maxRadius
        );
        this.visible._el.setAttributeNS(null, 'd', d);
    }

    afterDraw() {
        this.options.plugins.forEach(pluginName => {
            const nodeList = this.speedometer.element.querySelectorAll(`[x-id="${pluginName}"]`);
            for (let node of nodeList) {
                node.setAttributeNS(null, 'mask', `url(#${this.name})`);
            }
        });
    }
}

const defaultConfig$6 = {
    stops: [],
    solidColor: null
};

class RainbowPlugin {
    constructor(speedometer, options) {
        const {geometry, alpha, colors, construct: {ticks}} = speedometer.settings;
        let max = ticks && ticks.max || alpha.angle;
        const rainbow = [];

        if (options) {
            const set = safeMerge(defaultConfig$6, options);
            const p2c = polar2cart.bind(null, geometry.center.x, geometry.center.y);

            const innerRadius = geometry.innerRadius == null ? 1 / 3 : geometry.innerRadius;
            if (!set.stops) {
                set.stops = [
                    {offset: 0, color: set.solidColor || colors.defaultRGBA},
                    {offset: 1, color: set.solidColor || colors.defaultRGBA}
                ];
            }

            const rainbowStartDeg = alpha.angle / max * (set.start || 0) + alpha.start;
            const bigR = geometry.maxRadius - geometry.margin;
            const smallR = innerRadius && (innerRadius > 1 ? innerRadius : geometry.maxRadius * innerRadius) || 0;
            const lengthDeg = alpha.end - rainbowStartDeg;
            const largeArc = 0;
            const step = 1;
            const stops = {
                offsets: set.stops.map(stop => stop.offset),
                colors: set.stops.map(stop => color2rgb(stop.color || colors.defaultRGBA)),
            };

            if (stops.offsets[0] != 0) {
                stops.offsets.unshift(0);
                stops.colors.unshift(colors.defaultRGBA);
		        // stops.colors.unshift(stops.colors[0]);
            }

            if (stops.offsets[stops.offsets.length - 1] != 1) {
                stops.offsets.push(1);
                stops.colors.push(colors.defaultRGBA);
		        // stops.colors.push(stops.colors[stops.colors.length - 1]);
            }

            for(let n = 0; n < lengthDeg; n += step) {
                const nStart = rainbowStartDeg + n;
                const nEnd = nStart + step;

                const shiftDeg = n / lengthDeg;
                const colorIndex = stops.offsets.findIndex(stop => stop > shiftDeg);
                const startColorRGB = stops.colors[colorIndex ? colorIndex - 1 : colorIndex];

                let color = startColorRGB; // solid
                if (set.type !== 'solid') { // gradient
                    const endColorRGB = stops.colors[colorIndex];
                    const [from, to] = [stops.offsets[colorIndex ? colorIndex - 1 : colorIndex], stops.offsets[colorIndex]];
                    color = colorShift(startColorRGB, endColorRGB, (shiftDeg - from) / (to - from));
                }

                const shift = 0.001;
                const arcBigStart = p2c(bigR, nEnd + shift);
                const arcBigEnd = p2c(bigR, nStart);
                const arcSmallStart = p2c(smallR, nStart);
                const arcSmallEnd = p2c(smallR, nEnd + shift);

                if (options.opacity != null) {
                    color.a = color[3] = (color.a != null ? color.a : 1) * options.opacity;
                }

                rainbow.push({
                    tag: 'path',
                    opt: {
                        d: [
                            'M', arcBigStart.x, arcBigStart.y,
                            'A', bigR, bigR, 0, largeArc, 0, arcBigEnd.x, arcBigEnd.y,
                            'L', arcSmallStart.x, arcSmallStart.y,
                            'A', smallR, smallR, 0, largeArc, 1, arcSmallEnd.x, arcSmallEnd.y,
                            'Z'
                        ].join(' '),
                        fill: rgb2rgba(color)
                    }
                });
            }
        }

        return {
            tag: 'g',
            sub: rainbow
        }
    }
}

class RedZonePlugin {
    constructor(speedometer, fromTick = 0) {
        const {geometry, alpha, colors, construct: {ticks}} = speedometer.settings;

        let max = ticks && ticks.max || alpha.angle;

        const redZoneStartDeg = alpha.angle / max * fromTick + alpha.start;
        const bigR = geometry.maxRadius - geometry.margin - 1;
        const smallR = geometry.maxRadius / 6;

        return {
            tag: 'path',
            opt: {
                fill: colors.redZone || 'red',
                opacity: 0.4,
                d: sector(
                    geometry.center.x, geometry.center.y,
                    redZoneStartDeg, alpha.end,
                    smallR, bigR
                )
            }
        };
    }
}

class SpeedTextPlugin {
    constructor(speedometer, options = {}) {
        const {center} = speedometer.settings.geometry;
        
        this.subTree = new Tree({
            tag: 'g',
            sub: [
                {
                    _id: 'inner circle',
                    tag: 'circle',
                    opt: {
                        cx: center.x,
                        cy: center.y,
                        r: speedometer.settings.geometry.maxRadius / 3,
                        fill: 'black',
                        stroke: 'white',
                        'stroke-width': 1.5
                    }
                },
                {
                    tag: 'text',
                    val: '0',
                    _id: 'speedText',
                    sav: true,
                    opt: {
                        x: center.x,
                        y: center.y,
                        id: 'speed',
                        fill: 'white',
                        'font-size': '50px',
                        'font-family': 'sans-serif',
                        'font-weight': 'bold',
                        'alignment-baseline': 'middle',
                        'text-anchor': 'middle'
                    }
                },
                options.text != null ? {
                    tag: 'text',
                    val: options.text,
                    opt: {
                        x: center.x,
                        y: center.y + 40,
                        fill: 'white',
                        'font-size': '20px',
                        'font-family': 'sans-serif',
                        'alignment-baseline': 'top',
                        'text-anchor': 'middle'
                    }
                } : null
            ]
        });

        Object.assign(this, this.subTree.tree);
    }

    update({to: {degree: deg}}) {
        this.subTree.find('speedText')._el.innerHTML = Math.floor(deg / 1.3);
        // this.subTree.find('speedText')._el.innerHTML = new Date().toISOString().replace(/^.+T(\d\d:\d\d).+$/, "$1");
    }
}

const defaultConfig$7 = {
    color: '#4bacea',
    geometry: {
        innerRadius: -12,
        maxRadius: -4
    },
    alpha: 0
};

class ArcPlugin {
    constructor(speedometer, options) {
        const {geometry, alpha} = speedometer.settings;
        this.options = safeMerge(defaultConfig$7, safeMerge({geometry, alpha}, options));

        this.arc = {
            tag: 'path',
            sav: true,
            opt: {
                d: this.getSector(this.options.alpha.angle),
                class: 'arc',
                fill: this.options.color
            }
        };

        const subTree = {
            tag: 'g',
            opt: {},
            sub: [this.arc]
        };

        Object.assign(this, subTree);
    }

    getSector(degEnd, degStart = 0) {
        return sector(
            this.options.geometry.center.x, this.options.geometry.center.y,
            degStart + this.options.alpha.start, degEnd + this.options.alpha.start,
            this.options.geometry.innerRadius, this.options.geometry.maxRadius - this.options.geometry.margin,
            (degEnd - degStart < 360) && this.options.cap
        );
    }

    update({to: {degree: degEnd}, from: {degree: degStart}}) {
        const sector = this.getSector(degEnd, degStart || 0);
        this.arc._el.setAttributeNS(null, 'd', sector);
    }

    afterDraw() {}
}

const defaultConfig$8 = {
    color: '#4bacea',
    geometry: {
        innerRadius: -12,
        maxRadius: -4
    },
    alpha: 0
};

class ArcsPlugin {
    constructor(chart, options, name) {
        const {geometry, alpha, geometry: {center}} = chart.settings;
        this.bigTree = chart.tree;
        this.options = safeMerge(defaultConfig$8, safeMerge({geometry, alpha, center}, options));

        const initTree = {
            tag: 'g',
            opt: {},
            sav: true,
            _id: name,
            sub: []
        };

        Object.assign(this, initTree);
    }

    update(arcs) {
        if (!(arcs instanceof Array)) arcs = [arcs];

        this.sub = [];
        arcs.forEach(arc => {
            const {from: {degree: degStart}, to: {degree: degEnd}} = arc;
            const sectorData = {degStart, degEnd, ...safeMerge(this.options, arc._originalValue)};
            this.sub.push({
                tag: 'path',
                opt: {
                    d: getSector(sectorData),
                    class: 'arc',
                    fill: arc._originalValue.color || this.options.color
                }
            });
        });

        this.bigTree.recompile(this);
    }
}

const defaultConfig$9 = {
    x: 0,
    y: 0,
    linesGap: 5,
    text: null,
    id: 'text',
    align: 'middle',
    font: {
        color: 'white',
        size: 45,
        family: 'sans-serif',
        weight: 'bold'
    }
};

class TextPlugin {
    constructor(speedometer, options, name) {
        // setTimeout(() => {
        //     this.update = this.update2.bind(this, this._el, extractModel);
        // }, 0);

        const {x, y} = safeMerge(speedometer.settings.geometry.center, options && options.geometry && options.geometry.center || {});

        this.options = options = safeMerge(defaultConfig$9, {x, y, ...options});

        const subTree = {
            _id: name,
            tag: 'text',
            val: this.interpolate(this.options.text || this.options.value || '', this.options),
            sav: true,
            opt: {
                fill: options.font.color,
                x: options.x,
                y: options.y,
                id: options.id,
                'font-size': options.font.size + 'px',
                'font-family': options.font.family,
                'font-weight': options.font.weight,
                'alignment-baseline': options.align,
                'text-anchor': 'middle'
            },
        };

        Object.assign(this, subTree);
        // window.text = this;
    }

    //TODO: use this method instead of update, text processing needs to be done
    update2(el, dict = {}, data = {}) {
        const result = {};
        Object.entries(dict).forEach(([key, value]) => {
            const foundValue = value.split('.').reduce((store, key) => {
                return store && store[key] != null ? store[key] : null;
            }, data);

            if (foundValue != null) {
                // if (key === 'text') {
                    // if (foundValue === true) -> use default?
                    // if (typeof foundValue === 'string') -> interpolate?
                // }
                 result[key] = foundValue;
                el.setAttributeNS(null, key, foundValue);
            }
        });

        return result;
    }

    update({value, position, font, data}) {
        if (value != null || (data && this.options.text)) {
            value = data
                ? this.interpolate(value || this.options.text, data)
                : value;

            if (value != this._el.innerHTML) this._el.innerHTML = value;
        }

        if (position != null) {
            if (position.x != null) this.updAttr('x', position.x);
            if (position.y != null) this.updAttr( 'y', position.y);
            if (position.align != null) this.updAttr('text-anchor', position.align);
        }

        if (font != null) {
            if (font.color != null) this.updAttr('fill', font.color);
            if (font.size != null) this.updAttr('font-size', font.size);
            if (font.family != null) this.updAttr('font-family', font.family);
            if (font.weight != null) this.updAttr('font-weight', font.weight);
        }
    }

    updAttr(name, value) {
        this._el.setAttributeNS(null, name, value);

        if (this.options.font && Object.keys(this.options.font).includes(name)) {
            this.options.font[name] = value;
        } else {
            this.options[name] = value;
        }
    }

    interpolate(text, data = {}) {
        text = text.replace(/{{(\w*?)}}/g, (_, key) => data[key] != null ? data[key] : '');
        if (/\n/.test(text)) {
            let multiplayer = 0;
            text = text.split('\n').map(str => {
                return `<tspan x="${this.options.x}" y="${this.options.y + (this.options.font.size + this.options.linesGap) * multiplayer++}">${str}</tspan>`;
            }).join('');
        }
        return text;
    }

    afterDraw() {}
}

SpeedChart.register('gauge', GaugePlugin, 'store only');

class Gauge extends SpeedChart {
    static get defaultConfig() {
        return {
            plugins: ['gauge'],
            // value: 12,
            geometry: {
                innerRadius: -24
            },
            alpha: 180,
            construct: {
                gauge: {
                    cap: 'round',
                }
            }
        }
    }

    constructor(element, settings) {
        const fixed = SpeedChart.fixParameters(element, settings);

        fixed.settings = safeMerge(Gauge.defaultConfig, fixed.settings);

        super(fixed.element, fixed.settings);
    }
}

class Speedometer extends SpeedChart {
    static get defaultConfig() {
        return {
            alpha: 110,
            norma: ({construct: {ticks}}) => ticks.max,
            construct: {
                speed: {text: 'km/h'},
                ticks: {
                    max: 8,
                    zeroText: 'ready',
                    innerTicks: {
                        count: 9,
                        highlight: 5
                    }
                },
                redZone: 6.5
            },
        };
    }

    constructor(element, settings) {
        const fixed = SpeedChart.fixParameters(element, settings);

        fixed.settings = safeMerge(Speedometer.defaultConfig, fixed.settings);

        super(fixed.element, fixed.settings);
    }
}

const commonConfig = {
    from: 0,
    to: 10,
    run: true,
    delay: 0,
    type: 'plain',

    plugins: [
        {name: 'background', constructor: BackgroundPlugin},
        {name: 'gauge', constructor: GaugePlugin}
    ],
    geometry: {
        innerRadius: 22,
        maxRadius: 25,
        margin: 0
    },
    alpha: 0,
    construct: {
        gauge: {
            bgColor: '#EEE',
            color: 'lightgreen',
            cap: 'round'
        },
        background: {
            back: null,
            border: false
        }
    }
};

class Spinner extends AnimatedSpeedChart {
    get commonConfig() {
        return commonConfig;
    }

    step(timestamp) {
        this[this.settings.type](timestamp);
    }

    plain() {
        let {from, to} = this.settings;
        this.redraw(to, from);

        from++;
        to++;

        if (from > this.settings.norma.max) from -= this.settings.norma.max;
        if (to > this.settings.norma.max) to -= this.settings.norma.max;

        Object.assign(this.settings, {from, to});
    }

    stretch() {
        // just to demonstrate switching of methods
        this.plain();
    }

    redraw(to = this.to, from = this.from) {
        this.update([to, from]);
    }
}

const defaultConfig$a = {
    gap: 0.1,
    innerRadius: 0.6,
    highlightActive: true,
    allowMultiple: false,
    straightGaps: true,
    border: 1,
    colors: {
        background: 'silver',
        border: 'gray',
        activeBackground: '#9a9acd',
        activeBorder: 'navy'
    },
};

class Zebra {
    constructor(speedometer, options) {
        options = safeMerge(defaultConfig$a, options);
        const {norma, geometry, alpha} = speedometer.settings;

        let sectorDegree = norma.coefficient;
        if (Math.abs(options.gap) < 1) options.gap *= norma.coefficient;
        sectorDegree -= options.gap;
        const halfGap = options.gap / 2;

        const outerRadius = geometry.maxRadius - geometry.margin;
        let innerRadius = geometry.innerRadius;
        if (innerRadius == null) innerRadius = geometry.maxRadius * options.innerRadius;
        if (innerRadius === 0) innerRadius = 1;

        const l = (Math.PI * options.gap) / 180;
        const L = l * outerRadius;
        const Lsm = l * innerRadius;
        const Lshift = (L - Lsm) / 2;
        let Rshift = Lshift * 180 / (Math.PI * innerRadius);
        if (!options.straightGaps) Rshift = 0;

        this.parts = [];
        this.active = options.allowMultiple ? [0] : 0;

        let {x: cx, y: cy} = geometry.center;
        for (let n = 1; n <= norma.max; n++) {
            const degStart = alpha.start + (n - 1) * norma.coefficient + halfGap;
            const degEnd = degStart + sectorDegree;

            this.parts.push({
                tag: 'path',
                sav: !!options.highlightActive,
                opt: {
                    d: this.sector(cx, cy, degStart, degEnd, innerRadius, outerRadius, Rshift),
                    fill: (options.colors[n - 1] || options.colors).background,
                    stroke: (options.colors[n - 1] || options.colors).border,
                    'stroke-width': options.border
                }
            });
        }

        const subTree = {
            tag: 'g',
            sub: this.parts
        };

        Object.assign(this,
            subTree,
            {
                norma,
                colors: options.colors,
                allowMultiple: options.allowMultiple,
                highlightActive: options.highlightActive
            }
        );
    }

    highlight(n = this.active, state = 'active') {
        if (!this.highlightActive) return;

        if (n instanceof Array) {
            n.filter(value => value != null).forEach(value => this.highlight(value, state));
            return;
        }

        let active = n;
        if (typeof active === 'object') n = active.value;
        else active = {color: {}};

        if (n == null || n < this.norma.min || n >= this.norma.max) return;

        const el = this.parts[n]._el;

        const stroke = state === 'active' ? (active.color.border || this.colors.activeBorder) : (this.colors[n] || this.colors).border;
        const fill = state === 'active' ? (active.color.background || this.colors.activeBackground) : (this.colors[n] || this.colors).background;

        el.setAttributeNS(null, 'stroke', stroke);
        el.setAttributeNS(null, 'fill', fill);
    }

    sector(cx, cy, degStart, degEnd, innerRadius, outerRadius, Rshift) {
            const big = _arc(cx, cy, outerRadius, degStart, degEnd);
            const small = _arc(cx, cy, innerRadius, degStart + Rshift, degEnd - Rshift, true);

            let rightSide = ['L', small.end.x, small.end.y];
            let leftSide = ['Z'];

            return [
                'M', big.start.x, big.start.y,
                ...big.line,
                ...rightSide,
                ...small.line,
                ...leftSide
            ].join(' ');
    }

    /**
     * @param {updValues|number|Array<number>} value
     */
    update(value) {
        this.highlight(this.active, 'normal');

        if (this.allowMultiple) {
            if (typeof value === 'object' && !(value instanceof Array)) {
                value = [value.to.value];
            } else {
                value = [value];
            }
        } else {
            if (value instanceof Array) value = value[0];
            else value = value.to.value;
        }

        this.active = value;
        this.highlight(this.active, 'active');
    }

    afterDraw() {}
}

const commonConfig$1 = {
    run: true,
    delay: 165,
    direction: 1,

    plugins: [
        {name: 'background', constructor: BackgroundPlugin},
        {name: 'zebra', constructor: Zebra}
    ],
    geometry: {
        margin: 1,
        innerRadius: 0.6
    },
    alpha: 0,
    norma: 7,
    construct: {
        zebra: {
            gap: 0.1
        },
        background: {
            back: null,
            border: false,
        }
    }
};

class ZebraLoader extends AnimatedSpeedChart {
    get commonConfig() {
        return commonConfig$1;
    }

    afterRemake() {
        this.rotateValue = this.rotateValue.bind(this);
    }

    rotateValue(value) {
        let n = typeof value === 'object' ? value.value : value;
        n = n + this.settings.direction;
        if (n >= this.settings.norma.max) n = this.settings.norma.min;
        else if (n < this.settings.norma.min) n = this.settings.norma.max - 1;
        return typeof value === 'object' ? {...value, value: n} : n;
    }

    step() {
        let value = this.value;
        if (value instanceof Array) {
            value = value.map(this.rotateValue);
        } else {
            value = this.rotateValue(value);
        }
        this.value = value;
    }
}

const commonConfig$2 = {
    run: false,
    delay: 0,
    restartOnResume: true,
    clickable: true,
    showMilliseconds: true,

    plugins: [
        {name: 'time', constructor: TextPlugin},
        {name: 'backArc', constructor: ArcPlugin},
        {name: 'arc', constructor: ArcPlugin}
    ],
    geometry: {},
    alpha: -0,
    norma: 100,
    multiValues: true,
    construct: {
        time: {
            text: '00:00:00.00',
            font: {
                color: 'black',
                size$: ({geometry: {size: {width}}}) => Math.round(width * 0.14)
            }
        },
        backArc: {
            color: 'silver',
            geometry: {
                innerRadius$: -8
            },
            value: 100
        },
        arc: {
            color: '#000088',
            geometry: {
                innerRadius$: -8
            },
            cap: 'round',
            value: 100
        }
    }
};

class Timer extends AnimatedSpeedChart {
    constructor(...params) {
        super(...params);

        if (this.settings.clickable) {
            document
                .querySelector(this.settings.selector)
                .addEventListener('click', event => {
                    if (this.isRun) {
                        this.stop();
                    } else {
                        this.start();
                    }
                });
        }

        if (!this.settings.run) {
            this.beforeStart();
        }
    }

    get commonConfig() {
        return commonConfig$2;
    }

    beforeStart() {
        delete this.fin;
        delete this.dif;
        this.values = {
            time: {value: this.toTime(this.settings.ms)}
        };
    }

    step() {
        let dif = this.fin - Date.now();
        if (dif < 0) dif = 0;

        this.values = {
            arc: dif / this.settings.ms * 100,
            time: {value: this.toTime(dif)}
        };

        if (dif === 0) this.stop('hide');
    }

    start() {
        this.tree.find('arc').arc._el.style.display = '';
        if (this.fin == null || this.settings.restartOnResume) {
            this.fin = Date.now() + this.settings.ms;
        } else if (this.dif != null) {
            this.fin = Date.now() + this.dif;
            delete this.dif;
        }
        super.start();
    }

    stop(hide = false) {
        if (hide) {
            this.tree.find('arc').arc._el.style.display = 'none';
            this.finish();
        } else {
            this.dif = this.fin - Date.now();
        }
        super.stop();
    }

    toTime(n) {
        const date = new Date(n);
        const [hours, minutes, seconds, milliseconds] = [
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds(),
            ~~(date.getUTCMilliseconds() / 10)
        ].map(n => String(n).padStart(2, '0'));

        const hasNaN = [hours, minutes, seconds, milliseconds].find(n => isNaN(n));
        if (hasNaN) return '';

        let time = [hours, minutes, seconds].join(':');
        if (this.settings.showMilliseconds) time += '.' + milliseconds;

        return time;
    }

    /**
     * Set new time
     * @param {number} newValue - new time in ms
     */
    set value(newValue) {
        this.settings.ms = newValue;
        super.value = newValue;
        this.beforeStart();
        if (this.isRun) this.start();
    }

    restart() {
        this.start();
    }

    /**
     * @abstract
     */
    finish() {}
}

export { AnimatedSpeedChart, ArcPlugin, ArcsPlugin, ArrowPlugin, BackgroundPlugin, Gauge, GaugePlugin, MaskPlugin, NeedlePlugin, RainbowPlugin, RedZonePlugin, SpeedChart, SpeedTextPlugin, Speedometer, Spinner, TextPlugin, TicksPlugin, Timer, Tree, ZebraLoader, utils as chartUtils };
