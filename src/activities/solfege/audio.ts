import { nearestPiano } from './piano';
import { REFERENCE_MIDI, type Solfege } from './model';
export class ReferenceAudio {
  private context: AudioContext | null = null;
  private nodes: AudioBufferSourceNode[] = [];
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private frame = 0;
  private generation = 0;
  stop() {
    this.generation++;
    cancelAnimationFrame(this.frame);
    for (const node of this.nodes) { try { node.stop(); } catch { /* Already stopped. */ } node.disconnect(); }
    this.nodes = [];
  }
  async play(notes: readonly Solfege[], transpose: number, slow: boolean, highlight: (index: number) => void) {
    this.stop(); highlight(-1);
    const generation = this.generation;
    try {
      const Audio = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Audio) throw new Error('Web Audio unavailable');
      this.context ??= new Audio();
      const context = this.context;
      await context.resume(); // Invoked directly by the teacher's click, also on Safari.
      if (generation !== this.generation) return;
      if (context.state !== 'running') throw new Error('Audio suspended');
      const step = slow ? 1.05 : 0.72;
      const duration = step * 0.84;
      const prepared = await Promise.all(notes.map(async note => {
        const midi = REFERENCE_MIDI[note] + transpose;
        const recording = nearestPiano(midi);
        let loading = this.buffers.get(recording.url);
        if (!loading) {
          loading = fetch(recording.url).then(response => {
            if (!response.ok) throw new Error('Piano sample unavailable');
            return response.arrayBuffer();
          }).then(bytes => context.decodeAudioData(bytes)).then(buffer => {
            let peak = 0;
            for (let c=0;c<buffer.numberOfChannels;c++) for (const value of buffer.getChannelData(c)) peak=Math.max(peak,Math.abs(value));
            if (peak>0) for(let c=0;c<buffer.numberOfChannels;c++) {
              const data=buffer.getChannelData(c);for(let i=0;i<data.length;i++) data[i]*=0.7/peak;
            }
            return buffer;
          }).catch(error => { this.buffers.delete(recording.url); throw error; });
          this.buffers.set(recording.url, loading);
        }
        return { buffer: await loading, rate: 2 ** ((midi-recording.midi)/12) };
      }));
      // A retry, route change or hidden tab can cancel while recordings load.
      if (generation !== this.generation) return;
      if (context.state !== 'running') throw new Error('Audio suspended');
      const start = context.currentTime + 0.06;
      prepared.forEach(({buffer,rate}, index) => {
        const at = start + index * step;
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        source.playbackRate.value = rate;
        gain.gain.setValueAtTime(0,at);
        gain.gain.linearRampToValueAtTime(0.75,at+0.006);
        gain.gain.setValueAtTime(0.75,at+duration-0.08);
        gain.gain.linearRampToValueAtTime(0,at+duration);
        source.connect(gain);gain.connect(context.destination);
        source.onended = () => {source.disconnect();gain.disconnect();};
        this.nodes.push(source);
        source.start(at); source.stop(at + duration);
      });
      const tick = () => {
        if (generation !== this.generation) return;
        if (context.state !== 'running') { this.stop(); highlight(-1); return; }
        // Use the audio clock for highlights, rather than an independent timer.
        const elapsed = context.currentTime - start;
        const index = Math.floor(elapsed / step);
        highlight(elapsed >= 0 && index < notes.length && elapsed - index * step < duration ? index : -1);
        if (elapsed < (notes.length - 1) * step + duration) this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    } catch (error) {
      if (generation !== this.generation) return;
      this.stop(); highlight(-1); throw error;
    }
  }
  dispose() { this.stop(); void this.context?.close().catch(() => {}); this.context = null; this.buffers.clear(); }
}
