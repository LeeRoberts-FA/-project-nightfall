'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../public');
const sources=[
{name:'models/rifle.glb',expectedBytes:785648,sha:'01dcbaed28efc7173cbefc73b6721306c6ffe634',url:'https://raw.githubusercontent.com/cktang88/3d-fps/main/public/assets/models/weapons/m4a1.glb'},
{name:'models/burnt-car.glb',expectedBytes:2605856,sha:'b6a2657a9e53c3824d96745a03e4082a8f996f6e',url:'https://raw.githubusercontent.com/cktang88/3d-fps/main/public/assets/ambience/models/burnt_car/burnt_car.glb'},
{name:'models/soldier.glb',expectedBytes:3094592,sha:'b00ed33108f2579880c82cd27d10f9237ff3a219',url:'https://raw.githubusercontent.com/cktang88/3d-fps/main/public/assets/models/characters/soldier.glb'},
{name:'models/zombie.glb',expectedBytes:831380,sha:'7670f4cfbcd21a088917cec2078cf93151de72d2',url:'https://raw.githubusercontent.com/mars-tw/storm-apocalypse/main/public/models/zombie.glb'},
{name:'textures/asphalt-color.webp',expectedBytes:1630170,sha:'3ea2ad5a662d0a4ea4b0ca6f8423562542a027e7',url:'https://raw.githubusercontent.com/cktang88/3d-fps/main/public/assets/textures/Asphalt031/Color.webp'},
{name:'textures/asphalt-normal.webp',expectedBytes:1765202,sha:'58a139c5fa24b32dba09ef01f31efe9fa47c8582',url:'https://raw.githubusercontent.com/cktang88/3d-fps/main/public/assets/textures/Asphalt031/NormalGL.webp'},
{name:'textures/asphalt-rough.webp',expectedBytes:432128,sha:'d30f0638f534a4eda9a38157907843148ee26582',url:'https://raw.githubusercontent.com/cktang88/3d-fps/main/public/assets/textures/Asphalt031/Roughness.webp'},
{name:'textures/brick-color.webp',expectedBytes:654112,sha:'66c0f82b27c033b7f78bf00280af2c0bdc343c66',url:'https://raw.githubusercontent.com/cktang88/3d-fps/main/public/assets/textures/Bricks097/Color.webp'},
{name:'textures/brick-normal.webp',expectedBytes:616596,sha:'9c737e480d01bf10947ad08228590d476737b935',url:'https://raw.githubusercontent.com/cktang88/3d-fps/main/public/assets/textures/Bricks097/NormalGL.webp'},
{name:'textures/brick-rough.webp',expectedBytes:167388,sha:'0e6b6ef455400acc751f290b9bb92a377254fab0',url:'https://raw.githubusercontent.com/cktang88/3d-fps/main/public/assets/textures/Bricks097/Roughness.webp'},
{name:'textures/concrete-color.webp',expectedBytes:1093192,sha:'fc9276e4d8084b55fdec3d58f2ef7babc4f52612',url:'https://raw.githubusercontent.com/cktang88/3d-fps/main/public/assets/textures/Concrete048/Color.webp'},
{name:'textures/concrete-normal.webp',expectedBytes:1295562,sha:'14048bf7ac45a45061760c4db1cfcad24f1e1c31',url:'https://raw.githubusercontent.com/cktang88/3d-fps/main/public/assets/textures/Concrete048/NormalGL.webp'},
{name:'textures/concrete-rough.webp',expectedBytes:293012,sha:'7204c9643e0347c0142243e09dc4c93a90817f64',url:'https://raw.githubusercontent.com/cktang88/3d-fps/main/public/assets/textures/Concrete048/Roughness.webp'}
];
function hash(buf){return crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+buf.length+'\0'),buf])).digest('hex')}
async function install({name,sha,url,expectedBytes}){const target=path.join(root,name);if(fs.existsSync(target)){const buf=fs.readFileSync(target);if(buf.length===expectedBytes&&hash(buf)===sha){console.log('Verified cached asset: '+name);return}}
console.log('Downloading licensed game asset: '+name);const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);try{const response=await fetch(url,{signal:controller.signal,redirect:'follow',headers:{'User-Agent':'Project-Nightfall-Build/1.0'}});if(!response.ok)throw Error('HTTP '+response.status+' downloading '+name);const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length!==expectedBytes||hash(bytes)!==sha)throw Error('Integrity verification failed for '+name);fs.mkdirSync(path.dirname(target),{recursive:true});const temp=target+'.tmp-'+process.pid;fs.writeFileSync(temp,bytes);fs.renameSync(temp,target);console.log('Verified '+name+' ('+bytes.length+' bytes)')}finally{clearTimeout(timer)}}
(async()=>{for(let i=0;i<sources.length;i+=3)await Promise.all(sources.slice(i,i+3).map(install))})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
