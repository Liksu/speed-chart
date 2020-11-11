import {safeMerge, fixValue} from '../utils.js';

const defaultConfig = {
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

export default class ArrowPlugin {
    constructor(speedometer, options) {
        const {geometry, alpha} = safeMerge(speedometer.settings, options);
        this.center = geometry.center;
        this.alpha = alpha;

        this.options = options = safeMerge(defaultConfig, options);
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