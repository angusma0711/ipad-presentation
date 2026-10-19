import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PresentationView } from '../components/PresentationView';
import { initialInteraction } from '../types/interaction';
import type { SlideAction } from '../components/ActionContext';
import { useDeck } from '../presentations/registry';
// Local preview of any deck for authoring: no Firebase, no sync, arrow keys to move.
export function PreviewPage(){
 const {deckId=''}=useParams();const {deck,error}=useDeck(deckId);
 const [action,setAction]=useState<SlideAction|null>(null);
 const [index,setIndex]=useState(0);const [state,setState]=useState(initialInteraction());
 const count=deck?.slides.length??1;
 const go=(next:number)=>{setIndex(Math.max(0,Math.min(count-1,next)));setState(initialInteraction());setAction(null);};
 useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();go(index+(event.key==='ArrowLeft'?-1:1));}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);});
 if(!deck)return <main className="shell"><section className="card"><p>{error||'正在載入簡報…'}</p><Link to="/start">返回</Link></section></main>;
 const Controls=deck.plugin.Controls;const slide=deck.slides[index];
 return <main className="shell preview-page"><section className="card"><p className="eyebrow">本機預覽 · 沒有跨裝置同步</p><h2>{deck.title} · {index+1} / {count}：{slide.title}</h2><div className="tool-bar"><button onClick={()=>go(index-1)}>上一頁</button><button onClick={()=>go(index+1)}>下一頁</button><Link className="button" to="/start">返回</Link></div><p className="small">{slide.notes}</p>{slide.actions.length>0&&<div className="tool-bar" aria-label="教師預覽控制">{slide.actions.map(a=><button key={a.id} onClick={()=>setAction({commandId:crypto.randomUUID(),commandAt:Date.now(),action:a.id})}>{a.label}</button>)}</div>}</section>
  {Controls&&<Controls deck={deck} index={index} state={state} disabled={false} change={patch=>setState(s=>({...s,...patch}))} playMedia={()=>{}}/>}
  <div className="preview-frame"><PresentationView action={action} deck={deck} index={index} interaction={state} onInteraction={patch=>setState(s=>({...s,...patch}))} onNext={()=>go(index+1)}/></div></main>;
}
