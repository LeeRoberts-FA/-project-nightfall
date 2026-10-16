import * as THREE from '/three.module.js';
import { GLTFLoader } from '/GLTFLoader.js';
import { clone as cloneSkinned } from '/SkeletonUtils.js';
import { mergeGeometries } from '/utils/BufferGeometryUtils.js';

const SCALE = .035;
const Y = new THREE.Vector3(0, 1, 0);
const mix = (a,b,t) => a+(b-a)*t;
export class NightfallScene {
  constructor(canvas) {
    this.canvas=canvas;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.22;
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x18242d);
    this.scene.fog=new THREE.Fog(0x27383f,30,85);
    this.camera=new THREE.PerspectiveCamera(54,1,.08,180);this.cameraYaw=0;
    this.entities=new Map();this.models={};this.effects=[];this.materials=new Map();this.propSlots=[];
    this.loader=new GLTFLoader();this.tick=0;this.lastMode='';this.cameraAt=new THREE.Vector3();
    this.geo={box:new THREE.BoxGeometry(1,1,1),sphere:new THREE.SphereGeometry(1,18,12),cyl:new THREE.CylinderGeometry(.5,.5,1,12)};
    this.scene.add(new THREE.HemisphereLight(0xa0bdce,0x282d2d,1.35));
    const sun=this.sun=new THREE.DirectionalLight(0xb0c8d9,1.9);sun.position.set(-25,38,18);sun.castShadow=true;
    sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-23,right:23,top:23,bottom:-23,near:.1,far:95});sun.shadow.bias=-.0007;sun.shadow.normalBias=.025;this.scene.add(sun,sun.target);
    this.flash=new THREE.PointLight(0xffbf71,0,5,2);this.scene.add(this.flash);
    this.setupTextures();this.buildWorld();
    this.ready=this.loadModels();
    this.ray=new THREE.Raycaster();this.ground=new THREE.Plane(Y,0);
    this.canvas.style.touchAction='none';
  }
  world(x,y){return [x*SCALE-35,0,y*SCALE-21]}
  mat(color,metalness=0,roughness=.8){const k=color+'-'+metalness+'-'+roughness;if(!this.materials.has(k))this.materials.set(k,new THREE.MeshStandardMaterial({color,metalness,roughness}));return this.materials.get(k)}
  mesh(parent,kind,color,pos,scale=[1,1,1],metal=0){const m=new THREE.Mesh(this.geo[kind],this.mat(color,metal));m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
  setupTextures(){const loader=new THREE.TextureLoader();const load=(name,color,repeat)=>{const t=loader.load('/textures/'+name);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);t.anisotropy=Math.min(4,this.renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=THREE.SRGBColorSpace;return t};const surface=(name,repeat,roughness)=>new THREE.MeshStandardMaterial({map:load(name+'-color.webp',true,repeat),normalMap:load(name+'-normal.webp',false,repeat),roughnessMap:load(name+'-rough.webp',false,repeat),normalScale:new THREE.Vector2(.4,.4),roughness});this.pbr={asphalt:surface('asphalt',[12,8],.63),bricks:surface('brick',[2,3],.96),concrete:surface('concrete',[3,2],.9)};
    // Fine woven grain shared by uniforms; geometry and material groups retain original art detail.
    const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#a2a090';ctx.fillRect(0,0,128,128);for(let i=0;i<128;i+=2){ctx.fillStyle=i%4?'#898b7a':'#b5b3a3';ctx.fillRect(i,0,1,128);ctx.fillStyle='#6c706844';ctx.fillRect(0,i,128,1)}this.fabric=new THREE.CanvasTexture(c);this.fabric.wrapS=this.fabric.wrapT=THREE.RepeatWrapping;this.fabric.repeat.set(5,5);
  }
  sign(text,w=6,h=1,color='#d7c6a4',bg='#17252a'){const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,768,128);ctx.strokeStyle=color;ctx.lineWidth=5;ctx.strokeRect(8,8,752,112);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 43px sans-serif';ctx.fillText(text,384,66,722);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,roughness:.7,emissive:color,emissiveIntensity:.12}));return p}
  buildWorld(){if(this.worldGroup)this.scene.remove(this.worldGroup);const g=this.worldGroup=new THREE.Group();this.scene.add(g);this.propSlots=[];
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(125,100),this.pbr.asphalt);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;g.add(floor);
    // Playable streets are enclosed by detailed facades; buildings stay outside the combat bounds.
    for(const side of [-1,1]){
      const z=side*25.5;const curb=this.mesh(g,'box',0x6d706a,[0,.12,side*22.4],[83,.24,2.4]);curb.material=this.pbr.concrete;
      for(let i=0;i<9;i++){const x=-39+i*9.8,ht=10+(i*7%5)*2.3;const b=this.mesh(g,'box',0x65665c,[x,ht/2,z+side*3],[9.4,ht,8]);b.material=i%3?this.pbr.bricks:this.pbr.concrete;
        this.mesh(g,'box',0x3b4140,[x,ht+.2,z+side*3],[9.7,.45,8.3]);
        for(let f=0;f<Math.floor(ht/3);f++)for(let j=0;j<4;j++){const wx=x-3.2+j*2.1,wz=z-side*1.12,lit=(i*3+j+f)%11===0;
          this.mesh(g,'box',0x9c9a8e,[wx,1.8+f*3,wz],[1.4,1.9,.18]);const glass=this.mesh(g,'box',lit?0xd2924d:0x101b22,[wx,1.85+f*3,wz-side*.12],[1.1,1.55,.12],.25);if(lit){glass.material=new THREE.MeshStandardMaterial({color:0xe9ac60,emissive:0xff9c40,emissiveIntensity:.65})}
          this.mesh(g,'box',0x3c4444,[wx,1.85+f*3,wz-side*.2],[1.1,.07,.08]);if((i+j+f)%7===0){let plank=this.mesh(g,'box',0x5e5142,[wx,1.85+f*3,wz-side*.22],[1.8,.22,.09]);plank.rotation.z=.5}
        }
        this.mesh(g,'box',0x192026,[x,1.2,z-side*1.2],[1.7,2.4,.15]);const sig=this.sign(i===4?'BLACKWATER MEDICAL':i%3===0?'EVACUATION ZONE':'QUARANTINE // SECTOR 07',8,.7);sig.position.set(x,3.4,z-side*1.4);if(side>0)sig.rotation.y=Math.PI;g.add(sig);
        for(let j=0;j<2;j++){this.mesh(g,'box',0x7b8179,[x-2+j*4,ht+.65,z],[1.3,.8,1],.4);this.mesh(g,'cyl',0x303b3e,[x+3,ht+1.1,z+1],[.2,1.8,.2],.6)}
      }
    }
    for(let side of [-1,1]){const x=side*38;this.mesh(g,'box',0x333d3d,[x,1.25,0],[.65,2.5,48]);for(let z=-21;z<=21;z+=3){this.mesh(g,'cyl',0x7a8681,[x,2.3,z],[.09,4.6,.09],.7)}
      const chain=new THREE.Mesh(new THREE.PlaneGeometry(48,2.1),new THREE.MeshStandardMaterial({color:0x71817d,wireframe:true,transparent:true,opacity:.25,side:THREE.DoubleSide}));chain.rotation.y=Math.PI/2;chain.position.set(x,3.4,0);g.add(chain);
    }
    for(let z=-18;z<=18;z+=6){for(let x=-32;x<=32;x+=8)this.mesh(g,'box',0xc1b991,[x,.013,z],[3,.016,.10]);}
    for(let i=0;i<12;i++){const x=-32+i*5.8,z=i%2?21.5:-21.5;this.mesh(g,'cyl',0x4e5858,[x,3.5,z],[.12,7,.12],.6);this.mesh(g,'box',0x606a64,[x,7,z],[1.6,.12,.55],.4);const bulb=this.mesh(g,'box',0xffd298,[x,6.9,z],[1,.045,.35]);bulb.material=new THREE.MeshBasicMaterial({color:0xffcb8b});if(i%3===0){const l=new THREE.PointLight(0xffab50,22,13,2);l.position.set(x,6.7,z);g.add(l)}}
    const carPositions=[[-25,-12,.2],[14,10,-.22],[24,-9,.13],[-8,-15,.05],[-29,15,-.2],[31,17,.3]];
    for(const [x,z,rot] of carPositions){const slot=new THREE.Group();slot.position.set(x,0,z);slot.rotation.y=rot;g.add(slot);this.propSlots.push(slot)}
    // Barricades, hazard stripes, sandbags and drums dress perimeter without invisible obstructions.
    for(let i=0;i<12;i++){const x=-33+i*6,z=i%2?19.3:-19.3;const base=this.mesh(g,'box',0x7b7b66,[x,.45,z],[2.5,.9,.62]);base.material=this.pbr.concrete;for(let j=-2;j<=2;j++){const stripe=this.mesh(g,'box',0xd9a83d,[x+j*.42,.52,z+(i%2?-.32:.32)],[.17,.65,.015]);stripe.rotation.z=-.5}
      for(let a=0;a<3;a++)this.mesh(g,'sphere',0x655e44,[x-1+a*.65,.2,z-.8],[.5,.22,.32]);
      if(i%3===0){this.mesh(g,'cyl',0x7a4635,[x+1.8,.55,z],[.65,1.1,.65],.5);this.mesh(g,'cyl',0x292d2c,[x+1.8,1.1,z],[.67,.06,.67],.6)}
    }
    for(let i=0;i<95;i++){let x=Math.sin(i*43.7)*35,z=Math.cos(i*19.9)*20;const rubble=this.mesh(g,'box',i%3?0x5a5951:0x3d403b,[x,.035,z],[.15+(i%5)*.09,.07,.2+(i%3)*.1]);rubble.rotation.y=i*1.3}
    this.batchArchitecture(g);
    this.rainGeo=new THREE.BufferGeometry();const pts=new Float32Array(600*3);for(let i=0;i<600;i++){pts[i*3]=Math.sin(i*142)*45;pts[i*3+1]=(i%100)*.18;pts[i*3+2]=Math.cos(i*74)*32}this.rainGeo.setAttribute('position',new THREE.BufferAttribute(pts,3));this.rain=new THREE.Points(this.rainGeo,new THREE.PointsMaterial({color:0xadc9cc,size:.025,transparent:true,opacity:.35,depthWrite:false}));g.add(this.rain);
    this.bulletGeo=new THREE.SphereGeometry(.045,6,4);this.bulletMaterial=new THREE.MeshBasicMaterial({color:0xffd59b});this.hostileMaterial=new THREE.MeshBasicMaterial({color:0xb4f23b});this.bulletPool=[];for(let i=0;i<100;i++){const b=new THREE.Mesh(this.bulletGeo,this.bulletMaterial);b.visible=false;this.scene.add(b);this.bulletPool.push(b)}
  }
  batchArchitecture(group){
    // Buildings contain hundreds of details but share materials; batch them to avoid mobile draw-call spikes.
    group.updateMatrixWorld(true);const batches=new Map();group.traverse(n=>{if(n.isMesh&&!Array.isArray(n.material)){const key=n.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(n)}});
    for(const meshes of batches.values()){if(meshes.length<3)continue;const geometries=meshes.map(n=>n.geometry.clone().applyMatrix4(n.matrixWorld));const geometry=mergeGeometries(geometries,false);if(geometry){const merged=new THREE.Mesh(geometry,meshes[0].material);merged.castShadow=meshes.some(n=>n.castShadow);merged.receiveShadow=true;for(const n of meshes)n.removeFromParent();group.add(merged)}for(const g of geometries)g.dispose()}
  }
  async loadModels(){const load=url=>this.loader.loadAsync(url);try{const [soldier,rifle,car]=await Promise.all([load('/models/soldier.glb'),load('/models/rifle.glb'),load('/models/burnt-car.glb')]);this.models.survivor=soldier;this.models.zombie=soldier;this.models.rifle=rifle;this.models.car=car;
    for(const slot of this.propSlots){const model=car.scene.clone(true),box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),scale=4.8/Math.max(size.x,size.z);model.scale.setScalar(scale);const c=box.getCenter(new THREE.Vector3());model.position.set(-c.x*scale,-box.min.y*scale,-c.z*scale);model.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true}});slot.add(model)}
    for(const entry of this.entities.values())this.attachModel(entry);return true;
    }catch(e){console.error('Character or environment asset failed',e);throw e}}
  makeEntity(kind,type,boss=false){const obj=new THREE.Group();this.scene.add(obj);const entry={obj,kind,type,boss};
    // Contact shadows retain grounding on devices with reduced shadow quality.
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(boss?1.8:.45,20),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.23,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.02;obj.add(shadow);entry.shadow=shadow;this.attachModel(entry);return entry}
  attachModel(entry){const asset=this.models.survivor;if(!asset||entry.model)return;
    const model=cloneSkinned(asset.scene);
    // The distributed GLB is saved prone. Measure the evaluated standing skeleton, never its bind pose.
    const reference=new THREE.AnimationMixer(model);reference.clipAction(asset.animations.find(c=>c.name==='idle')||asset.animations[0]).play();reference.update(.05);model.updateMatrixWorld(true);model.traverse(n=>{if(n.isSkinnedMesh){n.skeleton.update();n.computeBoundingBox()}});
    const box=new THREE.Box3().setFromObject(model);const dims=box.getSize(new THREE.Vector3());const factor=1.82/Math.max(.01,dims.y);model.scale.setScalar(factor);const center=box.getCenter(new THREE.Vector3());model.position.set(-center.x*factor,-box.min.y*factor,-center.z*factor);entry.obj.add(model);entry.model=model;reference.stopAllAction();
    const enemy=entry.type==='zombie',bloater=entry.kind==='bloater';entry.obj.scale.setScalar(entry.boss?2.6:bloater?1.45:1);
    model.traverse(n=>{if(!n.isMesh)return;n.castShadow=true;n.receiveShadow=true;const apply=source=>{const m=source.clone();m.side=THREE.FrontSide;m.color.multiplyScalar(2.0);m.roughness=Math.max(.45,m.roughness);if(/fabric|clothes/i.test(m.name)){m.map=this.fabric;m.color.set(enemy?entry.kind==='runner'?0x68534a:0x6d7663:entry.kind==='medic'?0x5b7c69:entry.kind==='heavy'?0x5b6978:0x8c947c);m.roughness=.95;}if(enemy&&/flesh/i.test(m.name))m.color.set(entry.kind==='spitter'?0x94a06b:0x9d9b87);if(enemy&&/armor/i.test(m.name))m.color.set(0x3d4238);return m};n.material=Array.isArray(n.material)?n.material.map(apply):apply(n.material)});
    entry.mixer=new THREE.AnimationMixer(model);const clips=asset.animations;const clip=(name,fallback)=>clips.find(c=>c.name===name)||clips.find(c=>c.name===fallback)||clips[0];
    entry.actions={idle:entry.mixer.clipAction(clip(enemy?'ready_idle':'aim_idle','idle')),move:entry.mixer.clipAction(clip(enemy?'run':'aim_run','walk')),attack:entry.mixer.clipAction(clip(enemy?'melee':'aim_idle','idle')),reload:entry.mixer.clipAction(clip('reload','aim_idle'))};
    entry.activeMotion=entry.actions.idle;entry.activeMotion.play();entry.mixer.update(.05);model.updateMatrixWorld(true);
    if(enemy){entry.actions.move.timeScale=entry.kind==='runner'?1.35:.55;const wounds=this.mat(entry.kind==='spitter'?0x79883b:0x633c37,0,.95);for(let i=0;i<7;i++){const growth=new THREE.Mesh(this.geo.sphere,wounds);growth.position.set(Math.sin(i*2.4)*.24,.9+i*.11,.20+Math.cos(i)*.06);growth.scale.set(.075+(i%3)*.025,.09,.065);entry.obj.add(growth)}if(bloater||entry.boss){for(let i=0;i<8;i++){let tumor=this.mesh(entry.obj,'sphere',0x656348,[Math.sin(i*3)*.35,1+i*.08,Math.cos(i*2)*.22],[.19,.21,.16]);tumor.rotation.z=i*.4}}}
    else if(this.models.rifle){const weapon=this.models.rifle.scene.clone(true),holder=new THREE.Group();weapon.scale.setScalar(.47);weapon.position.set(0,.15*.47,.05*.47);weapon.getObjectByName('SpareMagazine')?.removeFromParent();holder.rotation.y=Math.PI;holder.add(weapon);entry.obj.add(holder);entry.weapon=holder;model.traverse(n=>{if(/RightHand$/.test(n.name))entry.hand=n});entry.handPoint=new THREE.Vector3();}

    entry.assetSizing={originalHeight:dims.y,originalDimensions:dims.toArray(),scale:factor};
  }
  aimAt(px,py){const r=this.canvas.getBoundingClientRect();this.ray.setFromCamera(new THREE.Vector2((px/r.width)*2-1,-(py/r.height)*2+1),this.camera);return this.ray.ray.intersectPlane(this.ground,new THREE.Vector3())}
  project(x,y,height=2.2){return new THREE.Vector3(...this.world(x,y)).add(new THREE.Vector3(0,height,0)).project(this.camera)}
  sync(state,myId,aim,delta,localMoving=false){if(!state)return;this.resize();this.tick+=delta;this.lastMode=state.mission;const active=new Set(),me=state.players.find(p=>p.id===myId);
    const actors=[...state.players.map(p=>({...p,key:'p'+p.id,type:'survivor'})),...(state.enemies||[]).map(e=>({...e,key:'e'+e.id,type:'zombie'}))];
    for(const a of actors){active.add(a.key);let e=this.entities.get(a.key);if(!e){e=this.makeEntity(a.cls||a.kind,a.type,a.boss);this.entities.set(a.key,e)}const pos=new THREE.Vector3(...this.world(a.x,a.y));if(!e.positioned){e.obj.position.copy(pos);e.positioned=true}else e.obj.position.lerp(pos,1-Math.exp(-delta*16));e.obj.visible=a.alive!==false;
      const travel=e.prevX===undefined?0:Math.hypot(a.x-e.prevX,a.y-e.prevY);e.prevX=a.x;e.prevY=a.y;if(travel>.2)e.movingUntil=this.tick+.16;
      const enemy=a.type==='zombie',moving=a.id===myId?localMoving:this.tick<(e.movingUntil||0);const angle=enemy&&me?Math.atan2(me.y-a.y,me.x-a.x):a.id===myId?aim:a.angle??-Math.PI/2;
      let desired=-angle+Math.PI/2;let diff=Math.atan2(Math.sin(desired-e.obj.rotation.y),Math.cos(desired-e.obj.rotation.y));e.obj.rotation.y+=diff*(1-Math.exp(-delta*15));
      if(e.mixer){let close=enemy&&me&&Math.hypot(me.x-a.x,me.y-a.y)<85;const action=!enemy&&a.reloading?e.actions.reload:close?e.actions.attack:moving||enemy?e.actions.move:e.actions.idle;if(action!==e.activeMotion){e.activeMotion.fadeOut(.18);action.reset().fadeIn(.18).play();e.activeMotion=action}e.mixer.update(delta)}
      if(e.lastHp!==undefined&&a.hp<e.lastHp){e.hitUntil=this.tick+.13;this.lastHit=this.tick;}
      e.lastHp=a.hp;if(e.weapon&&e.hand){e.obj.updateMatrixWorld(true);e.hand.getWorldPosition(e.handPoint);e.weapon.position.copy(e.obj.worldToLocal(e.handPoint));e.weapon.rotation.x=a.reloading?-.25:0;e.weapon.position.z+=a.firing?Math.sin(this.tick*38)*.018:0;}
    }
    for(const [key,e] of this.entities)if(!active.has(key)){e.deadAt??=this.tick;e.obj.rotation.z=mix(e.obj.rotation.z,-1.45,Math.min(1,delta*8));e.obj.position.y-=delta*.35;if(this.tick-e.deadAt>.55){this.scene.remove(e.obj);e.mixer?.stopAllAction();e.model?.traverse(n=>{if(n.isMesh){for(const m of Array.isArray(n.material)?n.material:[n.material])m.dispose()}});this.entities.delete(key)}}
    if(me){const pos=new THREE.Vector3(...this.world(me.x,me.y));const portrait=this.camera.aspect<.8;const sy=Math.sin(this.cameraYaw),cy=Math.cos(this.cameraYaw),distance=portrait?6.3:5.1;const target=pos.clone().add(new THREE.Vector3(-sy*2+.25*cy,1.15,-cy*2-.25*sy));const desired=pos.clone().add(new THREE.Vector3(sy*distance+.7*cy,portrait?3.7:3.1,cy*distance-.7*sy));if(!this.cameraReady){this.camera.position.copy(desired);this.cameraAt.copy(target);this.cameraReady=true}else{this.camera.position.lerp(desired,1-Math.exp(-delta*9));this.cameraAt.lerp(target,1-Math.exp(-delta*9))}this.camera.lookAt(this.cameraAt);this.sun.position.set(pos.x-20,35,pos.z+15);this.sun.target.position.copy(pos);this.sun.target.updateMatrixWorld();
      const p=this.entities.get('p'+myId);this.flash.intensity=me.firing&&Math.sin(this.tick*45)>.3?4:0;if(p)this.flash.position.copy(p.obj.position).add(new THREE.Vector3(Math.cos(aim)*.6,1.25,Math.sin(aim)*.6));
    }
    for(let i=0;i<this.bulletPool.length;i++){const b=state.bullets[i],m=this.bulletPool[i];m.visible=!!b;if(b){const p=this.world(b.x,b.y);m.position.set(p[0],1.2,p[2]);m.scale.set(1,1,b.enemy?1:3);m.material=b.enemy?this.hostileMaterial:this.bulletMaterial}}
    const a=this.rainGeo.attributes.position;for(let i=0;i<a.count;i++){a.array[i*3+1]-=delta*13;if(a.array[i*3+1]<0)a.array[i*3+1]=18}a.needsUpdate=true;
    this.renderer.render(this.scene,this.camera);
  }
  debugActor(id){const e=this.entities.get('p'+id);if(!e?.model)return null;e.obj.updateMatrixWorld(true);e.model.traverse(n=>{if(n.isSkinnedMesh){n.skeleton.update();n.computeBoundingBox()}});const b=new THREE.Box3().setFromObject(e.obj);return {size:b.getSize(new THREE.Vector3()).toArray(),center:b.getCenter(new THREE.Vector3()).toArray(),feet:b.min.clone().project(this.camera).toArray(),head:b.max.clone().project(this.camera).toArray(),root:e.obj.position.toArray(),modelPosition:e.model.position.toArray(),source:e.assetSizing}}
  resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(w&&h&&(w!==this.width||h!==this.height)){this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.width=w;this.height=h}}
  dispose(){this.renderer.dispose()}
}
