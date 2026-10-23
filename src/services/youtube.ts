export type YouTubePlayer = {playVideo():void;pauseVideo():void;seekTo(seconds:number,allowSeekAhead:boolean):void;destroy():void};
type PlayerOptions = {videoId:string;playerVars:Record<string,string|number>;events:{onReady:()=>void;onStateChange:(event:{data:number})=>void;onError:(event:{data:number})=>void;onAutoplayBlocked:()=>void}};
type YouTubeAPI = {Player:new(element:HTMLElement,options:PlayerOptions)=>YouTubePlayer};
declare global {interface Window {YT?:YouTubeAPI;onYouTubeIframeAPIReady?:()=>void;}}
let loading:Promise<YouTubeAPI>|undefined;
export function youtubeAPI():Promise<YouTubeAPI>{
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(loading)return loading;
 loading=new Promise((resolve,reject)=>{
  const timeout=window.setTimeout(()=>{loading=undefined;reject(new Error('YouTube 載入逾時，請檢查網絡或重新載入投影頁。'));},20000);
  const previous=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=()=>{previous?.();clearTimeout(timeout);if(window.YT)resolve(window.YT);};
  if(!document.getElementById('youtube-api')){
   const script=document.createElement('script');script.id='youtube-api';script.src='https://www.youtube.com/iframe_api';
   script.onerror=()=>{clearTimeout(timeout);loading=undefined;script.remove();reject(new Error('無法載入 YouTube。'));};document.head.appendChild(script);
  }
 });
 return loading;
}

// IFrame API error codes; availability must be checked by the player, not oEmbed.
export function youtubeErrorMessage(code:number):string {
 const reasons:Record<number,string>={2:'影片 ID 無效，請檢查 YouTube 連結。',5:'HTML5 播放器發生錯誤，請重新載入或換用瀏覽器。',100:'影片不存在、已移除或已設為私人。',101:'影片擁有者不允許在其他網站嵌入播放。',150:'影片擁有者不允許在其他網站嵌入播放。',153:'YouTube 未收到來源識別。請用 HTTPS／localhost 開啟網站，不要使用 file://；若仍出錯，請檢查瀏覽器或網絡的來源資訊設定。'};
 return `YouTube 錯誤 ${code}：${reasons[code]??'無法播放，請檢查網絡或在 YouTube 開啟。'}`;
}
