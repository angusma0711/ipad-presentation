import { assetURL } from '../../utils/urls';
import { useContext, useEffect, useRef, useState, type CSSProperties } from 'react';
import deck from './deck.json';
import { renderP5 } from './render.js';
import { InteractionContext } from '../../components/InteractionContext';
import { initialInteraction } from '../../types/interaction';
import type { DeckControlsProps, DeckPlugin } from '../types';
type Track = keyof typeof deck.tracks;
const youtube = (track: string) => ({ kind: 'youtube' as const, src: deck.tracks[track as Track].youtubeId });
function P5Slide({ index }: { index: number }) {
 const root = useRef<HTMLDivElement>(null); const [scale, setScale] = useState(1); const { state, change, next, playMedia } = useContext(InteractionContext);
 useEffect(() => { const element = root.current; if (!element) return; const observer = new ResizeObserver(() => setScale(Math.min(element.clientWidth / 1600, element.clientHeight / 900))); observer.observe(element); return () => observer.disconnect(); }, []);
 const rendered = renderP5(index, state);
 const html = rendered.html.replaceAll('/media/', assetURL('/media/'));
 function activate(target: HTMLElement) {
  const button = target.closest<HTMLElement>('button'); if (!button) return;
  const name = button.dataset.p5Action;
  if (button.dataset.choice !== undefined) { change?.({ selection: Number(button.dataset.choice) }); return; }
  if (button.dataset.timbre !== undefined) { const n = Number(button.dataset.timbre); change?.({ timbreSelections: state.timbreSelections.includes(n) ? state.timbreSelections.filter(x => x !== n) : [...state.timbreSelections, n] }); return; }
  const patches: Record<string, Partial<typeof state>> = { 'revision-reveal': { revisionRevealed: true, phase: (['listen', 'compare', 'vote', 'explain'] as const)[Math.min(state.revisionRevealed ? ['listen', 'compare', 'vote', 'explain'].indexOf(state.phase) + 1 : 0, 3)] }, 'analysis-part': { revealed: !state.revealed }, 'back-analysis': { choice: false }, 'show-choices': { choice: true, phase: 'compare' }, 'begin-vote': { phase: 'vote' }, 'explain': { phase: 'explain' }, 'reveal': { revealed: true }, 'hide-reveal': { revealed: false, timbre: false }, 'choose-timbre': { timbre: true }, 'back-instrument': { timbre: false } };
  if (name?.startsWith('compare-')) { playMedia?.(youtube(name.slice(8))); return; }
  if (name === 'observe') next?.(); else if (name && patches[name]) change?.(patches[name]);
 }
 return <div ref={root} className="p5-host" style={{ '--p5-scale': scale } as CSSProperties}><div className="p5-stage" onClick={e => activate(e.target as HTMLElement)}><section className={'p5-content-stage ' + rendered.className} dangerouslySetInnerHTML={{ __html: html }} /></div></div>;
}
function P5Controls({ index, state, disabled, change, playMedia }: DeckControlsProps) {
 const revisionCount = state.revisionRevealed ? ['listen', 'compare', 'vote', 'explain'].indexOf(state.phase) + 1 : 0;
 const slide = deck.slides[index]; const track = slide.track as Track | undefined;
 return <section className="card"><h2>此頁教學互動</h2><div className="p5-control-buttons">
  {slide.kind === 'revision' && <button disabled={disabled || revisionCount === 4} onClick={() => change({ revisionRevealed: true, phase: (['listen', 'compare', 'vote', 'explain'] as const)[revisionCount] })}>{revisionCount === 4 ? '已全部揭示' : '揭示下一類'}</button>}
  {slide.kind === 'investigation' && <><button disabled={disabled} onClick={() => change({ choice: false })}>題目</button>{track === 'zheng' && <button disabled={disabled} onClick={() => change({ choice: false, revealed: !state.revealed })}>{state.revealed ? '開始' : '後半段'}</button>}<button disabled={disabled} onClick={() => change({ choice: true, phase: 'compare' })}>圖片</button><button disabled={disabled || !state.choice} onClick={() => change({ phase: 'explain' })}>說理由</button>{['A', 'B', 'C'].map((letter, i) => <button key={letter} disabled={disabled || !state.choice} aria-pressed={state.selection === i} onClick={() => change({ selection: i })}>{letter}</button>)}</>}
  {slide.kind === 'reveal' && track && deck.timbreOptions.byTrack[track].words.map((word, i) => <button key={word} disabled={disabled} aria-pressed={state.timbreSelections.includes(i)} onClick={() => change({ timbreSelections: state.timbreSelections.includes(i) ? state.timbreSelections.filter(n => n !== i) : [...state.timbreSelections, i] })}>{word}{state.timbreSelections.includes(i) ? ' ✓' : ''}</button>)}
  {slide.kind === 'comparison' && Object.entries(deck.tracks).map(([id, item]) => <button key={id} disabled={disabled} onClick={() => playMedia(youtube(id))}>{item.name}：重聽</button>)}
  <button disabled={disabled} onClick={() => change(initialInteraction())}>重設</button></div><p className="small">互動狀態與投影同步；換頁後返回保留此頁選擇。</p></section>;
}
export default { Slide: P5Slide, Controls: P5Controls } satisfies DeckPlugin;
