#!/usr/bin/env node
'use strict';
// Public Hugging Face Hub metadata research. No inference, tokens, model downloads,
// billing, filesystem writes outside the report, or automatic asset integration.
const fs=require('node:fs');
const outDir='agent-proposals/huggingface';
fs.mkdirSync(outDir,{recursive:true});
const keywords=['rigged character','zombie 3d','glb','3d game assets'];
const allowed=/\.(glb|gltf|fbx)$/i;
const scrub=x=>String(x).replace(/[|<>]/g,'');
const lines=[
  '# Hugging Face public game-asset scout',
  '',
  'This is metadata-only discovery; it makes no model inference requests and purchases nothing.',
  'A public repository is **not automatically usable in a commercial game**.',
  'Every candidate needs original author verification, explicit compatible license, geometry/animation review and screenshots.',
  ''
];
const abortFetch=async(url)=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8500);
  try{
    const response=await fetch(url,{headers:{accept:'application/json','user-agent':'Nightfall-Asset-License-Scout/1.0'},signal:controller.signal});
    if(!response.ok)throw Error('HTTP '+response.status);
    return await response.json();
  }finally{clearTimeout(timer)}
};
const enc=id=>id.split('/').map(encodeURIComponent).join('/');
(async()=>{
  const seen=new Map();
  for(const keyword of keywords){
    try{
      const url='https://huggingface.co/api/datasets?search='+encodeURIComponent(keyword)+'&limit=18&full=true';
      const datasets=await abortFetch(url);
      if(!Array.isArray(datasets))throw Error('Unexpected dataset metadata');
      for(const d of datasets){
        if(!d.id||d.private||d.gated||seen.has(d.id))continue;
        seen.set(d.id,{id:d.id,keyword,license:d.cardData?.license||d.license||'NOT VERIFIED'});
      }
      lines.push('- Search "'+keyword+'": '+datasets.length+' metadata results returned');
    }catch(e){
      lines.push('- Search "'+keyword+'": unavailable ('+String(e.message||e)+')');
    }
  }
  lines.push('','## Potential 3D source files','','| Dataset | Search | License metadata | Candidate files |','|---|---|---|---|');
  let found=0,examined=0;
  for(const d of [...seen.values()].slice(0,24)){
    try{
      const data=await abortFetch('https://huggingface.co/api/datasets/'+enc(d.id)+'/tree/main?recursive=true&limit=150');
      examined++;
      const matches=(Array.isArray(data)?data:[]).filter(x=>x.type==='file'&&allowed.test(x.path||'')).slice(0,8);
      if(!matches.length)continue;
      found++;
      const url='https://huggingface.co/datasets/'+enc(d.id)+'/tree/main';
      const license=Array.isArray(d.license)?d.license.join(', '):String(d.license);
      const filenames=matches.map(x=>scrub(x.path)).join(', ');
      lines.push('| ['+scrub(d.id)+']('+url+') | '+scrub(d.keyword)+' | '+scrub(license)+' | '+filenames+' |');
    }catch(e){
      lines.push('<!-- Metadata unavailable for '+scrub(d.id)+': '+scrub(String(e.message||e)).replace(/--/g,'')+' -->');
    }
  }
  if(!found)lines.push('| None confirmed in scanned metadata | — | — | Search other repositories and check author rights manually |');
  lines.push('','Datasets scanned: '+examined+'; possible 3D file sources: '+found+'.',
    'This report does **not** approve any asset for production. No model files were downloaded.');
  fs.writeFileSync(outDir+'/report.md',lines.join('\n')+'\n');
  console.log('NIGHTFALL_HF_SCOUT: '+JSON.stringify({examined,found,report:outDir+'/report.md'}));
})().catch(e=>{
  fs.writeFileSync(outDir+'/report.md',lines.join('\n')+'\n\n## Scout error\n\n'+String(e.message||e)+'\n');
  console.error('NIGHTFALL_HF_SCOUT_ERROR '+String(e.message||e));
});
