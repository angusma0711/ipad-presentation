import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Point, Stroke, PointerState } from '../types/teaching';
import { uid, simplify, smoothPath, roundPoint, MAX_POINTS } from '../types/teaching';
export type Tool = 'none'|'pointer'|'pen'|'erase';
type Props = {slide:number;strokes:Stroke[];pointer:PointerState|null;tool?:Tool;disabled?:boolean;color?:string;onStroke?:(stroke:Stroke)=>void;onDraft?:(stroke:Stroke)=>void;onPointer?:(pointer:PointerState)=>void;inkHost?:HTMLElement|null;pageInk?:boolean};
type Surface = SVGSVGElement | HTMLCanvasElement;
const coordinates=(event:ReactPointerEvent<Surface>):Point=>{const box=event.currentTarget.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(event.clientX-box.left)/box.width)),y:Math.max(0,Math.min(1,(event.clientY-box.top)/box.height))};};
function frameOf(host: HTMLElement | null) {
 if (!host) return { w: 1600, h: 900 };
 const w = Number(host.dataset.pageW), h = Number(host.dataset.pageH);
 return Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0 ? { w, h } : { w: 1600, h: 900 };
}
// Page ink is drawn on a portrait sheet inside a 16:9 slide, so the same stored width would look hairline. Scale it up, and make the eraser wider than the pen.
function inkWidth(stroke: Stroke, viewW: number, page: boolean) {
 return stroke.width * (viewW / 1600) * (page ? 3 : 1) * (stroke.erase ? 2.6 : 1);
}
function bitmapSize(frame: { w: number; h: number }) {
 const scale = Math.min(2, 2200 / Math.max(frame.w, frame.h));
 return { w: Math.max(1, Math.round(frame.w * scale)), h: Math.max(1, Math.round(frame.h * scale)) };
}
// Canvas keeps destination-out inside the ink bitmap. An SVG blend would also erase the worksheet photo.
function paintCanvas(canvas: HTMLCanvasElement, strokes: Stroke[], frame: { w: number; h: number }, page: boolean, pointer: { x: number; y: number } | null) {
 const size = bitmapSize(frame);
 if (canvas.width !== size.w || canvas.height !== size.h) { canvas.width = size.w; canvas.height = size.h; }
 const ctx = canvas.getContext('2d');
 if (!ctx) return;
 ctx.clearRect(0, 0, size.w, size.h);
 ctx.lineCap = 'round';
 ctx.lineJoin = 'round';
 for (const stroke of strokes) {
  const width = inkWidth(stroke, frame.w, page) * (size.w / frame.w);
  ctx.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over';
  ctx.strokeStyle = stroke.erase ? '#000' : stroke.color;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = width;
  const pts = stroke.points;
  if (pts.length === 1) { ctx.beginPath(); ctx.arc(pts[0].x * size.w, pts[0].y * size.h, width / 2, 0, Math.PI * 2); ctx.fill(); continue; }
  ctx.beginPath();
  ctx.moveTo(pts[0].x * size.w, pts[0].y * size.h);
  if (pts.length < 3) { for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x * size.w, pts[i].y * size.h); }
  else {
   for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i].x * size.w, pts[i].y * size.h, (pts[i].x + pts[i + 1].x) / 2 * size.w, (pts[i].y + pts[i + 1].y) / 2 * size.h);
   ctx.lineTo(pts[pts.length - 1].x * size.w, pts[pts.length - 1].y * size.h);
  }
  ctx.stroke();
 }
 ctx.globalCompositeOperation = 'source-over';
 if (pointer) {
  ctx.fillStyle = '#ef233c'; ctx.strokeStyle = '#fff'; ctx.lineWidth = size.w * 0.004;
  ctx.beginPath(); ctx.arc(pointer.x * size.w, pointer.y * size.h, size.w * 0.012, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
 }
}
export function AnnotationLayer({slide,strokes,pointer,tool='none',disabled=false,color='#e63946',onStroke,onDraft,onPointer,inkHost=null,pageInk=false}:Props){
 const canvasRef=useRef<HTMLCanvasElement|null>(null);
 const svgRef=useRef<SVGSVGElement|null>(null);
 const activeSurface=()=>useCanvas?canvasRef.current:svgRef.current;
 const drawing=tool==='pen'||tool==='erase';
 const [draft,setDraft]=useState<Stroke|null>(null);const draftRef=useRef<Stroke|null>(null);
 const pressed=useRef<number|null>(null);const lastPoint=useRef<Point>({x:0,y:0});const lastPublish=useRef(0);
 const [clock,setClock]=useState(Date.now());const [localPointer,setLocalPointer]=useState<PointerState|null>(null);
 const publishRef=useRef(onPointer);publishRef.current=onPointer;
 const frame=frameOf(pageInk?inkHost:null);
 const shown=tool==='pointer'&&localPointer?localPointer:pointer;
 const showPointer=!!(shown?.active&&shown.slide===slide&&shown.expiresAt>clock);
 const visible=[...strokes.filter(stroke=>stroke.id!==draft?.id),...(draft?[draft]:[])];
 const useCanvas=pageInk||tool==='erase'||visible.some(stroke=>stroke.erase);
 useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),250);return()=>clearInterval(timer);},[]);
 useEffect(()=>{
  const surface=activeSurface();
  if(!surface||(!drawing&&tool!=='pointer'))return;
  const preventGesture=(event:Event)=>{if(event.cancelable)event.preventDefault();};
  surface.addEventListener('touchstart',preventGesture,{passive:false});
  surface.addEventListener('touchmove',preventGesture,{passive:false});
  return()=>{surface.removeEventListener('touchstart',preventGesture);surface.removeEventListener('touchmove',preventGesture);};
 },[tool,drawing,inkHost,useCanvas]);
 useEffect(()=>{
  const timer=setInterval(()=>{if(tool==='pointer'&&pressed.current!==null&&!disabled)publishRef.current?.({...lastPoint.current,slide,active:true,expiresAt:Date.now()+2400});},1000);
  return()=>{clearInterval(timer);if(pressed.current!==null&&tool==='pointer')publishRef.current?.({...lastPoint.current,slide,active:false,expiresAt:Date.now()});const active=pressed.current;pressed.current=null;const surface=activeSurface();if(active!==null&&surface?.hasPointerCapture(active))surface.releasePointerCapture(active);};
 },[slide,tool,disabled]);
 useEffect(()=>{setDraft(null);draftRef.current=null;setLocalPointer(null);},[slide,tool,disabled]);
 useLayoutEffect(()=>{
  if(!useCanvas||!canvasRef.current)return;
  paintCanvas(canvasRef.current,visible,frame,pageInk,showPointer&&shown?shown:null);
 });
 function pointerValue(point:Point,active:boolean){return {...point,slide,active,expiresAt:Date.now()+2400};}
 function down(event:ReactPointerEvent<Surface>){
  if(disabled||(!drawing&&tool!=='pointer')||pressed.current!==null)return;
  event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);pressed.current=event.pointerId;
  const point=coordinates(event);lastPoint.current=point;
  if(tool==='pointer'){const value=pointerValue(point,true);setLocalPointer(value);onPointer?.(value);lastPublish.current=Date.now();}
  else{const stroke:Stroke=tool==='erase'?{id:uid(),points:[roundPoint(point)],color:'#111111',width:10,erase:true}:{id:uid(),points:[roundPoint(point)],color,width:6};draftRef.current=stroke;setDraft(stroke);onDraft?.(stroke);lastPublish.current=Date.now();}
 }
 function move(event:ReactPointerEvent<Surface>){
  if(disabled||pressed.current!==event.pointerId)return;
  event.preventDefault();
  const point=coordinates(event);lastPoint.current=point;
  if(tool==='pointer'){const value=pointerValue(point,true);setLocalPointer(value);if(Date.now()-lastPublish.current>=80){onPointer?.(value);lastPublish.current=Date.now();}}
  else if(draftRef.current){
   const box=event.currentTarget.getBoundingClientRect();
   const samples=(event.nativeEvent.getCoalescedEvents?.()??[]).map(sample=>({x:Math.max(0,Math.min(1,(sample.clientX-box.left)/box.width)),y:Math.max(0,Math.min(1,(sample.clientY-box.top)/box.height))}));
   let points=draftRef.current.points;
   for(const sample of samples.length?samples:[point]){const previous=points[points.length-1];if(Math.hypot(sample.x-previous.x,sample.y-previous.y)>=.0015)points=[...points,roundPoint(sample)];}
   if(points===draftRef.current.points)return;
   if(points.length>MAX_POINTS)points=simplify(points,Math.round(MAX_POINTS*.8));
   const stroke={...draftRef.current,points};draftRef.current=stroke;setDraft(stroke);
   if(Date.now()-lastPublish.current>=70){onDraft?.(stroke);lastPublish.current=Date.now();}
  }
 }
 function finish(event:ReactPointerEvent<Surface>){
  if(pressed.current!==event.pointerId)return;
  pressed.current=null;
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  if(tool==='pointer'){setLocalPointer(null);onPointer?.(pointerValue(lastPoint.current,false));}
  else{if(draftRef.current)onStroke?.(draftRef.current);draftRef.current=null;setDraft(null);}
 }
 if(pageInk&&!inkHost)return null;
 const handlers={onPointerDown:down,onPointerMove:move,onPointerUp:finish,onPointerCancel:finish,onLostPointerCapture:(event:ReactPointerEvent<Surface>)=>{if(pressed.current===event.pointerId)finish(event);}};
 const label=tool==='pointer'?'在預覽點選或拖曳以指示':tool==='erase'?'在預覽擦除筆跡':tool==='pen'?'在預覽畫線或圈選':'投影片標記';
 const surface=useCanvas
  ? <canvas ref={canvasRef} className={`annotation-layer ${drawing||tool==='pointer'?'interactive-layer':''} ${tool==='erase'?'erase-layer':''}`} aria-label={label} {...handlers}/>
  : <svg ref={svgRef} className={`annotation-layer ${drawing||tool==='pointer'?'interactive-layer':''}`} viewBox={`0 0 ${frame.w} ${frame.h}`} preserveAspectRatio="none" aria-label={label} {...handlers}>
   {visible.map(stroke=>stroke.points.length===1
    ? <circle key={stroke.id} cx={stroke.points[0].x*frame.w} cy={stroke.points[0].y*frame.h} r={inkWidth(stroke,frame.w,false)/2} fill={stroke.color}/>
    : <path key={stroke.id} d={smoothPath(stroke.points,frame.w,frame.h)} fill="none" stroke={stroke.color} strokeWidth={inkWidth(stroke,frame.w,false)} strokeLinecap="round" strokeLinejoin="round"/>)}
   {showPointer&&shown&&<circle className="laser-point" cx={shown.x*frame.w} cy={shown.y*frame.h} r="13" fill="#ef233c" stroke="white" strokeWidth="4"/>}
  </svg>;
 return pageInk&&inkHost?createPortal(surface,inkHost):surface;
}
