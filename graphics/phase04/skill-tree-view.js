/* Presentation only. Skill visibility, learning and reset are owned by RavanCore. */
(function(){
 const base=renderSkills;
 const plans=new Map();
 let last=null;
 function profileKey(){
  return JSON.stringify([state.overworld?.seed,state.name]);
 }
 function activePlan(){
  const key=profileKey();
  if(!plans.has(key))plans.set(key,new Set());
  return plans.get(key);
 }
 renderSkillPath=function(path,selected){
  const nodes=path.skills.map((id,index)=>{
   const skill=C.SKILLS[id], status=C.skillStatus(state,id), parent=skill.requires;
   const prior=path.skills[index-1];
   const link=prior&&parent===prior?'<span class="rv20-link '+(C.skillStatus(state,prior).known?'lit':'')+'" aria-hidden="true"></span>':'';
   const label=status.known?'Nauceno':status.canLearn?'Dostupno':'Zakljucano';
   const mark=status.known?'✓':status.canLearn?'+':'−';
   const planned=activePlan().has(id);
   return `${link}<button type="button" class="v4-tree-node rv20-node ${status.known?'known':status.canLearn?'open':'locked'}"
    data-act="v4-skill-select" data-id="${esc(id)}" aria-pressed="${id===selected}">
    <span class="v4-node-icon">${icon(skill.icon,26)}<em aria-hidden="true">${mark}</em></span>
    <b>${esc(skill.name)}</b><small>${label}${planned?' · Plan':''}</small></button>`;
  }).join('');
  return `<div class="v4-tree-row rv20-path ${esc(path.id)}"><div class="v4-branch-label">${icon(path.icon,20)}<b>${esc(path.name)}</b></div><div class="v4-tree-nodes">${nodes}</div></div>`;
 };
 renderSkills=function(){
  const {paths,modifiers}=C.skillTree(state);
  const visible=new Set([...paths,...modifiers].flatMap(path=>path.skills));
  const key=profileKey(), plan=activePlan();
  for(const id of plan)if(!visible.has(id)||C.skillStatus(state,id).known)plan.delete(id);
  const unlocked=last?.key===key&&[...visible].some(id=>!last.visible.has(id));
  last={key,visible};
  const markup=base();
  const selected=ui.v4Skill, selectedStatus=C.skillStatus(state,selected);
  const canPlan=selectedStatus.visible&&!selectedStatus.known&&(plan.has(selected)||plan.size<3);
  const steps=[...plan].map(id=>esc(C.SKILLS[id].name)).join(' → ');
  const prompt=plan.has(selected)?'Ukloni iz plana':'Dodaj u plan';
  const planPanel=`<div class="rv20-plan">${steps?`<p><b>Plan</b> · ${steps}</p>`:''}
   ${canPlan?`<button type="button" class="v3-text-button" data-rv20-plan="${esc(selected)}">${prompt}</button>`:''}</div>`;
  return markup.replace('class="v4-skills-page"',`class="v4-skills-page rv20 ${unlocked?'rv20-reveal':''}"`)
   .replace('</aside>',planPanel+'</aside>');
 };
 document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-rv20-plan]');
  if(!button||!state)return;
  const id=button.dataset.rv20Plan, status=C.skillStatus(state,id), plan=activePlan();
  if(!status.visible||status.known)return;
  if(plan.has(id))plan.delete(id);
  else if(plan.size<3)plan.add(id);
  render();
  document.querySelector('[data-rv20-plan]')?.focus();
 });
})();
