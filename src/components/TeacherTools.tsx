import {ToolIcon,type TeacherCategory} from './ToolIcon';
import {createPortal} from 'react-dom';
import {TimerTools} from './TimerTools';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { useTeaching } from '../services/useTeaching';
import type { MediaKind, Stroke } from '../types/teaching';
import { mediaSource } from '../types/teaching';
import { addGroup, removeGroup, MAX_GROUPS, changeGroup, setScoresVisible, controlTimer, configureMedia, commandMedia, commandSlideAction, changeInteraction } from '../services/teachingService';
import type { Deck, DeckMedia } from '../presentations/types';
import { PresentationView } from './PresentationView';
import { useAnnotationSync } from '../services/useAnnotationSync';
import type { Tool } from './AnnotationLayer';
type Props={navigationVersion?:number;category?:TeacherCategory;quickTarget?:HTMLElement|null;stageTarget?:HTMLElement|null;mode?:'slide'|'general';deck:Deck;id:string;slide:number;disabled:boolean;teaching:ReturnType<typeof useTeaching>};
export function TeacherTools({navigationVersion=0,category,quickTarget,stageTarget,mode,deck,id,slide,disabled,teaching}:Props){
 const [tool,setTool]=useState<Tool>('none');const [color,setColor]=useState('#e63946');
 const [busy,setBusy]=useState(false);const lock=useRef(false);const [error,setError]=useState('');
 const lessonSlide=deck.slides[slide]; const suggested=lessonSlide.media[0]; const Controls=deck.plugin.Controls;
 const [kind,setKind]=useState<MediaKind>('audio');const [source,setSource]=useState('/media/demo-beat.wav');
 // Navigation and tool-category changes leave drawing mode before another page is used.
 useEffect(()=>{setTool('none');},[slide,category,navigationVersion]);
 useEffect(()=>{setKind(teaching.media?.kind??suggested?.kind??'audio');setSource(teaching.media?.src??suggested?.src??'/media/demo-beat.wav');},[slide,teaching.media?.kind,teaching.media?.src,suggested?.kind,suggested?.src]);
 async function perform(action:()=>Promise<void>){
  if(disabled||lock.current)return;lock.current=true;setBusy(true);setError('');
  try{await action();}catch(failure){setError(failure instanceof Error?failure.message:'操作失敗，請重試。');}finally{lock.current=false;setBusy(false);}
 }
 const annotations=useAnnotationSync(id,slide,teaching.strokes,!disabled);
 const syncText={synced:'標記已同步',syncing:'標記同步中…',retrying:'網絡不穩，標記稍後自動重試'}[annotations.sync];
 const syncLabel=disabled&&annotations.sync!=='synced'?'未連線：標記已保留，重新連線後自動同步':syncText;
 const unavailable=disabled||busy;
 function playMedia(media:DeckMedia){void perform(async()=>{await configureMedia(id,slide,media.kind,media.src);await commandMedia(id,slide,'play');});}
 function attach(event:FormEvent){event.preventDefault();void perform(async()=>{const src=mediaSource(kind,source);await configureMedia(id,slide,kind,src);});}
 const status=teaching.media ? (teaching.feedback?.commandId===teaching.media.commandId ? teaching.feedback.status : '等待投影回應') : '未設定';
 const statusText:Record<string,string>={ready:'已就緒',playing:'播放中',paused:'已暫停',ended:'播放完畢',blocked:'播放被阻擋',error:'播放失敗'};
 const quickTools=<div className="controller-quick-tools" role="group" aria-label="主畫面畫筆快捷工具"><button aria-pressed={tool==='pen'} onClick={()=>setTool(tool==='pen'?'none':'pen')}><ToolIcon name="pen"/>畫筆</button><div className="quick-colors" role="group" aria-label="畫筆顏色">{[['#e63946','紅色'],['#176b60','綠色'],['#1b4fc4','藍色']].map(([value,label])=><button className="color-swatch" key={value} style={{backgroundColor:value}} aria-label={label} aria-pressed={color===value} onClick={()=>setColor(value)}/>)}</div><button disabled={!annotations.strokes.length} onClick={annotations.undo}><ToolIcon name="undo"/>復原</button></div>;
 return <>
  {quickTarget&&mode!=='slide'&&tool==='pen'&&createPortal(quickTools,quickTarget)}
  {mode!=='general'&&<div hidden={!!category&&category!=='action'} id="teacher-panel-action" role={category?'tabpanel':undefined} aria-labelledby={category?'teacher-tab-action':undefined}>
  {Controls&&<Controls deck={deck} index={slide} state={teaching.interaction} disabled={unavailable} change={patch=>void perform(()=>changeInteraction(id,slide,patch))} playMedia={playMedia}/>}
  {suggested&&<section className="card"><h2>此頁教材媒體</h2><div className="tool-bar"><button className="primary" disabled={unavailable} onClick={()=>playMedia(suggested)}>播放</button><button disabled={unavailable||!teaching.media} onClick={()=>void perform(()=>commandMedia(id,slide,'pause'))}>暫停</button></div><p className="small" role="status">播放狀態：{statusText[String(status)]??status}。聲音由投影電腦播放。</p></section>}
  {lessonSlide.actions.length>0&&<section className="card"><h2>投影片功能</h2><div className="tool-bar">{lessonSlide.actions.map(action=><button key={action.id} disabled={unavailable} onClick={()=>void perform(()=>commandSlideAction(id,slide,action.id))}>{action.label}</button>)}</div></section>}
  {!Controls&&!suggested&&!lessonSlide.actions.length&&<p className="small">這張投影片沒有專用教學按鈕。</p>}
  </div>}
  {mode!=='slide'&&<>
  <div hidden={!!category&&category!=='pen'} id="teacher-panel-pen" role={category?'tabpanel':undefined} aria-labelledby={category?'teacher-tab-pen':undefined}><section className="card preview-card"><h2>投影片預覽與標記</h2><div className="tool-bar" role="group" aria-label="預覽工具">
   {([['none','瀏覽'],['pen','畫線／圈選']] as const).map(([value,label])=><button key={value} aria-pressed={tool===value} onClick={()=>setTool(value)}>{label}</button>)}
  </div>{tool==='pen'&&<div className="tool-bar" role="group" aria-label="畫筆顏色">{[['#e63946','紅色'],['#176b60','綠色'],['#1b4fc4','藍色']].map(([value,label])=><button key={value} aria-pressed={color===value} onClick={()=>setColor(value)}>{label}</button>)}</div>}
   {stageTarget?createPortal(<div className={`preview-frame ${tool!=='none'?'touch-tool-active':''}`}><PresentationView timer={teaching.timer} timerEditable={!unavailable} onTimerLayout={layout=>void perform(()=>controlTimer(id,'layout',layout))} deck={deck} index={slide} interaction={teaching.interaction} onInteraction={patch=>void perform(()=>changeInteraction(id,slide,patch))} preview groups={teaching.groups} strokes={annotations.strokes} pointer={teaching.pointer} media={teaching.media} tool={tool} disabled={tool==='pen'?false:unavailable} color={color} onDraft={(stroke:Stroke)=>annotations.draw(stroke)} onStroke={(stroke:Stroke)=>annotations.draw(stroke)}/></div>,stageTarget):<div className={`preview-frame ${tool!=='none'?'touch-tool-active':''}`}><PresentationView timer={teaching.timer} timerEditable={!unavailable} onTimerLayout={layout=>void perform(()=>controlTimer(id,'layout',layout))} deck={deck} index={slide} interaction={teaching.interaction} onInteraction={patch=>void perform(()=>changeInteraction(id,slide,patch))} preview groups={teaching.groups} strokes={annotations.strokes} pointer={teaching.pointer} media={teaching.media} tool={tool} disabled={tool==='pen'?false:unavailable} color={color} onDraft={(stroke:Stroke)=>annotations.draw(stroke)} onStroke={(stroke:Stroke)=>annotations.draw(stroke)}/></div>}
   <p className="small">{tool==='pen'?'在主畫面畫線或圈選；畫的途中同步至投影。':'主畫面與投影使用相同比例。選擇畫筆後可直接在主畫面標記；計時器可直接拖動及縮放。'}</p>
   <div className="tool-bar"><button disabled={!annotations.strokes.length} onClick={annotations.undo}>復原上一筆</button><button disabled={!annotations.strokes.length} onClick={()=>{if(window.confirm('清除這張投影片的所有標記？'))annotations.clear();}}>清除此頁標記</button><span className={`sync-state sync-${annotations.sync}`} role="status">{syncLabel}</span></div>{annotations.full&&<p className="small">此頁已有 30 條標記，請先復原或清除。</p>}
  </section></div>
  <div hidden={!!category&&category!=='timer'} id="teacher-panel-timer" role={category?'tabpanel':undefined} aria-labelledby={category?'teacher-tab-timer':undefined}><TimerTools id={id} timer={teaching.timer} disabled={unavailable}/></div>
  <div hidden={!!category&&category!=='groups'} id="teacher-panel-groups" role={category?'tabpanel':undefined} aria-labelledby={category?'teacher-tab-groups':undefined}><details className="card tools-section" open><summary>小組積分</summary><p className="small">可設定 1–8 組；修改組名後按儲存。新增小組從 0 分開始，其他小組積分保留。</p>
   <button disabled={unavailable} aria-pressed={teaching.groups.visible} onClick={()=>void perform(()=>setScoresVisible(id,!teaching.groups.visible))}>{teaching.groups.visible?'隱藏投影積分':'顯示投影積分'}</button>
   <div className="tool-bar"><strong>目前 {teaching.groups.groups.length} 組</strong><button disabled={unavailable||teaching.groups.groups.length>=MAX_GROUPS} onClick={()=>void perform(()=>addGroup(id))}>新增小組</button></div>
   <div className="groups-list">{teaching.groups.groups.map((group,i)=><div className="group-row" key={i}>
    <form key={group.name} onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);void perform(()=>changeGroup(id,i,{name:String(form.get('name'))}));}}><label className="sr-only" htmlFor={`group-${i}`}>第 {i+1} 組名稱</label><input id={`group-${i}`} name="name" defaultValue={group.name} maxLength={24} required disabled={unavailable}/><button disabled={unavailable}>儲存</button></form>
    <strong aria-label={`${group.name}總分`}>{group.points}</strong><button className="primary" aria-label={`${group.name}加一分`} disabled={unavailable||group.points===9999} onClick={()=>void perform(()=>changeGroup(id,i,{delta:1}))}>+1</button><button className="primary" aria-label={`${group.name}加兩分`} disabled={unavailable||group.points>9997} onClick={()=>void perform(()=>changeGroup(id,i,{delta:2}))}>+2</button><button className="remove-group" aria-label={`刪除${group.name}`} disabled={unavailable||teaching.groups.groups.length<=1} onClick={()=>{if(window.confirm(`刪除「${group.name}」及其 ${group.points} 分？其他小組的積分會保留。`))void perform(()=>removeGroup(id,i));}}>刪除小組</button>
   </div>)}</div>
  </details></div>
  <div hidden={!!category&&category!=='media'} id="teacher-panel-media" role={category?'tabpanel':undefined} aria-labelledby={category?'teacher-tab-media':undefined}><details className="card tools-section" open><summary>此頁音訊／影片</summary><p role="status">播放狀態：{statusText[String(status)]??status}</p>
   <div className="tool-bar">{([['play','播放'],['pause','暫停'],['restart','重新播放']] as const).map(([action,label])=><button key={action} disabled={unavailable||!teaching.media} onClick={()=>void perform(()=>commandMedia(id,slide,action))}>{label}</button>)}</div>
   {teaching.feedback?.commandId===teaching.media?.commandId&&teaching.feedback?.message&&<p className="error" role="status">{teaching.feedback.message}</p>}
   {teaching.media?.kind==='youtube'&&<p className="small">{teaching.feedback?.commandId===teaching.media.commandId&&teaching.feedback.status==='error'?'影片未能嵌入。請在投影電腦開啟 YouTube；外部播放不受控制器遙控。':'貼上連結並加入此頁後不會自動播放；按播放才向投影電腦發出指令。'} <a href={`https://www.youtube.com/watch?v=${encodeURIComponent(teaching.media.src)}`} target="_blank" rel="noopener noreferrer">在此裝置開啟 YouTube ↗</a></p>}
   <form className="media-form" onSubmit={attach}><label htmlFor="media-kind">媒體來源</label><select id="media-kind" value={kind} disabled={unavailable} onChange={event=>{setKind(event.target.value as MediaKind);setSource('');}}><option value="audio">本機音訊</option><option value="video">本機影片</option><option value="youtube">YouTube</option></select>
    <label htmlFor="media-source">{kind==='youtube'?'YouTube 連結／影片 ID':'本機媒體路徑'}</label><input id="media-source" value={source} disabled={unavailable} onChange={event=>setSource(event.target.value)} placeholder={kind==='youtube'?'https://www.youtube.com/watch?v=…':kind==='audio'?'/media/lesson.mp3':'/media/lesson.mp4'} required/>
    <button className="primary" disabled={unavailable}>將媒體加入此頁</button>
   </form><p className="small">本機檔案請先放入專案的 public/media 資料夾，再輸入 /media/檔案名稱。示範音訊：/media/demo-beat.wav。聲音由投影電腦播放；若被阻擋，請在該電腦按播放鍵。</p>
  </details></div>
  </>}
  {(error||teaching.error)&&<p className="error" role="alert">{error||teaching.error}</p>}
 </>;
}
