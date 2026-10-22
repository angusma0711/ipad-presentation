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
 const {sessionId=''}=useParams();const session=useSession(sessionId);const {deck,error}=useDeck(session.presentationId);
 const {setDeck}=session;useEffect(()=>setDeck(deck),[deck,setDeck]);
 const index=deck?Math.min(session.slide,deck.slides.length-1):0;
 const teaching=useTeaching(sessionId,index);
 const [menuOpen,setMenuOpen]=useState(false),[previewNext,setPreviewNext]=useState(false);
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
 return <main className="shell controller-workspace"><header className="workspace-header"><div><p className="eyebrow">課堂 {sessionId} · V2</p><h2>教師控制器</h2></div><div className="controller-header-tools"><ConnectionStatus status={session.status}/><FullscreenButton/><button aria-pressed={previewNext} onClick={()=>setPreviewNext(value=>!value)}>{previewNext?'隱藏下一頁':'預覽下一頁'}</button><button ref={menuButton} className="primary" aria-expanded={menuOpen} aria-controls="teacher-sidebar" onClick={()=>setMenuOpen(value=>!value)}>☰ {menuOpen?'收起選單':'教師選單'}</button></div></header>
  {session.missing?<section className="card"><h1>Session not found.</h1><p>Please scan the presentation QR code again.</p><Link to="/start">開始新課堂</Link></section>:!deck?<section className="card"><p>{error||'正在載入簡報…'}</p></section>:<>
   <div className={`controller-layout ${menuOpen?'menu-open':''}`}>
   <section className={`controller-stage ${previewNext?'with-next-preview':''}`} aria-label="投影片工作區">
    <section className="current-slide-stage"><div className="stage-heading"><h2>目前投影 · {index+1} / {deck.slides.length}</h2><span>{deck.slides[index].title}</span></div><div ref={setStageTarget} className="current-slide-surface"/>
    {session.busy&&<p className="small" role="status">正在同步至投影電腦…</p>}</section>
    {previewNext&&<aside className="next-slide-preview" aria-label="下一頁預覽"><h2>下一頁{index+1<deck.slides.length?` · ${index+2}`:''}</h2>{index+1<deck.slides.length?<><div className="preview-frame" inert><PresentationView deck={deck} index={index+1} preview passive/></div><p>{deck.slides[index+1].title}</p></>:<p>已到最後一頁</p>}</aside>}
   </section>
   <aside id="teacher-sidebar" className="teacher-sidebar" aria-label="教師功能選單" hidden={!menuOpen} onKeyDown={event=>{if(event.key==='Escape')closeMenu();}}>
   <div className="sidebar-heading"><h2>教師選單</h2><button onClick={closeMenu}>收起選單</button></div>
   <ControllerPanel showNext={false} deck={deck} index={index} disabled={session.status!=='Connected'} navigate={change=>void session.navigate(change)}><TeacherTools mode="slide" deck={deck} id={sessionId} slide={index} disabled={session.busy||session.status!=='Connected'} teaching={teaching}/></ControllerPanel>
   <TeacherTools stageTarget={stageTarget} mode="general" deck={deck} id={sessionId} slide={index} disabled={session.busy||session.status!=='Connected'} teaching={teaching}/>
   {session.status!=='Connected'&&<p role="status">等待連線；電腦仍可使用方向鍵操作。重新連線後將顯示雲端最新投影片。</p>}
   <section className="card"><h2>結束課堂</h2><p className="small">停用此課堂代碼；投影會顯示「課堂已結束」。課堂代碼亦會在 24 小時後自動失效。</p><button disabled={ending||session.status!=='Connected'} onClick={()=>void end()}>{ending?'正在結束…':'結束課堂'}</button>{endError&&<p className="error" role="alert">{endError}</p>}</section>
  </aside></div></>}{session.error&&<p className="error" role="alert">{session.error}</p>}
 </main>;
}
