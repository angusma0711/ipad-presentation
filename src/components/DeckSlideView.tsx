import { useContext, useEffect, useMemo, useRef } from 'react';
import { ActionContext } from './ActionContext';
import { deckAsset } from '../presentations/registry';
import type { Deck } from '../presentations/types';
// Deck HTML is authored lesson material, never student input.
function prepare(html: string, base: string) {
 // Audio and video play through the shared media player, so inline players are removed.
 return html.replace(/\b(src|poster)="(\.\/[^"]+)"/g, (_, attribute, path) => `${attribute}="${deckAsset(path, base)}"`)
  .replace(/<(audio|video)\b[^>]*>[\s\S]*?<\/\1>/g, '');
}
function HtmlSlide({ deck, index, passive=false }: { deck: Deck; index: number; passive?: boolean }) {
 const root = useRef<HTMLDivElement>(null);
 const command = useContext(ActionContext);
 const seen = useRef('');
 const html = useMemo(() => prepare(deck.slides[index].html ?? '', deck.assetBase), [deck, index]);
 useEffect(() => !passive && root.current && deck.plugin.attach ? deck.plugin.attach(root.current) : undefined, [deck, html, passive]);
 // A controller action button clicks the matching data-action element on the projector.
 useEffect(() => {
  if (passive || !command || seen.current === command.commandId) return; seen.current = command.commandId;
  if (Date.now() - command.commandAt < 10000) root.current?.querySelector<HTMLElement>(`[data-action="${CSS.escape(command.action)}"]`)?.click();
 }, [command, passive]);
 return <div ref={root} className={typeof deck.data.htmlClass === 'string' ? deck.data.htmlClass : 'deck-html'} dangerouslySetInnerHTML={{ __html: html }} />;
}
export function DeckSlideView({ deck, index, passive=false, preview=false }: { deck: Deck; index: number; passive?: boolean; preview?:boolean }) {
 const Custom = deck.plugin.Slide;
 return Custom ? <Custom deck={deck} index={index} passive={passive||preview} /> : <HtmlSlide passive={passive} key={deck.slides[index].id} deck={deck} index={index} />;
}
