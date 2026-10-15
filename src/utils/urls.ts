// Cloud-hosted builds can live under a repository path without changing stored media paths.
export const assetURL=(path:string)=>path.startsWith('/media/')?`${import.meta.env.BASE_URL}${path.slice(1)}`:path;
export const appURL=(path:string,origin=location.origin)=>`${origin}${import.meta.env.BASE_URL}${import.meta.env.VITE_PAGES==='true'?'#'+path:path.replace(/^\//,'')}`;
