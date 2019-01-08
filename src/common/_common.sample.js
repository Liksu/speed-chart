import SpeedChart from "../speed-chart.js";
import {safeMerge} from "../utils.js";

export default class Common extends SpeedChart {
    static get defaultConfig() {
        return {};
    }

    constructor(element, settings) {
        const fixed = SpeedChart.fixParameters(element, settings);

        fixed.settings = safeMerge(Common.defaultConfig, fixed.settings);

        super(fixed.element, fixed.settings);
    }
}