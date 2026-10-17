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
  if (TOGGLES.includes(action)) slide!.classList.toggle('dp-revealed');
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
 return () => { root.removeEventListener('click', click); clearInterval(countdown); game?.destroy(); };
}
export default { attach } satisfies DeckPlugin;
