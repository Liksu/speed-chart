import AnimatedSpeedChart from "../animated-speed-chart.js";
import BackgroundPlugin from "../plugins/background.js";
import Zebra from "../plugins/zebra.js";

const commonConfig = {
    run: true,
    delay: 165,
    direction: 1,

    plugins: [
        {name: 'background', constructor: BackgroundPlugin},
        {name: 'zebra', constructor: Zebra}
    ],
    geometry: {
        margin: 1,
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

    afterRemake() {
        this.rotateValue = this.rotateValue.bind(this);
    }

    rotateValue(value) {
        let n = typeof value === 'object' ? value.value : value;
        n = n + this.settings.direction;
        if (n >= this.settings.norma.max) n = this.settings.norma.min;
        else if (n < this.settings.norma.min) n = this.settings.norma.max - 1;
        return typeof value === 'object' ? {...value, value: n} : n;
    }

    step() {
        let value = this.value;
        if (value instanceof Array) {
            value = value.map(this.rotateValue);
        } else {
            value = this.rotateValue(value);
        }
        this.value = value;
    }
}