import {getSector, safeMerge, sector} from '../utils.js';

const defaultConfig = {
    color: '#4bacea',
    geometry: {
        innerRadius: -12,
        maxRadius: -4
    },
    alpha: 0
};

export default class ArcsPlugin {
    constructor(chart, options) {
        const {geometry, alpha, geometry: {center}} = chart.settings;
        this.bigTree = chart.tree;
        this.options = safeMerge(defaultConfig, safeMerge({geometry, alpha, center}, options));

        // this.arc = {
        //     tag: 'path',
        //     sav: true,
        //     opt: {
        //         d: this.getSector(this.options.alpha.angle),
        //         class: 'arc',
        //         fill: this.options.color
        //     }
        // };

        this.subTree = {
            tag: 'g',
            opt: {},
            sav: true,
            sub: []
        };

        console.log(this.options);

        Object.assign(this, this.subTree);
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

        // this.bigTree.find();
        // console.log(this);

        // this.subTree._el.innerHTML = '';

        // const sector = this.getSector(degEnd, degStart || 0);
        // this.arc._el.setAttributeNS(null, 'd', sector);
    }
}