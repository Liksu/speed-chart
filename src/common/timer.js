import {AnimatedSpeedChart, TextPlugin, ArcPlugin} from "../../index.js";

const commonConfig = {
    run: false,
    delay: 0,
    restartOnResume: true,
    clickable: true,
    showMilliseconds: true,

    plugins: [
        {name: 'time', constructor: TextPlugin},
        {name: 'backArc', constructor: ArcPlugin},
        {name: 'arc', constructor: ArcPlugin}
    ],
    geometry: {},
    alpha: -0,
    norma: 100,
    multiValues: true,
    construct: {
        time: {
            text: '00:00:00.00',
            font: {
                color: 'black',
                size$: ({geometry: {size: {width}}}) => Math.round(width * 0.14)
            }
        },
        backArc: {
            color: 'silver',
            geometry: {
                innerRadius$: -8
            },
            value: 100
        },
        arc: {
            color: '#000088',
            geometry: {
                innerRadius$: -8
            },
            cap: 'round',
            value: 100
        }
    }
};

export default class Timer extends AnimatedSpeedChart {
    constructor(...params) {
        super(...params);

        if (this.settings.clickable) {
            document
                .querySelector(this.settings.selector)
                .addEventListener('click', event => {
                    if (this.isRun) {
                        this.stop();
                    } else {
                        this.start();
                    }
                });
        }

        if (!this.settings.run) {
            this.beforeStart();
        }
    }

    get commonConfig() {
        return commonConfig;
    }

    beforeStart() {
        delete this.fin;
        delete this.dif;
        this.values = {
            time: {value: this.toTime(this.settings.ms)}
        };
    }

    step() {
        let dif = this.fin - Date.now();
        if (dif < 0) dif = 0;

        this.values = {
            arc: dif / this.settings.ms * 100,
            time: {value: this.toTime(dif)}
        };

        if (dif === 0) this.stop('hide');
    }

    start() {
        this.tree.find('arc').arc._el.style.display = '';
        if (this.fin == null || this.settings.restartOnResume) {
            this.fin = Date.now() + this.settings.ms;
        } else if (this.dif != null) {
            this.fin = Date.now() + this.dif;
            delete this.dif;
        }
        super.start();
    }

    stop(hide = false) {
        if (hide) {
            this.tree.find('arc').arc._el.style.display = 'none';
            this.finish();
        } else {
            this.dif = this.fin - Date.now();
        }
        super.stop();
    }

    toTime(n) {
        const date = new Date(n);
        const [hours, minutes, seconds, milliseconds] = [
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds(),
            ~~(date.getUTCMilliseconds() / 10)
        ].map(n => String(n).padStart(2, '0'));

        const hasNaN = [hours, minutes, seconds, milliseconds].find(n => isNaN(n));
        if (hasNaN) return '';

        let time = [hours, minutes, seconds].join(':');
        if (this.settings.showMilliseconds) time += '.' + milliseconds;

        return time;
    }

    /**
     * Set new time
     * @param {number} newValue - new time in ms
     */
    set value(newValue) {
        this.settings.ms = newValue;
        super.value = newValue;
        this.beforeStart();
        if (this.isRun) this.start();
    }

    restart() {
        this.start();
    }

    /**
     * @abstract
     */
    finish() {}
}