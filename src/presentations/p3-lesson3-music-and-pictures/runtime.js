export function attachMusicPictures(root, config, resolve) {
 const status=root.querySelector('.mp-media-status');const say=text=>{if(status)status.textContent=text;};
 let audio=null,interval=0,epoch=0;
 const video=root.querySelector('[data-swan]');
 const stop=()=>{epoch++;clearInterval(interval);interval=0;if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null;}if(video)video.pause();};
 const missing=item=>!item||!item.src;
 root.querySelectorAll('.mp-figure img').forEach(img=>{const fail=()=>img.closest('figure')?.classList.add('mp-missing');img.addEventListener('error',fail);if(img.complete&&img.naturalWidth===0)fail();});
 root.querySelectorAll('[data-media-label]').forEach(el=>{const item=config.media[el.dataset.mediaLabel];el.textContent=item?.label??'媒體未設定';});
 const playback=async(key,mode)=>{
  stop(); const token=epoch,item=config.media[key],swan=mode!==undefined;
  if(swan&&missing(config.swan)){say('天鵝影片待補：'+config.swan.expectedFile);return;}
  if((!swan||mode!=='silent')&&missing(item)){say('音樂待補：'+(item?.expectedFile??key));return;}
  try{
   const start=swan?config.swan.start:item.start,length=swan?config.swan.duration:item.duration;
   if(swan){
    video.muted=true;
    if(video.getAttribute('src')!==resolve(config.swan.src)){video.src=resolve(config.swan.src);await new Promise((ok,no)=>{video.onloadedmetadata=ok;video.onerror=()=>no(new Error('未能載入天鵝影片'));});}
    if(token!==epoch)return;
    video.currentTime=start;video.closest('.mp-swan').classList.add('mp-video-ready');
   }
   if(!swan||mode!=='silent'){
    audio=new Audio(resolve(item.src));audio.preload='auto';
    const sound=audio;
    await new Promise((ok,no)=>{sound.onloadedmetadata=ok;sound.onerror=()=>no(new Error('未能載入音樂檔案'));});
    if(token!==epoch){sound.pause();return;}
    sound.currentTime=item.start;
    await sound.play();
   }
   if(token!==epoch)return;
   if(swan)await video.play();
   const started=performance.now();say('播放中 · '+length+' 秒片段');
   interval=window.setInterval(()=>{if(token!==epoch)return;const ended=swan?video.ended:audio?.ended;const elapsed=swan?video.currentTime-start:(audio?.currentTime??item.start)-item.start;if(ended||elapsed>=length||(performance.now()-started)/1000>length+3){stop();say('片段完畢，可重播。');}},100);
  }catch(error){if(token!==epoch)return;stop();say((error instanceof Error?error.message:'播放失敗')+'。請在投影電腦按播放，或核對素材路徑。');}
 };
 const openMaker=()=>{let stored='';try{stored=localStorage.getItem('p3l3-music-maker-url')??'';}catch{}const value=config.musicMakerURL||stored;if(!value){say('請先在教師設定填入 Music Maker 網址。');return;}try{const url=new URL(value,location.href);if(!['http:','https:'].includes(url.protocol))throw Error();const opened=window.open(url.href,'p3-lesson3-music-maker');say(opened?'Music Maker 已在另一視窗開啟；返回原簡報分頁即可。':'瀏覽器阻擋新視窗，請在投影電腦按「開啟 Music Maker」。');}catch{say('Music Maker 網址無效，請使用 http／https 網址。');}};
 const click=event=>{
  const target=event.target.closest('button');if(!target||!root.contains(target))return;
  if(target.hasAttribute('data-mp-stop')){stop();say('已停止');return;}
  if(target.hasAttribute('data-open-maker')){openMaker();return;}
  if(target.dataset.mpPlay||target.dataset.mpReplay){void playback(target.dataset.mpPlay||target.dataset.mpReplay);return;}
  if(target.dataset.swanPlay){const mode=target.dataset.swanPlay;void playback(mode,mode);return;}
  const action=target.dataset.action;
  if(action==='listen-stop'){stop();say('已停止');}
  else if(action==='open-maker')openMaker();
  else if(action==='swan-play'){const mode=root.querySelector('[data-swan-play]')?.dataset.swanPlay;void playback(mode,mode);}
  else if(action==='exit-a'||action==='exit-b')void playback(action==='exit-a'?'exitA':'exitB');
  else if(action==='listen-play')void playback('chopin');
 };
 root.addEventListener('click',click);
 const onHide=()=>{if(document.hidden){stop();say('離開分頁，播放已停止。');}};document.addEventListener('visibilitychange',onHide);
 return()=>{stop();root.removeEventListener('click',click);document.removeEventListener('visibilitychange',onHide);if(video){video.removeAttribute('src');video.load();}};
}
