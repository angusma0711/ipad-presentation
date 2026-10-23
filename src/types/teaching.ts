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
export const MAX_STROKES = 30, MAX_POINTS = 300;
export function validStrokes(value: unknown): Stroke[] {
 if (!Array.isArray(value)) return [];
 return value.slice(0,30).filter((s): s is Stroke => !!s && typeof s.id === 'string' && s.id.length <= 32
  && ['#e63946','#176b60','#1b4fc4'].includes(s.color) && [3,6,10].includes(s.width)
  && Array.isArray(s.points) && s.points.length > 0 && s.points.length <= MAX_POINTS
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
// Ramer–Douglas–Peucker: keeps the shape of a long stroke within MAX_POINTS.
export function simplify(points: Point[], max = MAX_POINTS): Point[] {
 if (points.length <= max) return points;
 let tolerance = .0008, result = points;
 while (result.length > max) { result = rdp(points, tolerance); tolerance *= 1.6; }
 return result;
}
function rdp(points: Point[], tolerance: number): Point[] {
 if (points.length < 3) return points;
 const first = points[0], last = points[points.length - 1];
 let index = 0, distance = 0;
 for (let i = 1; i < points.length - 1; i++) {
  const p = points[i], dx = last.x - first.x, dy = last.y - first.y, length = Math.hypot(dx, dy) || 1e-9;
  const d = Math.abs(dy * p.x - dx * p.y + last.x * first.y - last.y * first.x) / length;
  if (d > distance) { distance = d; index = i; }
 }
 if (distance <= tolerance) return [first, last];
 return [...rdp(points.slice(0, index + 1), tolerance).slice(0, -1), ...rdp(points.slice(index), tolerance)];
}
// Smooth curve through the points (quadratic segments between midpoints), in a 1600×900 box.
export function smoothPath(points: Point[]) {
 const p = points.map(point => [point.x * 1600, point.y * 900]);
 if (p.length < 3) return `M${p[0][0]},${p[0][1]}` + p.slice(1).map(([x, y]) => `L${x},${y}`).join('');
 let d = `M${p[0][0]},${p[0][1]}`;
 for (let i = 1; i < p.length - 1; i++) d += `Q${p[i][0]},${p[i][1]} ${(p[i][0] + p[i + 1][0]) / 2},${(p[i][1] + p[i + 1][1]) / 2}`;
 const end = p[p.length - 1];
 return d + `L${end[0]},${end[1]}`;
}
export const roundPoint = (point: Point): Point => ({ x: Math.round(point.x * 10000) / 10000, y: Math.round(point.y * 10000) / 10000 });

export type ClassroomTimer = {visible:boolean;running:boolean;duration:number;remaining:number;endsAt:number;x:number;y:number;width:number};
export const defaultTimer = ():ClassroomTimer => ({visible:false,running:false,duration:180,remaining:180,endsAt:0,x:.72,y:.04,width:.24});
export function readTimer(data:Record<string,unknown>|null):ClassroomTimer {
 const fallback=defaultTimer();if(!data)return fallback;
 if(typeof data.visible!=='boolean'||typeof data.running!=='boolean'||!Number.isInteger(data.duration)||Number(data.duration)<1||Number(data.duration)>5999||!Number.isFinite(data.remaining)||Number(data.remaining)<0||Number(data.remaining)>5999||!Number.isFinite(data.endsAt)||Number(data.endsAt)<0||!Number.isFinite(data.x)||!Number.isFinite(data.y)||!Number.isFinite(data.width)||Number(data.width)<.15||Number(data.width)>.5||Number(data.x)<0||Number(data.x)>1-Number(data.width)||Number(data.y)<0||Number(data.y)>.98-Number(data.width)*.75)return fallback;
 return data as unknown as ClassroomTimer;
}
export const timerRemaining=(timer:ClassroomTimer)=>timer.running?Math.max(0,(timer.endsAt-Date.now())/1000):timer.remaining;

export type MediaLayout={x:number;y:number;width:number};
export function boundedMediaLayout(value:MediaLayout):MediaLayout {
 const width=Math.max(.3,Math.min(1,value.width));
 return {width,x:Math.max(0,Math.min(1-width,value.x)),y:Math.max(0,Math.min(1-width,value.y))};
}
