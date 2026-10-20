import { useCallback, useEffect, useRef, useState } from 'react';
import { saveAnnotations } from './teachingService';
import { MAX_STROKES } from '../types/teaching';
import type { Stroke } from '../types/teaching';
const signature = (strokes: Stroke[]) => strokes.map(stroke => `${stroke.id}:${stroke.points.length}`).join('|');
export type SyncState = 'synced' | 'syncing' | 'retrying';
// The iPad keeps its own copy of each slide's strokes and shows it immediately, so drawing
// never waits for the network. Only the newest copy is sent (one request at a time);
// failed sends are retried until they succeed, so a Wi-Fi blip does not lose strokes.
export function useAnnotationSync(id: string, slide: number, remote: Stroke[], connected: boolean) {
 const local = useRef(new Map<number, { strokes: Stroke[]; version: number; sent: number; savedAt: number }>());
 const [, redraw] = useState(0);
 const [sync, setSync] = useState<SyncState>('synced');
 const sending = useRef(false), retryTimer = useRef(0), failures = useRef(0);
 const online = useRef(connected); online.current = connected;
 const pending = () => [...local.current.entries()].filter(([, entry]) => entry.version !== entry.sent);
 const flush = useCallback(async () => {
  if (sending.current || !online.current) return;
  sending.current = true;
  try {
   for (let next = pending()[0]; next && online.current; next = pending()[0]) {
    const [index, entry] = next, version = entry.version;
    setSync('syncing');
    await saveAnnotations(id, index, entry.strokes);
    entry.sent = version; entry.savedAt = Date.now(); failures.current = 0;
    window.setTimeout(() => redraw(value => value + 1), 3100);
   }
   if (!pending().length) setSync('synced');
  } catch {
   failures.current++; setSync('retrying');
   clearTimeout(retryTimer.current);
   retryTimer.current = window.setTimeout(() => void flush(), Math.min(8000, 500 * 2 ** failures.current));
  } finally { sending.current = false; }
 }, [id]);
 useEffect(() => { if (connected) void flush(); }, [connected, flush]);
 useEffect(() => () => clearTimeout(retryTimer.current), []);
 useEffect(() => { local.current.clear(); setSync('synced'); }, [id]);
 // Once this slide is saved and the cloud copy has caught up (or 3 s have passed), follow the cloud again.
 let entry = local.current.get(slide);
 if (entry && entry.version === entry.sent && (signature(entry.strokes) === signature(remote) || Date.now() - entry.savedAt > 3000)) { local.current.delete(slide); entry = undefined; }
 const strokes = entry ? entry.strokes : remote;
 const change = useCallback((update: (strokes: Stroke[]) => Stroke[]) => {
  const current = local.current.get(slide);
  const base = current ? current.strokes : remote;
  const next = update(base);
  if (next === base) return;
  local.current.set(slide, { strokes: next, version: (current?.version ?? 0) + 1, sent: current?.sent ?? 0, savedAt: current?.savedAt ?? 0 });
  redraw(value => value + 1);
  void flush();
 }, [slide, remote, flush]);
 const draw = useCallback((stroke: Stroke) => change(strokes => {
  const at = strokes.findIndex(item => item.id === stroke.id);
  if (at >= 0) { const copy = [...strokes]; copy[at] = stroke; return copy; }
  return strokes.length >= MAX_STROKES ? strokes : [...strokes, stroke];
 }), [change]);
 const undo = useCallback(() => change(strokes => strokes.slice(0, -1)), [change]);
 const clear = useCallback(() => change(() => []), [change]);
 const full = strokes.length >= MAX_STROKES;
 return { strokes, sync, draw, undo, clear, full };
}
