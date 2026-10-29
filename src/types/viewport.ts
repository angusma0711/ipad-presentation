export type SlideViewport={scale:number;x:number;y:number};
export const fullViewport:SlideViewport={scale:1,x:0,y:0};
export function clampViewport(value:SlideViewport):SlideViewport{
 const scale=Math.max(1,Math.min(4,Number.isFinite(value.scale)?value.scale:1));
 return {scale,x:Math.max(1-scale,Math.round(Math.max(1-scale,Math.min(0,value.x))*100000)/100000),y:Math.max(1-scale,Math.round(Math.max(1-scale,Math.min(0,value.y))*100000)/100000)};
}
export function readViewport(data:Record<string,unknown>|null):SlideViewport{
 if(!data||![data.scale,data.x,data.y].every(v=>typeof v==='number'&&Number.isFinite(v)))return fullViewport;
 return clampViewport({scale:Number(data.scale),x:Number(data.x),y:Number(data.y)});
}
