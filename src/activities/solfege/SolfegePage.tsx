import { useEffect, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FullscreenButton } from '../../components/FullscreenButton';
import { ReferenceAudio } from './audio';
import { FINAL, STAFF_MAPPING, STAGES, initialGame, makeQuestions, transition, type Solfege, type StaffMapping } from './model';
import './solfege.css';
import runnerIdle from './assets/runner/idle-0.png';
import runner0 from './assets/runner/run-0.png';
import runner1 from './assets/runner/run-1.png';
import runner2 from './assets/runner/run-2.png';
import runner3 from './assets/runner/run-3.png';
import runnerWin from './assets/runner/celebrate-1.png';
const runnerFrames = [runner0,runner1,runner2,runner3];
function Badge({ filled }: { filled: boolean }) {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill={filled ? '#176b60' : '#e4ebe8'} /><path d="M38 16v29c0 8-17 10-17 1 0-6 8-9 13-6V19z" fill={filled ? 'white' : '#a2b4ae'} /></svg>;
}
function Journey({ collected }: { collected: number }) {
  const [frame,setFrame] = useState(-1);
  useEffect(()=>{
    if(collected===0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches){setFrame(-1);return;}
    let raf=0;const start=performance.now();
    const tick=(now:number)=>{const elapsed=now-start;if(elapsed>=1400){setFrame(-1);return;}setFrame(Math.floor(elapsed/110)%4);raf=requestAnimationFrame(tick);};
    raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
  },[collected]);
  useEffect(()=>{[runnerIdle,...runnerFrames,runnerWin].forEach(src=>{const img=new Image();img.src=src;});},[]);
  return <div className="su-journey" aria-label={`音符跑道：已完成 ${collected} 站，共六站`}>
    <div className="su-road" aria-hidden="true"><div className="su-road-fill" style={{width:`${collected/6*100}%`}}/></div>
    {Array.from({length:6},(_,i)=><div key={i} className={`su-stop ${i<collected?'is-collected':''}`} style={{left:`${18+i*14}%`}} aria-hidden="true"><span>{i<collected?'✓':'♪'}</span><small>{i+1}</small></div>)}
    <div className="su-runner" style={{left:`${4+collected*14}%`}} aria-label="戴耳機的小跑手">
      <span className="su-runner-shadow"/>
      {frame>=0 && <span className="su-speed-lines" aria-hidden="true">≋</span>}
      <img className="su-person" src={frame>=0?runnerFrames[frame]:collected===6?runnerWin:runnerIdle} alt="戴耳機的小跑手" draggable={false}/>
    </div>
    <svg className="su-finish" viewBox="0 0 60 70" aria-label={collected===6?'已解鎖':'終點鎖'}><g transform="translate(30,20)" fill="none" stroke="#176b60" strokeWidth="4"><path d="M-12 12 V0 a12 12 0 0 1 24 0" transform={collected===6?'rotate(-25 -12 12)':undefined}/><rect x="-18" y="12" width="36" height="30" rx="6" fill={collected===6?'#f4c963':'#eef3ef'}/><path d="M0 22v9"/></g></svg>
  </div>;

}
function Score({ notes, mapping, revealed, active }: { notes: readonly Solfege[]; mapping: StaffMapping; revealed: boolean; active: number }) {
  return <svg className="su-score" viewBox="0 75 1000 245" role="img" aria-label={revealed ? `二線譜：${notes.join('、')}` : '二線譜題目，請看音符位置唱'}>
    {notes.map((_, index) => active === index && <rect className="su-note-highlight" key={index} x={285 + (index + 0.5) * 600 / notes.length - 48} y="65" width="96" height="195" rx="24" fill="#f7d990" fillOpacity=".65"/>)}
    {mapping.lines.map(y => <line className="su-staff-line" key={y} x1="95" x2="950" y1={y} y2={y} stroke="#344b46" strokeWidth="4" />)}
    <g className="su-d-marker" aria-label="d 定位提示"><ellipse cx={mapping.marker.x} cy={mapping.marker.y} rx="34" ry="25" fill="none" stroke="#344b46" strokeWidth="3"/><text x={mapping.marker.x} y={mapping.marker.y + 15} textAnchor="middle" fontFamily="Georgia, serif" fontSize="48" fill="#344b46">d</text><text x={mapping.marker.x} y="295" textAnchor="middle" fontSize="19" fill="#647c73">定位</text></g>
    {notes.map((note, index) => {
      const x = 285 + (index + 0.5) * 600 / notes.length;
      return <g className={`su-note ${active===index?'su-active':''}`} key={index}>
        <ellipse className="su-notehead" cx={x} cy={mapping.positions[note]} rx="34" ry="25" fill="none" stroke="#172c38" strokeWidth="4" />
        {revealed && <text className="su-solfege-label" x={x} y="295" textAnchor="middle" fontSize="42" fontWeight="700" fill="#172c38">{note}</text>}
      </g>;
    })}
  </svg>;
}
export function SolfegePage() {
  const [game, dispatch] = useReducer(transition, undefined, initialGame);
  const audio = useRef<ReferenceAudio | null>(null);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState('');
  const [transpose, setTranspose] = useState(0);
  const [slow, setSlow] = useState(false);
  const [group, setGroup] = useState('第一排同學');
  const stage = Math.floor(game.index / 2);
  const notes = game.screen === 'final' ? FINAL : game.questions[game.index] ?? [];
  const playingScreen = game.screen === 'question' || game.screen === 'final';
  function stop() { audio.current?.stop(); setActive(-1); }
  useEffect(() => {
    const engine = new ReferenceAudio(); audio.current = engine;
    const leave = () => { engine.stop(); setActive(-1); };
    const hidden = () => { if (document.hidden) leave(); };
    window.addEventListener('pagehide', leave); document.addEventListener('visibilitychange', hidden);
    return () => { engine.dispose(); window.removeEventListener('pagehide', leave); document.removeEventListener('visibilitychange', hidden); };
  }, []);
  async function play(firstOnly: boolean) {
    setError('');
    try { await audio.current?.play(firstOnly ? notes.slice(0, 1) : notes, transpose, slow, setActive); }
    catch { setError('未能播放。老師可自行給音，繼續歌唱。'); }
  }
  function restart() {
    stop();
    if (game.screen === 'welcome' || window.confirm('重新開始？已收集的音符會歸零。')) { dispatch({ type: 'reset' }); setError(''); }
  }
  return <main className="su-app">
    <header className="su-top"><Link to="/start" onClick={stop}>‹ 課堂首頁</Link><span>小二音樂 · 合作視唱</span><FullscreenButton /></header>
    <section className="su-heading"><div><p className="eyebrow">{game.screen === 'welcome' ? '聽起音 · 看譜 · 一起唱' : game.screen === 'final' ? '最後挑戰' : game.screen === 'success' ? '合作完成' : `第 ${stage + 1} 階段｜${STAGES[stage]} · ${game.index + 1} / 6`}</p><h1>唱名解鎖</h1></div><div className="su-progress" aria-label={`已收集 ${game.collected} 枚，共 6 枚音符`}><div>{Array.from({ length: 6 }, (_, i) => <Badge key={i} filled={i < game.collected}/>)}</div><strong>{game.collected} / 6 枚音符</strong></div></section>
    <Journey collected={game.collected}/>
    <section className={`su-board ${game.awarded ? 'su-earned' : ''}`}>
      {game.screen === 'welcome' ? <div className="su-intro"><span className="su-tag">全班合作 · 約 5 分鐘</span><h2>用歌聲，集齊 6 枚音符</h2><p>先聽起音，想一想，再一起唱。</p><button className="primary" onClick={() => { stop(); dispatch({ type: 'start', questions: makeQuestions() }); }}>開始挑戰</button></div>
      : game.screen === 'success' ? <div className="su-intro"><span className="su-tag">6 枚音符，收集完成！</span><h2>一起解鎖最後一句</h2><p>先看譜唱，再聽示範比較。</p><button className="primary" onClick={() => { stop(); dispatch({ type: 'final' }); }}>最後挑戰</button></div>
      : <><div className="su-prompt" aria-live="polite">{game.awarded ? '已收集一枚音符！準備好才繼續。' : game.screen === 'final' ? '全班一起唱 · 先唱，再聽答案' : stage === 2 ? `請${group.trim() || '這一組同學'}唱` : stage === 0 ? '看一看，這是甚麼唱名？' : '全班看譜，把三個音連起來唱'}</div>
      <Score notes={notes} mapping={STAFF_MAPPING} revealed={game.revealed} active={active}/>
      </>}
    </section>
    {playingScreen && <section className="su-controls" aria-label="教師控制">
      <div className="su-listen"><button onClick={() => void play(true)}>給起音</button><button aria-pressed={game.revealed} onClick={() => dispatch({ type: 'reveal' })}>{game.revealed ? '隱藏唱名' : '顯示唱名'}</button><button onClick={() => void play(false)}>播放答案</button></div>
      <div className="su-decide">{game.screen !== 'final' && <button className="primary" disabled={game.awarded} onClick={() => { stop(); dispatch({ type: 'collect' }); }}>{game.awarded ? '已收集 ✓' : '完成，收集音符'}</button>}{game.awarded ? <button className="primary su-collected" onClick={() => { stop(); dispatch({ type: 'next' }); }}>{game.collected === 6 ? '查看解鎖成果' : '下一題'} →</button> : <button onClick={() => { stop(); dispatch({ type: 'retry' }); }}>再試一次</button>}</div>
    </section>}
    {error && <p className="su-error" role="alert">{error}</p>}
    <footer className="su-footer"><span>{playingScreen ? '老師給起音 → 學生先唱 → 聽示範比較' : ''}</span><div><button onClick={restart}>重新開始</button><details><summary>教師設定</summary><div className="su-settings"><label>參考調：整體移調<select value={transpose} onChange={e => { stop(); setTranspose(Number(e.target.value)); }}>{Array.from({ length: 13 }, (_, i) => i - 6).map(value => <option key={value} value={value}>{value === 0 ? '原調（do = C4）' : `${value > 0 ? '+' : ''}${value} 半音`}</option>)}</select></label><label>播放速度<select value={slow ? 'slow' : 'normal'} onChange={e => { stop(); setSlow(e.target.value === 'slow'); }}><option value="normal">正常</option><option value="slow">慢速</option></select></label><label>應答組別<input value={group} maxLength={24} onChange={e => setGroup(e.target.value)} /></label><p>真鋼琴錄音，各音等長；原調 do=C4、mi=E4、sol=G4，僅為可調參考音。教師判斷是否完成。本活動在目前裝置操作，不使用跨裝置同步。</p><p className="su-credit">鋼琴錄音：Versilian Studios / VSCO 2，經 tonejs-instruments 提供，<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>；播放時作移調及音量處理。</p></div></details></div></footer>
  </main>;
}
