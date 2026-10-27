import type { DeckPlugin } from '../types';
import '../p2-dynamic-poems/styles.css';
// Slides are plain HTML; the iPad's actions click the hidden [data-action] buttons.
// All state lives in the slide's DOM, so leaving the slide resets it.
// focus: one item highlighted at a time (then none); reveal: items appear one by one (then hide all).
const STEPS: Record<string, { selector: string; mode: 'focus' | 'reveal' }> = {
 'pb-line-next': { selector: '.pb-poem-line', mode: 'focus' },
 'pb-answer-next': { selector: '.pb-answer', mode: 'reveal' },
 'pb-move-next': { selector: '.pb-move-card', mode: 'focus' },
 'pb-sfx-next': { selector: '.pb-sfx-row', mode: 'focus' },
 'pb-perform-next': { selector: '.pb-perform-line', mode: 'focus' },
};
const BPM = 72, COUNT_IN = 4;
function attach(root: HTMLElement) {
 const slide = root.querySelector<HTMLElement>('.pb-slide');
 if (!slide) return () => {};
 let frame = 0, audio: AudioContext | null = null;
 const cards = [...slide.querySelectorAll<HTMLElement>('[data-beat]')];
 const status = slide.querySelector<HTMLElement>('.pb-status');
 function step(action: string) {
  const { selector, mode } = STEPS[action];
  const items = [...slide!.querySelectorAll<HTMLElement>(selector)];
  if (mode === 'reveal') {
   const next = items.find(item => !item.classList.contains('pb-shown'));
   if (next) next.classList.add('pb-shown'); else items.forEach(item => item.classList.remove('pb-shown'));
   return;
  }
  const current = items.findIndex(item => item.classList.contains('pb-current'));
  items.forEach(item => item.classList.remove('pb-current'));
  const next = current + 1;
  if (next < items.length) items[next].classList.add('pb-current');
  items[0]?.parentElement?.classList.toggle('pb-focus', next < items.length);
 }
 function tick(at: number, accent: boolean) {
  if (!audio || audio.state !== 'running') return;
  const osc = audio.createOscillator(), gain = audio.createGain();
  osc.frequency.value = accent ? 1000 : 750;
  gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(.18, at + .003); gain.gain.exponentialRampToValueAtTime(.0001, at + .065);
  osc.connect(gain).connect(audio.destination); osc.start(at); osc.stop(at + .07);
 }
 function stop(message = '') {
  cancelAnimationFrame(frame); frame = 0;
  cards.forEach(card => card.classList.remove('pb-on'));
  if (status) status.textContent = message;
 }
 // Count in 4 beats, then light each card for one beat (ti-ti = two words in one beat).
 async function play() {
  if (!cards.length) return;
  stop();
  try { audio ??= new AudioContext(); await Promise.race([audio.resume(), new Promise(resolve => setTimeout(resolve, 250))]); } catch { /* Visual only. */ }
  const beat = 60 / BPM, total = COUNT_IN + cards.length;
  const startPerf = performance.now() + 150;
  if (audio?.state === 'running') { const zero = audio.currentTime + .15; for (let b = 0; b < total; b++) tick(zero + b * beat, b < COUNT_IN); }
  let previous = -1;
  const loop = () => {
   const index = Math.floor((performance.now() - startPerf) / 1000 / beat);
   if (index >= total) { stop('完成'); return; }
   if (index !== previous && index >= 0) {
    previous = index;
    cards.forEach(card => card.classList.remove('pb-on'));
    if (index < COUNT_IN) { if (status) status.textContent = `預備 ${index + 1}`; }
    else { cards[index - COUNT_IN].classList.add('pb-on'); if (status) status.textContent = '一起讀！'; }
   }
   frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);
 }
 function act(action: string) {
  if (STEPS[action]) step(action);
  else if (action === 'read-play') void play();
  else if (action === 'read-stop') stop('已停止');
 }
 const click = (event: MouseEvent) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!button || !root.contains(button)) return;
  event.stopPropagation(); act(button.dataset.action!);
 };
 root.addEventListener('click', click);
 return () => { root.removeEventListener('click', click); stop(); void audio?.close().catch(() => {}); };
}
export default { attach } satisfies DeckPlugin;
