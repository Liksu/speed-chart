import {safeMerge} from '../utils.js';

const defaultConfig = {
    inner: true,
    radius: null,
    color: 'blue',
    sizes: {
        width: 12,
        height: 18,
        notch: 3
    }
};

export default class ArrowPlugin {
    constructor(speedometer, options) {
        const {geometry, alpha} = speedometer.settings;
        this.center = geometry.center;
        this.alpha = alpha;

        this.options = options = safeMerge(defaultConfig, options);
        if (options.radius == null) {
            options.radius = options.inner ? geometry.innerRadius : geometry.maxRadius;
        }

        const A = {x: this.center.x, y: this.center.y - options.radius};
        const B = {x: A.x - options.sizes.width / 2, y: A.y + options.sizes.height * (options.inner ? 1 : -1)};
        const C = {x: A.x + options.sizes.width / 2, y: B.y};
        const N = {x: A.x, y: B.y - options.sizes.notch * (options.inner ? 1 : -1)};

        this.arrow = {
            tag: 'path',
            sav: true,
            opt: {
                fill: options.color,
                transform: `rotate(${alpha.start} ${this.center.x} ${this.center.y})`,
                d: [
                    'M', A.x, A.y,
                    'L', B.x, B.y,
                    'L', N.x, N.y,
                    'L', C.x, C.y,
                    'Z'
                ].join(' ')
            }
        };

        const subTree = {
            tag: 'g',
            sub: [this.arrow]
        };

        Object.assign(this, subTree);
    }

    update({to: {degree: deg}}) {
        this.arrow._el.setAttributeNS(null, 'transform', `rotate(${deg + this.alpha.start} ${this.center.x} ${this.center.y})`);
    }
}