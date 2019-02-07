import SpeedChart from "../speed-chart.js";

const commonConfig = {};

export default class Common extends SpeedChart {
    get commonConfig() {
        return commonConfig;
    }
}