import {sector} from '../utils.js';

export default class RedZone {
    constructor(speedometer, fromTick) {
        const {geometry, alpha, colors, construct: {ticks}} = speedometer.settings;

        let max = ticks && ticks.max || alpha.angle;

        const redZoneStartDeg = alpha.angle / max * fromTick + alpha.start;
        const bigR = geometry.maxRadius - geometry.margin - 1;
        const smallR = geometry.maxRadius / 6;

        return {
            tag: 'path',
            opt: {
                fill: colors.redZone || 'red',
                opacity: 0.4,
                d: sector(
                    geometry.center.x, geometry.center.y,
                    redZoneStartDeg, alpha.end,
                    smallR, bigR
                )
            }
        };
    }
}