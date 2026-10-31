'use strict';
// A deterministic FREE GitHub Actions QA worker; no AI service or account credentials.
const fs=require('node:fs'),path=require('node:path');
function file(p){return fs.readFileSync(path.join(__dirname,'..',p),'utf8')}
const installer=file('scripts/install-assets.cjs'),credits=file('ASSET_CREDITS.md');
const modelFiles=['soldier.glb','rifle.glb','burnt-car.glb'];
const failures=[],messages=[];
for(const model of modelFiles){
  if(!installer.includes('models/'+model))failures.push('Missing hash-pinned download declaration: '+model);
  if(!fs.existsSync(path.join(__dirname,'../public/models',model)))failures.push('Missing installed model: '+model);
  else messages.push('Present: '+model+' ('+fs.statSync(path.join(__dirname,'../public/models',model)).size+' bytes)');
}
for(const source of ['CC0','CC BY','https://']){
  if(!credits.includes(source))failures.push('Asset credits missing: '+source);
}
for(const url of installer.matchAll(/url:'([^']+)'/g)){
  if(!url[1].startsWith('https://raw.githubusercontent.com/'))failures.push('Non-pinned asset source host: '+url[1]);
  if(/\/main\/|\/master\//.test(url[1]))failures.push('Unpinned branch URL: '+url[1]);
}
const reporter='## Asset provenance sentinel\n\n'+messages.map(x=>'- '+x).join('\n')+'\n\nProblems: '+failures.length+'\n';
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n'+reporter);
console.log(reporter);
if(failures.length){for(const failure of failures)console.error('::error::'+failure);process.exitCode=1}
