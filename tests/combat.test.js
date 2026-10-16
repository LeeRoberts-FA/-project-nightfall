'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
process.env.PORT='0';
const {server,rooms,tick,handle,resolvePosition}=require('../server');
const base=Date.now();
function operative(id){return {id,socket:{write(){}},buffer:Buffer.alloc(0),room:null,mx:0,my:0,angle:0,firing:false,useAbility:false,shootAt:0,abilityAt:0,points:0,kills:0,xp:0,level:1,upgrades:{damage:0,armor:0,mobility:0}}}
test('collision keeps players outside authored car cover',()=>{const o=require('../public/arena.json').obstacles[0];const p=resolvePosition(o.x,o.y);assert.ok(Math.hypot(p[0]-o.x,p[1]-o.y)>=o.r+18-1e-6)});
test('both Recruit solo operations are winnable through actual combat and award XP',()=>{
 for(const mission of ['raid','outbreak']){const p=operative(mission);handle(p,{type:'create',mode:'solo',mission,difficulty:'recruit',name:'QA',cls:'assault'});handle(p,{type:'start'});const r=rooms.get(p.room);let now=base,maxWave=0,reloads=0,lastAmmo=30;
  for(let n=0;n<14000&&r.phase==='playing';n++){now+=65;const enemy=r.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
   if(enemy){p.angle=Math.atan2(enemy.y-p.y,enemy.x-p.x);p.firing=true;const d=Math.hypot(enemy.x-p.x,enemy.y-p.y);const t=n*.065*.24;const tx=1000+Math.cos(t)*650,ty=600+Math.sin(t)*370;let dx=tx-p.x,dy=ty-p.y;if(d<200){dx+=(p.x-enemy.x)*3;dy+=(p.y-enemy.y)*3}const len=Math.hypot(dx,dy)||1;p.mx=dx/len;p.my=dy/len;p.useAbility=true;}else{p.firing=false;p.mx=p.my=0}
   if(p.points){handle(p,{type:'upgrade',key:p.upgrades.damage<5?'damage':'armor'})}
   tick(.065,now);maxWave=Math.max(maxWave,r.wave);if(p.ammo>lastAmmo)reloads++;lastAmmo=p.ammo;
  }
  assert.equal(r.phase,'won',mission+' did not reach victory; wave '+r.wave+' hp '+p.hp);assert.equal(maxWave,mission==='raid'?4:6);assert.ok(p.kills>10);assert.ok(p.level>1);assert.ok(reloads>0);rooms.delete(r.code);
 }
});
test.after(()=>server.close());
