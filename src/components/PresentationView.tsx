import {ZoomGesture} from './ZoomGesture';
import {fullViewport,type SlideViewport} from '../types/viewport';
import {useEffect,useRef,useState} from 'react';
import {MediaPlacement} from './MediaPlacement';
import type {MediaLayout} from '../types/teaching';
import {TimerOverlay} from './TimerOverlay';
import type {ClassroomTimer} from '../types/teaching';
import {InteractionContext} from './InteractionContext';
import {initialInteraction,type LessonInteraction} from '../types/interaction';
import type { Deck, DeckMedia } from '../presentations/types';
import type { GroupsState, MediaConfig, MediaFeedback, PointerState, Stroke } from '../types/teaching';
import { InkHostSetter } from './InkHostContext';
import { AnnotationLayer } from './AnnotationLayer';
import type { Tool } from './AnnotationLayer';
import { ActionContext } from './ActionContext';
import type { SlideAction } from './ActionContext';
import { MediaPlayer } from './MediaPlayer';
import { DeckSlideView } from './DeckSlideView';
type Props={viewport?:SlideViewport;zoomEditable?:boolean;onViewport?:(value:SlideViewport)=>void;mediaLayout?:MediaLayout;mediaEditable?:boolean;onMediaLayout?:(layout:MediaLayout)=>void;timer?:ClassroomTimer;timerEditable?:boolean;onTimerLayout?:(layout:{x:number;y:number;width:number})=>void;passive?:boolean;deck:Deck;index:number;interaction?:LessonInteraction;onInteraction?:(patch:Partial<LessonInteraction>)=>void;onNext?:()=>void;onPlayMedia?:(media:DeckMedia)=>void;action?:SlideAction|null;groups?:GroupsState;strokes?:Stroke[];pointer?:PointerState|null;media?:MediaConfig|null;preview?:boolean;tool?:Tool;disabled?:boolean;color?:string;onStroke?:(stroke:Stroke)=>void;onDraft?:(stroke:Stroke)=>void;onPointer?:(pointer:PointerState)=>void;onFeedback?:(feedback:MediaFeedback)=>void};
export function PresentationView({viewport=fullViewport,zoomEditable=false,onViewport,mediaLayout,mediaEditable=false,onMediaLayout,timer,timerEditable=false,onTimerLayout,passive=false,deck,index,interaction=initialInteraction(),onInteraction,onNext,onPlayMedia,action=null,groups,strokes=[],pointer=null,media=null,preview=false,tool='none',disabled=false,color,onStroke,onDraft,onPointer,onFeedback}:Props){
 const page=deck.slides[index];const canvas=page.mediaCanvas===true;const preset=canvas?page.media[0]:undefined;
 const [inkHost,setInkHost]=useState<HTMLElement|null>(null);
 const pageInk=deck.data.ink==='page';
 // Optional lesson-level close control: unmount the existing player and do not replay an old command on reopening.
 const dismissed=page.mediaDismissible===true&&interaction.choice;
 const dismissedCommand=useRef<string|null>(null);
 useEffect(()=>{if(dismissed)dismissedCommand.current=media?.commandId??null;},[dismissed,media?.commandId]);
 const activeMedia=media&&media.commandId===dismissedCommand.current?{...media,action:'pause' as const,commandAt:0}:media;
 const shownMedia=dismissed?null:activeMedia??(preset?{...preset,commandId:'000000000000000000000000',action:'pause' as const,commandAt:0}:null);
 const placement=mediaLayout??(page.mediaLayout as MediaLayout|undefined)??{x:.08,y:.08,width:.84};
 const player=shownMedia?(preview?<div className="media-placeholder"><span>{shownMedia.kind==='youtube'?'YouTube':shownMedia.kind==='audio'?'♫ 音訊':'▶ 影片'}</span><small>於投影電腦播放</small></div>:<MediaPlayer media={shownMedia} onFeedback={media?(onFeedback??(()=>{})):(()=>{})}/>):null;
 return <article className={`slide sync-zoom-slide ${preview?'preview-slide':''} ${shownMedia?'with-media media-'+shownMedia.kind:''} ${canvas?'media-canvas':''} ${groups?.visible?'with-scores':''} ${deck.viewClass??''}`}>
  <div className="slide-zoom-surface" style={{transform:`translate(${viewport.x*100}%,${viewport.y*100}%) scale(${viewport.scale})`}}>
  {!canvas&&<div className="slide-content"><InteractionContext.Provider value={{state:interaction,change:onInteraction,next:onNext,playMedia:onPlayMedia}}><ActionContext.Provider value={preview?null:action}><InkHostSetter.Provider value={setInkHost}><DeckSlideView passive={passive} preview={preview} action={action} deck={deck} index={index}/></InkHostSetter.Provider></ActionContext.Provider></InteractionContext.Provider></div>}
  {player&&(canvas?<MediaPlacement layout={placement} editable={mediaEditable&&!disabled} onLayout={onMediaLayout}>{player}</MediaPlacement>:<div className="slide-media">{player}</div>)}
  <AnnotationLayer slide={index} strokes={strokes} pointer={pointer} tool={tool} disabled={disabled} color={color} onStroke={onStroke} onDraft={onDraft} onPointer={onPointer} pageInk={pageInk} inkHost={pageInk?inkHost:null}/>
  </div>
  {zoomEditable&&!disabled&&onViewport&&<ZoomGesture value={viewport} onChange={onViewport}/>}
  <span className="slide-counter">{index+1} / {deck.slides.length}</span>
  {groups?.visible&&<aside className="score-strip" aria-label="各組總分">{groups.groups.map((group,i)=><div key={i}><span>{group.name}</span><strong>{group.points}</strong></div>)}</aside>}
  {timer&&<TimerOverlay timer={timer} editable={timerEditable} onLayout={onTimerLayout}/>}

 </article>;
}
