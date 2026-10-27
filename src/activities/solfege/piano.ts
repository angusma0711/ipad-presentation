import a3 from './assets/piano/A3.mp3';
import c4 from './assets/piano/C4.mp3';
import ds4 from './assets/piano/Ds4.mp3';
import fs4 from './assets/piano/Fs4.mp3';
import a4 from './assets/piano/A4.mp3';
import c5 from './assets/piano/C5.mp3';
const RECORDINGS = [{midi:57,url:a3},{midi:60,url:c4},{midi:63,url:ds4},{midi:66,url:fs4},{midi:69,url:a4},{midi:72,url:c5}];
export function nearestPiano(midi:number) {
 return RECORDINGS.reduce((best,item)=>Math.abs(item.midi-midi)<Math.abs(best.midi-midi)?item:best);
}
