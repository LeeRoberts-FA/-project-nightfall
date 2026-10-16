'use strict';
const fs=require('node:fs');const path=require('node:path');const {chromium}=require('playwright');
(async()=>{
const url=process.env.NIGHTFALL_URL||'http://127.0.0.1:30281';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--no-sandbox','--disable-dev-shm-usage']});
const failures=[],logs=[],failedRequests=[];
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const page=await context.newPage();
page.on('pageerror',err=>failures.push(err.message));
page.on('console',msg=>{if(msg.type()==='error'||msg.type()==='warning')logs.push(msg.text().slice(0,400))});
page.on('requestfailed',request=>failedRequests.push(request.url()+' '+request.failure()?.errorText));
try{
const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
if(response?.status()!==200)throw Error('Homepage HTTP status: '+response?.status());
await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('ONLINE'),{timeout:25000});
const options=await page.locator('.mode-option').count();if(options!==2)throw Error('Missing outbreak/raid game modes');
await page.locator('[data-mission="outbreak"]').click();
await page.locator('[data-difficulty="recruit"]').click();
await page.locator('#solo').click();
await page.waitForFunction(()=>!document.getElementById('game').classList.contains('hidden'),null,{timeout:20000});
await page.waitForTimeout(7000);
const result=await page.evaluate(()=>{
const c=document.querySelector('#combat3d'),hud=document.getElementById('wave');
return {threeCanvasPresent:!!c,canvasWidth:c?.width||0,canvasHeight:c?.height||0,webglSupported:!!document.createElement('canvas').getContext('webgl'),wave:hud?.textContent,health:document.querySelector('#health')?.textContent,visible:!document.getElementById('game').classList.contains('hidden'),visual:window.__nightfallVisualReport?.()||null};
});
const preview=await page.locator('.playfield').screenshot({type:'jpeg',quality:37,timeout:10000});
fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync(path.join('test-results','mobile-combat.jpg'),preview);const report={url,...result,console:logs.slice(0,12),pageErrors:failures,requestsFailed:failedRequests.slice(0,12),previewBytes:preview.length};fs.writeFileSync(path.join('test-results','mobile-report.json'),JSON.stringify(report,null,2));process.stdout.write('NIGHTFALL_VISUAL_REPORT:'+JSON.stringify(report)+'\n');
if(!result.visible||!result.threeCanvasPresent||result.canvasWidth<100||result.canvasHeight<100)throw Error('3D combat canvas did not initialize with a usable size');if(!result.visual?.loadedCharacters?.includes('survivor')||!result.visual?.loadedCharacters?.includes('zombie')||result.visual.displayedCharacterModels<2)throw Error('3D character assets did not load and replace placeholder figures');
if(failures.length)throw Error('Browser JS exceptions: '+failures.join('; '));
if(logs.some(x=>/asset failed|3d frame error|3d initialization|failed to load resource|module/i.test(x)))throw Error('3D renderer/asset load error: '+logs.join('; '));
}finally{await browser.close()}
})().catch(e=>{console.error('NIGHTFALL_BROWSER_FAILED:'+e.stack);process.exitCode=1});
