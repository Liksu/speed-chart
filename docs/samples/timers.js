import {Timer} from "../bundle.js";

let [hours, minutes, seconds] = [0, 1, 0];

window.timerA = new Timer({
    selector: '#timerA',
    ms: (hours * 3600 + minutes * 60 + seconds) * 1000,
    restartOnResume: false
});

[hours, minutes, seconds] = [0, 5, 0];

window.timerB = new Timer({
    selector: '#timerB',
    ms: (hours * 3600 + minutes * 60 + seconds) * 1000,
    restartOnResume: false,
    showMilliseconds: false
});

window.timerA.finish = () => {
    window.timerB.start();
}