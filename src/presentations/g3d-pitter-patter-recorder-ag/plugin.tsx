import type { DeckPlugin } from '../types';
import { attachSlideInteractions } from './slide-interactions.js';
// P3 slides are plain HTML; this only adds the melody-contour animation.
export default { attach: attachSlideInteractions } satisfies DeckPlugin;
