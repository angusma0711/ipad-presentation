import { useContext, useEffect, useRef, useState } from 'react';
import type { Deck, DeckPlugin } from '../types';
import { deckAsset } from '../registry';
import { ActionContext } from '../../components/ActionContext';

const CHANNEL = 'p3-l2-system';
// One frame per view, kept across slide changes to retain worksheet vector ink.
function Slide({ deck, index }: { deck: Deck; index: number }) {
 const frame = useRef<HTMLIFrameElement>(null);
 const [ready, setReady] = useState(false);
 const action = useContext(ActionContext);
 const seen = useRef('');
 const current = useRef(index); current.current = index;
 const readonly = /(?:^|[\/#])control(?:\/|$)/.test(location.pathname + location.hash);
 const initial = useRef(deckAsset('./index.html', deck.assetBase) + '?embedded=1&v=' + encodeURIComponent(String(deck.data.revision ?? '1')) + (readonly ? '&readonly=1' : '') + '#' + deck.slides[index].id);
 function send(message: Record<string, unknown>) {
  frame.current?.contentWindow?.postMessage({ channel: CHANNEL, ...message }, location.origin);
 }
 useEffect(() => {
  const receive = (event: MessageEvent) => {
   if (event.origin !== location.origin || event.source !== frame.current?.contentWindow || event.data?.channel !== CHANNEL) return;
   if (event.data.type === 'ready') { setReady(true); return; }
   if (!readonly && event.data.type === 'navigate' && [-1, 1].includes(event.data.delta)) {
    // Let the existing parent keyboard handler perform local/Firebase navigation.
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: event.data.delta === -1 ? 'ArrowLeft' : 'ArrowRight', bubbles: true }));
   }
  };
  window.addEventListener('message', receive);
  return () => window.removeEventListener('message', receive);
 }, [readonly]);
 useEffect(() => {
  if (ready) send({ type: 'slide', id: deck.slides[index].id });
 }, [ready, deck, index]);
 useEffect(() => {
  if (!ready || readonly || !action || seen.current === action.commandId) return;
  seen.current = action.commandId;
  if (Date.now() - action.commandAt < 10000 && deck.slides[index].actions.some(item => item.id === action.action)) {
   send({ type: 'action', slideId: deck.slides[index].id, action: action.action });
  }
 }, [ready, readonly, action, deck, index]);
 return <iframe ref={frame} className="p3-l2-system-frame" src={initial.current}
  title="小三第二課：動人的配樂" tabIndex={readonly ? -1 : 0}
  style={readonly ? { pointerEvents: 'none' } : undefined}
  onLoad={() => { setReady(true); send({ type: 'slide', id: deck.slides[current.current].id }); }} />;
}
export default { Slide } satisfies DeckPlugin;
