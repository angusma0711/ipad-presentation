import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useMatch } from 'react-router-dom';
import type { SlideAction } from '../../components/ActionContext';
import { InkHostSetter } from '../../components/InkHostContext';
import { deckAsset } from '../registry';
import type { Deck, DeckControlsProps, DeckPlugin } from '../types';

type Box = { x: number; y: number; w: number; h: number };
type Point = { x: number; y: number };
const FULL: Box = { x: 0, y: 0, w: 1, h: 1 };
const ZOOM = /^z-(\d{4})-(\d{4})-(\d{4})-(\d{4})$/;

function regionOf(action: string | undefined): Box {
 if (action === 'view-top') return { x: 0, y: 0, w: 1, h: 0.5 };
 if (action === 'view-bottom') return { x: 0, y: 0.5, w: 1, h: 0.5 };
 const match = ZOOM.exec(action ?? '');
 if (!match) return FULL;
 const [x, y, w, h] = match.slice(1).map(part => Number(part) / 9999);
 if (w < 0.05 || h < 0.05 || x < 0 || y < 0) return FULL;
 const left = Math.min(x, 1);
 const top = Math.min(y, 1);
 return { x: left, y: top, w: Math.min(w, 1 - left), h: Math.min(h, 1 - top) };
}

function encodeZoom(box: Box) {
 const n = (value: number) => String(Math.max(0, Math.min(9999, Math.round(value * 9999)))).padStart(4, '0');
 return `z-${n(box.x)}-${n(box.y)}-${n(box.w)}-${n(box.h)}`;
}

// Fit the chosen page region inside the viewport without cropping that region or stretching the photo.
function place(view: { w: number; h: number }, pageAspect: number, region: Box) {
 if (view.w < 2 || view.h < 2) return { left: 0, top: 0, width: 0, height: 0 };
 const regionAspect = (region.w / region.h) * pageAspect;
 const viewAspect = view.w / view.h;
 const dispW = regionAspect > viewAspect ? view.w : view.h * regionAspect;
 const dispH = regionAspect > viewAspect ? view.w / regionAspect : view.h;
 const width = dispW / region.w;
 const height = dispH / region.h;
 return {
  left: (view.w - dispW) / 2 - region.x * width,
  top: (view.h - dispH) / 2 - region.y * height,
  width,
  height,
 };
}

