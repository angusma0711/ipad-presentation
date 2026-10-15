export type Group = { name: string; points: number };
export type GroupsState = { groups: Group[]; visible: boolean };
export type Point = { x: number; y: number };
export type Stroke = { id: string; points: Point[]; color: string; width: number };
export type PointerState = Point & { active: boolean; slide: number; expiresAt: number };
export type MediaKind = 'audio' | 'video' | 'youtube';
export type MediaAction = 'play' | 'pause' | 'restart';
export type MediaConfig = { kind: MediaKind; src: string; commandId: string; action: MediaAction; commandAt: number };
export type MediaFeedback = { commandId: string; status: 'ready' | 'playing' | 'paused' | 'ended' | 'blocked' | 'error'; message: string };
export const defaultGroups = (): GroupsState => ({ visible: false, groups: Array.from({length:4}, (_,i) => ({name:`第 ${i+1} 組`,points:0})) });
export const uid = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), byte => byte.toString(16).padStart(2,'0')).join('');
export function validStrokes(value: unknown): Stroke[] {
 if (!Array.isArray(value)) return [];
 return value.slice(0,30).filter((s): s is Stroke => !!s && typeof s.id === 'string' && s.id.length <= 32
  && ['#e63946','#176b60','#1b4fc4'].includes(s.color) && [3,6,10].includes(s.width)
  && Array.isArray(s.points) && s.points.length > 0 && s.points.length <= 120
  && s.points.every((p:Point) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1));
}
export function mediaSource(kind: MediaKind, input: string) {
 if (kind === 'youtube') {
  if (/^[\w-]{11}$/.test(input.trim())) return input.trim();
  const url = new URL(input.trim());
  const host = url.hostname.toLowerCase();
  if (!['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com'].includes(host)) throw new Error('請輸入 YouTube 影片連結。');
  const id = host === 'youtu.be' ? url.pathname.slice(1).split('/')[0] : url.searchParams.get('v') ?? url.pathname.split('/').at(-1);
  if (!id || !/^[\w-]{11}$/.test(id)) throw new Error('YouTube 影片連結無效。');
  return id;
 }
 const raw = input.trim();
 if (!raw.startsWith('/media/') || raw.includes('..') || raw.includes('\\') || /[?#]/.test(raw)) throw new Error('本機媒體請使用 /media/檔案名稱。');
 const path = decodeURIComponent(raw);
 if (path.includes('..') || path.includes('\\') || !path.startsWith('/media/')) throw new Error('本機媒體路徑無效。');
 const extension = kind === 'audio' ? /\.(mp3|wav|m4a|ogg)$/i : /\.(mp4|webm|mov)$/i;
 if (!extension.test(path)) throw new Error(kind === 'audio' ? '請使用 MP3、WAV、M4A 或 OGG。' : '請使用 MP4、WebM 或 MOV。');
 return raw;
}
