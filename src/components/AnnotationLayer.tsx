import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Point, Stroke, PointerState } from '../types/teaching';
import { uid } from '../types/teaching';
export type Tool = 'none'|'pointer'|'pen';
type Props = {slide:number;strokes:Stroke[];pointer:PointerState|null;tool?:Tool;disabled?:boolean;color?:string;onStroke?:(stroke:Stroke)=>void;onDraft?:(stroke:Stroke)=>void;onPointer?:(pointer:PointerState)=>void};
const coordinates=(event:PointerEvent<SVGSVGElement>):Point=>{const box=event.currentTarget.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(event.clientX-box.left)/box.width)),y:Math.max(0,Math.min(1,(event.clientY-box.top)/box.height))};};
export function AnnotationLayer({slide,strokes,pointer,tool='none',disabled=false,color='#e63946',onStroke,onDraft,onPointer}:Props){
 const surfaceRef=useRef<SVGSVGElement|null>(null);
 // Safari needs non-passive touch listeners to suppress page scrolling on SVG.
 useEffect(()=>{
  const surface=surfaceRef.current;
  if(!surface||tool==='none')return;
  const preventGesture=(event:TouchEvent)=>{if(event.cancelable)event.preventDefault();};
  surface.addEventListener('touchstart',preventGesture,{passive:false});
  surface.addEventListener('touchmove',preventGesture,{passive:false});
  return()=>{surface.removeEventListener('touchstart',preventGesture);surface.removeEventListener('touchmove',preventGesture);};
 },[tool]);
 const [draft,setDraft]=useState<Stroke|null>(null);const draftRef=useRef<Stroke|null>(null);
 const pressed=useRef<number|null>(null);const lastPoint=useRef<Point>({x:0,y:0});const lastPublish=useRef(0);
 const [clock,setClock]=useState(Date.now());const [localPointer,setLocalPointer]=useState<PointerState|null>(null);
 const publishRef=useRef(onPointer);publishRef.current=onPointer;
 useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),250);return()=>clearInterval(timer);},[]);
 useEffect(()=>{
  const timer=setInterval(()=>{if(tool==='pointer'&&pressed.current!==null&&!disabled)publishRef.current?.({...lastPoint.current,slide,active:true,expiresAt:Date.now()+2400});},1000);
  return()=>{clearInterval(timer);if(pressed.current!==null&&tool==='pointer')publishRef.current?.({...lastPoint.current,slide,active:false,expiresAt:Date.now()});pressed.current=null;};
 },[slide,tool,disabled]);
 useEffect(()=>{setDraft(null);draftRef.current=null;setLocalPointer(null);},[slide,tool,disabled]);
 function pointerValue(point:Point,active:boolean){return {...point,slide,active,expiresAt:Date.now()+2400};}
 function down(event:PointerEvent<SVGSVGElement>){
  if(disabled||tool==='none'||pressed.current!==null)return;
  event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);pressed.current=event.pointerId;
  const point=coordinates(event);lastPoint.current=point;
  if(tool==='pointer'){const value=pointerValue(point,true);setLocalPointer(value);onPointer?.(value);lastPublish.current=Date.now();}
  else{const stroke={id:uid(),points:[point],color,width:6};draftRef.current=stroke;setDraft(stroke);onDraft?.(stroke);lastPublish.current=Date.now();}
 }
 function move(event:PointerEvent<SVGSVGElement>){
  if(disabled||pressed.current!==event.pointerId)return;
  event.preventDefault();
  const point=coordinates(event);lastPoint.current=point;
  if(tool==='pointer'){const value=pointerValue(point,true);setLocalPointer(value);if(Date.now()-lastPublish.current>=80){onPointer?.(value);lastPublish.current=Date.now();}}
  else if(draftRef.current){
   const points=draftRef.current.points;const previous=points[points.length-1];
   if(Math.hypot(point.x-previous.x,point.y-previous.y)<.002)return;
   const nextPoints=points.length>=120?points.filter((_,i)=>i%2===0):points;
   const stroke={...draftRef.current,points:[...nextPoints,point]};draftRef.current=stroke;setDraft(stroke);
   if(Date.now()-lastPublish.current>=150){onDraft?.(stroke);lastPublish.current=Date.now();}
  }
 }
 function finish(event:PointerEvent<SVGSVGElement>,_cancelled=false){
  if(pressed.current!==event.pointerId)return;
  pressed.current=null;
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  if(tool==='pointer'){setLocalPointer(null);onPointer?.(pointerValue(lastPoint.current,false));}
  else{if(draftRef.current)onStroke?.(draftRef.current);draftRef.current=null;setDraft(null);}
 }
 const shown=tool==='pointer'&&localPointer?localPointer:pointer;
 const showPointer=shown?.active&&shown.slide===slide&&shown.expiresAt>clock;
 return <svg ref={surfaceRef} className={`annotation-layer ${tool!=='none'?'interactive-layer':''}`} viewBox="0 0 1600 900" preserveAspectRatio="none"
  aria-label={tool==='pointer'?'在預覽點選或拖曳以指示':tool==='pen'?'在預覽畫線或圈選':'投影片標記'}
  onPointerDown={down} onPointerMove={move} onPointerUp={event=>finish(event)} onPointerCancel={event=>finish(event,true)}
  onLostPointerCapture={event=>{if(pressed.current===event.pointerId)finish(event,true);}}>
  {[...strokes.filter(stroke=>stroke.id!==draft?.id),...(draft?[draft]:[])].map(stroke=>stroke.points.length===1?<circle key={stroke.id} cx={stroke.points[0].x*1600} cy={stroke.points[0].y*900} r={stroke.width/2} fill={stroke.color}/>:<polyline key={stroke.id} points={stroke.points.map(point=>`${point.x*1600},${point.y*900}`).join(' ')} fill="none" stroke={stroke.color} strokeWidth={stroke.width} strokeLinecap="round" strokeLinejoin="round"/>)}
  {showPointer&&<circle className="laser-point" cx={shown.x*1600} cy={shown.y*900} r="13" fill="#ef233c" stroke="white" strokeWidth="4"/>}
 </svg>;
}
