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
    constructor(chart, options, name) {
        const {geometry, alpha, geometry: {center}} = chart.settings;
        this.bigTree = chart.tree;
        this.options = safeMerge(defaultConfig, safeMerge({geometry, alpha, center}, options));

        const initTree = {
            tag: 'g',
            opt: {},
            sav: true,
            _id: name,
            sub: []
        };

        Object.assign(this, initTree);
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
    }
}