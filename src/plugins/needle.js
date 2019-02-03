import {tick, safeMerge} from '../utils.js';

const pinDefaultConfig = {
    radius: 10,
    color: 'white',
    overlap: false
};

const defaultConfig = {
    pin: false,
    radius: 0,
    length: 2 / 3,
    color: 'red',
    width: 5
};

export default class NeedlePlugin {
    constructor(speedometer, options) {
        const {geometry: {center, maxRadius}, alpha} = speedometer.settings;
        this.center = center;

        const config = safeMerge(defaultConfig, options);

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