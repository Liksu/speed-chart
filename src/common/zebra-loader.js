import AnimatedSpeedChart from "../animated-speed-chart.js";
import BackgroundPlugin from "../plugins/background.js";
import Zebra from "../plugins/zebra.js";

const commonConfig = {
    run: true,
    delay: 165,

    plugins: [
        {name: 'background', constructor: BackgroundPlugin},
        {name: 'zebra', constructor: Zebra}
    ],
    geometry: {
        margin: 10,
        innerRadius: 0.6
    },
    alpha: 0,
    norma: 7,
    construct: {
        zebra: {
            gap: 0.1
        },
        background: {
            back: null,
            border: false,
        }
    }
};

export default class ZebraLoader extends AnimatedSpeedChart {
    get commonConfig() {
        return commonConfig;
    }

    step() {
        let value = this.value;
        value++;
        if (value >= this.settings.norma.max) value = this.settings.norma.min;
        this.value = value;
    }
}