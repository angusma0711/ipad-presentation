import {useEffect,useRef,useState} from 'react';
import {fastWrite} from './fastWrite';
import {clampViewport,type SlideViewport} from '../types/viewport';
// Serialize and coalesce gestures: a slow network cannot create an unbounded queue.
export function useViewportSync(id:string,slide:number,remote:SlideViewport,disabled:boolean){
 const [local,setLocal]=useState(remote),[error,setError]=useState('');
 const latest=useRef(remote);latest.current=remote;
 const scope=useRef(0),pending=useRef<SlideViewport|null>(null),running=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{scope.current++;pending.current=null;running.current=false;if(timer.current)clearTimeout(timer.current);timer.current=null;setLocal(latest.current);setError('');return()=>{scope.current++;pending.current=null;if(timer.current)clearTimeout(timer.current);};},[id,slide]);
 useEffect(()=>{if(!running.current&&!pending.current)setLocal(remote);},[remote.scale,remote.x,remote.y]);
 useEffect(()=>{if(disabled){pending.current=null;if(timer.current)clearTimeout(timer.current);timer.current=null;setLocal(latest.current);}},[disabled]);
 async function flush(){
  if(running.current||disabled||!pending.current)return;
  const generation=scope.current;const next=pending.current;pending.current=null;running.current=true;
  try{await fastWrite(`sessions/${id}/teaching/viewport-${slide}`,next);if(generation===scope.current)setError('');}
  catch{if(generation===scope.current){pending.current=null;setLocal(latest.current);setError('縮放未同步，請檢查連線後重試。');}}
  finally{if(generation===scope.current){running.current=false;if(pending.current)timer.current=setTimeout(()=>{timer.current=null;void flush();},150);}}
 }
 function change(value:SlideViewport){if(disabled)return;const next=clampViewport(value);setLocal(next);pending.current=next;if(!running.current&&!timer.current)timer.current=setTimeout(()=>{timer.current=null;void flush();},150);}
 return {viewport:local,change,error};
}
