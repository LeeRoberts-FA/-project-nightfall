#!/usr/bin/env node
'use strict';
// Isolated, no-API-key, read-mostly open-weight proposal generator for GitHub Actions.
// Models are NOT authorized to push, deploy, install packages or modify the public game.
const fs=require('node:fs');
const cp=require('node:child_process');
const path=require('node:path');
const id=process.env.AGENT_ID||'gameplay';
const spec={
  gameplay:{file:'public/game.js',anchor:'function joystick(',topic:'Mobile touch joystick and player-fired combat reliability'},
  visuals:{file:'public/scene3d.js',anchor:'attachModel(entry){',topic:'Rigged soldier weapon animation, third-person camera and mobile render efficiency'}
}[id];
if(!spec)throw Error('Unknown agent: '+id);
const model=process.env.AGENT_MODEL||'qwen2.5-coder:1.5b';
const output=path.join('agent-proposals',id);
fs.mkdirSync(output,{recursive:true});
const source=fs.readFileSync(spec.file,'utf8');
const start=source.indexOf(spec.anchor);
if(start<0)throw Error('Code anchor not found: '+spec.anchor);
const excerpt=source.slice(start,start+3400);
const prompt=[
  'You are an isolated coding assistant for PROJECT NIGHTFALL, a Three.js 3D co-op shooter.',
  'The user requires realistic gameplay and mobile controls, no more automatic firing.',
  'Task: find ONE tiny concrete defect or quality improvement in the supplied source excerpt.',
  'Do not rebuild the game, add packages, change network protocols, make purchases, or remove features.',
  'Output one JSON object ONLY, no Markdown. Keys: "find", "replace", "reason".',
  'The "find" must be an exact 1-to-400-character substring of the excerpt appearing exactly ONCE in the source.',
  'The "replace" must be the complete safer replacement, between 1 and 700 characters.',
  'Prefer a small robust one-line/two-line code improvement. Preserve JS syntax and all existing controls.',
  'If no safe fix exists return {"skip":true,"reason":"explain"} instead.',
  'Never call network services, read secrets, change billing, deploy, or import libraries.',
  'Filename: '+spec.file+'; objective: '+spec.topic,
  'SOURCE EXCERPT:',
  excerpt
].join('\n\n');
function saveReport(lines){
  fs.writeFileSync(path.join(output,'report.md'),lines.join('\n')+'\n');
  console.log('NIGHTFALL_OPEN_WEIGHT_AGENT '+id+' report saved');
}
async function main(){
  const report=[
    '# Nightfall proposed change: '+id,
    '',
    '- Model: '+model,
    '- Task: '+spec.topic,
    '- Source: '+spec.file,
    '- Mode: isolated GitHub Actions CPU runner; no paid inference or laptop model',
    '- Safety: any patch is a **proposal only**, not committed, merged, or deployed',
    ''
  ];
  let reply;
  try {
    const controller=new AbortController();
    const t=setTimeout(()=>controller.abort(),185000);
    try {
      const response=await fetch('http://127.0.0.1:11434/api/generate',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          model,prompt,stream:false,format:'json',
          options:{temperature:0.15,num_ctx:4096,num_predict:750}
        }),
        signal:controller.signal
      });
      if(!response.ok)throw Error('Ollama returned HTTP '+response.status);
      const result=await response.json();
      reply=String(result.response||'').trim();
    } finally {clearTimeout(t)}
  }catch(e){
    report.push('## Worker error','','Model request did not complete: '+String(e.message||e));
    saveReport(report);
    return;
  }
  fs.writeFileSync(path.join(output,'raw-response.txt'),reply.slice(0,10000)+'\n');
  let proposal;
  try{proposal=JSON.parse(reply)}catch{
    report.push('## No patch','','Model output was not valid JSON; see raw-response.txt.');
    saveReport(report);
    return;
  }
  report.push('## Model finding','',String(proposal.reason||'No rationale returned').slice(0,1200),'');
  if(proposal.skip===true){
    report.push('No code change suggested.');saveReport(report);return;
  }
  const find=proposal.find,replace=proposal.replace;
  if(typeof find!=='string'||typeof replace!=='string'||find.length<1||find.length>400||
      replace.length<1||replace.length>700||source.split(find).length!==2||!excerpt.includes(find)){
    report.push('**Rejected:** unsafe or nonmatching replacement.');saveReport(report);return;
  }
  const forbidden=/\b(?:require|eval|import|fetch|XMLHttpRequest|Function|process\.env)\s*\(|document\.cookie|localStorage|https?:\/\/|new\s+WebSocket|child_process/i;
  if(forbidden.test(replace)){
    report.push('**Rejected:** forbidden network, environment, code execution, or storage behavior.');saveReport(report);return;
  }
  const candidate=source.replace(find,replace);
  if(candidate===source){report.push('No change generated.');saveReport(report);return}
  fs.writeFileSync(spec.file,candidate);
  try{
    cp.execFileSync(process.execPath,['--check',spec.file],{stdio:'pipe',timeout:12000});
    cp.execFileSync('git',['diff','--check'],{stdio:'pipe',timeout:12000});
    cp.execFileSync('npm',['test'],{stdio:'pipe',timeout:80000});
  }catch(e){
    fs.writeFileSync(spec.file,source);
    report.push('**Rejected:** syntax or gameplay/server test failure.',
      '','\`\`\`',String(e.stderr||e.stdout||e.message).slice(-1200),'\`\`\`');
    saveReport(report);return;
  }
  const diff=cp.execFileSync('git',['diff','--',spec.file],{encoding:'utf8'});
  if(!diff.trim()){
    report.push('No diff after verification.');saveReport(report);return;
  }
  fs.writeFileSync(path.join(output,'candidate.patch'),diff);
  fs.writeFileSync(spec.file,source); // never leave modified production code in this job
  report.push('## Candidate patch','','**PASS:** JavaScript syntax, whitespace check, and existing \`npm test\`.',
    '','\`candidate.patch\` is attached as a GitHub Actions artifact for **human review**.',
    'The real WebGL and cross-device browser test has NOT run against this candidate.',
    'Do not apply or deploy it without additional visual/gameplay checks.');
  saveReport(report);
}
main().catch(e=>{console.error(e);process.exitCode=1});
