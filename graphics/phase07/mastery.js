(function(root){
 'use strict';
 const app=document.getElementById('app');
 let selectedPath=null, owner=null;
 function make(tag,copy,cls){
  const node=document.createElement(tag);node.textContent=copy;if(cls)node.className=cls;return node;
 }
 function decorate(){
  const page=app.querySelector('.v4-skills-page');
  if(!page||page.classList.contains('rv-e7-mastery')||typeof state==='undefined'||!state)return;
  const model=root.RavanCore.skillTree(state);
  const key=state.name+'|'+state.overworld?.seed;
  if(key!==owner){owner=key;selectedPath=null;}
  const tree=page.querySelector('.v4-tree');
  if(!tree)return;
  page.classList.add('rv-e7-mastery');
  const rows=Array.from(tree.querySelectorAll(':scope > .v4-tree-row'));
  const tabs=make('nav','','rv-e7-branches');tabs.setAttribute('aria-label','Pravci razvoja');
  const active=rows.findIndex(row=>row.querySelector('[aria-pressed=true]'));
  const current=model.paths.findIndex(p=>p.id===selectedPath);
  const reveal=index=>{
   selectedPath=index<0?null:model.paths[index].id;
   rows.forEach((row,i)=>{row.hidden=index>=0&&i!==index;});
   Array.from(tabs.children).forEach((tab,i)=>tab.setAttribute('aria-pressed',String(i===index+1)));
   for(const section of tree.querySelectorAll(':scope > section'))section.hidden=index>=0&&model.paths[index].id!=='magic';
  };
  for(const [i,label] of ['Svi pravci',...model.paths.map(p=>p.name)].entries()){
   const button=make('button',label);button.type='button';
   button.onclick=()=>reveal(i-1);tabs.append(button);
  }
  tree.before(tabs);reveal(active>=0&&current!==active?active:current);
  for(const pair of model.specializations||[]){
   const nodes=pair.map(id=>Array.from(tree.querySelectorAll('[data-act=v4-skill-select]')).find(node=>node.dataset.id===id));
   if(nodes.some(node=>!node))continue;
   const parent=nodes[0].parentElement;
   if(nodes[1].parentElement!==parent)continue;
   const group=make('div','','rv-e7-specialization');group.setAttribute('role','group');group.setAttribute('aria-label','Izaberi jednu specijalizaciju');
   nodes[0].before(group);group.append(make('span','Jedan izbor','rv-e7-choice-label'),...nodes);
  }
  const chosen=tree.querySelector('[data-act=v4-skill-select][aria-pressed=true]');
  const skill=root.RavanCore.SKILLS[chosen?.dataset.id];
  const other=skill?.exclusiveWith&&root.RavanCore.SKILLS[skill.exclusiveWith];
  if(other)page.querySelector('.v4-skill-detail .v4-skill-buy')?.before(make('p','Alternativa: '+other.name,'rv-e7-alternative'));
 }
 new MutationObserver(decorate).observe(app,{childList:true,subtree:true});decorate();
})(globalThis);
