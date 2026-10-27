import { useContext, useEffect, useRef, useState, type CSSProperties } from 'react';
import { InteractionContext } from '../../components/InteractionContext';
import { initialInteraction, type LessonInteraction } from '../../types/interaction';
import { assetURL } from '../../utils/urls';
import type { Deck, DeckControlsProps, DeckPlugin } from '../types';

type Answer={text:string;x?:number;y?:number;note?:boolean;correct?:number[]};
type Content={kind?:string;body:string;image?:string;page?:number;hint?:string;terms?:string[];options?:string[];answers:Answer[];instruments?:{id:string;name:string}[]};
const flags=['revealed','choice','timbre','revisionRevealed'] as const;
function shown(state:LessonInteraction,i:number){return i<3?state.timbreSelections.includes(i):Boolean(state[flags[i-3]]);}
function toggle(state:LessonInteraction,i:number):Partial<LessonInteraction>{return i<3?{timbreSelections:shown(state,i)?state.timbreSelections.filter(n=>n!==i):[...state.timbreSelections,i]}:{[flags[i-3]]:!shown(state,i)};}
function OriginalImage({deck,c,state}:{deck:Deck;c:Content;state:LessonInteraction}){
 const [ratio,setRatio]=useState(3);const height=c.kind==='illustration'?420:530;const width=Math.min(1480,height*ratio);
 return <div className="l2-original" style={{width,height:width/ratio}}><img src={assetURL(deck.assetBase+c.image)} alt={c.kind==='worksheet'?'原工作紙題目，保留五線譜、音符和作答位置':'原教材圖片／譜例'} onLoad={e=>setRatio(e.currentTarget.naturalWidth/e.currentTarget.naturalHeight)}/>{c.answers.map((a,i)=>a.x!==undefined&&shown(state,i)&&<span key={i} className={'l2-overlay '+(a.note?'l2-whole-note':'')} style={{left:a.x+'%',top:a.y+'%'}} aria-label={a.note?'建議填上的全音符':`答案 ${a.text}`}>{a.note?<svg viewBox="0 0 40 24"><ellipse cx="20" cy="12" rx="15" ry="9" fill="#a12f25"/><ellipse cx="20" cy="12" rx="6" ry="8" fill="white" transform="rotate(-22 20 12)"/></svg>:a.text}</span>)}</div>;
}
function Slide({deck,index}:{deck:Deck;index:number}){
 const c=deck.slides[index] as unknown as Content;const {state,change}=useContext(InteractionContext);const host=useRef<HTMLDivElement>(null);const [scale,setScale]=useState(1);
 useEffect(()=>{if(!host.current)return;const el=host.current;const o=new ResizeObserver(()=>setScale(Math.min(el.clientWidth/1600,el.clientHeight/900)));o.observe(el);return()=>o.disconnect();},[]);
 const revealed=c.answers.flatMap((a,i)=>shown(state,i)?a.correct??[]:[]);
 return <div className="l2-host" ref={host}><section className="l2-stage" style={{transform:`translate(-50%,-50%) scale(${scale})`} as CSSProperties}>
 <header><p className="l2-kicker">{c.page?`課本 P.${c.page}`:c.kind==='worksheet'?'音程工作紙':'五年級音樂'}</p><h1>{deck.slides[index].title}</h1></header>
 {c.body&&<p className="l2-question">{c.body}</p>}
 {c.kind==='instrument'?<div className="l2-instrument"><img src={assetURL(deck.assetBase+c.image)} alt={deck.slides[index].title+'課本實物照片'}/><p>{c.hint}</p></div>:
 c.kind==='summary'?<div className="l2-summary">{c.instruments?.map(t=><figure key={t.id}><img src={assetURL(deck.assetBase+t.id+'.jpg')} alt={t.name}/><figcaption>{t.name}</figcaption></figure>)}</div>:
 c.image?<OriginalImage key={c.image} deck={deck} c={c} state={state}/>:null}
 {c.options&&<div className={'l2-options '+(c.options.some(t=>t.length>18)?'long':'')}>{c.options.map((word,i)=><div key={word} className={revealed.includes(i)?'correct':''}><span className="l2-box"/>{word}</div>)}</div>}
 {c.terms&&<div className="l2-terms">{c.terms.map(t=><div key={t}><strong>{t}</strong><span>＿＿＿＿＿＿</span></div>)}</div>}
 <div className="l2-answer-text">{c.answers.map((a,i)=>a.x===undefined&&a.text&&shown(state,i)&&<p key={i}>{a.text}</p>)}</div>
 {change&&c.answers.length>0&&<nav className="l2-local-reveal" aria-label="揭示答案">{c.answers.map((_,i)=><button key={i} aria-pressed={shown(state,i)} onClick={()=>change(toggle(state,i))}>{c.answers.length===1?'答案':`答案 ${i+1}`}</button>)}</nav>}
 </section></div>;
}
function Controls({deck,index,state,change,disabled}:DeckControlsProps){const c=deck.slides[index] as unknown as Content;return <section className="card"><h2>此頁功能</h2><div className="tool-bar">{c.kind==='video'&&<button disabled={disabled} onClick={()=>change({choice:!state.choice})}>{state.choice?'開啟影片':'關閉影片'}</button>}{c.answers.map((_,i)=><button key={i} disabled={disabled} aria-pressed={shown(state,i)} onClick={()=>change(toggle(state,i))}>{shown(state,i)?'隱藏':'揭示'}{c.answers.length>1?` ${i+1}`:'答案'}</button>)}{c.answers.length>0&&<button disabled={disabled} onClick={()=>change(initialInteraction())}>重設</button>}{deck.slides[index].media.map(m=>m.kind==='youtube'&&<a key={m.src} className="button" href={`https://www.youtube.com/watch?v=${m.src}`} target="_blank" rel="noreferrer">在 YouTube 開啟 ↗</a>)}</div>{c.kind==='blank'&&<p>待補教材；依你的指示，學生畫面暫時留白。</p>}{c.kind==='video'&&<p className="small">使用系統「媒體」功能播放／暫停／關閉；選段由教師手動控制。</p>}</section>;}
export default {Slide,Controls} satisfies DeckPlugin;
