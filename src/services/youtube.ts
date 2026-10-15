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
