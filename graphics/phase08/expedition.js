(function(root){
 'use strict';
 const app=document.getElementById('app');
 function el(tag,copy,cls){
  const n=document.createElement(tag);if(copy)n.textContent=copy;if(cls)n.className=cls;return n;
 }
 function goal(model){
  const p=model.progress;
  if(!p.waypoint)return p.route==='river'?'Obnovi ili poseti obnovljenu Putnu stanicu.':'Poseti Sumski rub.';
  if(p.visited.length<3)return 'Nastavi kroz preostale regije.';
  if(!model.proof)return 'Potvrdi prolaz na Kamenom prolazu ili pobedi razbojnike van Doline.';
  return model.home?'Zavrsi ekspediciju u kampu.':'Vrati se u kamp.';
 }
 function attach(){
  const original=app.querySelector('[aria-label="Ekspedicija kroz tri regije"]');
  const combat=app.querySelector('.rv-viewport .battle-goal');
  if((!original||original.dataset.e8Expedition)&&(!combat||combat.dataset.e8Expedition))return;
  const snapshot=root.RavanRPG.snapshot(),model=snapshot.expedition;
  if(!model?.progress)return;
  const p=model.progress;
  if(combat){
   combat.dataset.e8Expedition='true';
   if(p.status==='active')combat.append(el('small','Ekspedicija · '+p.visited.length+'/3 regije','rv-e8-battle-progress'));
  }
  if(!original)return;
  original.dataset.e8Expedition='true';
  const status=original.querySelector('[role=status]');
  const panel=el('section','','rv-e8-expedition');
  panel.setAttribute('aria-label','Napredak ekspedicije');
  const route=model.routes.find(r=>r.id===p.route);
  panel.append(el('h2',route?.name||'Ekspedicija'));
  if(p.status==='active'){
   const next=el('p',goal(model),'rv-e8-exp-goal');
   next.setAttribute('role','status');panel.append(next);
   const row=el('div','','rv-e8-exp-status');
   for(const [label,done] of [[p.visited.length+'/3 regije',p.visited.length===3],['Prilaz',p.waypoint],['Dokaz prolaza',model.proof]]){
    row.append(el('span',(done?'✓ ':'○ ')+label));
   }
   panel.append(row);
   const details=el('details');details.append(el('summary','Povratak i opcioni izazov'));
   details.append(el('p','Povratak peske ide kroz prethodne regije. Visoki greben je opcioni izazov.'));
   if(model.canGuide)details.append(el('p','Prevoz: '+model.guide.gold+' zlata · '+model.guide.ticks+' koraka sata.'));
   panel.append(details);
  }else{
   panel.append(el('p',status?.textContent||'Ekspedicija je zavrsena.','rv-e8-exp-goal'));
   const wins=p.wins.length;
   panel.append(el('p',p.visited.length+'/3 regije · '+wins+' potvrdenih susreta'+(p.elite?' · Elita savladana':'')));
  }
  for(const button of original.querySelectorAll('[data-act=long-expedition]')){
   const start=button.dataset.id.startsWith('start:');
   panel.append(start?button.closest('p'):button);
  }
  const map=app.querySelector('svg[aria-label="Mapa regije"]');
  if(map)map.before(panel);else original.before(panel);
  original.hidden=true;
 }
 new MutationObserver(attach).observe(app,{childList:true,subtree:true});attach();
})(globalThis);
