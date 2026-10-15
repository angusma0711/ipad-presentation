export type LessonInteraction={choice:boolean;phase:'listen'|'compare'|'vote'|'explain';revealed:boolean;timbre:boolean;timbreSelections:number[];selection:number|null;revisionRevealed:boolean};
export const initialInteraction=():LessonInteraction=>({choice:false,phase:'listen',revealed:false,timbre:false,timbreSelections:[],selection:null,revisionRevealed:false});
export function readInteraction(data:Record<string,unknown>|null):LessonInteraction{
 const d=initialInteraction();if(!data)return d;
 return {...d,choice:data.choice===true,phase:['listen','compare','vote','explain'].includes(String(data.phase))?data.phase as LessonInteraction['phase']:'listen',revealed:data.revealed===true,timbre:data.timbre===true,revisionRevealed:data.revisionRevealed===true,selection:[0,1,2].includes(Number(data.selection))&&data.selection!==null?Number(data.selection):null,timbreSelections:Array.isArray(data.timbreSelections)?data.timbreSelections.filter(x=>[0,1,2].includes(x)):[]};
}
