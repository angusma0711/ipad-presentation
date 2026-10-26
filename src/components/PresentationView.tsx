import {MediaPlacement} from './MediaPlacement';
import type {MediaLayout} from '../types/teaching';
import {TimerOverlay} from './TimerOverlay';
import type {ClassroomTimer} from '../types/teaching';
import {InteractionContext} from './InteractionContext';
import {initialInteraction,type LessonInteraction} from '../types/interaction';
import type { Deck, DeckMedia } from '../presentations/types';
import type { GroupsState, MediaConfig, MediaFeedback, PointerState, Stroke } from '../types/teaching';
import { AnnotationLayer } from './AnnotationLayer';
import type { Tool } from './AnnotationLayer';
import { ActionContext } from './ActionContext';
import type { SlideAction } from './ActionContext';
import { MediaPlayer } from './MediaPlayer';
import { DeckSlideView } from './DeckSlideView';
type Props={mediaLayout?:MediaLayout;mediaEditable?:boolean;onMediaLayout?:(layout:MediaLayout)=>void;timer?:ClassroomTimer;timerEditable?:boolean;onTimerLayout?:(layout:{x:number;y:number;width:number})=>void;passive?:boolean;deck:Deck;index:number;interaction?:LessonInteraction;onInteraction?:(patch:Partial<LessonInteraction>)=>void;onNext?:()=>void;onPlayMedia?:(media:DeckMedia)=>void;action?:SlideAction|null;groups?:GroupsState;strokes?:Stroke[];pointer?:PointerState|null;media?:MediaConfig|null;preview?:boolean;tool?:Tool;disabled?:boolean;color?:string;onStroke?:(stroke:Stroke)=>void;onDraft?:(stroke:Stroke)=>void;onPointer?:(pointer:PointerState)=>void;onFeedback?:(feedback:MediaFeedback)=>void};
export function PresentationView({mediaLayout,mediaEditable=false,onMediaLayout,timer,timerEditable=false,onTimerLayout,passive=false,deck,index,interaction=initialInteraction(),onInteraction,onNext,onPlayMedia,action=null,groups,strokes=[],pointer=null,media=null,preview=false,tool='none',disabled=false,color,onStroke,onDraft,onPointer,onFeedback}:Props){
 const page=deck.slides[index];const canvas=page.mediaCanvas===true;const preset=canvas?page.media[0]:undefined;
 const shownMedia=media??(preset?{...preset,commandId:'000000000000000000000000',action:'pause' as const,commandAt:0}:null);
 const placement=mediaLayout??(page.mediaLayout as MediaLayout|undefined)??{x:.08,y:.08,width:.84};
 const player=shownMedia?(preview?<div className="media-placeholder"><span>{shownMedia.kind==='youtube'?'YouTube':shownMedia.kind==='audio'?'♫ 音訊':'▶ 影片'}</span><small>於投影電腦播放</small></div>:<MediaPlayer media={shownMedia} onFeedback={media?(onFeedback??(()=>{})):(()=>{})}/>):null;
 return <article className={`slide ${preview?'preview-slide':''} ${shownMedia?'with-media media-'+shownMedia.kind:''} ${canvas?'media-canvas':''} ${groups?.visible?'with-scores':''} ${deck.viewClass??''}`}>
  {!canvas&&<div className="slide-content"><InteractionContext.Provider value={{state:interaction,change:onInteraction,next:onNext,playMedia:onPlayMedia}}><ActionContext.Provider value={preview?null:action}><DeckSlideView passive={passive||preview} deck={deck} index={index}/></ActionContext.Provider></InteractionContext.Provider></div>}
  {player&&(canvas?<MediaPlacement layout={placement} editable={mediaEditable&&!disabled} onLayout={onMediaLayout}>{player}</MediaPlacement>:<div className="slide-media">{player}</div>)}
  <span className="slide-counter">{index+1} / {deck.slides.length}</span>
  {groups?.visible&&<aside className="score-strip" aria-label="各組總分">{groups.groups.map((group,i)=><div key={i}><span>{group.name}</span><strong>{group.points}</strong></div>)}</aside>}
  {timer&&<TimerOverlay timer={timer} editable={timerEditable} onLayout={onTimerLayout}/>}
  <AnnotationLayer slide={index} strokes={strokes} pointer={pointer} tool={tool} disabled={disabled} color={color} onStroke={onStroke} onDraft={onDraft} onPointer={onPointer}/>
 </article>;
}
