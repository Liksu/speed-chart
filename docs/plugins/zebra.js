import {ZebraLoader} from "../bundle.js";
import {ArrowPlugin} from "../bundle.js";
ZebraLoader.register('pointer', ArrowPlugin);

window.zebraSkew = new ZebraLoader('#skew', {
    run: false,
    geometry: {
        innerRadius: 0.5,
        margin: 1
    },
    norma: 6,
    pushPlugins: ['pointer'],
    construct: {
        zebra: {
            highlightActive: false,
            straightGaps: false
        },
        pointer: {
            radius: -0,
            color: 'darkred',
            sizes: {stick: 20},
            spin: {
                degree: 120,
                around: (s, o, {A}) => ({
                    x: A.x - 2,
                    y: A.y - 2
                })
            }
        }
    }
});

window.zebraStraight = new ZebraLoader('#straight', {
    run: false,
    geometry: {
        innerRadius: 0.5,
        margin: 1
    },
    norma: 6,
    pushPlugins: ['pointer'],
    construct: {
        zebra: {
            highlightActive: false,
            straightGaps: true
        },
        pointer: {
            radius: -0,
            color: 'darkred',
            sizes: {stick: 20},
            spin: {
                degree: 120,
                around: (s, o, {A}) => ({
                    x: A.x - 2,
                    y: A.y - 2
                })
            }
        }
    }
});

window.zebraHighlight = new ZebraLoader({
    selector: '#highlight'
});

const highlightStatus = document.getElementById('highlightStatus');
window.toggleHighlight = function(checkbox) {
    window.zebraHighlight.remake({
        construct: {
            zebra: {
                highlightActive: checkbox.checked
            }
        }
    });
    highlightStatus.innerText = checkbox.checked;
};

const runStatus = document.getElementById('runStatus');
window.toggleRun = function(checkbox) {
    window.zebraHighlight[checkbox.checked ? 'start' : 'stop']();
    runStatus.innerText = checkbox.checked;
};

const value = document.getElementById('value');
setInterval(() => {
    value.innerText = window.zebraHighlight.value;
}, 100);
