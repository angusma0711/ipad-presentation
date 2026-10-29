import {ToolIcon,type TeacherCategory} from '../components/ToolIcon';
import {PresentationView} from '../components/PresentationView';
import {useRef} from 'react';
import { FullscreenButton } from '../components/FullscreenButton';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../services/useSession';
import { useTeaching } from '../services/useTeaching';
import { useWakeLock } from '../services/useWakeLock';
import { endSession } from '../services/sessionService';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { ControllerPanel } from '../components/ControllerPanel';
import { TeacherTools } from '../components/TeacherTools';
import { LessonEnded } from '../components/LessonEnded';
import { useDeck } from '../presentations/registry';
export function ControlPage(){
 const {sessionId=''}=useParams();const session=useSession(sessionId);const {deck,error}=useDeck(session.presentationId,session.slideOrder);
 const {setDeck}=session;useEffect(()=>setDeck(deck),[deck,setDeck]);
 const index=deck?Math.min(session.slide,deck.slides.length-1):0;
 const teaching=useTeaching(sessionId,index);
 const [menuOpen,setMenuOpen]=useState(()=>window.matchMedia('(min-width:761px)').matches),[previewNext,setPreviewNext]=useState(true);
 const [navigationVersion,setNavigationVersion]=useState(0);
 const [category,setCategory]=useState<TeacherCategory>('slides');
 const [quickTarget,setQuickTarget]=useState<HTMLDivElement|null>(null);
 const [stageTarget,setStageTarget]=useState<HTMLDivElement|null>(null);const menuButton=useRef<HTMLButtonElement>(null);
 function closeMenu(){setMenuOpen(false);menuButton.current?.focus();}
 const [ending,setEnding]=useState(false);const [endError,setEndError]=useState('');const go=useNavigate();
 useWakeLock(!session.ended);
 async function end(){
  if(!window.confirm('結束課堂？投影會顯示「課堂已結束」，此 QR code 之後不能再使用。'))return;
  setEnding(true);setEndError('');
  try{await endSession(sessionId);go('/start');}catch(failure){setEndError(failure instanceof Error?failure.message:'未能結束課堂。');}finally{setEnding(false);}
 }
 if(session.ended)return <LessonEnded/>;
 return <main className="shell controller-workspace"><header className="workspace-header"><div className="controller-brand"><span className="brand-mark" aria-hidden="true">ib</span><div><h2>I-board</h2><p className="eyebrow">教師控制器 · {sessionId}</p></div></div><div className="controller-header-tools"><ConnectionStatus status={session.status}/><FullscreenButton/><button aria-pressed={previewNext} onClick={()=>setPreviewNext(value=>!value)}><ToolIcon name="slides"/>預覽</button><button ref={menuButton} className="primary" aria-expanded={menuOpen} aria-controls="teacher-sidebar" onClick={()=>setMenuOpen(value=>!value)}><ToolIcon name="menu"/>{menuOpen?'收起選單':'教師選單'}</button></div></header>
  {session.missing?<section className="card"><h1>Session not found.</h1><p>Please scan the presentation QR code again.</p><Link to="/start">開始新課堂</Link></section>:!deck?<section className="card"><p>{error||'正在載入簡報…'}</p></section>:<>
   <div className={`controller-layout ${menuOpen?'menu-open':''}`}>
   <section className={`controller-stage ${previewNext?'with-next-preview':''}`} aria-label="投影片工作區">
    <section className="current-slide-stage"><div className="stage-heading"><h2>目前投影 · {index+1} / {deck.slides.length}</h2><span>{deck.slides[index].title}</span></div><div ref={setStageTarget} className="current-slide-surface"/><div ref={setQuickTarget} className="quick-tools-mount"/>
    {session.busy&&<p className="small" role="status">正在同步至投影電腦…</p>}</section>
    {previewNext&&<aside className="next-slide-preview" aria-label="下一頁預覽"><h2>下一頁{index+1<deck.slides.length?` · ${index+2}`:''}</h2>{index+1<deck.slides.length?<><div className="preview-frame" inert><PresentationView deck={deck} index={index+1} preview passive/></div><p>{deck.slides[index+1].title}</p></>:<p>已到最後一頁</p>}</aside>}
   </section>
   <aside id="teacher-sidebar" className="teacher-sidebar" aria-label="教師功能選單" hidden={!menuOpen} onKeyDown={event=>{if(event.key==='Escape')closeMenu();}}>
   <div className="sidebar-heading"><h2>教師工具</h2><button onClick={closeMenu} aria-label="收起選單"><ToolIcon name="close"/></button></div>
   <nav className="teacher-tool-tabs" role="tablist" aria-label="教師工具分類">{([['slides','換頁'],['action','此頁功能'],['pen','畫筆'],['timer','計時'],['groups','積分'],['media','媒體']] as const).map(([value,label],i)=><button key={value} id={`teacher-tab-${value}`} role="tab" aria-selected={category===value} aria-controls={`teacher-panel-${value}`} tabIndex={category===value?0:-1} onClick={()=>setCategory(value)} onKeyDown={event=>{const values:TeacherCategory[]=['slides','action','pen','timer','groups','media'];let target:number|undefined;if(event.key==='ArrowRight')target=(i+1)%6;if(event.key==='ArrowLeft')target=(i+5)%6;if(event.key==='Home')target=0;if(event.key==='End')target=5;if(target!==undefined){event.preventDefault();setCategory(values[target]);document.getElementById(`teacher-tab-${values[target]}`)?.focus();}}}><ToolIcon name={value}/><span>{label}</span></button>)}</nav>
   <div className="teacher-tab-content">
   <div hidden={category!=='slides'} role="tabpanel" id="teacher-panel-slides" aria-labelledby="teacher-tab-slides"><ControllerPanel showNext={false} deck={deck} index={index} disabled={session.status!=='Connected'} navigate={change=>{setNavigationVersion(value=>value+1);void session.navigate(change);}}/></div>
   <TeacherTools navigationVersion={navigationVersion} category={category} stageTarget={stageTarget} quickTarget={quickTarget} deck={deck} id={sessionId} slide={index} disabled={session.busy||session.status!=='Connected'} teaching={teaching}/>
   </div>
   {session.status!=='Connected'&&<p role="status">等待連線；電腦仍可使用方向鍵操作。重新連線後將顯示雲端最新投影片。</p>}
   <section className="sidebar-end"><p className="sr-only">結束後將停用此課堂代碼。</p><button disabled={ending||session.status!=='Connected'} onClick={()=>void end()}>{ending?'正在結束…':'結束課堂'}</button>{endError&&<p className="error" role="alert">{endError}</p>}</section>
  </aside></div></>}{session.error&&<p className="error" role="alert">{session.error}</p>}
 </main>;
}
