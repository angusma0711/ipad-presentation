import { assetURL } from '../../utils/urls';
// Clap-along rhythm game: symbols slide to the judgement line, the class claps there.
// No scoring and no microphone. Driven only by slide actions (start/stop/next/reset/step).
type Rhythm = 'ta' | 'titi' | 'rest';
type Beat = { r: Rhythm; text?: string };
type Round = { title: string; beats: Beat[]; emptyMessage?: string };
export type GameConfig = { bpm: number; countIn: number; rounds: Round[] };
const SYMBOLS: Record<Rhythm, [string, string, string]> = { ta: ['ta.svg', '♩', 'ta'], titi: ['titi.svg', '♫', 'ti-ti'], rest: ['rest.svg', '𝄽', '—'] };
const JUDGE = 14, BEAT_WIDTH = 18, GAP = 2;
const escape = (value: string) => value.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function createGame(element: HTMLElement, config: GameConfig, assetBase: string) {
 const title = element.querySelector<HTMLElement>('.dp-game-title')!;
 const status = element.querySelector<HTMLElement>('.dp-game-status')!;
 const lane = element.querySelector<HTMLElement>('.dp-lane')!;
 const track = element.querySelector<HTMLElement>('.dp-track')!;
 const judge = element.querySelector<HTMLElement>('.dp-judge')!;
 const enable = element.querySelector<HTMLButtonElement>('[data-game-enable]')!;
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const beatSeconds = 60 / Math.max(30, Math.min(160, config.bpm || 72));
 const countIn = Math.max(1, config.countIn || 4);
 let round = 0, frame = 0, step = -1, manual = false;
 let run: { start: number; demo: number; follow: number; end: number } | null = null;
 let audio: AudioContext | null = null; const sources: AudioScheduledSourceNode[] = [];
 let tokens: HTMLElement[] = [];
 const beats = () => config.rounds[round]?.beats ?? [];

 function cell(beat: Beat) {
  const [file, alt, say] = SYMBOLS[beat.r];
  return `<span class="dp-cell dp-${beat.r}"><img src="${assetURL(assetBase + 'symbols/' + file)}" alt="${alt}"><small>${say}</small><b>${beat.text ? escape(beat.text) : '&nbsp;'}</b></span>`;
 }
 function render() {
  const current = config.rounds[round];
  title.textContent = current?.title ?? '節奏遊戲';
  lane.classList.toggle('dp-static', !run || reduced || manual);
  if (!beats().length) { track.innerHTML = `<p class="dp-empty">${escape(current?.emptyMessage ?? '沒有節奏')}</p>`; tokens = []; return; }
  track.innerHTML = beats().map(beat => `<div class="dp-token${beat.r === 'rest' ? ' dp-rest-token' : ''}">${cell(beat)}</div>`).join('');
  tokens = [...track.querySelectorAll<HTMLElement>('.dp-token')];
 }
 // Claps fall on each ta, on both halves of ti-ti, and never on a rest.
 function onsets(start: number) { return beats().flatMap((beat, i) => beat.r === 'ta' ? [start + i] : beat.r === 'titi' ? [start + i, start + i + .5] : []); }
 function sound(at: number, kind: 'tick' | 'accent' | 'note') {
  if (!audio || audio.state !== 'running') return;
  const oscillator = audio.createOscillator(), gain = audio.createGain();
  oscillator.type = kind === 'note' ? 'triangle' : 'sine';
  oscillator.frequency.value = kind === 'note' ? 660 : kind === 'accent' ? 1600 : 1100;
  const peak = kind === 'note' ? .5 : kind === 'accent' ? .3 : .15, length = kind === 'note' ? .14 : .05;
  gain.gain.setValueAtTime(peak, at); gain.gain.exponentialRampToValueAtTime(.001, at + length);
  oscillator.connect(gain).connect(audio.destination); oscillator.start(at); oscillator.stop(at + length + .02); sources.push(oscillator);
 }
 async function prepareAudio() {
  const AudioClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioClass) return;
  audio ??= new AudioClass();
  if (audio.state !== 'running') await Promise.race([audio.resume().catch(() => {}), new Promise(resolve => setTimeout(resolve, 250))]);
  // Browsers block sound until someone clicks on the projector page itself.
  enable.hidden = audio.state === 'running';
 }
 function flash() { judge.classList.remove('dp-flash'); void judge.offsetWidth; judge.classList.add('dp-flash'); setTimeout(() => judge.classList.remove('dp-flash'), 120); }
 function stopRun(message = '') {
  cancelAnimationFrame(frame); run = null; manual = false;
  sources.splice(0).forEach(source => { try { source.stop(); } catch { /* already stopped */ } });
  render(); if (message) status.textContent = message;
 }
 async function start() {
  stopRun(); step = -1;
  if (!beats().length) { status.textContent = config.rounds[round]?.emptyMessage ?? '沒有節奏'; return; }
  await prepareAudio();
  const n = beats().length, demo = countIn, follow = demo + n + GAP + countIn;
  const begin = performance.now() / 1000 + .2;
  run = { start: begin, demo, follow, end: follow + n };
  render();
  if (audio?.state === 'running') {
   const zero = audio.currentTime + .2;
   for (let b = 0; b < run.end; b++) {
    const counting = b < demo || (b >= demo + n + GAP && b < follow);
    sound(zero + b * beatSeconds, counting && (b === 0 || b === demo + n + GAP) ? 'accent' : 'tick');
   }
   for (const at of onsets(demo)) sound(zero + at * beatSeconds, 'note');
  }
  const flashes = [...onsets(demo), ...onsets(follow)].sort((a, b) => a - b); let nextFlash = 0;
  const tick = () => {
   if (!run) return;
   const now = (performance.now() / 1000 - run.start) / beatSeconds;
   while (nextFlash < flashes.length && flashes[nextFlash] <= now) { if (now - flashes[nextFlash] < .25) flash(); nextFlash++; }
   const pass = now < run.demo + n + GAP / 2 ? run.demo : run.follow;
   if (now < 0) status.textContent = '預備…';
   else if (now < run.demo) status.textContent = `示範：聽一聽、看一看　${Math.floor(now) + 1}`;
   else if (now < run.demo + n) status.textContent = '示範：聽一聽、看一看';
   else if (now < run.follow) status.textContent = `輪到你們！預備　${Math.max(1, Math.floor(now - (run.demo + n + GAP)) + 1)}`;
   else if (now < run.end) status.textContent = '全班跟拍！';
   else { stopRun('停！再試一次？按「開始」'); return; }
   if (reduced) tokens.forEach((token, i) => token.classList.toggle('dp-now', Math.floor(now) === pass + i));
   else tokens.forEach((token, i) => { const x = JUDGE + (pass + i - now) * BEAT_WIDTH; token.style.left = `${x}%`; token.style.visibility = x < -8 || x > 108 ? 'hidden' : 'visible'; });
   frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
 }
 // Fallback: a static row with a highlight box that moves one beat per press.
 function stepBeat() {
  if (run) stopRun();
  if (!beats().length) { status.textContent = config.rounds[round]?.emptyMessage ?? '沒有節奏'; return; }
  manual = true; lane.classList.add('dp-static');
  step = (step + 1) % beats().length;
  tokens.forEach((token, i) => token.classList.toggle('dp-now', i === step));
  status.textContent = `逐拍高亮：第 ${step + 1} 拍`;
 }
 enable.addEventListener('click', () => { void audio?.resume().then(() => { enable.hidden = audio?.state === 'running'; }); });
 render();
 return {
  handle(action: string) {
   if (action === 'game-start') void start();
   else if (action === 'game-stop') stopRun('已停止');
   else if (action === 'game-next') { stopRun(); round = (round + 1) % config.rounds.length; step = -1; render(); status.textContent = '按「開始」'; }
   else if (action === 'game-reset') { stopRun(); round = 0; step = -1; render(); status.textContent = '按「開始」'; }
   else if (action === 'game-step') stepBeat();
  },
  destroy() { stopRun(); void audio?.close().catch(() => {}); },
 };
}