function WorksheetSlide({ deck, index, preview = false, action = null }: { deck: Deck; index: number; passive?: boolean; preview?: boolean; action?: SlideAction | null }) {
 const page = deck.slides[index];
 const pageWidth = Number(page.pageWidth);
 const pageHeight = Number(page.pageHeight);
 const setInkHost = useContext(InkHostSetter);
 const routePreview = useMatch('/preview/:deckId');
 const canPick = preview || !!routePreview;
 const picking = action?.action === 'view-pick' && canPick;
 const region = action?.action === 'view-pick' ? FULL : regionOf(action?.action);
 const viewportRef = useRef<HTMLDivElement>(null);
 const sheetRef = useRef<HTMLDivElement>(null);
 const [viewSize, setViewSize] = useState({ w: 0, h: 0 });
 const [drag, setDrag] = useState<{ a: Point; b: Point } | null>(null);
 const dragRef = useRef<{ a: Point; b: Point } | null>(null);
 const hostRef = useCallback((node: HTMLDivElement | null) => { setInkHost(node); }, [setInkHost]);
 useLayoutEffect(() => {
  const node = viewportRef.current;
  if (!node) return;
  const measure = () => setViewSize({ w: node.clientWidth, h: node.clientHeight });
  measure();
  const observer = new ResizeObserver(measure);
  observer.observe(node);
  return () => observer.disconnect();
 }, [index]);
 useEffect(() => { setDrag(null); }, [index, action?.commandId]);
 const box = place(viewSize, pageWidth / pageHeight, region);
 function pagePoint(event: ReactPointerEvent<HTMLDivElement>): Point | null {
  const sheet = sheetRef.current?.getBoundingClientRect();
  if (!sheet || sheet.width < 1 || sheet.height < 1) return null;
  return {
   x: Math.max(0, Math.min(1, (event.clientX - sheet.left) / sheet.width)),
   y: Math.max(0, Math.min(1, (event.clientY - sheet.top) / sheet.height)),
  };
 }
 function pickDown(event: ReactPointerEvent<HTMLDivElement>) {
  const point = pagePoint(event);
  if (!point) return;
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
  dragRef.current = { a: point, b: point };
  setDrag(dragRef.current);
 }
 function pickMove(event: ReactPointerEvent<HTMLDivElement>) {
  if (!dragRef.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
  const point = pagePoint(event);
  if (!point) return;
  event.preventDefault();
  dragRef.current = { a: dragRef.current.a, b: point };
  setDrag(dragRef.current);
 }
 function pickUp(event: ReactPointerEvent<HTMLDivElement>) {
  if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  const current = dragRef.current;
  const point = pagePoint(event);
  dragRef.current = null;
  setDrag(null);
  if (!point || !current) return;
  const x = Math.min(current.a.x, point.x);
  const y = Math.min(current.a.y, point.y);
  const w = Math.abs(point.x - current.a.x);
  const h = Math.abs(point.y - current.a.y);
  if (w < 0.05 || h < 0.05) return;
  window.dispatchEvent(new CustomEvent('nv-page-zoom', { detail: { slideId: page.id, region: { x, y, w, h } } }));
 }
 return <div className="nv-viewport" ref={viewportRef} data-view={action?.action ?? 'view-full'}>
  <div className="nv-sheet" ref={sheetRef} style={box}>
   <img src={deckAsset(String(page.image), deck.assetBase)} alt={page.title} width={pageWidth} height={pageHeight} draggable={false} />
   <div ref={hostRef} className="nv-ink-host" data-page-w={pageWidth} data-page-h={pageHeight} />
   {picking && <div className="nv-pick" aria-label="拖曳矩形以放大該範圍" onPointerDown={pickDown} onPointerMove={pickMove} onPointerUp={pickUp} onPointerCancel={pickUp}>
    {drag && <div className="nv-pick-rect" style={{ left: `${Math.min(drag.a.x, drag.b.x) * 100}%`, top: `${Math.min(drag.a.y, drag.b.y) * 100}%`, width: `${Math.abs(drag.a.x - drag.b.x) * 100}%`, height: `${Math.abs(drag.a.y - drag.b.y) * 100}%` }} />}
   </div>}
  </div>
 </div>;
}

function Controls({ deck, index, disabled, sendAction, action }: DeckControlsProps) {
 const page = deck.slides[index];
 const current = action?.action ?? '';
 const mode = current === 'view-top' || current === 'view-bottom' || current === 'view-pick' ? current : ZOOM.test(current) ? 'zoom' : 'view-full';
 useEffect(() => {
  const onZoom = (event: Event) => {
   const detail = (event as CustomEvent<{ slideId: string; region: Box }>).detail;
   if (!detail || detail.slideId !== page.id) return;
   sendAction?.(encodeZoom(detail.region));
  };
  window.addEventListener('nv-page-zoom', onZoom);
  return () => window.removeEventListener('nv-page-zoom', onZoom);
 }, [page.id, sendAction]);
 return <section className="card"><h2>投影頁面</h2>
  <div className="tool-bar" role="group" aria-label="頁面範圍">
   <button type="button" aria-pressed={mode === 'view-full'} disabled={disabled} onClick={() => sendAction?.('view-full')}>全頁</button>
   <button type="button" aria-pressed={mode === 'view-top'} disabled={disabled} onClick={() => sendAction?.('view-top')}>上半頁</button>
   <button type="button" aria-pressed={mode === 'view-bottom'} disabled={disabled} onClick={() => sendAction?.('view-bottom')}>下半頁</button>
   <button type="button" aria-pressed={mode === 'view-pick'} disabled={disabled} onClick={() => sendAction?.('view-pick')}>框選放大</button>
  </div>
  <p className="small">{mode === 'view-pick' ? '在預覽上由一角拖到對角。放開後，該範圍放大到投影，頁面不會被拉變形。' : mode === 'zoom' ? '正在放大所選範圍。可再框選，或按全頁、上半頁、下半頁返回。' : '上半頁、下半頁和放大都只是把原頁拉近，不會裁走整頁內容。畫線、圈選、擦除、復原和清除在「畫筆」。'}</p>
 </section>;
}

export default { Slide: WorksheetSlide, Controls } satisfies DeckPlugin;
