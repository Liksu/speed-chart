import {safeMerge, sector} from '../utils.js';

const defaultConfig = {
    color: '#4bacea',
    geometry: {
        innerRadius: -12,
        maxRadius: -4
    },
    alpha: 0
};

export default class ArcPlugin {
    constructor(speedometer, options) {
        const {geometry, alpha} = speedometer.settings;
        this.options = safeMerge(defaultConfig, safeMerge({geometry, alpha}, options));

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