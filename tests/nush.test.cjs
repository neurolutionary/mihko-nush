'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const data=require('../nush/pilot.json');
const {build}=require('../tools/nush/build.cjs');
test('24 draft cards have valid answers, unique IDs and four balanced subjects',()=>{
 assert.equal(data.cards.length,24);
 assert.equal(new Set(data.cards.map(c=>c.id)).size,24);
 for(const subject of data.subjects)assert.equal(data.cards.filter(c=>c.subjectId===subject.id).length,6);
 for(const c of data.cards){
  assert.ok(/^G1-(MATH|UKR|ENG|YDS)-\d{2}$/.test(c.id),c.id);
  assert.equal(c.courseId,'grade1');assert.equal(c.status,'author_draft');
  assert.equal(c.gameExportStatus,'not_exported');
  assert.ok(data.subjects.some(s=>s.id===c.subjectId));
  assert.ok(data.sources.some(s=>s.id===c.curriculum.sourceId));
  const {type,options,answerIds}=c.interaction;
  assert.ok(['choose_one','choose_count','order'].includes(type));
  assert.equal(new Set(options.map(o=>o.id)).size,options.length);
  assert.ok(answerIds.every(id=>options.some(o=>o.id===id)),c.id);
  if(type==='order'){assert.equal(answerIds.length,options.length);assert.equal(new Set(answerIds).size,options.length);}
  else assert.equal(answerIds.length,1);
  for(const key of ['goal','teach','prompt','hint','easier','skillId'])assert.ok(c[key]?.trim(),c.id+' '+key);
 }
});
test('All card prerequisites resolve and cannot form a cycle',()=>{
 const seen=new Set(),visiting=new Set();
 function visit(id){
  assert.ok(!visiting.has(id),'Cycle at '+id);if(seen.has(id))return;
  const card=data.cards.find(c=>c.id===id);assert.ok(card,'Missing prerequisite '+id);
  visiting.add(id);for(const prerequisite of card.prerequisites)visit(prerequisite);
  visiting.delete(id);seen.add(id);
 }
 data.cards.forEach(c=>visit(c.id));
});
test('Standalone Pages bundle includes only the authored NUSH site',()=>{
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'mihko-nush-'));
 try{
  build(path.resolve(__dirname,'..'),output);
  assert.deepEqual(fs.readdirSync(output).sort(),['.nojekyll','index.html','nush']);
  assert.deepEqual(fs.readdirSync(path.join(output,'nush')).sort(),['app.js','index.html','pilot.json','styles.css']);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output,'nush/pilot.json'),'utf8')),data);
  assert.match(fs.readFileSync(path.join(output,'index.html'),'utf8'),/url=\.\/nush\//);
 }finally{fs.rmSync(output,{recursive:true,force:true});}
});
