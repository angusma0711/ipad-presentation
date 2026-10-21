import {useEffect,useState} from 'react';
import type {Deck} from '../presentations/types';
import type {ClassroomTimer} from '../types/teaching';
import {controlTimer} from '../services/teachingService';
import {PresentationView} from './PresentationView';
export function TimerTools({id,deck,index,timer,disabled}:{id:string;deck:Deck;index:number;timer:ClassroomTimer;disabled:boolean}){
 const [size,setSize]=useState(Math.round(timer.width*100));
 const [duration,setDuration]=useState(timer.duration);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 useEffect(()=>setSize(Math.round(timer.width*100)),[timer.width]);
 useEffect(()=>setDuration(timer.duration),[timer.duration]);
 async function change(action:Parameters<typeof controlTimer>[1],value:Record<string,number|boolean>={}){if(disabled||busy)return;setBusy(true);setError('');try{await controlTimer(id,action,value);}catch(e){setError(e instanceof Error?e.message:'計時器未能同步。');}finally{setBusy(false);}}
 const unavailable=disabled||busy;
 return <details className="card tools-section" open><summary>倒數計時器</summary><p className="small">在下方預覽拖動計時器，拖右下角調整大小。位置及大小會同步至投影，切換頁面後繼續計時。隱藏不會暫停倒數。</p>
 <form className="timer-settings" onSubmit={event=>{event.preventDefault();void change('configure',{duration});}}><label>分鐘<input type="number" min="0" max="99" value={Math.floor(duration/60)} disabled={unavailable} onChange={event=>setDuration(Math.max(0,Math.min(99,Number(event.target.value)))*60+duration%60)}/></label><label>秒<input type="number" min="0" max="59" value={duration%60} disabled={unavailable} onChange={event=>setDuration(Math.floor(duration/60)*60+Math.max(0,Math.min(59,Number(event.target.value))))}/></label><button disabled={unavailable||duration<1}>設定時間</button></form>
 <div className="tool-bar"><button disabled={unavailable} onClick={()=>void change('visible',{visible:!timer.visible})}>{timer.visible?'隱藏計時器':'顯示計時器'}</button><button disabled={unavailable||timer.running} onClick={()=>void change('start')}>開始／繼續</button><button disabled={unavailable||!timer.running} onClick={()=>void change('pause')}>暫停</button><button disabled={unavailable} onClick={()=>void change('reset')}>重設</button></div>
 <label>計時器大小<input type="range" min="15" max="50" value={size} disabled={unavailable} onChange={event=>setSize(Number(event.target.value))} onPointerUp={()=>void change('layout',{x:Math.min(timer.x,1-size/100),y:timer.y,width:size/100})} onKeyUp={()=>void change('layout',{x:Math.min(timer.x,1-size/100),y:timer.y,width:size/100})}/></label>
 <div className="preview-frame timer-position-preview"><PresentationView deck={deck} index={index} preview passive timer={timer} timerEditable={!unavailable} onTimerLayout={layout=>void change('layout',layout)}/></div>
 {error&&<p className="error" role="alert">{error}</p>}</details>;
}
