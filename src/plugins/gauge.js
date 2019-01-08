import {safeMerge, generateSectorPath, sector} from '../utils.js';

const defaultConfig = {
    color: '#669',
    bgColor: '#cccccc'
};

export default class GaugePlugin {
    constructor(speedometer, options) {
        this.geometry = speedometer.settings.geometry;
        this.alpha = speedometer.settings.alpha;
        options = safeMerge(defaultConfig, options);

        this.progress = generateSectorPath(speedometer.settings, {
            class: 'progress',
            fill: options.color
        });
        this.progress.sav = true;

        this.background = generateSectorPath(speedometer.settings, {
            class: 'background',
            fill: options.bgColor
        });


        const subTree = {
            tag: 'g',
            opt: {class: 'gauge'},
            sub: [this.background, this.progress]
        };

        Object.assign(this, subTree);
    }

    update(degree, value) {
        const d = sector(
            this.geometry.center.x, this.geometry.center.y,
            this.alpha.start, degree + this.alpha.start,
            this.geometry.innerRadius, this.geometry.maxRadius - this.geometry.margin
        );
        this.progress._el.setAttributeNS(null, 'd', d);
    }

    afterDraw() {}
}