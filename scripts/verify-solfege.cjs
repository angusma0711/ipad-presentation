// Run with a local Vite server and PLAYWRIGHT_MODULE pointing to installed playwright.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({headless:true});
 const page = await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror', e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.audioEvents=[];
  const original=AudioContext.prototype.createBufferSource;
  AudioContext.prototype.createBufferSource=function(){
   const o=original.call(this), context=this;
   const start=o.start.bind(o),stop=o.stop.bind(o);
   o.start=t=>{window.audioEvents.push({kind:'start',at:t,frames:o.buffer.length,sr:o.buffer.sampleRate,rate:o.playbackRate.value});return start(t)};
   o.stop=t=>{window.audioEvents.push({kind:'stop',at:t??context.currentTime,immediate:t===undefined});return stop(t)};
   return o;
  };
 });
 const btn=name=>page.getByRole('button',{name,exact:true});
 await page.goto('http://127.0.0.1:5186/activities/solfege');
 await btn('開始挑戰').waitFor();await page.screenshot({path:'solfege-welcome.png'});
 const modelChecks=await page.evaluate(async()=>{
  const {makeQuestions}=await import('/src/activities/solfege/model.ts');
  return Array.from({length:1000},()=>makeQuestions()).every(q=>q.length===6&&q.every((n,i)=>n.every(x=>['do','mi','sol'].includes(x))&&(i<2?n.length===1:i<4?n.length===3:n.length>=3&&n.length<=4)&&(i===0||JSON.stringify(n)!==JSON.stringify(q[i-1]))));
 });assert.ok(modelChecks);
 assert.equal(await page.getByText('教師控制 · 不限時 · 不扣分',{exact:true}).count(),0);
 assert.equal(await page.locator('.su-intro small').count(),0);
 assert.equal(await page.locator('.su-person').count(),1);
 await btn('開始挑戰').click();
 assert.equal(await page.locator('details[open]').count(),0);
 assert.equal(await page.evaluate(()=>window.audioEvents.length),0);
 await btn('顯示唱名').click();
 const initial=await page.locator('.su-solfege-label').allTextContents();
 assert.ok(['do','mi','sol'].includes(initial[0]));
 await btn('再試一次').click();
 assert.equal(await page.locator('.su-solfege-label').count(),0);
 await btn('顯示唱名').click();assert.deepEqual(await page.locator('.su-solfege-label').allTextContents(),initial);
 await btn('給起音').click();await page.waitForFunction(()=>window.audioEvents.some(e=>e.kind==='start'));await page.waitForTimeout(170);
 assert.equal((await page.evaluate(()=>window.audioEvents)).filter(e=>e.kind==='start').length,1);
 assert.equal(await page.locator('.su-active').count(),1);
 await btn('再試一次').click();assert.equal(await page.locator('.su-active').count(),0);
 // Same-tick events exercise the reducer, beyond the DOM disabled guard.
 await btn('完成，收集音符').evaluate(el=>{el.click();el.click();el.click()});
 assert.equal(await page.locator('.su-progress strong').innerText(),'1 / 6 枚音符');
 await page.waitForTimeout(180);const poseA=await page.locator('.su-person').getAttribute('src');
 await page.waitForTimeout(125);const poseB=await page.locator('.su-person').getAttribute('src');
 assert.notEqual(poseA,poseB);assert.match(poseA,/run-/);
 await page.waitForTimeout(1200);assert.match(await page.locator('.su-person').getAttribute('src'),/idle-/);
 assert.match(await page.locator('.su-runner').getAttribute('style'),/18%/);
 await page.getByRole('button',{name:'下一題'}).click();
 assert.equal(await page.locator('.su-solfege-label').count(),0);
 for(let i=1;i<6;i++){
  if(i===2){
   await page.evaluate(()=>window.audioEvents=[]);
   await btn('播放答案').click();await page.waitForFunction(()=>window.audioEvents.some(e=>e.kind==='start'));await page.waitForTimeout(150);
   const starts=(await page.evaluate(()=>window.audioEvents)).filter(e=>e.kind==='start');
   assert.equal(starts.length,3);assert.ok(Math.abs(starts[1].at-starts[0].at-.72)<.001);
   await page.waitForTimeout(720);assert.equal(await page.locator('.su-note').nth(1).getAttribute('class'),'su-note su-active');
   await btn('播放答案').click();
   assert.ok((await page.evaluate(()=>window.audioEvents)).some(e=>e.immediate));
   await btn('再試一次').click();
  }
  if(i===4){await page.getByText('教師設定',{exact:true}).click();await page.getByLabel('應答組別').fill('第二組');await page.getByText('教師設定',{exact:true}).click();assert.match(await page.locator('.su-prompt').innerText(),/第二組/);}
  await btn('完成，收集音符').click();
  assert.equal(await page.locator('.su-progress strong').innerText(),`${i+1} / 6 枚音符`);
  await page.getByRole('button',{name:i===5?'查看解鎖成果':'下一題'}).click();
 }
 await btn('最後挑戰').click();assert.equal(await page.locator('.su-note').count(),4);
 assert.equal(await page.locator('.su-staff-line').count(),2);
 assert.deepEqual(await page.locator('.su-staff-line').evaluateAll(els=>els.map(e=>e.getAttribute('y1'))),['150','230']);
 assert.deepEqual(await page.locator('.su-notehead').evaluateAll(els=>els.map(e=>e.getAttribute('cy'))),['190','150','110','190']);
 assert.equal(await page.locator('.su-d-marker ellipse').getAttribute('cy'),'190');
 assert.ok((await page.locator('.su-notehead').evaluateAll(els=>els.map(e=>e.getAttribute('fill')))).every(x=>x==='none'));
 await btn('顯示唱名').click();
 assert.deepEqual(await page.locator('.su-solfege-label').allTextContents(),['do','mi','sol','do']);
 for(const size of [{width:1280,height:720},{width:1920,height:1080},{width:1024,height:768},{width:390,height:844}]){
  await page.setViewportSize(size);
  await page.screenshot({path:`solfege-${size.width}.png`});
  const dims=await page.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight}));
  assert.ok(dims.w<=size.width,`horizontal overflow ${JSON.stringify(size)} ${JSON.stringify(dims)}`);
  if(size.width>=1024)assert.ok(dims.h<=size.height,`vertical overflow ${JSON.stringify(size)} ${JSON.stringify(dims)}`);
 }
 await page.setViewportSize({width:1280,height:720});
 await page.screenshot({path:'solfege-preview.png'});
 await page.getByText('教師設定',{exact:true}).click();
 await page.getByLabel('參考調：整體移調').selectOption('2');
 await page.getByLabel('播放速度').selectOption('slow');
 await page.evaluate(()=>window.audioEvents=[]);
 await btn('播放答案').click();await page.waitForFunction(()=>window.audioEvents.some(e=>e.kind==='start'));await page.waitForTimeout(100);
 const shifted=(await page.evaluate(()=>window.audioEvents)).filter(e=>e.kind==='start');
 assert.equal(shifted.length,4);assert.ok(Math.abs(shifted[0].rate-2**(-1/12))<.00001);
 assert.ok(shifted[0].frames>shifted[0].sr);
 assert.ok(Math.abs(shifted[1].at-shifted[0].at-1.05)<.001);
 await page.getByLabel('應答組別').fill('第二組');
 assert.equal(await page.locator('.su-active').count(),1);
 await page.getByRole('link',{name:'‹ 課堂首頁'}).click();
 assert.ok((await page.evaluate(()=>window.audioEvents)).filter(e=>e.immediate).length>=4);
 await page.getByRole('link',{name:'開啟唱名解鎖'}).click();await btn('開始挑戰').click();
 page.once('dialog',d=>d.accept());await btn('重新開始').click();await btn('開始挑戰').waitFor();
 // Cancel while a real recording is still loading: it must never play later.
 await page.reload();await btn('開始挑戰').click();
 let releaseSample;let sampleRequested=false;
 const gate=new Promise(resolve=>{releaseSample=resolve});
 await page.route(/\.mp3(?:\?.*)?$/,async route=>{sampleRequested=true;await gate;await route.continue()});
 await btn('給起音').click();
 for(let i=0;i<50&&!sampleRequested;i++)await page.waitForTimeout(20);
 assert.ok(sampleRequested);
 await btn('再試一次').click();releaseSample();await page.waitForTimeout(800);
 assert.equal((await page.evaluate(()=>window.audioEvents)).filter(e=>e.kind==='start').length,0);
 await page.unroute(/\.mp3(?:\?.*)?$/);
 // Complete all six questions without Web Audio available.
 await page.reload();await page.evaluate(()=>{window.AudioContext=undefined;window.webkitAudioContext=undefined});
 await btn('開始挑戰').click();await btn('給起音').click();await page.getByRole('alert').waitFor();
 for(let i=0;i<6;i++){await btn('完成，收集音符').click();await page.getByRole('button',{name:i===5?'查看解鎖成果':'下一題'}).click()}
 await btn('最後挑戰').click();
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: six-question flow, retry/reveal/reset, duplicate collection guard, audio first-note/sequence/replay/highlight/exit, audio-failure fallback, 4 viewports and home navigation.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
