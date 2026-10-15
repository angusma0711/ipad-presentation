import { useEffect } from 'react';
// Keeps the projector and iPad screens on during a lesson. The browser drops the lock
// whenever the tab is hidden, so it is requested again when the page becomes visible.
export function useWakeLock(enabled = true) {
 useEffect(() => {
  if (!enabled || !('wakeLock' in navigator)) return;
  let lock: WakeLockSentinel | null = null; let disposed = false;
  const request = () => { if (document.visibilityState !== 'visible' || (lock && !lock.released)) return; navigator.wakeLock.request('screen').then(sentinel => { if (disposed) void sentinel.release(); else lock = sentinel; }).catch(() => {}); };
  request();
  document.addEventListener('visibilitychange', request);
  // Some browsers only grant the lock after a tap.
  document.addEventListener('pointerdown', request);
  return () => { disposed = true; document.removeEventListener('visibilitychange', request); document.removeEventListener('pointerdown', request); void lock?.release().catch(() => {}); };
 }, [enabled]);
}
