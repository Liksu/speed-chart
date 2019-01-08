import {color2rgb, polar2cart, colorShift, rgb2rgba, safeMerge} from '../utils.js';

const defaultConfig = {
    stops: [],
    solidColor: null
};

export default class RainbowPlugin {
    constructor(speedometer, options) {
        const {geometry, alpha, colors, construct: {ticks}} = speedometer.settings;
        let max = ticks && ticks.max || alpha.angle;
        const rainbow = [];

        if (options) {
            const set = safeMerge(defaultConfig, options);
            const p2c = polar2cart.bind(null, geometry.center.x, geometry.center.y);

            const innerRadius = geometry.innerRadius == null ? 1 / 3 : geometry.innerRadius;
            if (!set.stops) {
                set.stops = [
                    {offset: 0, color: set.solidColor || colors.defaultRGBA},
                    {offset: 1, color: set.solidColor || colors.defaultRGBA}
                ];
            }

            const rainbowStartDeg = alpha.angle / max * (set.start || 0) + alpha.start;
            const bigR = geometry.maxRadius - geometry.margin;
            const smallR = innerRadius && (innerRadius > 1 ? innerRadius : geometry.maxRadius * innerRadius) || 0;
            const lengthDeg = alpha.end - rainbowStartDeg;
            const largeArc = 0;
            const step = 1;
            const stops = {
                offsets: set.stops.map(stop => stop.offset),
                colors: set.stops.map(stop => color2rgb(stop.color || colors.defaultRGBA)),
            };

            if (stops.offsets[0] != 0) {
                stops.offsets.unshift(0);
                stops.colors.unshift(colors.defaultRGBA);
		        // stops.colors.unshift(stops.colors[0]);
            }

            if (stops.offsets[stops.offsets.length - 1] != 1) {
                stops.offsets.push(1);
                stops.colors.push(colors.defaultRGBA);
		        // stops.colors.push(stops.colors[stops.colors.length - 1]);
            }

            for(let n = 0; n < lengthDeg; n += step) {
                const nStart = rainbowStartDeg + n;
                const nEnd = nStart + step;

                const shiftDeg = n / lengthDeg;
                const colorIndex = stops.offsets.findIndex(stop => stop > shiftDeg);
                const startColorRGB = stops.colors[colorIndex ? colorIndex - 1 : colorIndex];

                let color = startColorRGB; // solid
                if (set.type !== 'solid') { // gradient
                    const endColorRGB = stops.colors[colorIndex];
                    const [from, to] = [stops.offsets[colorIndex ? colorIndex - 1 : colorIndex], stops.offsets[colorIndex]];
                    color = colorShift(startColorRGB, endColorRGB, (shiftDeg - from) / (to - from));
                }


                const arcBigStart = p2c(bigR, nEnd);
                const arcBigEnd = p2c(bigR, nStart);
                const arcSmallStart = p2c(smallR, nStart);
                const arcSmallEnd = p2c(smallR, nEnd);

                if (options.opacity != null) {
                    color.a = color[3] = (color.a != null ? color.a : 1) * options.opacity;
                }

                rainbow.push({
                    tag: 'path',
                    opt: {
                        d: [
                            'M', arcBigStart.x, arcBigStart.y,
                            'A', bigR, bigR, 0, largeArc, 0, arcBigEnd.x, arcBigEnd.y,
                            'L', arcSmallStart.x, arcSmallStart.y,
                            'A', smallR, smallR, 0, largeArc, 1, arcSmallEnd.x, arcSmallEnd.y,
                            'Z'
                        ].join(' '),
                        fill: rgb2rgba(color)
                    }
                });
            }
        }

        return {
            tag: 'g',
            sub: rainbow
        }
    }
}