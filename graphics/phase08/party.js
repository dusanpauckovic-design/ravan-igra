(function(root){
 'use strict';
 const app=document.getElementById('app');
 function el(tag,copy,cls){
  const n=document.createElement(tag);n.textContent=copy;
  if(cls)n.className=cls;return n;
 }
 function attach(){
  const page=app.querySelector('.rosterlayout');
  if(!page||page.dataset.e8Party)return;
  const sheet=root.RavanRPG.snapshot().sheet;
  if(!sheet)return;
  page.dataset.e8Party='true';
  const cards=page.querySelector('.herogrid');
  const order=el('section','','rv-e8-formation');
  order.setAttribute('aria-label','Aktivni i rezervni clanovi');
  for(const [label,list] of [
   ['Pocetna postava',sheet.roster.filter(h=>h.active&&!(h.id==='main'&&sheet.reserveMain))],
   ['Rezerva',sheet.roster.filter(h=>!h.active||(h.id==='main'&&sheet.reserveMain))]
  ]){
   const row=el('div','','rv-e8-formation-row');row.append(el('strong',label));
   for(const hero of list){
    const control=Array.from(cards.querySelectorAll('[data-act=hero-detail]')).find(b=>b.dataset.id===hero.id);
    if(!control)continue;
    const button=el('button',hero.stats.name);button.type='button';
    button.setAttribute('aria-pressed',String(sheet.selected===hero.id));
    button.onclick=()=>control.click();row.append(button);
   }
   order.append(row);
  }
  cards.before(order);
  const reserve=page.querySelector('[data-act=party-reserve]');
  if(reserve)reserve.after(el('p',sheet.reserveMain?'Glavni lik ulazi kad padnu svi saborci, u borbama koje dozvoljavaju rezervu.':'Glavni lik je u pocetnoj postavi.','rv-e8-party-note'));
  const active=sheet.roster.filter(h=>h.active&&!(h.id==='main'&&sheet.reserveMain));
  const allies=active.map(h=>h.stats.name);
  const trained=typeof state!=='undefined'&&state?.narrative?.soloIntro?.phase==='trained';
  if(trained&&active.length>1){
   const cooperation=el('details','','rv-e8-cooperation');cooperation.append(el('summary','Saradnja u borbi'));
   for(const [id,copy] of [['radan','Gard: presrece prvi osnovni udar namenjen susednom saborcu.'],['iva','Precizan hitac ostavlja otvor. Drugi saborac moze da ga iskoristi za +3 stete.']]){
    const member=active.find(h=>h.id===id);
    if(member)cooperation.append(el('p',member.stats.name+' · '+copy+' U postavi: '+allies.filter(name=>name!==member.stats.name).join(', ')+'.'));
   }
   if(cooperation.childElementCount>1)order.after(cooperation);
  }
  for(const button of cards.querySelectorAll('[data-act=hero-detail]')){
   const member=sheet.roster.find(h=>h.id===button.dataset.id);
   const technique=member?.actions.find(a=>!['guard','attack'].includes(a.id));
   if(technique){
    const copy=root.RavanCore.SKILLS[technique.id]?.name||({aim:'Precizan hitac',bash:'Potisak'})[technique.id];
    if(copy)button.querySelector('.herobody')?.append(el('small',copy,'rv-e8-party-technique'));
   }
   if(member?.id==='main'&&sheet.reserveMain)button.querySelector('.inparty').textContent='REZERVA';
  }
 }
 new MutationObserver(attach).observe(app,{childList:true,subtree:true});attach();
})(globalThis);
