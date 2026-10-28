import { useEffect, useMemo, useState } from 'react';
import { assetURL } from '../utils/urls';
import type { Deck, DeckMedia, DeckPlugin, DeckSlide } from './types';
// Every folder with a deck.json is a lesson; the folder name is its presentation ID.
// Decks load on demand so each device only downloads the lesson it shows.
const decks = import.meta.glob<{ default: Record<string, unknown> }>(['./*/deck.json', '!./_*/deck.json']);
const plugins = import.meta.glob<{ default: DeckPlugin }>('./*/plugin.tsx');
const styles = import.meta.glob('./*/styles.css');
const folder = (path: string) => path.split('/')[1];
export const deckIds = Object.keys(decks).map(folder);
export const defaultPresentationId = 'g3d-pitter-patter-recorder-ag';
export const MAX_SLIDES = 100;
// Paths starting with ./ are relative to the deck's assetBase in public/.
export function deckAsset(path: string, base: string) {
 const resolved = path.startsWith('./') ? base.replace(/\/$/, '') + '/' + path.slice(2) : path;
 return assetURL(resolved);
}
function readSlide(raw: Record<string, unknown>, base: string): DeckSlide {
 const media = Array.isArray(raw.media) ? raw.media as DeckMedia[] : [];
 return { ...raw, id: String(raw.id), title: String(raw.title ?? ''), notes: String(raw.notes ?? ''), html: typeof raw.html === 'string' ? raw.html : undefined,
  media: media.map(item => ({ kind: item.kind, src: item.kind === 'youtube' ? item.src : (item.src.startsWith('./') ? base.replace(/\/$/, '') + '/' + item.src.slice(2) : item.src) })),
  actions: Array.isArray(raw.actions) ? raw.actions as DeckSlide['actions'] : [] };
}
const cache = new Map<string, Promise<Deck>>();
export function loadDeck(id: string): Promise<Deck> {
 if (!cache.has(id)) {
  const json = decks[`./${id}/deck.json`];
  if (!json) return Promise.reject(new Error('簡報不存在。'));
  const promise = Promise.all([json(), plugins[`./${id}/plugin.tsx`]?.(), styles[`./${id}/styles.css`]?.()]).then(([module, plugin]) => {
   const data = module.default; const assetBase = String(data.assetBase ?? '/media/');
   return { id, title: String(data.title ?? id), order: Number(data.order ?? 99), assetBase, viewClass: typeof data.viewClass === 'string' ? data.viewClass : undefined,
    slides: (data.slides as Record<string, unknown>[]).slice(0, MAX_SLIDES).map(slide => readSlide(slide, assetBase)), data, plugin: plugin?.default ?? {} };
  });
  promise.catch(() => cache.delete(id));
  cache.set(id, promise);
 }
 return cache.get(id)!;
}
export const loadAllDecks = () => Promise.all(deckIds.map(loadDeck)).then(list => list.sort((a, b) => a.order - b.order));
export function useDeck(id: string, slideOrder: number[] | null = null) {
 const [state, setState] = useState<{ id: string; deck: Deck | null; error: string }>({ id, deck: null, error: '' });
 useEffect(() => {
  let current = true;
  loadDeck(id).then(deck => { if (current) setState({ id, deck, error: '' }); }, error => { if (current) setState({ id, deck: null, error: error instanceof Error ? error.message : '未能載入簡報。' }); });
  return () => { current = false; };
 }, [id]);
 const ordered=useMemo(()=>state.deck&&slideOrder?{...state.deck,slides:slideOrder.map(index=>state.deck!.slides[index]).filter((slide):slide is DeckSlide=>!!slide)}:state.deck,[state.deck,JSON.stringify(slideOrder)]);
 return state.id === id ? {...state,deck:ordered} : { id, deck: null, error: '' };
}
export const clampSlide = (value: number, deck: Deck | null) => Math.max(0, Math.min((deck?.slides.length ?? MAX_SLIDES) - 1, Math.trunc(value)));
