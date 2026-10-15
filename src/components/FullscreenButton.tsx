import {useEffect,useState} from 'react';
type SafariElement=HTMLElement & {webkitRequestFullscreen?:()=>Promise<void>|void};
type SafariDocument=Document & {webkitFullscreenElement?:Element|null;webkitExitFullscreen?:()=>Promise<void>|void};
export function FullscreenButton({overlay=false}:{overlay?:boolean}){
 const [active,setActive]=useState(false);const [error,setError]=useState('');
 const current=()=>Boolean(document.fullscreenElement||(document as SafariDocument).webkitFullscreenElement);
 useEffect(()=>{const change=()=>{setActive(current());setError('');};change();document.addEventListener('fullscreenchange',change);document.addEventListener('webkitfullscreenchange',change);return()=>{document.removeEventListener('fullscreenchange',change);document.removeEventListener('webkitfullscreenchange',change);};},[]);
 async function toggle(){
  setError('');
  try{
   const doc=document as SafariDocument;const element=document.documentElement as SafariElement;
   if(current()){if(doc.exitFullscreen)await doc.exitFullscreen();else if(doc.webkitExitFullscreen)await doc.webkitExitFullscreen();}
   else if(element.requestFullscreen)await element.requestFullscreen();
   else if(element.webkitRequestFullscreen)await element.webkitRequestFullscreen();
   else setError('此瀏覽器不支援網頁全螢幕；iPad 可用 Safari「分享 → 加入主畫面」再開啟。');
  }catch{setError('無法進入全螢幕，請在這部裝置直接按按鈕重試。');}
 }
 return <div className={`fullscreen-tools ${overlay?'fullscreen-overlay':''}`}><button type="button" aria-pressed={active} onClick={()=>void toggle()}>{active?'退出全螢幕':'⛶ 全螢幕'}</button>{error&&<p className="fullscreen-message" role="status">{error}</p>}</div>;
}
