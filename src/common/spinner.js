import GaugePlugin from '../plugins/gauge.js';
import AnimatedSpeedChart from "../animated-speed-chart.js";

const commonConfig = {
    from: 0,
    to: 10,
    run: true,
    delay: 0,
    type: 'plain',

    plugins: [{name: 'gauge', constructor: GaugePlugin}],
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
        this[this.settings.type]();
    }

    plain() {
        let {from, to} = this.settings;
        this.redraw(to, from);

        from++;
        to++;

        if (from > this.settings.norma.max) from -= this.settings.norma.max;
        if (to > this.settings.norma.max) to -= this.settings.norma.max;

        Object.assign(this.settings, {from, to});
    }

    stretch() {
        // just to demonstrate switching of methods
        this.plain();
    }

    redraw(to = this.to, from = this.from) {
        this.update([to, from]);
    }
}