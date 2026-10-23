import { assetURL } from '../utils/urls';
import { useEffect, useRef, useState } from 'react';
import { youtubeAPI, youtubeErrorMessage } from '../services/youtube';
import type { YouTubePlayer } from '../services/youtube';
import type { MediaConfig, MediaFeedback } from '../types/teaching';
import { mediaSource } from '../types/teaching';
type Props={media:MediaConfig;onFeedback:(feedback:MediaFeedback)=>void};
export function MediaPlayer(props:Props){
 try{mediaSource(props.media.kind,props.media.src);}catch{return <p className="media-error">媒體來源無效。</p>;}
 return props.media.kind==='youtube'?<YouTubeMedia key={props.media.src} {...props}/>:<NativeMedia key={props.media.kind+props.media.src} {...props}/>;
}
function NativeMedia({media,onFeedback}:Props){
 const element=useRef<HTMLMediaElement|null>(null);const seen=useRef('');
 const [blocked,setBlocked]=useState(false);const [message,setMessage]=useState('');
 const current=useRef(media);current.current=media;const feedbackRef=useRef(onFeedback);feedbackRef.current=onFeedback;
 const report=(status:MediaFeedback['status'],text='')=>{setMessage(text);feedbackRef.current({commandId:current.current.commandId,status,message:text});};
 async function play(){setBlocked(false);try{await element.current?.play();}catch{setBlocked(true);report('blocked','請在投影電腦按「點此播放／啟用音訊」。');}}
 useEffect(()=>{
  if(seen.current===media.commandId)return;seen.current=media.commandId;
  if(Date.now()-media.commandAt>10000)return;
  if(media.action==='pause'){element.current?.pause();report('paused');}
  else{if(media.action==='restart'&&element.current)element.current.currentTime=0;void play();}
 },[media.commandId,media.action]);
 useEffect(()=>{const node=element.current;return()=>node?.pause();},[]);
 const attributes={src:assetURL(media.src),controls:true,preload:'metadata',onLoadedMetadata:()=>report(element.current?.paused?'ready':'playing'),onPlay:()=>report('playing'),onPause:()=>report('paused'),onEnded:()=>report('ended'),onError:()=>report('error','找不到媒體或格式不支援。請檢查 public/media 內的檔案。')};
 return <div className="media-player">{media.kind==='audio'?<div className="audio-tile"><span aria-hidden="true">♫</span><audio {...attributes} ref={node=>{element.current=node;}}/></div>:<video {...attributes} playsInline ref={node=>{element.current=node;}}/>}
  {blocked&&<button className="enable-media" onClick={()=>void play()}>點此播放／啟用音訊</button>}
  {message&&<p className="media-error" role="status">{message}</p>}
 </div>;
}
function YouTubeMedia({media,onFeedback}:Props){
 const container=useRef<HTMLDivElement|null>(null);const player=useRef<YouTubePlayer|null>(null);const seen=useRef('');
 const [failed,setFailed]=useState(false);const [ready,setReady]=useState(false);const [message,setMessage]=useState('');const [blocked,setBlocked]=useState(false);
 const current=useRef(media);current.current=media;const feedbackRef=useRef(onFeedback);feedbackRef.current=onFeedback;
 function report(status:MediaFeedback['status'],text=''){setFailed(status==='error');setMessage(text);feedbackRef.current({commandId:current.current.commandId,status,message:text});}
 useEffect(()=>{
  let cancelled=false;
  youtubeAPI().then(api=>{
   if(cancelled||!container.current)return;
   if(!['http:','https:'].includes(location.protocol)){report('error',youtubeErrorMessage(153));return;}
   const target=document.createElement('iframe');
   const params=new URLSearchParams({enablejsapi:'1',origin:location.origin,playsinline:'1',controls:'1',autoplay:'0',rel:'0'});
   target.src=`https://www.youtube.com/embed/${encodeURIComponent(media.src)}?${params}`;
   target.title='YouTube 教材影片';target.referrerPolicy='strict-origin-when-cross-origin';
   target.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';target.allowFullscreen=true;
   container.current.replaceChildren(target);
   player.current=new api.Player(target,{videoId:media.src,playerVars:{origin:location.origin,playsinline:1,controls:1,autoplay:0,rel:0},
    events:{onReady:()=>{if(!cancelled){setReady(true);report('ready');}},
     onStateChange:event=>{if(cancelled)return;const status=event.data===1?'playing':event.data===2?'paused':event.data===0?'ended':null;if(status){setBlocked(false);report(status);}},
     onError:event=>{if(!cancelled)report('error',youtubeErrorMessage(event.data));},
     onAutoplayBlocked:()=>{if(!cancelled){setBlocked(true);report('blocked','請在投影電腦按影片播放鍵以啟用播放。');}}}});
  }).catch(error=>{if(!cancelled)report('error',error instanceof Error?error.message:'YouTube 載入失敗，請檢查網絡。');});
  return()=>{cancelled=true;try{player.current?.destroy();}finally{player.current=null;container.current?.replaceChildren();}};
 },[media.src]);
 useEffect(()=>{
  if(!ready||seen.current===media.commandId)return;seen.current=media.commandId;
  if(Date.now()-media.commandAt>10000)return;
  if(media.action==='pause')player.current?.pauseVideo();
  else{if(media.action==='restart')player.current?.seekTo(0,true);player.current?.playVideo();}
 },[ready,media.commandId,media.action]);
 return <div className="media-player youtube-player"><div ref={container}/>{blocked&&<button className="enable-media" onClick={()=>player.current?.playVideo()}>點此啟用播放</button>}{message&&failed&&<aside className="youtube-error-panel" role="status"><p>{message}</p><a className="button primary" href={`https://www.youtube.com/watch?v=${encodeURIComponent(media.src)}`} target="_blank" rel="noopener noreferrer">在 YouTube 開啟 ↗</a><small>外部 YouTube 播放不受 iPad 控制器遙控。</small></aside>}{message&&!failed&&<p className="media-error" role="status">{message}</p>}</div>;
}
