'use strict';
const fs=require('node:fs');const path=require('node:path');const {chromium}=require('playwright');
(async()=>{
const url=process.env.NIGHTFALL_URL||'http://127.0.0.1:30281';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--no-sandbox','--disable-dev-shm-usage']});
const failures=[],logs=[],failedRequests=[];let guestPage=null;
async function waitNetwork(p,predicate,label){let last;for(let n=0;n<100;n++){last=await p.evaluate(()=>window.__nightfallNetworkReport());if(predicate(last))return last;if(n%20===0)console.log('NIGHTFALL_NETWORK_WAIT:'+label+':'+JSON.stringify(last));await new Promise(resolve=>setTimeout(resolve,100))}throw Error(label+': '+JSON.stringify(last))}

const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage();
page.on('pageerror',err=>failures.push(err.message));
page.on('console',msg=>{if(msg.type()==='error'||msg.type()==='warning')logs.push(msg.text().slice(0,400))});
page.on('requestfailed',request=>failedRequests.push(request.url()+' '+request.failure()?.errorText));
try{
const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
if(response?.status()!==200)throw Error('Homepage HTTP status: '+response?.status());
await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('ONLINE'),{timeout:25000});
await page.waitForFunction(()=>document.querySelector('#renderStatus')?.dataset.ready==='true',null,{timeout:60000});
const options=await page.locator('.mode-option').count();if(options!==2)throw Error('Missing outbreak/raid game modes');
await page.locator('[data-mission="outbreak"]').click();
await page.locator('[data-difficulty="recruit"]').click();
await page.locator('#solo').click();
await page.waitForFunction(()=>!document.getElementById('game').classList.contains('hidden'),null,{timeout:20000});
await page.waitForFunction(()=>window.__nightfallVisualReport?.().renderer==='active',null,{timeout:30000});await page.waitForTimeout(1300);
const result=await page.evaluate(()=>{
const c=document.querySelector('#combat3d'),hud=document.getElementById('wave');
return {threeCanvasPresent:!!c,canvasWidth:c?.width||0,canvasHeight:c?.height||0,webglSupported:!!document.createElement('canvas').getContext('webgl'),wave:hud?.textContent,health:document.querySelector('#health')?.textContent,visible:!document.getElementById('game').classList.contains('hidden'),visual:window.__nightfallVisualReport?.()||null};
});
const mobileControls=await page.evaluate(()=>{const ids=['moveStick','aimStick','fireMobile','abilityMobile','reloadButton','upgrade','exitGame'];const check=id=>{const el=document.getElementById(id),rect=el?.getBoundingClientRect();return {id,left:rect?.left,top:rect?.top,right:rect?.right,bottom:rect?.bottom,visible:!!(rect&&rect.width>0&&rect.height>0)}};const canvas=document.getElementById('combat3d');return {items:ids.map(check),overflow:document.documentElement.scrollWidth-window.innerWidth,renderScale:canvas?.width/canvas?.clientWidth||0,viewport:{w:window.innerWidth,h:window.innerHeight}}});
console.log('NIGHTFALL_MOBILE_LAYOUT:'+JSON.stringify(mobileControls));
for(const control of mobileControls.items){if(!control.visible||control.left< -2||control.right>mobileControls.viewport.w+2||control.top< -2||control.bottom>mobileControls.viewport.h+2)throw Error('Mobile combat control inaccessible: '+JSON.stringify(control))}
if(mobileControls.overflow>2)throw Error('Mobile layout overflows horizontally by '+mobileControls.overflow+' px');
if(mobileControls.renderScale>1.3)throw Error('Mobile WebGL backing resolution exceeds performance budget: '+mobileControls.renderScale);
await page.evaluate(()=>window.scrollTo(0,0));const preview=await page.screenshot({type:'jpeg',quality:80,timeout:20000});
fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync(path.join('test-results','mobile-combat.jpg'),preview);const report={url,...result,console:logs.slice(0,12),pageErrors:failures,requestsFailed:failedRequests.slice(0,12),previewBytes:preview.length};fs.writeFileSync(path.join('test-results','mobile-report.json'),JSON.stringify(report,null,2));process.stdout.write('NIGHTFALL_VISUAL_REPORT:'+JSON.stringify(report)+'\n');
if(!result.visible||!result.threeCanvasPresent||result.canvasWidth<100||result.canvasHeight<100)throw Error('3D combat canvas did not initialize with a usable size');if(!result.visual?.loadedCharacters?.includes('survivor')||!result.visual?.loadedCharacters?.includes('zombie')||result.visual.displayedCharacterModels<2)throw Error('3D character assets did not load and replace placeholder figures');if(!result.visual.playerVisible||Math.abs(result.visual.playerProjected?.x??99)>.75||Math.abs(result.visual.playerProjected?.y??99)>.75)throw Error('Playable character model not framed in on-screen camera');if(result.visual.drawCalls>450)throw Error('Mobile draw-call budget exceeded: '+result.visual.drawCalls);const bounds=result.visual.actorGeometry;if(!bounds||bounds.size[1]<1.5||bounds.size[1]>2.4||bounds.size[0]>2.5||bounds.head[1]>1||bounds.feet[1]<-1)throw Error('Animated soldier proportions or head-to-feet framing failed: '+JSON.stringify(bounds));if(bounds.head[1]-bounds.feet[1]<.24)throw Error('Character occupies too little screen height to read its details');if(!result.visual.pbrTexturesReady)throw Error('PBR surface textures did not load in browser');
await page.keyboard.down('w');await page.waitForTimeout(600);await page.keyboard.up('w');
const moved=await page.evaluate(()=>window.__nightfallVisualReport?.().playerWorld);
if(!moved||Math.hypot(moved[0]-result.visual.playerWorld[0],moved[2]-result.visual.playerWorld[2])<.2)throw Error('Keyboard movement did not move the networked character');
// Real browser Touch Events instead of mouse simulation: ensures transparent
// render overlay cannot steal iPhone thumbstick input.
const cdp=await context.newCDPSession(page);
async function touch(type,id,x,y){return cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:Math.round(x),y:Math.round(y),id,radiusX:5,radiusY:5,force:.8}]})}
const beforeStick=await page.evaluate(()=>window.__nightfallVisualReport().playerWorld);
const stick=await page.locator('#moveStick').boundingBox(),sx=stick.x+stick.width*.5,sy=stick.y+stick.height*.5;
const hit=await page.evaluate(([x,y])=>document.elementFromPoint(x,y)?.closest('#moveStick')?.id||'no-stick-hit',[sx,sy]);
if(hit!=='moveStick')throw Error('Touch control obstructed by overlay: '+hit);
await touch('touchStart',101,sx,sy);
for(let k=1;k<=4;k++){await touch('touchMove',101,sx+stick.width*.08*k,sy);await page.waitForTimeout(75)}
let controls=await page.evaluate(()=>window.__nightfallControlsReport());
if(!controls.move.active||controls.move.x<.35)throw Error('Native iPhone touch did not activate movement input: '+JSON.stringify(controls));
await page.waitForTimeout(520);
await touch('touchEnd',101,sx,sy);
await page.waitForTimeout(160);
const afterStick=await page.evaluate(()=>window.__nightfallVisualReport().playerWorld);
if(Math.hypot(afterStick[0]-beforeStick[0],afterStick[2]-beforeStick[2])<6)throw Error('Real native-touch drag did not move authoritative player: '+JSON.stringify({beforeStick,afterStick}));
controls=await page.evaluate(()=>window.__nightfallControlsReport());
if(controls.move.active||Math.abs(controls.move.x)>.01)throw Error('Left thumbstick did not release after touchend');
console.log('NIGHTFALL_REAL_TOUCH_MOVEMENT:'+JSON.stringify({from:beforeStick,to:afterStick}));

