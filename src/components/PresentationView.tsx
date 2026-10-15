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
type Props={deck:Deck;index:number;interaction?:LessonInteraction;onInteraction?:(patch:Partial<LessonInteraction>)=>void;onNext?:()=>void;onPlayMedia?:(media:DeckMedia)=>void;action?:SlideAction|null;groups?:GroupsState;strokes?:Stroke[];pointer?:PointerState|null;media?:MediaConfig|null;preview?:boolean;tool?:Tool;disabled?:boolean;color?:string;onStroke?:(stroke:Stroke)=>void;onDraft?:(stroke:Stroke)=>void;onPointer?:(pointer:PointerState)=>void;onFeedback?:(feedback:MediaFeedback)=>void};
export function PresentationView({deck,index,interaction=initialInteraction(),onInteraction,onNext,onPlayMedia,action=null,groups,strokes=[],pointer=null,media=null,preview=false,tool='none',disabled=false,color,onStroke,onDraft,onPointer,onFeedback}:Props){
 return <article className={`slide ${preview?'preview-slide':''} ${media?'with-media media-'+media.kind:''} ${groups?.visible?'with-scores':''} ${deck.viewClass??''}`}>
  <div className="slide-content"><InteractionContext.Provider value={{state:interaction,change:onInteraction,next:onNext,playMedia:onPlayMedia}}><ActionContext.Provider value={preview?null:action}><DeckSlideView deck={deck} index={index}/></ActionContext.Provider></InteractionContext.Provider></div>
  {media&&<div className="slide-media">{preview?<div className="media-placeholder"><span>{media.kind==='youtube'?'YouTube':media.kind==='audio'?'♫ 音訊':'▶ 影片'}</span><small>於投影電腦播放</small></div>:<MediaPlayer media={media} onFeedback={onFeedback??(()=>{})}/>}</div>}
  <span className="slide-counter">{index+1} / {deck.slides.length}</span>
  {groups?.visible&&<aside className="score-strip" aria-label="各組總分">{groups.groups.map((group,i)=><div key={i}><span>{group.name}</span><strong>{group.points}</strong></div>)}</aside>}
  <AnnotationLayer slide={index} strokes={strokes} pointer={pointer} tool={tool} disabled={disabled} color={color} onStroke={onStroke} onDraft={onDraft} onPointer={onPointer}/>
 </article>;
}
