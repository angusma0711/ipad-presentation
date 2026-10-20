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
 const [ending,setEnding]=useState(false);const [endError,setEndError]=useState('');const go=useNavigate();
 useWakeLock(!session.ended);
 async function end(){
  if(!window.confirm('結束課堂？投影會顯示「課堂已結束」，此 QR code 之後不能再使用。'))return;
  setEnding(true);setEndError('');
  try{await endSession(sessionId);go('/start');}catch(failure){setEndError(failure instanceof Error?failure.message:'未能結束課堂。');}finally{setEnding(false);}
 }
 if(session.ended)return <LessonEnded/>;
 return <main className="shell"><header><div><p className="eyebrow">課堂 {sessionId} · V2</p><h2>教師控制器</h2></div><div className="controller-header-tools"><ConnectionStatus status={session.status}/><FullscreenButton/></div></header>
  {session.missing?<section className="card"><h1>Session not found.</h1><p>Please scan the presentation QR code again.</p><Link to="/start">開始新課堂</Link></section>:!deck?<section className="card"><p>{error||'正在載入簡報…'}</p></section>:<>
   <ControllerPanel deck={deck} index={index} disabled={session.status!=='Connected'} navigate={change=>void session.navigate(change)}><TeacherTools mode="slide" deck={deck} id={sessionId} slide={index} disabled={session.busy||session.status!=='Connected'} teaching={teaching}/></ControllerPanel>
   {session.busy&&<p className="small" role="status">正在同步至投影電腦…</p>}
   <TeacherTools mode="general" deck={deck} id={sessionId} slide={index} disabled={session.busy||session.status!=='Connected'} teaching={teaching}/>
   {session.status!=='Connected'&&<p role="status">等待連線；電腦仍可使用方向鍵操作。重新連線後將顯示雲端最新投影片。</p>}
   <section className="card"><h2>結束課堂</h2><p className="small">停用此課堂代碼；投影會顯示「課堂已結束」。課堂代碼亦會在 24 小時後自動失效。</p><button disabled={ending||session.status!=='Connected'} onClick={()=>void end()}>{ending?'正在結束…':'結束課堂'}</button>{endError&&<p className="error" role="alert">{endError}</p>}</section>
  </>}{session.error&&<p className="error" role="alert">{session.error}</p>}
 </main>;
}
