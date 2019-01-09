import SpeedChart from "../speed-chart.js";
import {safeMerge} from "../utils.js";

import GaugePlugin from '../plugins/gauge.js';
SpeedChart.register('gauge', GaugePlugin, 'store only');

export default class Gauge extends SpeedChart {
    static get defaultConfig() {
        return {
            plugins: ['gauge'],
            // value: 12,
            geometry: {
                innerRadius: -24
            },
            alpha: 180,
            construct: {
                gauge: {
                    cap: 'round',
                }
            }
        }
    }

    constructor(element, settings) {
        const fixed = SpeedChart.fixParameters(element, settings);

        fixed.settings = safeMerge(Gauge.defaultConfig, fixed.settings);

        super(fixed.element, fixed.settings);
    }
}