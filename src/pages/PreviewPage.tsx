import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PresentationView } from '../components/PresentationView';
import type { Tool } from '../components/AnnotationLayer';
import { initialInteraction } from '../types/interaction';
import type { SlideAction } from '../components/ActionContext';
import { MAX_STROKES, type Stroke } from '../types/teaching';
import { useDeck } from '../presentations/registry';
// Local preview of any deck for authoring: no Firebase, no sync, arrow keys to move.
export function PreviewPage(){
 const {deckId=''}=useParams();const {deck,error}=useDeck(deckId);
 const [action,setAction]=useState<SlideAction|null>(null);
 const [index,setIndex]=useState(0);const [state,setState]=useState(initialInteraction());
 const [tool,setTool]=useState<Tool>('none');const [color,setColor]=useState('#e63946');const [ink,setInk]=useState<Stroke[][]>([]);
 const count=deck?.slides.length??1;
 const pageInk=deck?.data.ink==='page';
 const go=(next:number)=>{setIndex(Math.max(0,Math.min(count-1,next)));setState(initialInteraction());setAction(null);};
 useEffect(()=>{setIndex(0);setAction(null);setTool('none');setInk([]);},[deckId]);
 useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();go(index+(event.key==='ArrowLeft'?-1:1));}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);});
 function draw(stroke:Stroke){setInk(list=>{const copy=list.slice();const current=copy[index]?copy[index].slice():[];const at=current.findIndex(item=>item.id===stroke.id);if(at>=0)current[at]=stroke;else if(current.length<MAX_STROKES)current.push(stroke);copy[index]=current;return copy;});}
 if(!deck)return <main className="shell"><section className="card"><p>{error||'正在載入簡報…'}</p><Link to="/start">返回</Link></section></main>;
 const Controls=deck.plugin.Controls;const slide=deck.slides[index];
 return <main className="shell preview-page"><section className="card"><p className="eyebrow">本機預覽 · 沒有跨裝置同步</p><h2>{deck.title} · {index+1} / {count}：{slide.title}</h2><div className="tool-bar"><button onClick={()=>go(index-1)}>上一頁</button><button onClick={()=>go(index+1)}>下一頁</button><Link className="button" to="/start">返回</Link></div><p className="small">{slide.notes}</p>{slide.actions.length>0&&<div className="tool-bar" aria-label="教師預覽控制">{slide.actions.map(a=><button key={a.id} onClick={()=>setAction({commandId:crypto.randomUUID(),commandAt:Date.now(),action:a.id})}>{a.label}</button>)}</div>}
  {pageInk&&<div className="tool-bar" role="group" aria-label="本機筆跡（沒有跨裝置同步）">{([['none','瀏覽'],['pen','畫線／圈選'],['erase','擦除']] as const).map(([value,label])=><button type="button" key={value} aria-pressed={tool===value} onClick={()=>setTool(value)}>{label}</button>)}{tool==='pen'&&[['#e63946','紅色'],['#176b60','綠色'],['#1b4fc4','藍色']].map(([value,label])=><button type="button" key={value} aria-pressed={color===value} onClick={()=>setColor(value)}>{label}</button>)}<button type="button" disabled={!(ink[index]?.length)} onClick={()=>setInk(list=>{const copy=list.slice();copy[index]=(copy[index]??[]).slice(0,-1);return copy;})}>復原</button><button type="button" disabled={!(ink[index]?.length)} onClick={()=>setInk(list=>{const copy=list.slice();copy[index]=[];return copy;})}>清除此頁</button></div>}
 </section>
  {Controls&&<Controls action={action} sendAction={value=>setAction({commandId:crypto.randomUUID(),commandAt:Date.now(),action:value})} deck={deck} index={index} state={state} disabled={false} change={patch=>setState(s=>({...s,...patch}))} playMedia={()=>{}}/>}
  <div className={`preview-frame ${pageInk&&tool!=='none'?'touch-tool-active':''}`}><PresentationView action={action} deck={deck} index={index} interaction={state} onInteraction={patch=>setState(s=>({...s,...patch}))} onNext={()=>go(index+1)} strokes={pageInk?ink[index]??[]:undefined} tool={pageInk?tool:undefined} color={color} onDraft={pageInk?draw:undefined} onStroke={pageInk?draw:undefined}/></div></main>;
}
