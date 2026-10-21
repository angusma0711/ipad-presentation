import type { DeckPlugin } from '../types';
import deck from './deck.json';
import { createGame, type GameConfig } from './rhythm-game';
// Slides are plain HTML. This handles the iPad actions (each clicks a [data-action]
// button on the projector) and shows placeholders until the illustrations exist.
// State lives in the slide's DOM, so leaving the slide resets it.
const TOGGLES = ['reveal-long', 'reveal-end', 'reveal-rain', 'reveal-scrape'];
function attach(root: HTMLElement) {
 const slide = root.querySelector<HTMLElement>('.dp-slide');
 if (!slide) return () => {};
 root.querySelectorAll<HTMLImageElement>('.dp-art img').forEach(image => {
  const missing = () => image.parentElement?.classList.add('dp-missing');
  if (image.complete && image.naturalWidth === 0) missing(); else image.addEventListener('error', missing);
 });
 const gameElement = root.querySelector<HTMLElement>('[data-game]');
 const game = gameElement ? createGame(gameElement, deck.rhythmGame as GameConfig, deck.assetBase) : null;
 let beatFrame = 0;
 const beatDots = [...slide.querySelectorAll<HTMLElement>('[data-beat]')];
 const rhythmBeats = [...slide.querySelectorAll<HTMLElement>('[data-rhythm-beat]')];
 const preparation = [...slide.querySelectorAll<HTMLElement>('.dp-preparation i')];
 const beatStatus = slide.querySelector<HTMLElement>('.dp-follow-status');
 const clearBeat = () => [...beatDots, ...rhythmBeats, ...preparation].forEach(el => el.classList.remove('dp-playing'));
 let beatAudio: AudioContext | null = null;
 let soundTimer = 0;
 const sounding = new Set<OscillatorNode>();
 const enableSound = slide.querySelector<HTMLButtonElement>('[data-enable-beat]');
 async function unlockSound() {
  try {
   beatAudio ??= new AudioContext();
   if (enableSound) enableSound.hidden = beatAudio.state === 'running';
   await beatAudio.resume();
   if (enableSound) enableSound.hidden = beatAudio.state === 'running';
  } catch { if (enableSound) enableSound.hidden = false; }
 }
 const enableClick = () => { void unlockSound(); };
 enableSound?.addEventListener('click', enableClick);
 function stopSound() {
  clearInterval(soundTimer); soundTimer = 0;
  sounding.forEach(osc => { try { osc.stop(); } catch { /* Already ended. */ } });
  sounding.clear();
 }
 function startSound(started: number, duration: number) {
  void unlockSound();
  let next = 0;
  const schedule = () => {
   if (!beatAudio || beatAudio.state !== 'running') {
    next = Math.max(next, Math.ceil((performance.now() - started) / duration));
    return;
   }
   const elapsed = performance.now() - started;
   while (next < beatDots.length + 4 && next * duration < elapsed + 120) {
    const delay = (next * duration - elapsed) / 1000;
    if (delay >= -0.04) {
     const at = beatAudio.currentTime + Math.max(0, delay);
     const osc = beatAudio.createOscillator(), gain = beatAudio.createGain();
     osc.frequency.value = next < 4 ? 1000 : 750;
     gain.gain.setValueAtTime(0.0001, at);
     gain.gain.exponentialRampToValueAtTime(0.18, at + 0.003);
     gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.065);
     osc.connect(gain); gain.connect(beatAudio.destination);
     sounding.add(osc); osc.onended = () => { sounding.delete(osc); osc.disconnect(); gain.disconnect(); };
     osc.start(at); osc.stop(at + 0.07);
    }
    next++;
   }
  };
  schedule(); soundTimer = window.setInterval(schedule, 25);
 }

 function stopBeat(reset = false) {
  stopSound();
  cancelAnimationFrame(beatFrame); beatFrame = 0; clearBeat();
  if (beatStatus) beatStatus.textContent = reset ? '準備：4 拍' : '已停止';
 }
 function playBeat() {
  if (!beatDots.length) return;
  stopBeat(true);
  const started = performance.now(), duration = 60000 / 72;
  startSound(started, duration);
  let previous = -1;
  const tick = () => {
   const step = Math.floor((performance.now() - started) / duration);
   if (step >= beatDots.length + 4) {
    stopBeat(); if (beatStatus) beatStatus.textContent = '完成'; return;
   }
   if (step !== previous) {
    previous = step; clearBeat();
    if (step < 4) {
     preparation[step]?.classList.add('dp-playing');
     if (beatStatus) beatStatus.textContent = `預備 ${step + 1} / 4`;
    } else {
     const index = step - 4;
     beatDots[index]?.classList.add('dp-playing'); rhythmBeats.find(element=>index>=Number(element.dataset.rhythmBeat)&&index<Number(element.dataset.rhythmBeat)+Number(element.dataset.beats??1))?.classList.add('dp-playing');
     if (beatStatus) beatStatus.textContent = `第 ${index + 1} / ${beatDots.length} 拍`;
    }
   }
   beatFrame = requestAnimationFrame(tick);
  };
  tick();
 }

 let countdown = 0;
 function startTimer() {
  const display = slide!.querySelector<HTMLElement>('.dp-timer'); if (!display) return;
  const total = Number(display.dataset.seconds ?? 180), end = Date.now() + total * 1000;
  const show = () => {
   const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
   display.textContent = left ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : '時間到！';
   display.classList.toggle('dp-done', !left);
   if (!left) clearInterval(countdown);
  };
  clearInterval(countdown); show(); countdown = window.setInterval(show, 250);
 }
 function act(action: string) {
  if (action === 'beat-play') playBeat();
  else if (action === 'beat-stop') stopBeat();
  else if (action === 'beat-reset') stopBeat(true);
  else if (action === 'reveal-question') slide!.classList.toggle('dp-question-shown');
  else if (action === 'reveal-v1' || action === 'reveal-v2') slide!.classList.toggle(action === 'reveal-v1' ? 'dp-show-v1' : 'dp-show-v2');
  else if (TOGGLES.includes(action)) slide!.classList.toggle('dp-revealed');
  else if (action === 'reveal-sounds') {
   const hidden = slide!.querySelector('.dp-step:not(.dp-shown)');
   if (hidden) hidden.classList.add('dp-shown'); else slide!.querySelectorAll('.dp-step').forEach(item => item.classList.remove('dp-shown'));
  } else if (action === 'highlight-next') {
   const lines = [...slide!.querySelectorAll('.dp-seq')]; const current = lines.findIndex(line => line.classList.contains('dp-current'));
   lines.forEach(line => line.classList.remove('dp-current'));
   const next = current + 1;
   if (next < lines.length) lines[next].classList.add('dp-current');
   slide!.querySelector('.dp-ensemble')?.classList.toggle('dp-active', next < lines.length);
  } else if (action === 'start-timer') startTimer();
  else if (action.startsWith('game-')) game?.handle(action);
 }
 const click = (event: MouseEvent) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!button || !root.contains(button)) return;
  event.stopPropagation(); act(button.dataset.action!);
 };
 root.addEventListener('click', click);
 return () => { root.removeEventListener('click', click); clearInterval(countdown); cancelAnimationFrame(beatFrame); stopSound(); enableSound?.removeEventListener('click', enableClick); void beatAudio?.close(); game?.destroy(); };
}
export default { attach } satisfies DeckPlugin;
