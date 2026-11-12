(function(root){
 'use strict';
 const data={
  human:{name:'Naoruzani ljudi',sign:'◇',height:1,width:.91},
  beast:{name:'Zveri',sign:'⌁',height:.84,width:1.28},
  relentless:{name:'Neumoljivi',sign:'⬟',height:1.08,width:1.10}
 };
 function pose(unit,event,t,facing,reduced){
  const profile=data[unit.family];
  if(!profile)return null;
  const melee=!reduced&&event?.actor===unit.id&&event.type==='melee';
  const weight=melee?Math.sin(Math.PI*t):0;
  return {...profile,tilt:unit.family==='beast'?facing*.12*weight:0,offset:unit.family==='relentless'?-facing*8*weight:0};
 }
 function equipment(ctx,unit,pose){
  if(unit.family!=='relentless'||unit.kind!=='giant')return;
  const x=pose.x+pose.facing*pose.width*.22,y=pose.y-pose.height*.56;
  ctx.save();ctx.translate(x,y);ctx.rotate(-pose.facing*.31+(pose.tilt||0));
  ctx.fillStyle='#544535';ctx.fillRect(-2,-18,4,43);
  ctx.fillStyle='#78827b';ctx.fillRect(-11,-23,22,12);
  ctx.fillStyle='#b5bfb0';ctx.fillRect(-11,-23,22,3);
  ctx.restore();
 }
 function decorate(){
  const svg=document.querySelector('#combat-svg');
  if(!svg)return;
  const board=root.RavanGameplayUI?.snapshot().board;
  if(!board)return;
  for(const node of svg.querySelectorAll('g[data-act=unit]')){
   const unit=board.units.find(u=>u.id===node.dataset.id);
   const profile=data[unit?.family];if(!profile)continue;
   node.dataset.e7Family=unit.family;
   let badge=node.querySelector('.rv-e7-family-badge');
   if(badge)continue;
   badge=document.createElementNS('http://www.w3.org/2000/svg','text');
   badge.setAttribute('class','rv-e7-family-badge');
   badge.setAttribute('aria-hidden','true');
   badge.setAttribute('text-anchor','middle');badge.setAttribute('y','-97');
   badge.textContent=profile.sign;node.append(badge);
   const label=node.getAttribute('aria-label');
   if(label)node.setAttribute('aria-label',label+' · '+profile.name);
  }
 }
 root.RavanE7Families={pose,equipment};
 new MutationObserver(decorate).observe(document.getElementById('app'),{childList:true,subtree:true});
 decorate();
})(globalThis);
