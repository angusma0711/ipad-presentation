// Checks every lesson deck before a build. Structure problems stop the build;
// missing media files only warn, so a lesson can be published before its recordings exist.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const decksDir = join(root, 'src/presentations');
const errors = [], warnings = [];
const publicFile = path => existsSync(join(root, 'public', decodeURIComponent(path.replace(/^\//, '').split(/[?#]/)[0])));
const resolveAsset = (path, base) => path.startsWith('./') ? base.replace(/\/$/, '') + '/' + path.slice(2) : path;
const folders = readdirSync(decksDir, { withFileTypes: true }).filter(entry => entry.isDirectory() && !entry.name.startsWith('_')).map(entry => entry.name);
for (const id of folders) {
 const file = join(decksDir, id, 'deck.json');
 if (!existsSync(file)) continue;
 const where = `${id}/deck.json`;
 let deck;
 try { deck = JSON.parse(readFileSync(file, 'utf8')); } catch (error) { errors.push(`${where}: JSON 格式錯誤 – ${error.message}`); continue; }
 if (!/^[a-z0-9-]{1,60}$/.test(id)) errors.push(`${id}: 資料夾名稱只可用小楷英文、數字及 -`);
 if (typeof deck.title !== 'string' || !deck.title) errors.push(`${where}: 缺少 title`);
 const base = typeof deck.assetBase === 'string' ? deck.assetBase : '/media/';
 if (!base.startsWith('/media/')) errors.push(`${where}: assetBase 必須以 /media/ 開始`);
 const plugin = existsSync(join(decksDir, id, 'plugin.tsx'));
 if (!Array.isArray(deck.slides) || deck.slides.length === 0) { errors.push(`${where}: slides 必須是非空陣列`); continue; }
 if (deck.slides.length > 100) errors.push(`${where}: 最多 100 張投影片`);
 const seen = new Set();
 deck.slides.forEach((slide, i) => {
  const at = `${where} 第 ${i + 1} 張`;
  if (typeof slide.id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(slide.id)) errors.push(`${at}: id 只可用英文、數字、- 或 _`);
  else if (seen.has(slide.id)) errors.push(`${at}: id「${slide.id}」重複`); else seen.add(slide.id);
  if (typeof slide.title !== 'string' || !slide.title) errors.push(`${at}: 缺少 title`);
  if (slide.notes !== undefined && typeof slide.notes !== 'string') errors.push(`${at}: notes 必須是文字`);
  if (typeof slide.html !== 'string' && !plugin) errors.push(`${at}: 缺少 html`);
  for (const [n, media] of (slide.media ?? []).entries()) {
   if (!['audio', 'video', 'youtube'].includes(media?.kind)) { errors.push(`${at}: media[${n}].kind 必須是 audio、video 或 youtube`); continue; }
   if (media.kind === 'youtube') { if (!/^[\w-]{11}$/.test(media.src)) errors.push(`${at}: YouTube media 要填 11 位影片 ID`); continue; }
   const path = resolveAsset(String(media.src), base);
   if (!path.startsWith('/media/')) errors.push(`${at}: 媒體路徑必須在 /media/ 內`);
   else if (!publicFile(path)) warnings.push(`${at}: 找不到媒體檔 public${path}`);
  }
  for (const action of slide.actions ?? []) if (!/^[a-z0-9-]{1,40}$/.test(action?.id ?? '') || typeof action.label !== 'string') errors.push(`${at}: actions 需要 id（小楷英文）及 label`);
  for (const [, path] of String(slide.html ?? '').matchAll(/\b(?:src|poster)="([^"]+)"/g)) {
   if (/^(https?:|data:)/.test(path)) continue;
   const resolved = resolveAsset(path, base);
   if (!publicFile(resolved)) warnings.push(`${at}: 找不到檔案 public${resolved}`);
  }
 });
}
for (const warning of new Set(warnings)) console.warn(`⚠️  ${warning}`);
for (const error of errors) console.error(`❌ ${error}`);
if (errors.length) { console.error(`\n簡報檢查失敗：${errors.length} 個錯誤。`); process.exit(1); }
console.log(`✅ 已檢查 ${folders.length} 份簡報${warnings.length ? `（${new Set(warnings).size} 個提示）` : ''}。`);
