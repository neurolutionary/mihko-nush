'use strict';
const fs=require('node:fs');
const path=require('node:path');
const files=['index.html','styles.css','app.js','pilot.json'];
function build(root,output=path.join(root,'dist/nush-pages')){
 fs.rmSync(output,{recursive:true,force:true});
 fs.mkdirSync(path.join(output,'nush'),{recursive:true});
 for(const file of files)fs.copyFileSync(path.join(root,'nush',file),path.join(output,'nush',file));
 fs.writeFileSync(path.join(output,'.nojekyll'),'');
 fs.writeFileSync(path.join(output,'index.html'),'<!doctype html><html lang="uk"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=./nush/"><title>Mihko · НУШ</title><a href="./nush/">Відкрити НУШ у Mihko →</a></html>\n');
 return output;
}
module.exports={build};
if(require.main===module)console.log(build(path.resolve(__dirname,'../..')));
