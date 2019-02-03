import Tree from '../tree.js';

export default class SpeedTextPlugin {
    constructor(speedometer, options = {}) {
        const {center} = speedometer.settings.geometry;
        
        this.subTree = new Tree({
            tag: 'g',
            sub: [
                {
                    _id: 'inner circle',
                    tag: 'circle',
                    opt: {
                        cx: center.x,
                        cy: center.y,
                        r: speedometer.settings.geometry.maxRadius / 3,
                        fill: 'black',
                        stroke: 'white',
                        'stroke-width': 1.5
                    }
                },
                {
                    tag: 'text',
                    val: '0',
                    _id: 'speedText',
                    sav: true,
                    opt: {
                        x: center.x,
                        y: center.y,
                        id: 'speed',
                        fill: 'white',
                        'font-size': '50px',
                        'font-family': 'sans-serif',
                        'font-weight': 'bold',
                        'alignment-baseline': 'middle',
                        'text-anchor': 'middle'
                    }
                },
                options.text != null ? {
                    tag: 'text',
                    val: options.text,
                    opt: {
                        x: center.x,
                        y: center.y + 40,
                        fill: 'white',
                        'font-size': '20px',
                        'font-family': 'sans-serif',
                        'alignment-baseline': 'top',
                        'text-anchor': 'middle'
                    }
                } : null
            ]
        });

        Object.assign(this, this.subTree.tree);
    }

    update({to: {degree: deg}}) {
        this.subTree.find('speedText')._el.innerHTML = Math.floor(deg / 1.3);
        // this.subTree.find('speedText')._el.innerHTML = new Date().toISOString().replace(/^.+T(\d\d:\d\d).+$/, "$1");
    }
}