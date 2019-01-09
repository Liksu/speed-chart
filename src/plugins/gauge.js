import {safeMerge, generateSectorPath, sector} from '../utils.js';

const defaultConfig = {
    color: '#669',
    bgColor: '#cccccc'
};

export default class GaugePlugin {
    constructor(speedometer, options) {
        this.geometry = speedometer.settings.geometry;
        this.alpha = speedometer.settings.alpha;
        this.options = safeMerge(defaultConfig, options);


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

    getSector(degree) {
        return sector(
            this.geometry.center.x, this.geometry.center.y,
            this.alpha.start, degree + this.alpha.start,
            this.geometry.innerRadius, this.geometry.maxRadius - this.geometry.margin,
            degree && this.options.cap
        );
    }

    update(degree, value) {
        this.progress._el.setAttributeNS(null, 'd', this.getSector(degree));
    }

    afterDraw() {}
}