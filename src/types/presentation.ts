import type { ReactNode } from 'react';
export type Slide = {
    id: string;
    title: string;
    content: ReactNode;
    speakerNotes: string;
};
export type Connection = 'Connected' | 'Reconnecting…' | 'Offline';
