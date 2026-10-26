import {useContext,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {useParams} from 'react-router-dom';
import type {Deck,DeckPlugin,DeckControlsProps} from '../types';
import type {MediaFeedback} from '../../types/teaching';
import {deckAsset} from '../registry';
import {ActionContext} from '../../components/ActionContext';
import {InteractionContext} from '../../components/InteractionContext';
import {reportMedia} from '../../services/teachingService';
type MakerAPI={run:(action:string)=>Promise<string>};
const tracks:Record<string,{name:string;file:string;limit?:number}>={chopin:{name:'蕭邦《降 D 大調圓舞曲》Op.64 No.1',file:'chopin.mp3'},swan:{name:'聖桑《天鵝》開首30秒',file:'swan.mp3',limit:30},moon:{name:'德布西《月光》開首30秒',file:'moon.mp3',limit:30}};
function LessonSlide({deck,index,passive=false}:{deck:Deck;index:number;passive?:boolean}){
 const page=deck.slides[index];const {sessionId}=useParams();const command=useContext(ActionContext);const {state,change}=useContext(InteractionContext);
 const audio=useRef<HTMLAudioElement|null>(null),frame=useRef<HTMLIFrameElement|null>(null),seen=useRef(''),current=useRef(command);current.current=command;
 const chosen=useRef<string>('');const [status,setStatus]=useState(''),[blocked,setBlocked]=useState(false);
 function ack(status:MediaFeedback['status'],message:string){setStatus(message);const action=current.current;if(sessionId&&action)void reportMedia(sessionId,index,{commandId:action.commandId,status,message}).catch(()=>{});}
 async function playTrack(key:string){const track=tracks[key],node=audio.current;if(!track||!node)return;chosen.current=key;node.pause();node.src=deckAsset('./audio/'+track.file,deck.assetBase);node.currentTime=0;setBlocked(false);try{await node.play();ack('playing',track.name+'：瀏覽器已開始播放。');}catch{setBlocked(true);ack('blocked','請在投影電腦按「啟用音訊／播放」一次，再由iPad控制。');}}
 function maker(){try{return (frame.current?.contentWindow as unknown as {IBoardMusicMaker?:MakerAPI}|null)?.IBoardMusicMaker;}catch{return undefined;}}
 useEffect(()=>{setStatus('');setBlocked(false);const node=audio.current;return()=>{node?.pause();void maker()?.run('pause').catch(()=>{});};},[index]);
 useEffect(()=>{
  if(passive||!command||command.commandId===seen.current)return;seen.current=command.commandId;if(Date.now()-command.commandAt>10000)return;
  if(command.action==='music-stop'){audio.current?.pause();setBlocked(false);ack('paused','已暫停配樂。');}
  else if(command.action==='music-silent'){audio.current?.pause();setBlocked(false);ack('paused','只看相同天鵝照片，沒有配樂。');}
  else if(command.action.startsWith('music-'))void playTrack(command.action.slice(6));
  else if(command.action.startsWith('maker-')){const api=maker();if(!api){ack('blocked','請先開啟 Music Maker，等載入後在投影電腦按「開始」。');return;}const name=command.action.slice(6);void api.run(name).then(message=>ack(name==='play'||name==='check'?'playing':name==='pause'?'paused':'ready',message)).catch(error=>ack('blocked',error instanceof Error?error.message:'Music Maker 未能執行。'));}
 },[command,index,passive]);
 const opened=page.maker===true&&state.revealed;
 useLayoutEffect(()=>{const active=frame.current;if(!opened||!active)return;return()=>{try{void (active.contentWindow as unknown as {IBoardMusicMaker?:MakerAPI}|null)?.IBoardMusicMaker?.run('pause').catch(()=>{});}catch{}};},[opened,index]);
 return <div className="v3-slide-surface">{typeof page.readableHtml==='string'?<div className="v3-task-host" dangerouslySetInnerHTML={{__html:page.readableHtml.replaceAll('./images/',deckAsset('./images/',deck.assetBase))}}/>:page.kind==='task'?<div className="v3-task-host" dangerouslySetInnerHTML={{__html:page.html??''}}/>:<img className="pdf-page-image" src={deckAsset(String(page.pdfImage),deck.assetBase)} alt={page.title}/>}
  {blocked&&!passive&&<div className="v3-audio-status"><button onClick={()=>void playTrack(chosen.current)}>啟用音訊／播放</button></div>}
  {opened&&<div className="v3-maker-overlay"><header><strong>Music Maker</strong><span>首次請在投影電腦按「開始」</span><button onClick={()=>{void maker()?.run('pause').catch(()=>{});change?.({revealed:false});}}>返回投影片</button></header>{passive?<div className="v3-maker-passive">Music Maker 已在投影電腦開啟<br/><small>請在教師選單「此頁功能」選卡、試聽或停止。</small></div>:<iframe ref={frame} src={deckAsset('./music-maker/index.html',deck.assetBase)} title="Music Maker 教學配樂" allow="autoplay"/>}{status&&<p className="v3-maker-status" role="status">{status}</p>}</div>}
  {!passive&&<audio ref={audio} preload="metadata" onTimeUpdate={()=>{const node=audio.current,limit=tracks[chosen.current]?.limit;if(node&&limit&&node.currentTime>=limit){node.pause();ack('ended','30秒比較片段已結束。');}}} onEnded={()=>ack('ended','配樂已播放完畢。')} onError={()=>ack('error','音樂未能載入，請檢查網絡或重新開啟課堂。')}/>}
 </div>;
}
function Controls({deck,index,state,disabled,change,sendAction,feedback,action}:DeckControlsProps){
 const page=deck.slides[index];const music=Array.isArray(page.music)?page.music as string[]:[];const makerPage=false;
 if(!music.length&&!makerPage)return null;
 const send=(value:string)=>sendAction?.(value);
 return <section className="card"><h2>{makerPage?'Music Maker':'此頁配樂'}</h2>{music.length>0&&<><div className="tool-bar">{index===4&&<button disabled={disabled} onClick={()=>send('music-silent')}>先看照片（無配樂）</button>}{music.map(key=><button className="primary" key={key} disabled={disabled} onClick={()=>send('music-'+key)}>播放／重播 {tracks[key].name}</button>)}<button disabled={disabled} onClick={()=>send('music-stop')}>暫停配樂</button></div><p className="small">{music.includes('swan')?'同一張天鵝照片配兩首音樂，各播開首30秒；不是課本原版影片。':'此公開授權演奏約2分鐘，與教科書錄音可能不同。'} <a href={deckAsset('./audio/CREDITS.txt',deck.assetBase)} target="_blank" rel="noopener noreferrer">錄音來源及授權</a></p></>}

 {feedback&&feedback.commandId===action?.commandId&&<p className={feedback.status==='blocked'||feedback.status==='error'?'error':'small'} role="status">{feedback.message}</p>}
 </section>;
}
export default {Slide:LessonSlide,Controls} satisfies DeckPlugin;
