export type Solfege = 'do' | 'mi' | 'sol';
export const REFERENCE_MIDI: Record<Solfege, number> = { do: 60, mi: 64, sol: 67 };
export type StaffMapping = { source: string; lines: [number, number]; positions: Record<Solfege, number>; marker: { x: number; y: number } };
// Verified against IMG_5634.jpeg (2026-10-27). Upper/lower lines are one
// diatonic third apart: do in the space, mi on upper line, sol above it.
// Empty, unstemmed oval noteheads match the source; no clef or ledger lines.
// Printed coordinates and playback pitch remain independent configurations.
export const STAFF_MAPPING: StaffMapping = {
  source: 'IMG_5634.jpeg, supplied examination scope, sight-singing example',
  lines: [150, 230],
  positions: { do: 190, mi: 150, sol: 110 },
  marker: { x: 155, y: 190 },
};
export const BANK: readonly (readonly (readonly Solfege[])[])[] = [
  [['do'], ['mi'], ['sol']],
  [['do', 'do', 'mi'], ['sol', 'sol', 'mi'], ['mi', 'do', 'mi'], ['mi', 'sol', 'mi']],
  [['do', 'mi', 'sol'], ['sol', 'mi', 'do'], ['mi', 'mi', 'sol', 'mi'], ['sol', 'mi', 'do', 'mi']],
];
export const FINAL: readonly Solfege[] = ['do', 'mi', 'sol', 'do'];
export const STAGES = ['找到唱名', '唱名接龍', '小隊解鎖'];
export function makeQuestions(random = Math.random): Solfege[][] {
  return BANK.flatMap(pool => {
    const first = Math.min(pool.length - 1, Math.floor(random() * pool.length));
    const remaining = pool.filter((_, index) => index !== first);
    const second = Math.min(remaining.length - 1, Math.floor(random() * remaining.length));
    return [[...pool[first]], [...remaining[second]]];
  });
}
export type Game = { screen: 'welcome' | 'question' | 'success' | 'final'; index: number; collected: number; revealed: boolean; awarded: boolean; questions: Solfege[][] };
export function initialGame(): Game {
  return { screen: 'welcome', index: 0, collected: 0, revealed: false, awarded: false, questions: [] };
}
export type Action = { type: 'start'; questions: Solfege[][] } | { type: 'reset' | 'reveal' | 'retry' | 'collect' | 'next' | 'final' };
export function transition(state: Game, action: Action): Game {
  switch (action.type) {
    case 'start': return { ...initialGame(), screen: 'question', questions: action.questions };
    case 'reset': return initialGame();
    case 'reveal': return { ...state, revealed: !state.revealed };
    case 'retry': return state.awarded ? state : { ...state, revealed: false };
    case 'collect': return state.screen !== 'question' || state.awarded ? state : { ...state, awarded: true, collected: state.collected + 1 };
    case 'next': return !state.awarded || state.screen !== 'question' ? state : state.collected === 6 ? { ...state, screen: 'success', revealed: false } : { ...state, index: state.index + 1, awarded: false, revealed: false };
    case 'final': return state.screen === 'success' ? { ...state, screen: 'final', awarded: false, revealed: false } : state;
  }
}
