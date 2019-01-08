import {arc, safeMerge} from '../utils.js';

const defaultConfig = {
    extra: 3,
    border: true
};

export default class BackgroundPlugin {
    constructor(speedometer, options) {
        const {geometry, alpha, colors} = speedometer.settings;

        options = safeMerge(defaultConfig, {
            outer: geometry.margin,
            back: colors.background || 'black'
        }, options);

        const subTree = [];

        subTree.push({
            tag: 'path',
            opt: {
                fill: colors.background || 'black',
                d: arc(geometry.center.x, geometry.center.y, geometry.maxRadius, alpha.start - options.extra, alpha.end + options.extra)
            }
        });

        if (options.border) subTree.push({
            tag: 'path',
            opt: {
                fill: 'none',
                stroke: 'white',
                'stroke-width': 2,
                d: arc(geometry.center.x, geometry.center.y, geometry.maxRadius - geometry.margin, alpha.start, alpha.end)
            }
        });

        return subTree;
    }
}