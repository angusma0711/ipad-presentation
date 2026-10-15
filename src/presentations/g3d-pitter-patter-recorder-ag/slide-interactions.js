// Shared by standalone preview and React; contains no teacher data or Firebase code.
export function attachSlideInteractions(root) {
  if (!root) return () => {};
  let animations = [];
  let run = 0;
  const getSlide = () => root.querySelector('#g3d-melody-descending');
  function reset() {
    run++;
    animations.forEach(animation => animation.cancel());
    animations = [];
    const slide = getSlide();
    if (!slide) return;
    slide.querySelectorAll('.pp-draw-line').forEach(line => line.style.removeProperty('stroke-dashoffset'));
    const button = slide.querySelector('[data-action="draw-contour"]');
    const status = slide.querySelector('.pp-draw-status');
    if (button) button.textContent = '開始';
    if (status) status.textContent = '按開始，看看旋律怎樣走。';
  }
  async function start() {
    reset();
    const slide = getSlide();
    if (!slide) return;
    const token = run;
    const button = slide.querySelector('[data-action="draw-contour"]');
    const status = slide.querySelector('.pp-draw-status');
    const lines = [...slide.querySelectorAll('.pp-draw-line')];
    button.textContent = '重新開始';
    status.textContent = '跟着橙色連線，用手勢畫出旋律。';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    animations = lines.map((line, index) => line.animate(
      [{ strokeDashoffset: '100' }, { strokeDashoffset: '0' }],
      { duration: reduced ? 1 : 2500, delay: reduced ? 0 : index * 2850, easing: 'linear', fill: 'forwards' }
    ));
    try {
      await Promise.all(animations.map(animation => animation.finished));
      if (token !== run) return;
      lines.forEach(line => line.style.strokeDashoffset = '0');
      animations.forEach(animation => animation.cancel());
      animations = [];
      button.textContent = '再看一次';
      status.textContent = '四句畫好了！旋律主要向哪裡走？';
    } catch { /* Navigation or replay cancels the previous drawing. */ }
  }
  function click(event) {
    const button = event.target.closest?.('[data-action="draw-contour"]');
    if (!button || !root.contains(button)) return;
    event.stopPropagation();
    void start();
  }
  function slideChange(event) {
    if (event.detail?.slideId !== 'g3d-melody-descending') reset();
  }
  root.addEventListener('click', click);
  window.addEventListener('presentation:slidechange', slideChange);
  reset();
  return () => {
    reset();
    root.removeEventListener('click', click);
    window.removeEventListener('presentation:slidechange', slideChange);
  };
}
