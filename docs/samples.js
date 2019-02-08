import SpeedChart from '../src/speed-chart.js';
import RainbowPlugin from "../src/plugins/rainbow.js";
import RedZonePlugin from "../src/plugins/redZone.js";
import SpeedTextPlugin from '../src/plugins/speed.js';
import NeedlePlugin from '../src/plugins/needle.js';
import ArrowPlugin from "../src/plugins/arrow.js";
import MaskPlugin from "../src/plugins/mask.js";
import Gauge from "../src/common/gauge.js";
import Speedometer from "../src/common/speedometer.js";
import Spinner from "../src/common/spinner.js";
import ZebraLoader from "../src/common/zebra-loader.js";

SpeedChart.register('rainbow', RainbowPlugin);
SpeedChart.register('redZone', RedZonePlugin);
SpeedChart.register('speed', SpeedTextPlugin);
SpeedChart.resetPlugins([
    'background',
    'rainbow',
    'redZone',
    'ticks',
    'needle',
    'speed',
]);

// window.speedometer = new SpeedChart({
//     selector: '#speedometer',
//     alpha: 110,
//     norma: ({construct: {ticks}}) => ticks.max,
//     construct: {
//         speed: {text: 'km/h'},
//         ticks: {
//             max: 8,
//             zeroText: 'ready',
//             innerTicks: {
//                 count: 9,
//                 highlight: 5
//             }
//         },
//         redZone: 6.5
//     },
// });

window.speedometer = new Speedometer({
    selector: '#speedometer'
});

SpeedChart.register('hours', NeedlePlugin, 'store only');
SpeedChart.register('minutes', NeedlePlugin, 'store only');
SpeedChart.register('seconds', NeedlePlugin, 'store only');

window.rainbowClock = new SpeedChart({
    selector: '#rainbowClock',
    alpha: -0,
    norma: 60,
    multiValues: true,
    plugins: ['rainbow', 'ticks', 'hours', 'minutes', 'seconds'],
    geometry: {
        innerRadius: 7
    },
    construct: {
        ticks: {
            max: 12,
            zeroText: '',
            innerTicks: {
                count: 4,
                highlight: 0,
                color: '#EEE'
            }
        },
        rainbow: {
            start: 0,
            type: 'gradient',
            opacity: 0.85,
            stops: [
                {offset: 0, color: '#C00'},
                {offset: 0.14, color: '#ee7a00'},
                {offset: 0.29, color: '#eee600'},
                {offset: 0.44, color: '#18cb00'},
                {offset: 0.57, color: '#22d5ff'},
                {offset: 0.71, color: '#0b00cc'},
                {offset: 0.85, color: '#824dcc'},
                {offset: 1, color: '#C00'},
            ]
        },
        hours: {
            radius: -15,
            length: 0.45,
            color: 'white',
            width: 7,
        },
        minutes: {
            radius: -15,
            length: 0.6,
            color: 'white',
            width: 4,
        },
        seconds: {
            radius: -15,
            length: 0.7,
            color: 'white',
            width: 2,
            pin: 8
        }
    },
});

setInterval(() => {
    const now = new Date();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    let hours = now.getHours();
    if (hours >= 12) hours -= 12;
    hours = (hours + minutes / 60) * 5;

    rainbowClock.update({
        seconds,
        minutes,
        hours
    });
}, 60);

SpeedChart.register('innerArrow', ArrowPlugin, 'store only');
SpeedChart.register('outerArrow', ArrowPlugin, 'store only');

window.gauge = new SpeedChart({
    selector: '#gauge',
    alpha: 180,
    value: 16,
    multiValues: true,
    geometry: {
        innerRadius: 75,
        maxRadius: 100,
        margin: 0,
        size: {
            width: 250,
            height: 130
        },
        center: {y: 120, x: 120}
    },
    plugins: ['rainbow', 'innerArrow', 'outerArrow'],
    construct: {
        outerArrow: {
            inner: false,
            value: 42
        },
        rainbow: {
            type: 'solid',
            stops: [
                {offset: 0, color: 'green'},
                {offset: 0.4, color: 'yellow'},
                {offset: 0.6, color: 'red'},
            ]
        }
    },
});

