import {useEffect,useRef,useState} from 'react';
import type {PointerEvent} from 'react';
import {timerRemaining,type ClassroomTimer} from '../types/teaching';
type Props={timer:ClassroomTimer;editable?:boolean;onLayout?:(layout:{x:number;y:number;width:number})=>void};
export function TimerOverlay({timer,editable=false,onLayout}:Props){
 const [,refresh]=useState(0);const [draft,setDraft]=useState<{x:number;y:number;width:number}|null>(null);
 const drag=useRef<{x:number;y:number;left:number;top:number;width:number;bounds:DOMRect;resize:boolean}|null>(null);
 useEffect(()=>{if(!timer.visible||!timer.running)return;const handle=window.setInterval(()=>refresh(n=>n+1),150);return()=>clearInterval(handle);},[timer.visible,timer.running]);
 if(!timer.visible)return null;
 const seconds=Math.ceil(timerRemaining(timer)),layout=draft??timer;
 function down(event:PointerEvent<HTMLDivElement>){if(!editable)return;event.preventDefault();event.stopPropagation();const bounds=event.currentTarget.parentElement!.getBoundingClientRect();event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:event.clientX,y:event.clientY,left:timer.x,top:timer.y,width:timer.width,bounds,resize:(event.target as HTMLElement).dataset.resize==='true'};}
 function move(event:PointerEvent<HTMLDivElement>){const origin=drag.current;if(!origin)return;event.preventDefault();const width=origin.resize?Math.max(.15,Math.min(.5,origin.width+(event.clientX-origin.x)/origin.bounds.width)):origin.width;setDraft({width,x:Math.max(0,Math.min(1-width,origin.left+(origin.resize?0:(event.clientX-origin.x)/origin.bounds.width))),y:Math.max(0,Math.min(.98-width*.75,origin.top+(origin.resize?0:(event.clientY-origin.y)/origin.bounds.height)))});}
 function finish(event:PointerEvent<HTMLDivElement>){if(!drag.current)return;event.stopPropagation();drag.current=null;if(draft)onLayout?.(draft);setDraft(null);}
 return <div className={`classroom-timer ${editable?'timer-editable':''} ${seconds===0?'timer-expired':''}`} style={{left:`${layout.x*100}%`,top:`${layout.y*100}%`,width:`${layout.width*100}%`,fontSize:`${layout.width*23}cqw`}} onPointerDown={down} onPointerMove={move} onPointerUp={finish} onPointerCancel={()=>{drag.current=null;setDraft(null);}} aria-label={`倒數 ${Math.floor(seconds/60)} 分 ${seconds%60} 秒`}>
 <span>{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</span>{seconds===0&&<small>時間到</small>}{editable&&<span className="timer-resize" data-resize="true" aria-label="拖曳調整大小">↘</span>}</div>;
}
