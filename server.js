'use strict';
// Project Nightfall deployable bootstrap. The complete original source,
// including browser assets and tests, is packaged in payload-1..4.txt.
// Run node server.js --extract-only to restore the editable project tree.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const target = path.join(__dirname, '.nightfall-runtime');
const encoded = [1,2,3,4].map(i=>fs.readFileSync(path.join(__dirname, 'payload-'+i+'.txt'),'utf8').trim()).join('');
const files = JSON.parse(zlib.brotliDecompressSync(Buffer.from(encoded,'base64')).toString('utf8'));
for (const [name, content] of Object.entries(files)) {
  const full = path.resolve(target,name);
  if (!full.startsWith(target + path.sep)) throw new Error('Unexpected source file path');
  fs.mkdirSync(path.dirname(full),{recursive:true});
  fs.writeFileSync(full,content,'utf8');
}
if (process.argv.includes('--extract-only')) {
  console.log('Restored '+Object.keys(files).length+' source files in '+target);
} else {
  require(path.join(target,'server.js'));
}