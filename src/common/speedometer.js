import SpeedChart from "../speed-chart.js";
import {safeMerge} from "../utils.js";

export default class Speedometer extends SpeedChart {
    static get defaultConfig() {
        return {
            alpha: 110,
            norma: ({construct: {ticks}}) => ticks.max,
            construct: {
                speed: {text: 'km/h'},
                ticks: {
                    max: 8,
                    zeroText: 'ready',
                    innerTicks: {
                        count: 9,
                        highlight: 5
                    }
                },
                redZone: 6.5
            },
        };
    }

    constructor(element, settings) {
        const fixed = SpeedChart.fixParameters(element, settings);

        fixed.settings = safeMerge(Speedometer.defaultConfig, fixed.settings);

        super(fixed.element, fixed.settings);
    }
}