SpeedChart.register('mask', MaskPlugin, 'store only');

window.common_gauge = new Gauge(document.getElementById('common-gauge'));
window.common_gauge.value = 75;

window.test = new SpeedChart();
// d = document.createElement('div');
// document.body.appendChild(d);
// d.appendChild(test.element);

window.progressbar = new SpeedChart({
    selector: '#progressbar',
    alpha: 180,
    value: 64,
    geometry: {
        innerRadius: 75,
        maxRadius: 100,
        margin: 5,
        size: {
            width: 200,
            height: 100
        },
        center: {y: 100}
    },
    plugins: ['background', 'rainbow', 'mask', 'text'],
    construct: {
        background: {border: false},
        mask: {
            plugins: ['rainbow']
        },
        rainbow: {
            stops: [
                {offset: 0, color: 'green'},
                {offset: 0.4, color: 'yellow'},
                {offset: 0.6, color: 'yellow'},
                {offset: 0.8, color: 'red'},
                {offset: 1, color: 'darkred'},
            ]
        },
        // undeclared plugin
        text: {
            tag: 'text',
            val: '100',
            sav: true,
            _id: 'valueText',
            opt: {
                fill: 'silver',
                x: 100,
                y: 75,
                id: 'speed',
                'font-size': '45px',
                'font-family': 'sans-serif',
                'font-weight': 'bold',
                'alignment-baseline': 'middle',
                'text-anchor': 'middle'
            },
            update: function({to: {value}}) {
                this._el.innerHTML = value;
            }
        }
    },
});

let direct = 0.1;
const intervalN = setInterval(() => {
    if (window.stopit) return clearInterval(intervalN);

    if (0 > window.speedometer.value || window.speedometer.value > window.speedometer.settings.norma.max) direct = -direct;

    window.speedometer.value += direct;
    // speed.el.innerHTML = Math.floor(value / 1.3);
}, 100);

const intervalK = setInterval(() => {
    if (window.stopit) return clearInterval(intervalK);

    window.progressbar.value = Math.floor(Math.random() * 101);
    window.gauge.values = {
        innerArrow: Math.floor(Math.random() * 101),
        outerArrow: Math.floor(Math.random() * 101)
    };
}, 4000);

window.spinner = new Spinner('#common-spinner', {
    to: 21,
    type: 'stretch'
});

window.zebra = new ZebraLoader('#common-zebra');
window.zebraBlue = new ZebraLoader('#common-zebra-blue', {
    value: [1, 4, 7, 10, 13],
    norma: 15,
    geometry: {
        margin: 10
    },
    construct: {
        zebra: {
            gap: 0.2,
            allowMultiple: true,
            colors: {
                activeBorder: 'white',
                activeBackground: 'white'
            }
        },
        background: {
            back: '#3128b6',
            border: false,
            hole: -10,
            extra: 0
        }
    }
});
window.zebraGreen = new ZebraLoader('#common-zebra-green', {
    direction: -1,
    norma: 16,
    geometry: {
        margin: 0
    },
    construct: {
        zebra: {
            gap: 0.5,
            straightGaps: false,
            colors: {
                border: null,
                activeBorder: null,
                activeBackground: 'green',
                5: {border: 'orange', background: 'yellow'},
                10: {border: 'blue', background: 'lightcyan'},
            }
        },
        background: {
            back: '#3128b6',
            border: false,
            hole: -0,
            extra: -60
        }
    }
});
window.zebraTail = new ZebraLoader('#common-zebra-tail', {
    value: [
        {value: 1, color: {border: '#ffd200', background: '#ffd200'}},
        {value: 2, color: {border: '#ffc100', background: '#ffc100'}},
        {value: 3, color: {border: '#ffb100', background: '#ffb100'}},
        {value: 4, color: {border: '#ffa000', background: '#ffa000'}},
    ],
    norma: 17,
    geometry: {
        margin: 0,
        innerRadius: 0.85
    },
    construct: {
        zebra: {
            gap: 0.2,
            allowMultiple: true,
            colors: {
                activeBorder: 'navy',
                activeBackground: 'lightcyan'
            }
        }
    }
});