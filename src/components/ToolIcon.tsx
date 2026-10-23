export type TeacherCategory='slides'|'action'|'pen'|'timer'|'groups'|'media';
export function ToolIcon({name}:{name:TeacherCategory|'menu'|'close'|'undo'}){
 const paths={slides:<><rect x="2" y="2" width="20" height="15" rx="2"/><path d="M12 17v5M6 22h12"/></>,action:<path d="m14 1-11 13h8l-2 9L23 9h-9V1Z"/>,pen:<path d="m3 21 2-7L17 2l5 5-12 12-7 2ZM14 5l5 5"/>,timer:<><circle cx="12" cy="14" r="9"/><path d="M8 2h8M12 5V2m0 7v5l4 2"/></>,groups:<path d="M5 3h14l-1 10-6 4-6-4-1-10ZM5 5H1l1 7 4 1m13-8h4l-1 7-4 1m-6 4v5m-5 0h10"/>,media:<><rect x="1" y="3" width="22" height="18" rx="3"/><path d="m9 8 8 4-8 5V8Z"/></>,menu:<path d="M2 5h20M2 12h20M2 19h20"/>,close:<path d="m6 6 12 12M6 18 18 6"/>,undo:<path d="M8 4 3 9l5 5M3 9h11a7 7 0 0 1 0 14"/>};
 return <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}
