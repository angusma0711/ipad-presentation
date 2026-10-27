import { appURL } from '../utils/urls';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { defaultPresentationId, loadAllDecks } from '../presentations/registry';
import type { Deck } from '../presentations/types';
import { createSession } from '../services/sessionService';
export function StartPage() {
    const [presentationId,setPresentationId]=useState(defaultPresentationId);
    const [id, setId] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [decks, setDecks] = useState<Deck[]>([]);
    useEffect(()=>{let current=true;loadAllDecks().then(list=>{if(current)setDecks(list);},()=>{if(current)setError('未能載入簡報清單，請重新載入。');});return()=>{current=false;};},[]);
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
        setId(await createSession(presentationId));
    }
    catch (err) {
        setError(err instanceof Error ? err.message : '未能建立課堂。');
    }
    finally {
        setBusy(false);
    } }
    return <main className="shell start"><p className="eyebrow">課堂簡報 · V2</p><h1>走到學生身邊，<br />掌握課堂節奏。</h1><p>電腦投影，iPad 遙控。教師筆記留在控制頁。</p>{!id ? <section className="card"><h2>開始一個課堂</h2><p>建立連線後，用 iPad 掃描 QR code。</p><label htmlFor="lesson-choice">選擇簡報</label><select id="lesson-choice" disabled={busy} value={presentationId} onChange={event=>setPresentationId(event.target.value)}>{decks.map(lesson=><option key={lesson.id} value={lesson.id}>{lesson.title} · {lesson.slides.length} 頁</option>)}</select><p></p><button className="primary" disabled={busy} onClick={() => void start()}>{busy ? '正在建立…' : '建立簡報課堂'}</button><p className="small">建立課堂需要連接互聯網。<a href={appURL(`/preview/${presentationId}`)}>預覽此簡報</a>（不需連線，不會同步）</p></section> : <section className="card"><h2>課堂 {id}</h2><div className="qr"><QRCodeSVG value={control} size={256} marginSize={4} level="M"/></div><p>{localHost?'Mac 與 iPad 連接同一 Wi-Fi，再用 iPad 相機掃描，開啟教師控制器。':'電腦與 iPad 連接互聯網，再用 iPad 相機掃描，開啟教師控制器；可以使用不同 Wi-Fi。'}</p><label>Presentation<a className="url" href={present} target="_blank" rel="noreferrer">{present}</a></label><label>Controller<a className="url" href={control} target="_blank" rel="noreferrer">{control}</a></label><a className="button primary" href={present} target="_blank" rel="noreferrer">Open Presentation</a>{localHost && sharedOrigin !== location.origin && <p className="small">QR code 已使用 Mac 的區域網絡 IP：{sharedURL.hostname}。</p>}{localHost && sharedOrigin === location.origin && <p className="error">未能找到 Mac 的區域網絡 IP。請以伺服器顯示的 Network URL 開啟此頁。</p>}</section>}<section className="card"><p className="eyebrow">單機課堂活動 · 小二音樂</p><h2>唱名解鎖</h2><p>看二線譜、唱 do／mi／sol，全班合作收集 6 枚音符。</p><a className="button primary" href={appURL('/activities/solfege')}>開啟唱名解鎖</a><p className="small">教師在投影裝置直接控制，不需建立課堂或登入。已按考試圖片核對二線譜，配合鋼琴參考音及音符跑道。</p></section>{error && <p className="error" role="alert">{error}</p>}</main>;
}
