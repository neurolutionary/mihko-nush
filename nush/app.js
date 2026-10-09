'use strict';
(async function(){
 const $=id=>document.getElementById(id);
 let data,subject='all',query='',activeCard=null,picks=[],lastTrigger=null;
 const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
 const subjectFor=id=>data.subjects.find(s=>s.id===id);
 const normalize=value=>value.normalize('NFKC').toLocaleLowerCase('uk-UA').replace(/[’‘`]/g,"'");
 function renderCourses(id){
  const course=data.courses.find(c=>c.id===id),panel=$('course-panel');
  $('course-tabs').querySelectorAll('button').forEach(b=>{const chosen=b.dataset.course===id;b.setAttribute('aria-selected',String(chosen));b.tabIndex=chosen?0:-1;});
  panel.setAttribute('aria-labelledby','tab-'+id);panel.replaceChildren();
  const intro=el('div');intro.append(el('span','badge',course.status),el('h3','',course.label),el('p','',course.description));
  const list=el('ul');course.topics.forEach(t=>list.append(el('li','',t)));
  panel.append(intro,list,el('p','course-next','Наступна дія: '+course.next));
 }
 function renderCards(){
  const tokens=normalize(query.trim()).split(/\s+/).filter(Boolean);
  const filtered=data.cards.filter(c=>(subject==='all'||c.subjectId===subject)&&tokens.every(t=>normalize([c.id,c.title,c.goal,c.prompt,subjectFor(c.subjectId).name].join(' ')).includes(t)));
  $('result-count').textContent=filtered.length+' з '+data.cards.length+' карток';
  $('empty').hidden=filtered.length>0;$('reset-filters').hidden=subject==='all'&&!query;
  $('cards').replaceChildren();
  filtered.forEach(c=>{
   const s=subjectFor(c.subjectId),article=el('article','card'),top=el('div','card-top');
   top.append(el('span','subject-icon '+s.color,s.symbol),el('span','card-id',c.id));
   const bottom=el('div','card-bottom');bottom.append(el('span','',s.short+' · ~1–2 хв'));
   const button=el('button','open-card','Відкрити картку ↗');button.type='button';button.setAttribute('aria-label','Відкрити картку: '+c.title);
   button.addEventListener('click',()=>openCard(c,button));bottom.append(button);
   article.append(top,el('h3','',c.title),el('p','',c.goal),bottom);$('cards').append(article);
  });
  $('subject-filters').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.subject===subject)));
 }
 function resetAnswers(){
  picks=[];$('hint-button').setAttribute('aria-expanded','false');$('feedback').textContent='';$('hint').hidden=true;$('try-again').hidden=true;$('answer-options').replaceChildren();
  const isOrder=activeCard.interaction.type==='order';$('order-note').hidden=!isOrder;
  activeCard.interaction.options.forEach(option=>{
   const button=el('button','',option.label);button.type='button';button.dataset.option=option.id;button.addEventListener('click',()=>answer(option,button,isOrder));$('answer-options').append(button);
  });
 }
 function answer(option,button,isOrder){
  if(isOrder){picks.push(option.id);button.classList.add('picked');button.disabled=true;button.textContent=picks.length+'. '+option.label;if(picks.length<activeCard.interaction.options.length){$('feedback').textContent='Обрано '+picks.length+' з '+activeCard.interaction.options.length;return;}}
  else picks=[option.id];
  const correct=JSON.stringify(picks)===JSON.stringify(activeCard.interaction.answerIds);
  $('answer-options').querySelectorAll('button').forEach(b=>{b.disabled=true;if(!isOrder&&activeCard.interaction.answerIds.includes(b.dataset.option))b.classList.add('correct');});
  if(!correct&&!isOrder)button.classList.add('wrong');
  if(isOrder&&!correct){$('answer-options').querySelectorAll('button').forEach(b=>b.classList.add('wrong'));}
  const orderedAnswer=activeCard.interaction.answerIds.map(id=>activeCard.interaction.options.find(o=>o.id===id).label).join(' → ');
  $('feedback').textContent=correct?'Так, правильно! Спробуй пояснити, як ти це зрозумів / зрозуміла.':'Спробуй ще раз. Правильна відповідь: '+orderedAnswer+'.';
  $('try-again').hidden=false;
 }
 function openCard(card,trigger){
  activeCard=card;lastTrigger=trigger;
  $('dialog-subject').textContent=subjectFor(card.subjectId).name;$('dialog-id').textContent=card.id;$('dialog-title').textContent=card.title;$('dialog-goal').textContent=card.goal;$('dialog-teach').textContent=card.teach;$('dialog-prompt').textContent=card.prompt;$('hint').textContent=card.hint;$('dialog-easier').textContent=card.easier;$('dialog-skill').textContent=card.skillId;
  $('dialog-prerequisites').textContent=card.prerequisites.length?card.prerequisites.map(id=>{const c=data.cards.find(c=>c.id===id);return id+' — '+c.title;}).join('; ')+'. Також врахуй знання, зазначені в поясненні.':'Прочитати вступне пояснення; додаткові знання, якщо потрібні, зазначено в ньому.';
  const source=data.sources.find(s=>s.id===card.curriculum.sourceId);$('dialog-source').textContent=source.title;$('dialog-source').href=source.url;
  $('card-dialog').querySelector('.method').open=false;resetAnswers();$('card-dialog').showModal();$('card-dialog').scrollTop=0;$('close-dialog').focus();
 }
 try{
  const response=await fetch('pilot.json');if(!response.ok)throw new Error('HTTP '+response.status);data=await response.json();
  data.courses.forEach(c=>{const b=el('button','',c.label);b.type='button';b.id='tab-'+c.id;b.dataset.course=c.id;b.setAttribute('role','tab');b.setAttribute('aria-controls','course-panel');b.addEventListener('click',()=>renderCourses(c.id));$('course-tabs').append(b);});
  $('course-tabs').addEventListener('keydown',event=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;event.preventDefault();const buttons=[...$('course-tabs').querySelectorAll('button')],index=buttons.indexOf(document.activeElement);const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[next].click();buttons[next].focus();});
  renderCourses('grade1');
  [{id:'all',name:'Усі · 24'},...data.subjects.map(s=>({id:s.id,name:s.short+' · 6'}))].forEach(s=>{const b=el('button','',s.name);b.type='button';b.dataset.subject=s.id;b.addEventListener('click',()=>{subject=s.id;renderCards();});$('subject-filters').append(b);});
  $('search').addEventListener('input',event=>{query=event.target.value;renderCards();});
  $('reset-filters').addEventListener('click',()=>{subject='all';query='';$('search').value='';renderCards();});
  data.sources.forEach(s=>{const article=el('article','source-item'),link=el('a','',s.title+' ↗');link.href=s.url;link.target='_blank';link.rel='noopener noreferrer';article.append(link,el('p','',s.note));$('source-list').append(article);});
  $('close-dialog').addEventListener('click',()=>$('card-dialog').close());
  $('card-dialog').addEventListener('close',()=>{if(lastTrigger&&lastTrigger.isConnected)lastTrigger.focus();});
  $('hint-button').addEventListener('click',()=>{$('hint').hidden=!$('hint').hidden;$('hint-button').setAttribute('aria-expanded',String(!$('hint').hidden));});
  $('try-again').addEventListener('click',resetAnswers);renderCards();
 }catch(error){$('load-error').hidden=false;$('load-error').textContent='Не вдалося завантажити картки. Онови сторінку або відкрий файл pilot.json за посиланням вище.';console.error(error);}
})();
