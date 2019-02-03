import SpeedChart from "../speed-chart.js";

import GaugePlugin from '../plugins/gauge.js';
import AnimatedSpeedChart from "./_animated.js";
SpeedChart.register('gauge', GaugePlugin, 'store only');

const commonConfig = {
    from: 0,
    to: 10,
    run: true,
    delay: 36,

    plugins: ['gauge'],
    geometry: {
        innerRadius: 22,
        maxRadius: 25,
        margin: 0
    },
    alpha: 0,
    construct: {
        gauge: {
            bgColor: '#EEE',
            color: 'lightgreen'
        }
    }
};

export default class Spinner extends AnimatedSpeedChart {
    get commonConfig() {
        return commonConfig;
    }

    step() {
        let {from, to} = this.settings;
        this.redraw(to, from);

        from++;
        to++;

        if (from > this.settings.norma.max) from -= this.settings.norma.max;
        if (to > this.settings.norma.max) to -= this.settings.norma.max;

        Object.assign(this.settings, {from, to});
    }

    redraw(to = this.to, from = this.from) {
        this.update([to, from]);
    }
}