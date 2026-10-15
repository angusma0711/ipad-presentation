import {execFileSync} from 'node:child_process';
import {readdirSync,rmSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
execFileSync(process.execPath,['scripts/check-decks.mjs'],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-b'],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--base=/ipad-presentation/','--outDir=dist-pages'],{cwd:root,env:{...process.env,VITE_PAGES:'true'},stdio:'inherit'});
function clean(folder){for(const file of readdirSync(folder,{withFileTypes:true})){const path=join(folder,file.name);if(file.isDirectory())clean(path);else if(file.name.endsWith('.md')||file.name.includes('GENERATION_PROMPTS'))rmSync(path);}}
clean(join(root,'dist-pages'));
writeFileSync(join(root,'dist-pages','.nojekyll'),'');
const output=join(root,'ipad-presentation-site.zip');rmSync(output,{force:true});
execFileSync('/usr/bin/zip',['-qr',output,'.'],{cwd:join(root,'dist-pages')});
console.log(`Pages deployment package: ${output}`);
