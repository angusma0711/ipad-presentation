import {useState} from 'react';
import type {DeckPlugin,DeckControlsProps} from '../types';
import {deckAsset} from '../registry';
import {attachMusicPictures} from './runtime.js';
import config from './media-config.json';
import deck from './deck.json';
function Controls({disabled}:DeckControlsProps){
 const [value,setValue]=useState(()=>{try{return localStorage.getItem('p3l3-music-maker-url')??'';}catch{return '';}});
 const [status,setStatus]=useState('');
 return <details className="card"><summary>Music Maker 教師設定</summary><p>此網址只儲存在本裝置；投影電腦須另設同一網址。學生不需登入或操作 App。</p><form onSubmit={event=>{event.preventDefault();try{const url=new URL(value);if(!['http:','https:'].includes(url.protocol))throw Error();localStorage.setItem('p3l3-music-maker-url',url.href);setStatus('已儲存。');}catch{setStatus('請輸入有效的 http／https 網址。');}}}><label>Music Maker 網址<input value={value} onChange={event=>setValue(event.target.value)} type="url" required/></label><button disabled={disabled}>儲存本機設定</button></form><p role="status">{status}</p></details>;
}
export default {Controls,attach:(root:HTMLElement)=>attachMusicPictures(root,config,path=>deckAsset(path.startsWith('./')?path:'./'+path,deck.assetBase))} satisfies DeckPlugin;
