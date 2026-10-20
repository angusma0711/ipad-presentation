import type { ReactNode } from 'react';
import { PresentationView } from './PresentationView';
import type { Deck } from '../presentations/types';
import { SlideNavigator } from './SlideNavigator';
export function ControllerPanel({ deck, index, disabled, navigate, children }: { deck: Deck; index: number; disabled: boolean; children?: ReactNode; navigate: (change: { delta: number } | { index: number }) => void }) {
 const slide = deck.slides[index];
 return <><section className="card"><p className="eyebrow">投影片 {index + 1} / {deck.slides.length}</p><h1>{slide.title}</h1></section><section className="card"><h2>投影片</h2><SlideNavigator deck={deck} index={index} disabled={disabled} onSelect={index => navigate({ index })}/></section>{children}{index+1<deck.slides.length?<section className="card next-slide-card"><h2>下一頁 · {index+2}：{deck.slides[index+1].title}</h2><div className="preview-frame passive-preview" inert><PresentationView deck={deck} index={index+1} preview passive/></div></section>:<section className="card"><p>已到最後一頁</p></section>}<section className="card notes"><p className="eyebrow">僅教師控制頁顯示</p><h2>Speaker Notes</h2><p>{slide.notes}</p></section></>;
}
