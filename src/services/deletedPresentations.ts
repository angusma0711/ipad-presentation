const STORAGE_KEY='iboard.deleted-presentations.v1';
export function readDeletedPresentations():string[]{
 try{const value:unknown=JSON.parse(localStorage.getItem(STORAGE_KEY)??'[]');return Array.isArray(value)?value.filter((id):id is string=>typeof id==='string'):[];}catch{return [];}
}
export function saveDeletedPresentations(ids:string[]){localStorage.setItem(STORAGE_KEY,JSON.stringify([...new Set(ids)]));}

const pageKey=(deckId:string)=>`iboard.deleted-slides.v1.${deckId}`;
export function readDeletedSlides(deckId:string):string[]{try{const data:unknown=JSON.parse(localStorage.getItem(pageKey(deckId))??'[]');return Array.isArray(data)?data.filter((id):id is string=>typeof id==='string'):[];}catch{return [];}}
export function saveDeletedSlides(deckId:string,ids:string[]){localStorage.setItem(pageKey(deckId),JSON.stringify([...new Set(ids)]));}
