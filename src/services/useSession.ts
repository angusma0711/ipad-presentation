import { useCallback, useEffect, useRef, useState } from 'react';
import { clampSlide, defaultPresentationId } from '../presentations/registry';
import type { Deck } from '../presentations/types';
import type { Connection } from '../types/presentation';
import { navigateSession, subscribeSession, validSession } from './sessionService';
export function useSession(id: string, localFallback = false) {
    const [ended, setEnded] = useState(false);
    const deck = useRef<Deck | null>(null);
    const [presentationId,setPresentationId]=useState(defaultPresentationId);
    const [slide, setSlide] = useState(0);
    const current = useRef(0);
    const [status, setStatus] = useState<Connection>('Reconnecting…');
    const [error, setError] = useState('');
    const [missing, setMissing] = useState(false);
    const [retry, setRetry] = useState(0);
    const [busy, setBusy] = useState(false);
    const locked = useRef(false);
    const pending = useRef<number|null>(null);
    const confirmed = useRef(0);
    const committedAt = useRef(0);
    const generation = useRef(0);
    const connected = useRef(false);
    useEffect(() => {
        let cancelled = false;
        const run=++generation.current;
        pending.current=null;locked.current=false;committedAt.current=0;setBusy(false);
        let stop: (() => void) | undefined;
        setMissing(false);
        setEnded(false);
        setError('');
        connected.current = false;
        if (!validSession(id)) {
            setMissing(true);
            setStatus('Offline');
            return;
        }
        const online = () => { connected.current = false; setStatus('Reconnecting…'); setRetry(value => value + 1); };
        const offline = () => { connected.current = false; pending.current=null; setStatus('Offline'); };
        window.addEventListener('online', online);
        window.addEventListener('offline', offline);
        if (!navigator.onLine)
            offline();
        subscribeSession(id, session => {
            if (cancelled)
                return;
            const cached = session?.cached ?? false;
            connected.current = !cached && navigator.onLine;
            setStatus(navigator.onLine ? (cached ? 'Reconnecting…' : 'Connected') : 'Offline');
            if (session === null) {
                setMissing(true);
                connected.current = false;
                return;
            }
            const {slide: index, presentationId: nextDeck, updatedAt} = session;
            setPresentationId(nextDeck);
            setEnded(session.ended);
            if (session.ended) connected.current = false;
            setMissing(false);
            setError('');
            if(updatedAt<committedAt.current)return;
            if (!cached) confirmed.current=index;
            if ((!cached || !localFallback) && !locked.current && pending.current===null) {
                setSlide(index);
                current.current = index;
            }
        }, err => { if (!cancelled) {
            connected.current = false;
            setStatus('Offline');
            setError(err.message);
        } }).then(unsubscribe => { if (cancelled)
            unsubscribe();
        else
            stop = unsubscribe; }).catch(err => { if (!cancelled) {
            setStatus('Offline');
            setError(err instanceof Error ? err.message : '連線失敗。');
        } });
        return () => { cancelled = true; if(generation.current===run)generation.current++;pending.current=null;connected.current = false; stop?.(); window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
    }, [id, retry, localFallback]);
    const navigate = useCallback(async (change: {
        delta: number;
    } | {
        index: number;
    }) => {
        const next = clampSlide('delta' in change ? current.current + change.delta : change.index,deck.current);
        if (ended) return;
        if (!connected.current || !navigator.onLine || missing) {
            if (localFallback) {
                current.current = next;
                setSlide(next);
            }
            return;
        }
        // Show the selected page immediately; only the latest waiting selection is sent.
        if(next===current.current && !locked.current)return;
        current.current=next;setSlide(next);pending.current=next;
        if(locked.current)return;
        const run=generation.current;
        locked.current=true;setBusy(true);setError('');
        try {
            while(pending.current!==null && connected.current && navigator.onLine && generation.current===run){
                const target=pending.current;pending.current=null;
                const timestamp=await navigateSession(id,target);
                if(generation.current===run){confirmed.current=target;committedAt.current=Math.max(committedAt.current,timestamp??0);}
            }
        } catch(err){
            if(generation.current===run){
                pending.current=null;
                setError(err instanceof Error?err.message:'更新失敗，請重試。');
                if(!localFallback){current.current=confirmed.current;setSlide(confirmed.current);}
            }
        } finally {
            if(generation.current===run){
                // Drop unsent requests on disconnect rather than replaying them later.
                if(!connected.current||!navigator.onLine){pending.current=null;if(!localFallback){current.current=confirmed.current;setSlide(confirmed.current);}}
                locked.current=false;setBusy(false);
            }
        }
    }, [id, missing, ended, localFallback]);
    // The page loads the deck after the session names it; navigation clamps to its length.
    const setDeck = useCallback((value: Deck | null) => { deck.current = value; }, []);
    return { presentationId, slide, status, error, missing, ended, busy, navigate, setDeck };
}
