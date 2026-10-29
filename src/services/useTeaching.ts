import {readViewport} from '../types/viewport';
import {readInteraction} from '../types/interaction';
import type { SlideAction } from '../components/ActionContext';
import { useEffect, useState } from 'react';
import { watchTeaching, readGroups } from './teachingService';
import { readTimer, validStrokes } from '../types/teaching';
import type { MediaConfig, MediaFeedback, PointerState } from '../types/teaching';
function useDocument(id:string,key:string,enabled=true) {
 const token=id+':'+key;
 const [stored,setStored]=useState<{token:string;data:Record<string,unknown>|null}>({token,data:null});
 const [retry,setRetry]=useState(0);
 const [error,setError]=useState('');
 useEffect(()=>{
  let disposed=false;let stop:(()=>void)|undefined;
  setStored({token,data:null});setError('');
  if(!enabled)return;
  const online=()=>setRetry(value=>value+1);window.addEventListener('online',online);
  watchTeaching(id,key,value=>{if(!disposed){setStored({token,data:value});setError('');}},failure=>{if(!disposed)setError(failure.message);})
   .then(unsubscribe=>{if(disposed)unsubscribe();else stop=unsubscribe;}).catch(failure=>{if(!disposed)setError(String(failure.message ?? failure));});
  return()=>{disposed=true;stop?.();window.removeEventListener('online',online);};
 },[id,key,retry,enabled]);
 return {data:stored.token===token?stored.data:null,error};
}
export function useTeaching(id:string,slide:number) {
 const viewport=useDocument(id,`viewport-${slide}`);
 const mediaLayout=useDocument(id,`media-layout-${slide}`);
 const timer=useDocument(id,'timer');
 const groups=useDocument(id,'groups');const pointer=useDocument(id,'pointer');
 const annotations=useDocument(id,`annotations-${slide}`);const media=useDocument(id,`media-${slide}`);
 const interaction=useDocument(id,`interaction-${slide}`);
 const action=useDocument(id,`action-${slide}`);
 const feedback=useDocument(id,`feedback-${slide}`);
 const rawPointer=pointer.data;
 const validPointer=rawPointer && typeof rawPointer.active==='boolean' && Number.isInteger(rawPointer.slide)
  && Number.isFinite(rawPointer.x) && Number.isFinite(rawPointer.y) && Number.isFinite(rawPointer.expiresAt)
  && Number(rawPointer.x)>=0 && Number(rawPointer.x)<=1 && Number(rawPointer.y)>=0 && Number(rawPointer.y)<=1;
 const rawMedia=media.data;
 const validMedia=rawMedia && ['audio','video','youtube'].includes(String(rawMedia.kind)) && typeof rawMedia.src==='string'
  && typeof rawMedia.commandId==='string' && ['play','pause','restart'].includes(String(rawMedia.action)) && Number.isFinite(rawMedia.commandAt);
 const rawLayout=mediaLayout.data;
 const validLayout=rawLayout&&[rawLayout.x,rawLayout.y,rawLayout.width].every(value=>typeof value==='number'&&Number.isFinite(value))&&Number(rawLayout.width)>=.3&&Number(rawLayout.width)<=1&&Number(rawLayout.x)>=0&&Number(rawLayout.x)<=1-Number(rawLayout.width)&&Number(rawLayout.y)>=0&&Number(rawLayout.y)<=1-Number(rawLayout.width);
 return {viewport:readViewport(viewport.data),mediaLayout:validLayout?rawLayout as unknown as import('../types/teaching').MediaLayout:undefined,timer:readTimer(timer.data),interaction:readInteraction(interaction.data),action:action.data as SlideAction|null,groups:readGroups(groups.data),pointer:validPointer?rawPointer as PointerState:null,
  strokes:validStrokes(annotations.data?.strokes),media:validMedia?rawMedia as MediaConfig:null,
  feedback:feedback.data as MediaFeedback|null,error:[viewport,mediaLayout,timer,groups,pointer,annotations,media,feedback,action,interaction].map(item=>item.error).find(Boolean)??''};
}
