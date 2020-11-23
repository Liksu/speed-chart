import {GaugePlugin, TextPlugin, SpeedChart, ArrowPlugin, ArcPlugin} from "../../index.js";

const arcRadius = 0.56;

const commonConfig = {
    plugins: [
        'background',
        {name: 'alpha', constructor: GaugePlugin},
        'ticks',
        {name: 'arc', constructor: ArcPlugin},
        {name: 'leftArrow', constructor: ArrowPlugin},
        {name: 'rightArrow', constructor: ArrowPlugin},
        {name: 'text', constructor: TextPlugin},
    ],
    geometry: {},
    alpha: -0,
    norma: 12,
    multiValues: true,
    construct: {
        background: {
            alpha$: 126,
            border: false
        },
        ticks: {
            alpha$: 120,
            color: '#00008066',
            zeroText: '0',
            zeroTextSize: '30px',
            max: 8,
            innerTicks: {
                count: 9,
                highlight: 5,
                color: '#00008048'
            }
        },
        alpha: {
            color: '#e68987',
            value: {from: 4, to: 8}
        },
        arc: {
            color: 'white',
            value: {from: 4.1, to: 7.9},
            geometry: {
                innerRadius$: arcRadius - 0.008,
                maxRadius$: arcRadius + 0.008,
                margin: 0
            }
        },
        leftArrow: {
            color: 'white',
            sizes: {
                height$: 0.1,
                width$: 0.06,
                notch$: 0.015
            },
            geometry: {
                innerRadius$: arcRadius
            },
            spin: {
                around: 'peak',
                degree$: ({geometry: {maxRadius}}, {sizes: {height}}) => {
                    const rad = height / (2 * maxRadius);
                    return Math.acos(rad) * 180 / Math.PI - 1;
                }
            },
            value: 8
        },
        rightArrow: {
            color: 'white',
            sizes: {
                height$: 0.1,
                width$: 0.06,
                notch$: 0.015
            },
            geometry: {
                innerRadius$: arcRadius
            },
            spin: {
                around: 'peak',
                degree$: ({geometry: {maxRadius}}, {sizes: {height}}) => {
                    const rad = height / (2 * maxRadius);
                    return -Math.acos(rad) * 180 / Math.PI + 1;
                }
            },
            value: 4
        },
        subTreeExample: {
            tag: 'rect',
            opt: {
                x$: globalSettings => globalSettings.geometry.center.x - 50,
                y$: globalSettings => globalSettings.geometry.center.y - 50,
                width: 100,
                height: 100,
                fill: 'green'
            },
        },
        svgExample: {
            tag: 'g',
            val: `<rect x="50" y="100" width="100" height="50" fill="orange">`
        },
        text: {
            geometry: {
                center: {
                    y$: (globalSettings, pluginConfig, partConfig) => {
                        return globalSettings.geometry.center.y + globalSettings.geometry.maxRadius * (arcRadius + 0.15)
                    }
                }
            },
            font: {
                size$: 0.2
            },
            text: 'alpha'
        }
    }
};

class Figure extends SpeedChart {
    get commonConfig() {
        return commonConfig;
    }
}

window.figure = new Figure({
    selector: '#figure'
});
