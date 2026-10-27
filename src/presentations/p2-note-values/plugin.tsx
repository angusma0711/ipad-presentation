import {useCallback,useContext,useLayoutEffect,useRef,useState} from 'react';
import {InkHostSetter} from '../../components/InkHostContext';
import {deckAsset} from '../registry';
import type {Deck,DeckPlugin} from '../types';
type Region={x:number;y:number;w:number;h:number};
function NoteTree(){
 const rows=[{count:1,y:65,label:'全音符',beats:'4 拍',kind:'whole'},{count:2,y:205,label:'二分音符',beats:'2 拍',kind:'half'},{count:4,y:345,label:'四分音符',beats:'1 拍',kind:'quarter'},{count:8,y:485,label:'八分音符',beats:'半拍',kind:'eighth'}];
 const x=(count:number,i:number)=>300+(i+.5)*1040/count;
 return <section className="nv-tree"><h1>音符樹</h1><svg viewBox="0 0 1400 580" role="img" aria-label="一個全音符等於兩個二分音符、四個四分音符或八個八分音符"><defs><g id="nv-whole"><ellipse cx="0" cy="0" rx="21" ry="13" fill="white" stroke="currentColor" strokeWidth="5"/></g><g id="nv-half"><ellipse cx="0" cy="0" rx="16" ry="11" transform="rotate(-20)" fill="white" stroke="currentColor" strokeWidth="4"/><path d="M15 -4V-64" stroke="currentColor" strokeWidth="4"/></g><g id="nv-quarter"><ellipse cx="0" cy="0" rx="17" ry="12" transform="rotate(-20)" fill="currentColor"/><path d="M15 -4V-64" stroke="currentColor" strokeWidth="4"/></g><g id="nv-eighth"><use href="#nv-quarter"/><path d="M15 -64C22 -44 48 -45 29 -17C37 -39 23 -37 15 -43Z" fill="currentColor"/></g></defs>{rows.slice(0,3).map((r,j)=>Array.from({length:r.count},(_,i)=>[0,1].map(k=><path key={`${j}-${i}-${k}`} d={`M${x(r.count,i)} ${r.y+20}L${x(r.count*2,i*2+k)} ${rows[j+1].y-78}`} fill="none" stroke="#9ab7ab" strokeWidth="3"/>)))}{rows.map(r=><g key={r.kind}><text x="10" y={r.y-5} fontSize="38" fill="#173f45" fontWeight="700">{r.label}</text><text x="10" y={r.y+40} fontSize="34" fill="#176b60">{r.beats}</text>{Array.from({length:r.count},(_,i)=><use key={i} href={`#nv-${r.kind}`} transform={`translate(${x(r.count,i)} ${r.y})`}/>)}</g>)}</svg><p>以四分音符為一拍</p></section>;
}
function Slide({deck,index}:{deck:Deck;index:number}){
 const page=deck.slides[index],viewport=useRef<HTMLDivElement>(null),setInkHost=useContext(InkHostSetter);
 const [size,setSize]=useState({w:0,h:0});
 const host=useCallback((node:HTMLDivElement|null)=>setInkHost(node),[setInkHost]);
 useLayoutEffect(()=>{const node=viewport.current;if(!node)return;const measure=()=>setSize({w:node.clientWidth,h:node.clientHeight});measure();const observer=new ResizeObserver(measure);observer.observe(node);return()=>observer.disconnect();},[index]);
 const region=page.region as Region|undefined,aspect=Number(page.pageWidth)/Number(page.pageHeight);
 const ra=region?region.w/region.h*aspect:1;
 const width=region?Math.min(size.w,size.h*ra):0,height=width/ra;
 return <div className="nv-viewport" ref={viewport}>
 {page.kind==='title'?<section className="nv-title"><p>小二音樂</p><h1>音符時值</h1></section>:page.kind==='tree'?<NoteTree/>:region&&<div className="nv-question-crop" style={{width,height,left:(size.w-width)/2,top:(size.h-height)/2}}><div className="nv-sheet" style={{width:width/region.w,height:height/region.h,left:-region.x*width/region.w,top:-region.y*height/region.h}}><img src={deckAsset(String(page.image),deck.assetBase)} alt={page.title} draggable={false}/><div ref={host} className="nv-ink-host" data-page-w={page.pageWidth} data-page-h={page.pageHeight}/></div></div>}
 {page.kind!=='question'&&<div ref={host} className="nv-ink-host" data-page-w="1600" data-page-h="900"/>}
 </div>;
}
export default {Slide} satisfies DeckPlugin;
