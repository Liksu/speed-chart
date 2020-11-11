import {arc, safeMerge, sector, fixValue} from '../utils.js';

const defaultConfig = {
    extra: 3, // degree add to alpha
    border: true, // draw white path inside background (margin)
    hole: false // inner radius of center hole in background
};

export default class BackgroundPlugin {
    constructor(speedometer, options) {
        const {geometry, alpha, colors} = safeMerge(speedometer.settings, options);

        options = safeMerge(defaultConfig, {
            outer: geometry.margin,
            back: colors.background || 'black'
        }, options);

        options.hole = fixValue(options.hole, geometry.innerRadius);

        const subTree = [];

        if (options.back) subTree.push({
            tag: 'path',
            opt: {
                fill: options.back,
                d: options.hole
                    ? sector(geometry.center.x, geometry.center.y, alpha.start - options.extra, alpha.end + options.extra, options.hole, geometry.maxRadius)
                    : arc(geometry.center.x, geometry.center.y, geometry.maxRadius, alpha.start - options.extra, alpha.end + options.extra)
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