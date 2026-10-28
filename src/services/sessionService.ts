import {readDeletedSlides} from './deletedPresentations';
import { fastWrite } from './fastWrite';
import { doc, runTransaction, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { database } from './firebase';
import { deckIds, defaultPresentationId, loadDeck, MAX_SLIDES } from '../presentations/registry';
export const validSession = (id: string) => /^[A-HJ-NP-Z2-9]{6}$/.test(id);
// Keep in step with LESSON_HOURS in firestore.rules.
export const LESSON_HOURS = 24;
export type SessionSnapshot = { slide: number; cached: boolean; presentationId: string; updatedAt: number; ended: boolean; slideOrder: number[] | null };
export async function createSession(presentationId=defaultPresentationId) {
    if(!deckIds.includes(presentationId)) throw new Error('簡報不存在。');
    const deck=await loadDeck(presentationId);
    const deleted=readDeletedSlides(presentationId);
    const slideOrder=deck.slides.map((slide,index)=>deleted.includes(slide.id)?-1:index).filter(index=>index>=0);
    if(!slideOrder.length)throw new Error('沒有可播放的投影片，請先在預覽復原至少一頁。');
    const db = await database();
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 12; attempt++) {
        const bytes = crypto.getRandomValues(new Uint8Array(6));
        const id = Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('');
        const created = await runTransaction(db, async (tx) => {
            const ref = doc(db, 'sessions', id);
            if ((await tx.get(ref)).exists())
                return false;
            tx.set(ref, { currentSlide: 0, presentationId, ...(deleted.length?{slideOrder}:{}), status: 'active', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
            return true;
        });
        if (created)
            return id;
    }
    throw new Error('未能產生獨特課堂代碼，請重試。');
}
export async function subscribeSession(id: string, receive: (session: SessionSnapshot | null) => void, fail: (error: Error) => void) {
    const db = await database();
    return onSnapshot(doc(db, 'sessions', id), { includeMetadataChanges: true }, snapshot => {
        if (!snapshot.exists()) {
            if (!snapshot.metadata.fromCache)
                receive(null);
            return;
        }
        const data = snapshot.data();
        if (!deckIds.includes(data.presentationId) || !['active','ended'].includes(data.status) || !Number.isInteger(data.currentSlide) || data.currentSlide < 0 || data.currentSlide >= MAX_SLIDES) {
            fail(new Error('課堂資料無效。'));
            return;
        }
        // Pending server timestamps read as null until the write is confirmed.
        const createdAt = data.createdAt?.toMillis?.() ?? Date.now();
        const ended = data.status === 'ended' || Date.now() - createdAt > LESSON_HOURS * 3600000;
        const order=data.slideOrder;
        if(order!==undefined&&(!Array.isArray(order)||!order.length||order.length>MAX_SLIDES||new Set(order).size!==order.length||!order.every(n=>Number.isInteger(n)&&n>=0&&n<MAX_SLIDES))){fail(new Error('課堂頁序無效。'));return;}
        receive({ slideOrder:order??null, slide: data.currentSlide, cached: snapshot.metadata.fromCache, presentationId: data.presentationId, updatedAt: data.updatedAt?.toMillis?.() ?? 0, ended });
    }, fail);
}
export async function navigateSession(id: string, index: number) {
    return await fastWrite(`sessions/${id}`, {currentSlide:index}, true);
}
export async function endSession(id: string) {
    try { await fastWrite(`sessions/${id}`, {status:'ended'}, true); }
    catch { throw new Error('未能結束課堂。請確認已發布最新的 Firestore Rules，並檢查連線。'); }
}
