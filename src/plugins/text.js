import {safeMerge} from '../utils.js';

const defaultConfig = {
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

const extractModel = {
    'x': 'position.x',
    'y': 'position.y',
    'text-anchor': 'position.align',
    'fill': 'font.color',
    'font-size': 'font.size',
    'font-family': 'font.family',
    'font-weight': 'font.weight',
    'text': 'text'
};

export default class TextPlugin {
    constructor(speedometer, options, name) {
        // setTimeout(() => {
        //     this.update = this.update2.bind(this, this._el, extractModel);
        // }, 0);

        const {x, y} = safeMerge(speedometer.settings.geometry.center, options && options.geometry && options.geometry.center || {});

        this.options = options = safeMerge(defaultConfig, {x, y, ...options});

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
            }).join('')
        }
        return text;
    }

    afterDraw() {}
}