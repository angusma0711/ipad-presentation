import type { DeckPlugin } from '../types';
// Worksheet slides are HTML. iPad actions click the matching [data-action] control.
// State stays in the slide DOM and resets when the class leaves the slide.
function attach(root: HTMLElement) {
 const slide = root.querySelector<HTMLElement>('.nv-slide');
 if (!slide) return () => {};
 const status = slide.querySelector<HTMLElement>('.nv-status');
 function blanks() { return [...slide!.querySelectorAll<HTMLElement>('.nv-blank:not(.nv-given)')]; }
 function bars() { return [...slide!.querySelectorAll<HTMLElement>('.nv-bar')]; }
 function act(action: string) {
  if (action === 'reveal-next') {
   slide!.classList.remove('nv-revealed');
   const pending = blanks().find(item => !item.classList.contains('nv-shown'));
   if (pending) pending.classList.add('nv-shown');
   else blanks().forEach(item => item.classList.remove('nv-shown'));
   if (status) status.textContent = pending ? '對一對這個空格。' : '答案已收起。';
  } else if (action === 'reveal-all') {
   const show = !slide!.classList.contains('nv-revealed');
   slide!.classList.toggle('nv-revealed', show);
   if (show) blanks().forEach(item => item.classList.remove('nv-shown'));
   if (status) status.textContent = show ? '全部答案已顯示。請學生加拍。' : '答案已收起。';
  } else if (action === 'next-bar') {
   const items = bars();
   const current = items.findIndex(item => item.classList.contains('nv-on'));
   items.forEach(item => item.classList.remove('nv-on'));
   const next = current + 1;
   if (next < items.length) {
    items[next].classList.add('nv-on');
    if (status) status.textContent = `第 ${next + 1} 小節：一共 ${items[next].dataset.beats} 拍`;
   } else if (status) status.textContent = '指着小節，跟學生一起數拍。';
  } else if (action.startsWith('self-')) {
   const face = slide!.querySelector<HTMLElement>(`[data-face="${action}"]`);
   const chosen = face?.classList.contains('nv-pick') ?? false;
   slide!.querySelectorAll('.nv-face').forEach(item => item.classList.remove('nv-pick'));
   if (!chosen) face?.classList.add('nv-pick');
  }
 }
 const click = (event: MouseEvent) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!button || !root.contains(button)) return;
  event.preventDefault();
  act(button.dataset.action!);
 };
 root.addEventListener('click', click);
 return () => root.removeEventListener('click', click);
}
export default { attach } satisfies DeckPlugin;
