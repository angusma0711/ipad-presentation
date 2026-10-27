import type { ComponentType } from 'react';
import type { LessonInteraction } from '../types/interaction';
import type {SlideAction} from '../components/ActionContext';
import type {MediaFeedback} from '../types/teaching';
import type { MediaKind } from '../types/teaching';
export type DeckMedia = { kind: MediaKind; src: string };
export type DeckAction = { id: string; label: string };
// One slide in deck.json. Extra fields (kind, track…) are kept for deck plugins.
export type DeckSlide = { id: string; title: string; notes: string; html?: string; media: DeckMedia[]; actions: DeckAction[]; [field: string]: unknown };
export type DeckControlsProps = {sendAction?:(action:string)=>void;action?:SlideAction|null;feedback?:MediaFeedback|null; deck: Deck; index: number; state: LessonInteraction; disabled: boolean; change: (patch: Partial<LessonInteraction>) => void; playMedia: (media: DeckMedia) => void };
// Optional plugin.tsx beside deck.json, for decks that need more than HTML slides.
export type DeckPlugin = {
 Slide?: ComponentType<{ deck: Deck; index: number; passive?:boolean; preview?: boolean; action?: SlideAction | null }>;
 Controls?: ComponentType<DeckControlsProps>;
 attach?: (root: HTMLElement) => () => void;
};
export type Deck = { id: string; title: string; order: number; assetBase: string; viewClass?: string; slides: DeckSlide[]; data: Record<string, unknown>; plugin: DeckPlugin };
