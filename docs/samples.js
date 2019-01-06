import Speedometer from '../src/speedometer.js';
import Rainbow from "../src/plugins/rainbow.js";
import RedZone from "../src/plugins/redZone.js";
import SpeedText from '../src/plugins/speed.js';
import Needle from '../src/plugins/needle.js';
import Arrow from "../src/plugins/arrow.js";
import Mask from "../src/plugins/mask.js";

Speedometer.register('rainbow', Rainbow);
Speedometer.register('redZone', RedZone);
Speedometer.register('speed', SpeedText);
Speedometer.resetPlugins([
    'background',
    'rainbow',
    'redZone',
    'ticks',
    'needle',
    'speed',
]);

window.speedometer = new Speedometer({
    selector: '#speedometer',
    alpha: 110,
    norma: ({construct: {ticks}}) => ticks.max,
    construct: {
        ticks: {
            max: 8,
            zeroText: 'ready',
            innerTicks: {
                count: 9,
                highlight: 5
            }
        },
        redZone: 6.5
    },
});

Speedometer.register('hours', Needle, 'store only');
Speedometer.register('minutes', Needle, 'store only');
Speedometer.register('seconds', Needle, 'store only');

window.rainbowClock = new Speedometer({
    selector: '#rainbowClock',
    alpha: -0,
    plugins: ['rainbow', 'ticks', 'hours', 'minutes', 'seconds'],
    geometry: {
        innerRadius: 0
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
    const seconds = now.getSeconds() * 1000 + now.getMilliseconds();
    rainbowClock.tree.find('seconds').update(seconds / (60 * 1000) * 360);
    const minutes = now.getMinutes() * 60 + now.getSeconds();
    rainbowClock.tree.find('minutes').update(minutes / (60 * 60) * 360);
    let hours = now.getHours();
    if (hours >= 12) hours -= 12;
    hours = hours * 12 + now.getMinutes();
    rainbowClock.tree.find('hours').update(hours / (24 * 60) * 360);
}, 60);

Speedometer.register('innerArrow', Arrow, 'store only');
Speedometer.register('outerArrow', Arrow, 'store only');

window.gauge = new Speedometer({
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

Speedometer.register('mask', Mask, 'store only');

window.progressbar = new Speedometer({
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
            update: function(deg, val) {
                this._el.innerHTML = val;
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