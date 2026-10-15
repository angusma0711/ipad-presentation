import type { Deck } from '../presentations/types';
import { SlideNavigator } from './SlideNavigator';
export function ControllerPanel({ deck, index, disabled, navigate }: { deck: Deck; index: number; disabled: boolean; navigate: (change: { delta: number } | { index: number }) => void }) {
 const slide = deck.slides[index];
 return <><section className="card"><p className="eyebrow">投影片 {index + 1} / {deck.slides.length}</p><h1>{slide.title}</h1></section><section className="card"><h2>投影片</h2><SlideNavigator deck={deck} index={index} disabled={disabled} onSelect={index => navigate({ index })}/></section><section className="card notes"><p className="eyebrow">僅教師控制頁顯示</p><h2>Speaker Notes</h2><p>{slide.notes}</p></section></>;
}
