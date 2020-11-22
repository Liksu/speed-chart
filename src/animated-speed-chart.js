import SpeedChart from "./speed-chart.js";

export default class AnimatedSpeedChart extends SpeedChart {
    constructor(...params) {
        super(...params);
        this.animationLastRunTime = 0;
        if (this.settings.run) this.nextStep();
    }

    start() {
        this.settings.run = true;
        this.nextStep();
    }

    stop() {
        this.settings.run = false;
        this.nextStep();
    }

    /**
     * Update image on each animation step
     * @abstract
     */
    step() {
        return void 0;
    }

    nextStep(timestamp = 0) {
        if (this.settings.run) {
            this.animationRequestID = window.requestAnimationFrame(this.nextStep.bind(this));
        } else {
            window.cancelAnimationFrame(this.animationRequestID);
            return void 0;
        }

        if (this.settings.delay && timestamp - this.animationLastRunTime < this.settings.delay) {
            return void 0;
        }

        this.animationLastRunTime = timestamp;
        this.step(timestamp);
    }

    get isRun() {
        return this.settings.run;
    }
}