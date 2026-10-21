import { FullscreenButton } from '../components/FullscreenButton';
import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSession } from '../services/useSession';
import { useTeaching } from '../services/useTeaching';
import { useWakeLock } from '../services/useWakeLock';
import { reportMedia, changeInteraction, configureMedia, commandMedia } from '../services/teachingService';
import type { MediaFeedback } from '../types/teaching';
import { PresentationView } from '../components/PresentationView';
import { LessonEnded } from '../components/LessonEnded';
import { useDeck } from '../presentations/registry';
export function PresentPage(){
 const {sessionId=''}=useParams();const session=useSession(sessionId,true);const {deck,error}=useDeck(session.presentationId);
 const {setDeck}=session;useEffect(()=>setDeck(deck),[deck,setDeck]);
 const index=deck?Math.min(session.slide,deck.slides.length-1):0;
 const teaching=useTeaching(sessionId,index);
 useWakeLock(!session.ended);
 const feedback=useCallback((value:MediaFeedback)=>{if(session.status==='Connected')void reportMedia(sessionId,index,value).catch(()=>{});},[sessionId,index,session.status]);
 useEffect(()=>{const handler=(event:KeyboardEvent)=>{
  if(event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;
  const target=event.target as HTMLElement;if(target.closest('button,input,select,textarea,audio,video,iframe'))return;
  if(event.key==='ArrowRight'||event.code==='Space'||event.key==='ArrowLeft'){event.preventDefault();void session.navigate({delta:event.key==='ArrowLeft'?-1:1});}
 };window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[session.navigate]);
 if(session.ended)return <LessonEnded projector/>;
 if(!deck)return <main className="presentation"><p className="deck-loading">{error||'正在載入簡報…'}</p></main>;
 return <main className="presentation"><FullscreenButton overlay/><PresentationView timer={teaching.timer} deck={deck} index={index} interaction={teaching.interaction} onInteraction={patch=>{if(session.status==='Connected')void changeInteraction(sessionId,index,patch).catch(()=>{});}} onPlayMedia={media=>{if(session.status==='Connected')void configureMedia(sessionId,index,media.kind,media.src).then(()=>commandMedia(sessionId,index,'play')).catch(()=>{});}} onNext={()=>void session.navigate({delta:1})} action={teaching.action} groups={teaching.groups} strokes={teaching.strokes} pointer={teaching.pointer} media={teaching.media} onFeedback={feedback}/></main>;
}
