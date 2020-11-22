import {AnimatedSpeedChart, TextPlugin, ArcsPlugin} from "../../index.js";
import {getClockTime} from "../../src/utils.js";

const commonConfig = {
    time: {
        showSeconds: false,
        margin: 30
    },
    date: {
        margin: 60
    },

    run: true,
    delay: 0,

    plugins: [
        'background',
        'ticks',
        {name: 'hours', constructor: 'needle'},
        {name: 'minutes', constructor: 'needle'},
        {name: 'seconds', constructor: 'needle'},
        {name: 'tasks', constructor: ArcsPlugin},
        {name: 'time', constructor: 'text'},
        {name: 'date', constructor: 'text'},
    ],
    geometry: {},
    alpha: -0,
    norma: 60,
    multiValues: true,
    construct: {
        background: {
            border: false
        },
        ticks: {
            color: 'white',
            max: 12,
            zeroText: '',
            hideText: true,
            innerTicks: {
                count: 4,
                highlight: 0,
                color: '#AAA'
            }
        },
        hours: {
            radius: -15,
            length: 0.45,
            color: 'red',
            width: 7,
        },
        minutes: {
            radius: -15,
            length: 0.6,
            color: 'blue',
            width: 4,
        },
        seconds: {
            radius: -15,
            length: 0.7,
            color: 'green',
            width: 2,
            pin: {
                overlap: true,
                radius: 8
            }
        },
        time: {
            font: {
                size: 45
            }
        },
        date: {
            text: '{{dow}}\n{{date}} {{month}}',
            font: {
                color: 'silver',
                size: 26
            }
        },
        tasks: {
            geometry: {
                innerRadius$: -6,
                margin: 2
            },
            cap: 'round',
            value: [
                {to: 18},
                {from: 30, to: 45},
                {
                    color: 'red',
                    geometry: {
                        innerRadius$: -12,
                        maxRadius$: -8,
                        margin: 0
                    },
                    value: {from: 35, to: 55}
                }
            ]
        }
    }
};

class Tizen extends AnimatedSpeedChart {
    constructor(...params) {
        super(...params);
        this.placeTexts();

        // setTimeout(() => {
        //     this.settings.construct.tasks.push({
        //         geometry: {
        //             innerRadius: -6,
        //             maxRadius: -2,
        //             margin: 0
        //         },
        //         cap: 'round',
        //         value: {
        //             from: 50, to: 59
        //         }
        //     })
        // }, 1000);
    }

    get commonConfig() {
        return commonConfig;
    }

    step() {
        this.values = {
            ...getClockTime(),
            time: {value: this.getTime()},
            date: {data: this.getDate()}
        };
    }

    getTime(now = new Date()) {
        const time = [now.getHours(), now.getMinutes()];
        if (this.settings.time.showSeconds) time.push(now.getSeconds());
        return time
            .map(n => String(n).padStart(2, '0'))
            .join(':');
    }

    placeTexts() {
        this.values = {
            time: {
                position: {
                    x: this.settings.geometry.center.x,
                    y: this.settings.geometry.center.y - this.settings.construct.time.font.size - this.settings.time.margin
                }
            },
            date: {
                position: {
                    x: this.settings.geometry.center.x,
                    y: this.settings.geometry.center.y + this.settings.construct.date.font.size + this.settings.date.margin
                }
            }
        };
    };

    getDate(now = new Date()) {
        return {
            dow: now.toLocaleDateString(undefined, { weekday: 'long' }),
            date: now.getDate(),
            month: now.toLocaleDateString(undefined, { month: 'short' })
        }
    }
}

Tizen.register('text', TextPlugin, 'store only');

window.tizen = new Tizen({
    selector: '#tizen'
});
