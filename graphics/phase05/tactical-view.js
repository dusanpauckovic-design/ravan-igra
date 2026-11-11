/* E5-D3: tactical context uses the committed battle-view snapshot. */
(function(root){
 'use strict';
 const app=document.getElementById('app');
 const svgNS='http://www.w3.org/2000/svg';
 function decorate(){
  const view=app.querySelector('.rv-viewport'), header=view?.querySelector('.battle-goal');
  if(!header)return;
  const state=root.RavanGameplayUI?.snapshot(), board=state?.board;
  if(!board?.approach)return;
  view.classList.add('rv-e5-tactical');
  const signal=board.units.find(unit=>unit.hp>0&&unit.tactical==='prepare')||
   board.units.find(unit=>unit.hp>0&&unit.tactical==='interrupt');
  const copy=signal?.tactical==='prepare'?'Priprema udara · pomeri se van oznacenih polja':
   signal?.tactical==='interrupt'?'Priprema prekinuta':
   board.approach==='covered'?'Zaklonjeni prilaz':'Otvoreni prilaz';
  let status=header.querySelector('.rv-e5-tactical-status');
  if(!status){
   status=document.createElement('span');status.className='rv-e5-tactical-status';
   status.setAttribute('role','status');header.append(status);
  }
  if(status.textContent!==copy)status.textContent=copy;
  status.dataset.signal=signal?.tactical||'approach';
  const svg=view.querySelector('#combat-svg');
  if(!svg)return;
  for(const figure of svg.querySelectorAll('g[data-act="unit"]')){
   const unit=board.units.find(u=>u.id===figure.dataset.id);
   if(!unit)continue;
   const marker=figure.querySelector('.rv-e5-svg-status');
   const text=unit.tactical==='prepare'?'!':unit.tactical==='interrupt'?'Prekinut':unit.guarding?'Gard':'';
   if(!text){marker?.remove();continue;}
   if(marker?.textContent===text)continue;
   const badge=marker||document.createElementNS(svgNS,'text');
   badge.classList.add('rv-e5-svg-status');badge.setAttribute('y','-112');badge.setAttribute('text-anchor','middle');
   badge.setAttribute('aria-hidden','true');badge.dataset.signal=unit.tactical||'guard';
   badge.textContent=text;
   if(!marker)figure.append(badge);
  }
 }
 new MutationObserver(decorate).observe(app,{childList:true,subtree:true});
 decorate();
})(globalThis);
