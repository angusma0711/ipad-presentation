import { createContext } from 'react';
export type SlideAction = {commandId:string;commandAt:number;action:string};
export const ActionContext=createContext<SlideAction|null>(null);
