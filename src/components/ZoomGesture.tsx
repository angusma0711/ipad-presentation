import {useEffect,useRef} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';
import {clampViewport,type SlideViewport} from '../types/viewport';
type Point={x:number;y:number};
export function ZoomGesture({value,onChange}:{value:SlideViewport;onChange:(value:SlideViewport)=>void}){
 const surface=useRef<HTMLDivElement>(null),points=useRef(new Map<number,Point>()),base=useRef<{distance:number;mid:Point;value:SlideViewport}|null>(null),current=useRef(value);current.current=value;
 useEffect(()=>{const node=surface.current;if(!node)return;const prevent=(event:Event)=>{if(event.cancelable)event.preventDefault();};for(const name of ['touchstart','touchmove','gesturestart','gesturechange'])node.addEventListener(name,prevent,{passive:false});return()=>{for(const name of ['touchstart','touchmove','gesturestart','gesturechange'])node.removeEventListener(name,prevent);points.current.clear();base.current=null;};},[]);
 function position(event:ReactPointerEvent<HTMLDivElement>){const box=event.currentTarget.getBoundingClientRect();return {x:(event.clientX-box.left)/box.width,y:(event.clientY-box.top)/box.height};}
 function snapshot(){const p=[...points.current.values()];if(p.length<2){base.current=null;return;}const box=surface.current!.getBoundingClientRect();base.current={distance:Math.hypot((p[0].x-p[1].x)*box.width,(p[0].y-p[1].y)*box.height),mid:{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2},value:current.current};}
 function down(event:ReactPointerEvent<HTMLDivElement>){event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);points.current.set(event.pointerId,position(event));snapshot();}
 function move(event:ReactPointerEvent<HTMLDivElement>){if(!points.current.has(event.pointerId))return;event.preventDefault();const previous=points.current.get(event.pointerId)!;const point=position(event);points.current.set(event.pointerId,point);const p=[...points.current.values()],b=base.current;
  if(p.length>=2&&b&&b.distance>1){const box=event.currentTarget.getBoundingClientRect();const distance=Math.hypot((p[0].x-p[1].x)*box.width,(p[0].y-p[1].y)*box.height);const scale=Math.max(1,Math.min(4,b.value.scale*distance/b.distance));const mid={x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2};onChange(clampViewport({scale,x:mid.x-(b.mid.x-b.value.x)*scale/b.value.scale,y:mid.y-(b.mid.y-b.value.y)*scale/b.value.scale}));}
  else if(event.pointerType==='mouse')onChange(clampViewport({...current.current,x:current.current.x+point.x-previous.x,y:current.current.y+point.y-previous.y}));
 }
 function up(event:ReactPointerEvent<HTMLDivElement>){points.current.delete(event.pointerId);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);snapshot();}
 return <div ref={surface} className="slide-zoom-gesture" aria-label="雙指捏合縮放、雙指拖動投影片" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={()=>{points.current.clear();base.current=null;}}/>;
}
