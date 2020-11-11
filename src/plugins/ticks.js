import {tick, polar2cart, safeMerge} from '../utils.js';

export default class TicksPlugin {
    constructor(speedometer, options = {}) {
        const {geometry, alpha, colors, construct: {ticks}} = safeMerge(speedometer.settings, options);

// prepare inner (small) ticks

        let innerTicks = [];

        if (options.innerTicks) {
            let ticksCount = options.max * options.innerTicks.count + options.max + 1;
            const stepDeg = alpha.angle / (ticksCount - 1);
            while (ticksCount--) {
                const neMain = ticksCount % (options.innerTicks.count + 1);
                if (!ticksCount || !neMain) continue;
                const long = ticksCount % (options.innerTicks.highlight || (ticksCount + 0.42)) ? 7 : 14;
                innerTicks.push({
                    tag: 'line',
                    opt: {
                        ...tick(geometry.center.x, geometry.center.y, geometry.maxRadius - long - geometry.margin - 4, alpha.end - stepDeg * ticksCount, long),
                        stroke: options.innerTicks.color || '#999999',
                        'stroke-width': 2
                    }
                });
            }
        }

// prepare main (big) ticks

        const mainTicks = [];
        let mainTicksCount = options.max + 1;
        const mainStepDeg = alpha.angle / (mainTicksCount - 1);
        while (mainTicksCount--) {
            mainTicks.unshift({
                tag: 'line',
                opt: {
                    ...tick(geometry.center.x, geometry.center.y, geometry.maxRadius - 20 - geometry.margin - 4, alpha.end - mainStepDeg * mainTicksCount, 20),
                    stroke: options.color || '#FFFFFF',
                    'stroke-width': 4
                }
            });
        }
//
// // prepare digits
//
        const digits = [];
        let digitsCount = options.max + 1;
        const digitStepDeg = alpha.angle / (digitsCount - 1);
        while (digitsCount--) {
            const {x, y} = polar2cart(geometry.center.x, geometry.center.y, geometry.maxRadius - 55, alpha.end - digitStepDeg * digitsCount);
            const val = options.max - digitsCount;
            digits.push({
                tag: 'text',
                val: val || options.zeroText || '',
                opt: {
                    x,
                    y,
                    'alignment-baseline': 'middle',
                    'text-anchor': 'middle',
                    fill: options.color || 'white',
                    'font-size': val ? '30px' : (options.zeroTextSize || '20px'),
                    'font-family': 'sans-serif'
                }
            });
        }

        if (options.hideText) {
            digits.splice(0, digits.length);
        }

        return {
            tag: 'g',
            sub: [
                {
                    tag: 'g',
                    _id: 'innerTicks',
                    sub: innerTicks
                },
                {
                    tag: 'g',
                    _id: 'mainTicks',
                    sub: mainTicks
                },
                {
                    tag: 'g',
                    _id: 'digits',
                    sub: digits
                }
            ]
        }
    }
}