import {safeMerge, _arc} from '../utils.js';

const defaultConfig = {
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

export default class Zebra {
    constructor(speedometer, options) {
        options = safeMerge(defaultConfig, options);
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
                allowMultiple: options.allowMultiple
            }
        );
    }

    highlight(n = this.active, state = 'active') {
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