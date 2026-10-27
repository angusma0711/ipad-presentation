import { createContext } from 'react';
// Worksheet slides register the page element that ink must cover.
// Strokes are stored in that element's box, not the 16:9 slide.
export const InkHostSetter = createContext<(host: HTMLElement | null) => void>(() => {});
