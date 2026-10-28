import {readDeletedPresentations,saveDeletedPresentations,readDeletedSlides} from '../services/deletedPresentations';
import { appURL } from '../utils/urls';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { defaultPresentationId, loadAllDecks } from '../presentations/registry';
import type { Deck } from '../presentations/types';
import { createSession } from '../services/sessionService';
export function StartPage() {
    const [presentationId,setPresentationId]=useState(defaultPresentationId);
    const [deleted,setDeleted]=useState(readDeletedPresentations);
    const [id, setId] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [decks, setDecks] = useState<Deck[]>([]);
    useEffect(()=>{let current=true;loadAllDecks().then(list=>{if(current)setDecks(list);},()=>{if(current)setError('未能載入簡報清單，請重新載入。');});return()=>{current=false;};},[]);
    const available=decks.filter(deck=>!deleted.includes(deck.id));
    const removed=decks.filter(deck=>deleted.includes(deck.id));
    const selected=available.find(deck=>deck.id===presentationId)??available[0];
    const selectedId=selected?.id??'';
    useEffect(()=>{const refresh=()=>setDeleted(readDeletedPresentations());window.addEventListener('storage',refresh);return()=>window.removeEventListener('storage',refresh);},[]);
    function updateDeleted(next:string[]){try{saveDeletedPresentations(next);setDeleted(next);setError('');}catch{setError('未能儲存刪除記錄。請檢查瀏覽器儲存空間或私密瀏覽設定。');}}
    function removeSelected(){if(!selected||!window.confirm(`刪除「${selected.title}」？\n只會從此瀏覽器的清單移除，可在「已刪除簡報」復原。`))return;updateDeleted([...deleted,selected.id]);}
    const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    const [lanHost,setLanHost]=useState(__PRESENTATION_LAN_HOST__);
    useEffect(()=>{
        if(!import.meta.env.DEV||!localHost)return;
        let disposed=false;
        const refresh=()=>{void fetch('/__lan-host',{cache:'no-store'}).then(response=>response.json()).then(value=>{if(!disposed&&typeof value.host==='string')setLanHost(value.host);}).catch(()=>{});};
        refresh();const timer=setInterval(refresh,10000);
        return()=>{disposed=true;clearInterval(timer);};
    },[localHost]);
    const sharedURL = new URL(location.origin);
    if (import.meta.env.DEV && localHost && lanHost) {
        sharedURL.hostname = lanHost;
    }
    const sharedOrigin = sharedURL.origin;
    const control = appURL(`/control/${id}`,sharedOrigin);
    const present = appURL(`/present/${id}`,sharedOrigin);
    async function start() { setBusy(true); setError(''); try {
        if(!selectedId)return;
        setId(await createSession(selectedId));
    }
    catch (err) {
        setError(err instanceof Error ? err.message : '未能建立課堂。');
    }
    finally {
        setBusy(false);
    } }
    return <main className="shell start"><p className="eyebrow">課堂簡報 · V2</p><h1>走到學生身邊，<br />掌握課堂節奏。</h1><p>電腦投影，iPad 遙控。教師筆記留在控制頁。</p>{!id ? <section className="card"><h2>開始一個課堂</h2><p>建立連線後，用 iPad 掃描 QR code。</p><label htmlFor="lesson-choice">選擇簡報</label><select id="lesson-choice" disabled={busy||!available.length} value={selectedId} onChange={event=>setPresentationId(event.target.value)}>{available.map(lesson=><option key={lesson.id} value={lesson.id}>{lesson.title} · {lesson.slides.filter(slide=>!readDeletedSlides(lesson.id).includes(slide.id)).length} 頁</option>)}</select><p></p><div className="tool-bar"><button className="primary" disabled={busy||!selectedId} onClick={() => void start()}>{busy ? '正在建立…' : '建立簡報課堂'}</button><button type="button" disabled={busy||!selectedId} onClick={removeSelected}>刪除此簡報</button></div>{selectedId?<p className="small">建立課堂需要連接互聯網。<a href={appURL(`/preview/${selectedId}`)}>預覽此簡報</a>（不需連線，不會同步）</p>:<p>清單內沒有簡報。可從「已刪除簡報」復原。</p>}<p className="small">刪除只影響目前瀏覽器的清單，可隨時復原。</p>{removed.length>0&&<details className="deleted-presentations"><summary>已刪除簡報（{removed.length}）</summary><ul>{removed.map(deck=><li key={deck.id}><span>{deck.title}</span><button type="button" disabled={busy} onClick={()=>updateDeleted(deleted.filter(id=>id!==deck.id))}>復原</button></li>)}</ul></details>}</section> : <section className="card"><h2>課堂 {id}</h2><div className="qr"><QRCodeSVG value={control} size={256} marginSize={4} level="M"/></div><p>{localHost?'Mac 與 iPad 連接同一 Wi-Fi，再用 iPad 相機掃描，開啟教師控制器。':'電腦與 iPad 連接互聯網，再用 iPad 相機掃描，開啟教師控制器；可以使用不同 Wi-Fi。'}</p><label>Presentation<a className="url" href={present} target="_blank" rel="noreferrer">{present}</a></label><label>Controller<a className="url" href={control} target="_blank" rel="noreferrer">{control}</a></label><a className="button primary" href={present} target="_blank" rel="noreferrer">Open Presentation</a>{localHost && sharedOrigin !== location.origin && <p className="small">QR code 已使用 Mac 的區域網絡 IP：{sharedURL.hostname}。</p>}{localHost && sharedOrigin === location.origin && <p className="error">未能找到 Mac 的區域網絡 IP。請以伺服器顯示的 Network URL 開啟此頁。</p>}</section>}{error && <p className="error" role="alert">{error}</p>}</main>;
}
