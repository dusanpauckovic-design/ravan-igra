(function(root){
 'use strict';
 const app=document.getElementById('app'), modal=document.getElementById('modal');
 const tags={'boots.trail':'boots','armor.pass-plate':'plate','sword.short':'sword','sword.edge':'edge','sword.balance':'balance'};
 const artCache=new Map();
 function el(tag,copy,cls){
  const n=document.createElement(tag);if(copy)n.textContent=copy;if(cls)n.className=cls;return n;
 }
 function polygon(ctx,points,color,edge){
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
  ctx.fillStyle=color;ctx.fill();if(edge){ctx.strokeStyle=edge;ctx.lineWidth=2;ctx.stroke();}
 }
 function draw(ctx,kind){
  if(kind==='boots'){
   for(const [x,y] of [[21,6],[34,18]]){
    ctx.save();ctx.translate(x,y);
    polygon(ctx,[[0,8],[23,6],[23,34],[41,46],[43,55],[3,55],[0,48]],'#966949','#d3aa7c');
    ctx.fillStyle='#3c352c';ctx.fillRect(1,51,41,5);ctx.fillStyle='#d9ad78';
    for(let i=0;i<3;i++)ctx.fillRect(8,18+i*6,10,2);
    ctx.restore();
   }
  }else if(kind==='plate'){
   polygon(ctx,[[26,18],[39,13],[49,25],[59,13],[73,18],[84,34],[70,43],[65,78],[35,78],[29,43],[16,34]],'#6a7472','#c8cabe');
   polygon(ctx,[[31,43],[48,31],[67,44],[63,65],[36,65]],'#9ba49c','#505f5e');
   ctx.fillStyle='#bcac89';ctx.fillRect(35,67,31,6);
  }else{
   ctx.save();ctx.translate(50,46);ctx.rotate(.56);
   polygon(ctx,[[-6,16],[-6,-25],[0,-39],[6,-25],[6,16]],kind==='edge'?'#dbe9e5':'#9caba9','#d8d4ba');
   ctx.fillStyle=kind==='balance'?'#cb995c':'#8f7357';ctx.fillRect(-12,14,24,6);
   ctx.fillStyle='#644a39';ctx.fillRect(-3,20,6,13);
   ctx.fillStyle=kind==='balance'?'#d9ba83':'#90938c';ctx.fillRect(-6,32,12,6);
   ctx.restore();
  }
 }
 function url(tag){
  if(!tags[tag])return '';
  if(!artCache.has(tag)){
   const canvas=el('canvas');canvas.width=100;canvas.height=92;
   draw(canvas.getContext('2d'),tags[tag]);artCache.set(tag,canvas.toDataURL());
  }
  return artCache.get(tag);
 }
 function image(tag){
  const img=el('img','','rv-e8-item');img.src=url(tag);img.alt='';img.dataset.gearTag=tag;return img;
 }
 function battleEquipment(battle){
  if(!battle.units.some(u=>u.team==='ally'&&u.heroId))return null;
  const roster=root.RavanRPG?.snapshot().sheet?.roster||[];
  return Object.fromEntries(battle.units.filter(u=>u.team==='ally').map(unit=>{
   const equipment=roster.find(h=>h.id===unit.heroId)?.equipment||{};
   return [unit.id,Object.values(equipment).map(x=>x?.appearanceTag).filter(tag=>tags[tag])];
  }));
 }
 function paintFighter(ctx,unit,pose){
  if(!unit.equipment?.length)return;
  const side=pose.facing||1;
  for(const tag of unit.equipment){
   const kind=tags[tag], sword=tag.startsWith('sword.');
   const size=sword?pose.height*.58:kind==='plate'?pose.height*.46:pose.height*.25;
   const x=pose.x+(sword?side*pose.width*.24:0)-size*.5;
   const y=pose.y-(sword?pose.height*.63:kind==='plate'?pose.height*.74:pose.height*.20);
   ctx.save();ctx.translate(x,y);ctx.scale(size/100,size/100);draw(ctx,kind);ctx.restore();
  }
 }
 function sheet(s){
  const detail=app.querySelector('.sheet-profile');
  if(!detail||detail.nextElementSibling?.classList.contains('rv-e8-sheet-gear'))return;
  const selected=app.querySelector('[data-sheet][aria-pressed=true]')?.dataset.sheet||s.sheet?.selected;
  const hero=s.sheet?.roster.find(h=>h.id===selected);
  const gear=Object.values(hero?.equipment||{}).filter(item=>tags[item?.appearanceTag]);
  if(!gear.length)return;
  const list=el('div','','rv-e8-sheet-gear');list.setAttribute('aria-label','Opremljeni predmeti');
  for(const item of gear){
   const group=el('span','','rv-e8-gear-chip');group.append(image(item.appearanceTag),el('span',item.name));list.append(group);
  }
  detail.after(list);
 }
 function inventory(s){
  const detail=app.querySelector('.item-hero');
  if(!detail||detail.querySelector('.rv-e8-item'))return;
  const uid=app.querySelector('[data-item][aria-pressed=true]')?.dataset.item;
  const item=s.inventory?.items.find(i=>i.uid===uid);
  if(tags[item?.appearanceTag]){
   detail.prepend(image(item.appearanceTag));
   if(item.source)detail.append(el('small',item.source));
  }
 }
 function workshop(s){
  for(const row of modal.querySelectorAll('section > p')){
   if(row.dataset.e8Upgrade)continue;
   const heading=row.parentElement.querySelector('h3')?.textContent;
   const item=s.workshop?.items.find(i=>heading===i.name+' · '+i.uid);
   const choice=item?.choices.find(c=>c.name===row.querySelector('b')?.textContent);
   const defs=root.RavanCore.ITEMS;
   const from=defs.sword,to=Object.values(defs).find(v=>v.name===choice?.name);
   if(!choice||!from||!to?.appearanceTag)continue;
   row.dataset.e8Upgrade=choice.id;row.classList.add('rv-e8-upgrade');
   const compare=el('span','','rv-e8-upgrade-stats');
   for(const [key,label] of [['attack','Napad'],['speed','Bonus inicijative']]){
    const before=from[key]||0,after=to[key]||0;
    compare.append(el('span',label+' '+before+' → '+after,before!==after?'rv-e8-delta':''));
   }
   row.prepend(image(to.appearanceTag));row.append(compare);
  }
 }
 function svg(){
  const nodes=app.querySelectorAll('#combat-svg g[data-act=unit][data-id^=a_]');
  if(!nodes.length||!state?.battle)return;
  const equipment=battleEquipment(state.battle);
  for(const unit of nodes){
   if(unit.querySelector('.rv-e8-svg-gear'))continue;
   const tags=equipment?.[unit.dataset.id];if(!tags?.length)continue;
   tags.forEach((tag,i)=>{
    const img=document.createElementNS('http://www.w3.org/2000/svg','image');
    img.setAttribute('class','rv-e8-svg-gear');img.setAttribute('href',url(tag));
    img.setAttribute('x',String(i*10-20));img.setAttribute('y',tag.startsWith('boots')?'-11':tag.startsWith('armor')?'-58':'-46');
    img.setAttribute('width','32');img.setAttribute('height','30');unit.append(img);
   });
  }
 }
 function attach(){
  if(!app.querySelector('.sheet-profile,.item-hero,#combat-svg')&&!modal.open)return;
  const snapshot=root.RavanRPG.snapshot();
  sheet(snapshot);inventory(snapshot);if(modal.open)workshop(snapshot);
  if(typeof state!=='undefined')svg();
 }
 root.RavanE8Equipment={battleEquipment,paintFighter};
 const observer=new MutationObserver(attach);
 observer.observe(app,{childList:true,subtree:true});observer.observe(modal,{childList:true,subtree:true});attach();
})(globalThis);
