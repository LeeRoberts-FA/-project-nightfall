'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../public/models');
const sources=[
{name:'soldier.glb',expectedBytes:3094592,sha:'b00ed33108f2579880c82cd27d10f9237ff3a219',url:'https://raw.githubusercontent.com/cktang88/3d-fps/main/public/assets/models/characters/soldier.glb'},
{name:'zombie.glb',expectedBytes:831380,sha:'7670f4cfbcd21a088917cec2078cf93151de72d2',url:'https://raw.githubusercontent.com/mars-tw/storm-apocalypse/main/public/models/zombie.glb'}
];
function hash(buf){return crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+buf.length+'\0'),buf])).digest('hex')}
async function install({name,sha,url,expectedBytes}){const target=path.join(root,name);if(fs.existsSync(target)){const buf=fs.readFileSync(target);if(buf.length===expectedBytes&&hash(buf)===sha){console.log('Verified cached asset: '+name);return}}
console.log('Downloading licensed game asset: '+name);const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);try{const response=await fetch(url,{signal:controller.signal,redirect:'follow',headers:{'User-Agent':'Project-Nightfall-Build/1.0'}});if(!response.ok)throw Error('HTTP '+response.status+' downloading '+name);const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length!==expectedBytes||hash(bytes)!==sha)throw Error('Integrity verification failed for '+name);fs.mkdirSync(root,{recursive:true});const temp=target+'.tmp-'+process.pid;fs.writeFileSync(temp,bytes);fs.renameSync(temp,target);console.log('Verified '+name+' ('+bytes.length+' bytes)')}finally{clearTimeout(timer)}}
Promise.all(sources.map(install)).catch(error=>{console.error(error.stack||error);process.exitCode=1});
