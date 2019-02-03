import {safeMerge} from '../utils.js';

const defaultConfig = {};

export default class Plugin {
    constructor(speedometer, options) {
        options = safeMerge(defaultConfig, options);

        const subTree = {
            tag: 'g',
            _id: this.constructor.name
        };

        Object.assign(this, subTree);
    }

    update({to: {degree}}) {}

    afterDraw() {}
}