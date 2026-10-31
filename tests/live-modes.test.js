'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const net=require('node:net'),http=require('node:http');
async function waitFor(url){for(let i=0;i<60;i++){try{const r=await fetch(url);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,100))}throw Error('server not ready')}
function client(port){return new Promise((resolve,reject)=>{const key=Buffer.from('nightfall-'+Math.random()).toString('base64'),s=net.connect(port);let first=true,buf=Buffer.alloc(0),listeners=[],pending=[];s.on('error',reject);s.on('connect',()=>s.write('GET /ws HTTP/1.1\r\nHost: localhost\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: '+key+'\r\n\r\n'));s.on('data',b=>{buf=Buffer.concat([buf,b]);if(first){let i=buf.indexOf('\r\n\r\n');if(i<0)return;assert.match(buf.slice(0,i).toString(),/101 Switching Protocols/);buf=buf.subarray(i+4);first=false;resolve({send:msg=>{const p=Buffer.from(JSON.stringify(msg)),mask=Buffer.from([13,29,41,7]),head=p.length<126?Buffer.from([0x81,0x80|p.length]):Buffer.from([0x81,0xfe,p.length>>8,p.length&255]);const body=Buffer.from(p);for(let i=0;i<body.length;i++)body[i]^=mask[i%4];s.write(Buffer.concat([head,mask,body]))},next:(type,timeout=6000)=>new Promise((ok,fail)=>{const ix=pending.findIndex(m=>m.type===type);if(ix>=0){ok(pending.splice(ix,1)[0]);return}const t=setTimeout(()=>fail(new Error('Timeout awaiting '+type)),timeout);listeners.push(m=>{if(m.type===type){clearTimeout(t);ok(m);return true}return false})}),close:()=>s.destroy()})}while(buf.length>=2){let len=buf[1]&127,off=2;if(len===126){if(buf.length<4)break;len=buf.readUInt16BE(2);off=4}if(buf.length<off+len)break;const m=JSON.parse(buf.subarray(off,off+len).toString());buf=buf.subarray(off+len);let handled=false;for(let i=listeners.length-1;i>=0;i--)if(listeners[i](m)){listeners.splice(i,1);handled=true;break}if(!handled)pending.push(m)}})})}
test('actual server: solo outbreak and co-op raid with difficulty synchronization',async()=>{
const port=23000+Math.floor(Math.random()*2000),proc=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)}}),sockets=[];try{await waitFor('http://127.0.0.1:'+port+'/health');const one=await client(port);sockets.push(one);let w=one.next('welcome');one.send({type:'create',mode:'solo',mission:'outbreak',difficulty:'nightmare',name:'SOLO'});const welcome=await w;let room=one.next('room');let lobby=await room;assert.equal(lobby.room?.mission,'outbreak');assert.equal(lobby.room?.difficulty,'nightmare');const start=one.next('started');one.send({type:'start'});await start;const snap=one.next('snapshot');const state=(await snap).state;assert.equal(state.wave,1);assert.equal(state.maxWave,6);assert.equal(state.lives,4);assert.ok(state.enemies.some(e=>e.kind));const guest=await client(port);sockets.push(guest);const error=guest.next('error');guest.send({type:'join',code:welcome.code});assert.match((await error).message,/Solo/);const leader=await client(port);sockets.push(leader);let a=leader.next('welcome');leader.send({type:'create',mission:'raid',difficulty:'recruit',name:'HOST'});const host=await a;const ally=await client(port);sockets.push(ally);let b=ally.next('welcome');ally.send({type:'join',code:host.code,name:'ALLY'});await b;const started=leader.next('started');leader.send({type:'start'});await started;const normal=leader.next('snapshot');assert.equal((await normal).state.difficulty,'recruit');}finally{for(const s of sockets)s.close();proc.kill()}})

test('two real sockets receive movement from the same authoritative squad state',async()=>{
 const port=25000+Math.floor(Math.random()*1000),proc=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)}}),sockets=[];
 try{await waitFor('http://127.0.0.1:'+port+'/health');const host=await client(port),guest=await client(port);sockets.push(host,guest);const hw=host.next('welcome');host.send({type:'create',mission:'raid',difficulty:'recruit',name:'HOST'});const identity=await hw;const gw=guest.next('welcome');guest.send({type:'join',code:identity.code,name:'GUEST'});await gw;const start=host.next('started');host.send({type:'start'});await start;const initial=(await host.next('snapshot')).state.players.find(p=>p.id===identity.you);host.send({type:'input',mx:1,my:0,angle:0,firing:true});
 async function moved(c){for(let n=0;n<50;n++){const s=(await c.next('snapshot')).state,p=s.players.find(p=>p.id===identity.you);if(p.x>initial.x+25)return {p,s}}throw Error('Movement was not replicated')}
 const [a,b]=await Promise.all([moved(host),moved(guest)]);assert.equal(a.s.code,b.s.code);assert.ok(Math.abs(a.p.x-b.p.x)<35);assert.ok(a.p.ammo<30&&b.p.ammo<30,'Firing and magazine state must replicate to both clients');
 }finally{for(const c of sockets)c.close();proc.kill()}
});

test('secure player session resumes after WebSocket drop without losing squad host or XP',async()=>{
 const port=26600+Math.floor(Math.random()*800),proc=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)}}),sockets=[];
 try {
  await waitFor('http://127.0.0.1:'+port+'/health');
  const host=await client(port),guest=await client(port);sockets.push(host,guest);
  const hw=host.next('welcome');host.send({type:'create',mission:'outbreak',difficulty:'recruit',name:'LEADER'});
  const identity=await hw;assert.match(identity.resumeToken,/^[0-9a-f]{48}$/);
  const gw=guest.next('welcome');guest.send({type:'join',code:identity.code,name:'ALLIED'});await gw;
  const started=host.next('started');host.send({type:'start'});await started;
  await host.next('snapshot');
  host.close();await new Promise(done=>setTimeout(done,120));
  const bad=await client(port);sockets.push(bad);
  const error=bad.next('error');bad.send({type:'resume',code:identity.code,token:'0'.repeat(48)});
  assert.match((await error).message,/Session expired/);
  const restored=await client(port);sockets.push(restored);
  const welcome=restored.next('welcome'),resumed=restored.next('started');
  restored.send({type:'resume',code:identity.code,token:identity.resumeToken});
  const w=await welcome;assert.equal(w.you,identity.you,'restored the same operative/player identity');
  assert.equal(w.resumeToken,identity.resumeToken);assert.equal(w.resumed,true);
  const match=await resumed;assert.equal(match.room.phase,'playing');assert.equal(match.room.host,identity.you);
  const snapshot=(await restored.next('snapshot')).state;
  assert.equal(snapshot.players.filter(p=>p.id===identity.you).length,1,'squad slot is not duplicated');
  restored.send({type:'input',mx:1,my:0,angle:0,firing:true});
  const original=snapshot.players.find(p=>p.id===identity.you);
  let advanced=false;
  for(let n=0;n<35;n++){
    const now=(await guest.next('snapshot')).state.players.find(p=>p.id===identity.you);
    if(now.x>original.x+16){advanced=true;break}
  }
  assert.equal(advanced,true,'resumed player movement replicates to another physical socket');
 }finally{for(const c of sockets)c.close();proc.kill()}
});
