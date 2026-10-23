import {useRef,useState} from 'react';
import type {PointerEvent,ReactNode} from 'react';
import {boundedMediaLayout,type MediaLayout} from '../types/teaching';
export function MediaPlacement({layout,editable,onLayout,children}:{layout:MediaLayout;editable:boolean;onLayout?:(layout:MediaLayout)=>void;children:ReactNode}){
 const [draft,setDraft]=useState<MediaLayout|null>(null);const latest=useRef<MediaLayout|null>(null);
 const drag=useRef<{x:number;y:number;bounds:DOMRect;layout:MediaLayout;resize:boolean}|null>(null);
 function down(event:PointerEvent<HTMLDivElement>){event.preventDefault();event.stopPropagation();event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:event.clientX,y:event.clientY,bounds:event.currentTarget.parentElement!.parentElement!.getBoundingClientRect(),layout,resize:(event.target as HTMLElement).dataset.resize==='true'};latest.current=null;}
 function move(event:PointerEvent<HTMLDivElement>){const origin=drag.current;if(!origin)return;event.preventDefault();const value=boundedMediaLayout({width:origin.layout.width+(origin.resize?(event.clientX-origin.x)/origin.bounds.width:0),x:origin.layout.x+(origin.resize?0:(event.clientX-origin.x)/origin.bounds.width),y:origin.layout.y+(origin.resize?0:(event.clientY-origin.y)/origin.bounds.height)});latest.current=value;setDraft(value);}
 function finish(event:PointerEvent<HTMLDivElement>){if(!drag.current)return;drag.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);if(latest.current)onLayout?.(latest.current);latest.current=null;setDraft(null);}
 const shown=draft??layout;
 return <div className="slide-media placed-media" style={{left:`${shown.x*100}%`,top:`${shown.y*100}%`,width:`${shown.width*100}%`}}>{children}{editable&&<div className="media-placement-handle" onPointerDown={down} onPointerMove={move} onPointerUp={finish} onPointerCancel={()=>{drag.current=null;latest.current=null;setDraft(null);}} aria-label="拖曳移動影片，拖右下角縮放"><span>拖曳移動影片</span><span className="media-placement-resize" data-resize="true">↘</span></div>}</div>;
}