// Aim assist must NOT fire without a real user action.
await page.waitForTimeout(230);
const ammoIdle=await page.evaluate(()=>window.__nightfallNetworkReport().players.find(p=>p.id===window.__nightfallNetworkReport().playerId)?.ammo);
await page.waitForTimeout(420);
const ammoLater=await page.evaluate(()=>window.__nightfallNetworkReport().players.find(p=>p.id===window.__nightfallNetworkReport().playerId)?.ammo);
if(ammoLater!==ammoIdle)throw Error('Aim assist still fires automatically without player action: '+ammoIdle+' vs '+ammoLater);
const aimStick=await page.locator('#aimStick').boundingBox(),ax=aimStick.x+aimStick.width*.5,ay=aimStick.y+aimStick.height*.5;
await touch('touchStart',102,ax,ay);await touch('touchMove',102,ax+aimStick.width*.35,ay);
await page.waitForTimeout(200);
const aiming=await page.evaluate(()=>window.__nightfallControlsReport());
if(!aiming.aim.active||aiming.aim.x<.35)throw Error('Native right-joystick aim touch did not register: '+JSON.stringify(aiming));
await touch('touchEnd',102,ax,ay);
const button=await page.locator('#fireMobile').boundingBox();
await touch('touchStart',103,button.x+button.width*.5,button.y+button.height*.5);
await page.waitForTimeout(220);
if(!(await page.evaluate(()=>window.__nightfallControlsReport().holdFire)))throw Error('Dedicated FIRE button did not register native touch');
await touch('touchEnd',103,button.x,button.y);
await page.waitForTimeout(100);
if(await page.evaluate(()=>window.__nightfallControlsReport().holdFire))throw Error('FIRE remained stuck after release');
console.log('NIGHTFALL_TOUCH_COMBAT: native drag movement, right-stick aim and hold-to-fire verified; idle auto-fire disabled');
// A quarter turn must change the camera without changing the player's position.
await page.locator('#assistButton').click();
const beforeTurn=await page.evaluate(()=>window.__nightfallVisualReport());
await page.locator('#cameraRight').click();await page.waitForFunction(before=>{const after=window.__nightfallVisualReport();return Math.hypot(after.cameraPosition[0]-before[0],after.cameraPosition[2]-before[2])>=1},beforeTurn.cameraPosition,{timeout:10000});
const afterTurn=await page.evaluate(()=>window.__nightfallVisualReport());
if(Math.abs(afterTurn.cameraYaw-beforeTurn.cameraYaw-Math.PI/4)>.01)throw Error('Camera rotation control failed');
if(Math.hypot(afterTurn.cameraPosition[0]-beforeTurn.cameraPosition[0],afterTurn.cameraPosition[2]-beforeTurn.cameraPosition[2])<1)throw Error('Camera did not orbit after rotation');
await page.locator('#cameraLeft').click();await page.waitForTimeout(300);
// Landscape touch controls and HUD must remain reachable.
await page.setViewportSize({width:844,height:390});await page.waitForTimeout(350);
for(const id of ['exitGame','reloadButton','cameraRight','abilityMobile','fireMobile']){const b=await page.locator('#'+id).boundingBox();if(!b||b.y<0||b.y+b.height>390)throw Error('Landscape control outside viewport: '+id)}
await page.screenshot({path:'test-results/landscape-combat.jpg',type:'jpeg',quality:80});
await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(300);await page.screenshot({path:'test-results/desktop-combat.jpg',type:'jpeg',quality:80});
await page.locator('#exitGame').click();await page.screenshot({path:'test-results/desktop-menu.jpg',type:'jpeg',quality:80});
if(await page.locator('#home').evaluate(el=>el.scrollWidth>el.clientWidth+2))throw Error('Menu has horizontal overflow');
// Join from a separate browser context and verify the same moving operative appears in both.
await page.setViewportSize({width:800,height:600});await page.locator('#name').fill('QA HOST');await page.locator('#create').click();
await page.waitForFunction(()=>!document.getElementById('lobby').classList.contains('hidden'));
const code=await page.locator('#roomcode').textContent();
const invitation=(await page.locator('#inviteLink').textContent()).trim();
if(new URL(invitation).searchParams.get('join')!==code)throw Error('Lobby invitation link does not match the created squad');
if((await page.locator('#hint').textContent()).includes('2+ OPERATIVES CONNECTED'))throw Error('Lobby incorrectly claims the one-player room is ready');
const guestContext=await browser.newContext({viewport:{width:800,height:600}}),guest=await guestContext.newPage();
guestPage=guest;guest.on('console',msg=>{if(msg.type()==='error'||msg.type()==='warning')logs.push('Guest: '+msg.text().slice(0,400))});guest.on('pageerror',err=>failures.push('Guest: '+err.message));
await guest.goto(invitation,{waitUntil:'domcontentloaded'});
await guest.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('ONLINE')&&document.querySelector('#renderStatus')?.dataset.ready==='true',null,{timeout:60000});
if(await guest.locator('#inviteBanner').evaluate(el=>el.classList.contains('hidden')))throw Error('Shared invitation banner was not displayed');
if((await guest.locator('#code').inputValue())!==code)throw Error('Shared invitation code was not prefilled');
if((await guest.locator('#join').textContent()).trim()!=='JOIN THIS SQUAD →')throw Error('Guest join action not clear');
await guest.locator('#name').fill('QA GUEST');await guest.locator('#join').click();
await page.waitForFunction(()=>document.querySelector('#count')?.textContent==='2/4');
await page.locator('#start').click();
await guest.bringToFront();await waitNetwork(guest,report=>report.players.length===2&&report.phase==='game','guest deployment');
await page.bringToFront();if((await page.locator('#assistButton').textContent()).includes('MANUAL'))await page.locator('#assistButton').click();
const host=await waitNetwork(page,report=>report.players.some(p=>p.id===report.playerId&&p.alive),'living host'),hostStart=host.players.find(p=>p.id===host.playerId);
const direction=hostStart.x>1500?-1:1,key=direction===1?'d':'a';
await page.keyboard.down(key);try{await waitNetwork(guest,report=>report.players.some(p=>p.id===host.playerId&&p.alive&&(p.x-hostStart.x)*direction>25),'host movement on guest')}finally{await page.keyboard.up(key)};
await guest.bringToFront();await guest.screenshot({path:'test-results/coop-guest.jpg',type:'jpeg',quality:80});
console.log('NIGHTFALL_COOP_BROWSER: guest followed shareable invite link, auto-filled room code, joined, deployed and replicated host movement');
await guestContext.close();
if(failures.length)throw Error('Browser JS exceptions: '+failures.join('; '));
if(logs.some(x=>/asset failed|3d frame error|3d initialization|failed to load resource|module/i.test(x)))throw Error('3D renderer/asset load error: '+logs.join('; '));
}catch(error){
 for(const [name,p] of [['host',page],['guest',guestPage]]){if(!p)continue;try{const diagnostic=await p.evaluate(()=>({network:window.__nightfallNetworkReport?.(),visual:window.__nightfallVisualReport?.(),screens:['home','lobby','game','result'].filter(id=>!document.getElementById(id)?.classList.contains('hidden')),status:document.getElementById('status')?.textContent,toast:document.getElementById('toast')?.textContent,room:document.getElementById('roomcode')?.textContent,count:document.getElementById('count')?.textContent}));console.error('NIGHTFALL_FAILURE_'+name+':'+JSON.stringify({diagnostic,failures,logs}));fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/'+name+'-failure.json',JSON.stringify({diagnostic,failures,logs},null,2));await p.screenshot({path:'test-results/'+name+'-failure.jpg',type:'jpeg',quality:70,timeout:10000})}catch(e){console.error('Diagnostic failed:',e.message)}}throw error;
}finally{await browser.close()}
})().catch(e=>{console.error('NIGHTFALL_BROWSER_FAILED:'+e.stack);process.exitCode=1});
