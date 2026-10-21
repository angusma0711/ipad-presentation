import {readInteraction} from '../types/interaction';
import { fastWrite } from './fastWrite';
import { doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { database } from './firebase';
import { readTimer, timerRemaining, defaultGroups, uid } from '../types/teaching';
import type { GroupsState, Group, Stroke, PointerState, MediaConfig, MediaAction, MediaFeedback } from '../types/teaching';
const reference = async (id:string, key:string) => doc(await database(),'sessions',id,'teaching',key);
export async function watchTeaching(id:string,key:string,receive:(data:Record<string,unknown>|null)=>void,fail:(error:Error)=>void) {
 return onSnapshot(await reference(id,key), snapshot => receive(snapshot.exists()?snapshot.data():null), fail);
}
// Transactions fail offline instead of queuing stale classroom actions for reconnection.
async function changeTeaching(id:string,key:string,change:(data:Record<string,unknown>|null)=>Record<string,unknown>) {
 const ref = await reference(id,key); const db = await database();
 await runTransaction(db,async tx => {const snapshot=await tx.get(ref);tx.set(ref,{...change(snapshot.exists()?snapshot.data():null),updatedAt:serverTimestamp()});});
}
export const MAX_GROUPS = 8;
function groupData(state: GroupsState): Record<string, unknown> {
 return {visible:state.visible,...Object.fromEntries(state.groups.map((group,index)=>[`g${index}`,group]))};
}
export async function changeGroup(id:string,index:number,change:{delta:number}|{name:string}) {
 await changeTeaching(id,'groups',data=>{
  const state=readGroups(data);const groups=state.groups.map(group=>({...group}));
  if (!Number.isInteger(index) || !groups[index]) throw new Error('小組已變更，請重新選擇。');
  if ('delta' in change) groups[index].points=Math.max(0,Math.min(9999,groups[index].points+change.delta));
  else {const name=change.name.trim();if(!name || name.length>24)throw new Error('組名需要 1–24 個字。');groups[index].name=name;}
  return groupData({...state,groups});
 });
}
export async function addGroup(id:string) {
 await changeTeaching(id,'groups',data=>{
  const state=readGroups(data);
  if(state.groups.length>=MAX_GROUPS)throw new Error(`最多 ${MAX_GROUPS} 組。`);
  let number=1;while(state.groups.some(group=>group.name===`第 ${number} 組`))number++;
  return groupData({...state,groups:[...state.groups,{name:`第 ${number} 組`,points:0}]});
 });
}
export async function removeGroup(id:string,index:number) {
 await changeTeaching(id,'groups',data=>{
  const state=readGroups(data);
  if(state.groups.length<=1)throw new Error('最少保留 1 組。');
  if(!Number.isInteger(index)||!state.groups[index])throw new Error('小組已變更，請重新選擇。');
  return groupData({...state,groups:state.groups.filter((_,i)=>i!==index)});
 });
}
export function readGroups(data:Record<string,unknown>|null):GroupsState {
 if(!data)return defaultGroups();
 const groups=Array.from({length:MAX_GROUPS},(_,i)=>data[`g${i}`]).filter(group=>group!==undefined) as Group[];
 if(!groups.length||groups.some(group=>!group||typeof group.name!=='string'||!group.name.trim()||group.name.length>24||!Number.isInteger(group.points)||group.points<0||group.points>9999))return defaultGroups();
 return {groups,visible:data.visible===true};
}
export async function setScoresVisible(id:string,visible:boolean) {
 await changeTeaching(id,'groups',data=>groupData({...readGroups(data),visible}));
}
export async function setPointer(id:string,pointer:PointerState) {await fastWrite(`sessions/${id}/teaching/pointer`,{...pointer});}
// Writes the whole stroke list in one request (no read first), so the newest drawing always wins.
export async function saveAnnotations(id:string,slide:number,strokes:Stroke[]) {await fastWrite(`sessions/${id}/teaching/annotations-${slide}`,{strokes});}
export async function configureMedia(id:string,slide:number,kind:MediaConfig['kind'],src:string) {
 await changeTeaching(id,`media-${slide}`,()=>({kind,src,commandId:uid(),action:'pause',commandAt:Date.now()}));
}
export async function commandMedia(id:string,slide:number,action:MediaAction) {
 await changeTeaching(id,`media-${slide}`,data=>{
  if(!data)throw new Error('請先為這張投影片設定媒體。');
  return {...data,commandId:uid(),action,commandAt:Date.now()};
 });
}
export async function reportMedia(id:string,slide:number,feedback:MediaFeedback) {
 await changeTeaching(id,`feedback-${slide}`,()=>({...feedback}));
}

export async function commandSlideAction(id:string,slide:number,action:string){await changeTeaching(id,`action-${slide}`,()=>({commandId:uid(),commandAt:Date.now(),action}));}

export async function changeInteraction(id:string,slide:number,patch:Partial<import('../types/interaction').LessonInteraction>){await changeTeaching(id,`interaction-${slide}`,data=>({...readInteraction(data),...patch}));}

export async function controlTimer(id:string,action:'start'|'pause'|'reset'|'configure'|'layout'|'visible',value:Record<string,number|boolean>={}) {
 await changeTeaching(id,'timer',data=>{
  const state=readTimer(data);
  if(action==='start') {const left=timerRemaining(state);state.remaining=left>0?left:state.duration;state.endsAt=Date.now()+state.remaining*1000;state.running=true;state.visible=true;}
  if(action==='pause'){state.remaining=timerRemaining(state);state.running=false;state.endsAt=0;}
  if(action==='reset'){state.remaining=state.duration;state.running=false;state.endsAt=0;}
  if(action==='configure'){const duration=Number(value.duration);if(!Number.isInteger(duration)||duration<1||duration>5999)throw new Error('請設定 1 秒至 99 分 59 秒。');Object.assign(state,{duration,remaining:duration,running:false,endsAt:0});}
  if(action==='visible')state.visible=value.visible===true;
  if(action==='layout') {const width=Math.max(.15,Math.min(.5,Number(value.width)));Object.assign(state,{width,x:Math.max(0,Math.min(1-width,Number(value.x))),y:Math.max(0,Math.min(.98-width*.75,Number(value.y)))});if(!Number.isFinite(state.x)||!Number.isFinite(state.y)||!Number.isFinite(state.width))throw new Error('計時器位置無效。');}
  return {...state};
 });
}
