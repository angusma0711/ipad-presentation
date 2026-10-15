import type { Deck } from '../presentations/types';
export function SlideNavigator({ deck, index, disabled, onSelect }: { deck: Deck; index: number; disabled: boolean; onSelect: (index: number) => void }) {
 return <nav className="navigator" aria-label="選擇投影片">{deck.slides.map((slide, i) => <button key={slide.id} disabled={disabled} aria-label={`${i + 1}：${slide.title}`} aria-current={i === index ? 'step' : undefined} onClick={() => onSelect(i)}>{i + 1}</button>)}</nav>;
}
