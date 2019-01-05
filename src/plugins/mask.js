import {safeMerge, sector} from '../utils.js';

const defaultConfig = {
    plugins: []
};

export default class Mask {
    constructor(speedometer, options, name) {
        const {geometry, alpha, norma} = speedometer.settings;
        this.options = safeMerge(defaultConfig, options);

        this.visible = {
            tag: 'path',
            opt: {fill: 'white', _id: 'visible'},
            sav: true
        };

        const subTree = {
            tag: 'mask',
            opt: {id: name},
            sub: [
                {
                    tag: 'rect',
                    _id: 'masked',
                    opt: {
                        x: 0,
                        y: 0,
                        width: geometry.size.width,
                        height: geometry.size.height,
                        fill: 'black'
                    }
                },
                this.visible
            ]
        };

        Object.assign(this, {geometry, alpha, speedometer, name, norma}, subTree);
    }

    update(deg) {
        const d = sector(
            this.geometry.center.x, this.geometry.center.y,
            this.alpha.start, deg + this.alpha.start,
            this.geometry.innerRadius, this.geometry.maxRadius
        );
        this.visible._el.setAttributeNS(null, 'd', d);
    }

    afterDraw() {
        this.options.plugins.forEach(pluginName => {
            const nodeList = this.speedometer.element.querySelectorAll(`[x-id="${pluginName}"]`);
            for (let node of nodeList) {
                node.setAttributeNS(null, 'mask', `url(#${this.name})`);
            }
        });
    }
}