import {createContext} from 'react';
import {initialInteraction,type LessonInteraction} from '../types/interaction';
import type {DeckMedia} from '../presentations/types';
export const InteractionContext=createContext<{state:LessonInteraction;change?:(patch:Partial<LessonInteraction>)=>void;playMedia?:(media:DeckMedia)=>void;next?:()=>void}>({state:initialInteraction()});
