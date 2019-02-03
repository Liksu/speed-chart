import {safeMerge, sector} from '../utils.js';

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

    getSector(degEnd, degStart = 0) {
        return sector(
            this.geometry.center.x, this.geometry.center.y,
            degStart + this.alpha.start, degEnd + this.alpha.start,
            this.geometry.innerRadius, this.geometry.maxRadius - this.geometry.margin,
            degEnd && this.options.cap
        );
    }

    update({to: {degree: degEnd}, from: {degree: degStart}}) {
        const sector = this.getSector(degEnd, degStart || 0);
        this.progress._el.setAttributeNS(null, 'd', sector);
    }

    afterDraw() {}
}