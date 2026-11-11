/* E5-D4: reward, equipment comparison and skill guidance. */
(function(root){
 'use strict';
 const app=document.getElementById('app');
 const stats={hp:'Zivot',atk:'Napad',def:'Odbrana',speed:'Inicijativa',move:'Kretanje',range:'Domet',focus:'Energija'};
 const slots={boots:'Obuca',offHand:'Druga ruka'};
 const motifs={trailboots:'leather',buckler:'wood'};
 function make(tag,cls,text){
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(text)el.textContent=text;
  return el;
 }

 function artifact(id){
  const canvas=make('canvas','rv-e5-item-art');
  canvas.width=128;canvas.height=112;
  canvas.setAttribute('aria-hidden','true');
  const ctx=canvas.getContext('2d');
  const gradient=(x,y,tx,ty,colors)=>{
   const shade=ctx.createLinearGradient(x,y,tx,ty);
   colors.forEach((color,i)=>shade.addColorStop(i/(colors.length-1),color));
   return shade;
  };
  const ellipse=(x,y,w,h,color)=>{
   ctx.beginPath();ctx.ellipse(x,y,w,h,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  };
  ellipse(67,96,44,7,'#101410ab');
  if(id==='buckler'){
   ctx.save();ctx.translate(64,52);ctx.rotate(-.30);
   ctx.beginPath();ctx.ellipse(0,0,35,43,0,0,Math.PI*2);
   ctx.fillStyle=gradient(-35,-40,35,40,['#ccb489','#796344','#4a4339']);ctx.fill();
   ctx.beginPath();ctx.ellipse(0,0,30,37,0,0,Math.PI*2);ctx.save();ctx.clip();
   ctx.fillStyle=gradient(-30,0,30,16,['#835131','#a67548','#583d2d']);ctx.fillRect(-31,-39,62,78);
   for(let n=-24;n<=26;n+=10){
    ctx.beginPath();ctx.moveTo(n,-40);ctx.bezierCurveTo(n+4,-13,n-5,16,n+1,40);
    ctx.lineWidth=1.4;ctx.strokeStyle=n%3?'#442f237e':'#d9a26b8c';ctx.stroke();
   }
   ctx.restore();
   ellipse(0,0,11,13,'#514738');
   ellipse(-2,-2,8,9,gradient(-7,-8,6,7,['#ead4a5','#9c8462','#675e4b']));
   for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5])
    ellipse(28*Math.cos(angle),35*Math.sin(angle),2,2,'#dcc291');
   ctx.restore();
  }else{
   for(const [x,y,scale] of [[15,-7,.91],[29,8,1]]){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    ctx.beginPath();ctx.moveTo(19,24);ctx.quadraticCurveTo(30,19,49,23);ctx.lineTo(47,59);
    ctx.quadraticCurveTo(52,70,75,73);ctx.quadraticCurveTo(84,78,81,85);
    ctx.quadraticCurveTo(46,92,20,82);ctx.quadraticCurveTo(14,77,19,64);ctx.closePath();
    ctx.fillStyle=gradient(14,25,61,82,['#b4875f','#754a31','#4d392c','#9c6b4c']);ctx.fill();
    ctx.strokeStyle='#403027';ctx.lineWidth=2;ctx.stroke();
    ctx.beginPath();ctx.moveTo(20,82);ctx.quadraticCurveTo(53,91,81,85);
    ctx.strokeStyle='#3a3028';ctx.lineWidth=5;ctx.stroke();
    ctx.strokeStyle='#d0a176';ctx.lineWidth=1.2;
    for(let n=34;n<=58;n+=6){
     ctx.beginPath();ctx.moveTo(34,n);ctx.lineTo(45,n+3);ctx.stroke();
    }
    ctx.restore();
   }
  }
  return canvas;
 }

 function rewards(offer){
  if(!offer.length)return;
  for(const scope of [app,document.getElementById('modal')]){
   const controls=Array.from(scope.querySelectorAll('[data-act="ow-trace-loot"],[data-act="trade-trace-loot"]'));
   if(!controls.length||controls.every(b=>b.closest('.rv-e5-reward')))continue;
   const group=make('div','rv-e5-reward-group');
   group.setAttribute('role','group');group.setAttribute('aria-label','Izaberi jedan predmet');
   controls[0].parentElement.before(group);
   for(const button of controls){
    const entry=offer.find(item=>item.id===button.dataset.id);
    if(!entry)continue;
    const card=make('article','rv-e5-reward');
    card.dataset.material=motifs[entry.id]||'';
    const copy=make('div','rv-e5-reward-copy');
    const [benefit,...remaining]=entry.description.split(/(?<=\.)\s+/);
    copy.append(make('h4','',entry.name),make('p','rv-e5-benefit',benefit));
    if(remaining.length)copy.append(make('p','rv-e5-condition',remaining.join(' ')));
    const old=button.parentElement;
    button.textContent='Uzmi';button.setAttribute('aria-label','Uzmi: '+entry.name);
    card.append(artifact(entry.id),copy,button);
    group.append(card);
    old.remove();
   }
  }
 }

 function identityChip(host,identity){
  if(!host||host.querySelector('.rv-e5-journey-identity'))return;
  const look=root.RavanAppearance.normalize(identity);
  if(!look)return;
  const chip=make('span','rv-e5-journey-identity');
  const portrait=make('img','');portrait.alt='';
  portrait.src=ART[root.RavanAppearance.faces[look.face].portrait];
  chip.append(portrait,make('span','',root.RavanAppearance.outfits[look.outfit].name));
  host.append(chip);
 }

 function compare(snapshot){
  const layout=app.querySelector('.inventory-layout'), detail=layout?.querySelector('.inventory-detail');
  if(!detail)return;
  layout.classList.add('rv-e5-inventory');
  layout.parentElement.classList.add('rv-e5-inventory-host');
  identityChip(app.querySelector('.screen-head'),snapshot.sheet?.identity);
  const uid=layout.querySelector('[data-item][aria-pressed=true]')?.dataset.item;
  const candidate=snapshot.inventory?.items.find(item=>item.uid===uid);
  const illustrated=!!(candidate&&motifs[candidate.id]);
  detail.classList.toggle('rv-e5-artifact-detail',illustrated);
  if(illustrated&&!detail.querySelector('.rv-e5-item-art')){
   const emblem=detail.querySelector('.item-emblem');
   emblem?.replaceWith(artifact(candidate.id));
  }
  if(!candidate?.slot||detail.querySelector('.rv-e5-compare')||!detail.querySelector('#item-equip'))return;
  const actor=snapshot.sheet?.selected||'main';
  const current=snapshot.inventory.items.find(item=>item.owner?.hero===actor&&item.owner.slot===candidate.slot);
  const check=root.RavanRPG.preview({version:1,revision:snapshot.revision,type:'equip',hero:actor,slot:candidate.slot,uid});
  const compare=make('section','rv-e5-compare');
  compare.append(make('h3','',slots[candidate.slot]||'Poredjenje opreme'));
  const names=make('div','rv-e5-compare-names');
  for(const [label,item] of [['Opremljeno',current],['Izabrano',candidate]]){
   const column=make('div','');
   column.append(make('small','',label),make('strong','',item?.name||'Prazno'));
   names.append(column);
  }
  compare.append(names);
  if(check.ok){
   const rows=make('dl','rv-e5-deltas');
   for(const [key,label] of Object.entries(stats)){
    const before=check.before[key],after=check.after[key];
    if(!Number.isFinite(before)||!Number.isFinite(after)||before===after)continue;
    const delta=make('dd',after>before?'gain':'loss',before+' → '+after);
    rows.append(make('dt','',label),delta);
   }
   if(rows.childElementCount)compare.append(rows);
   else compare.append(make('p','','Iste vrednosti u kartonu lika.'));
  }else compare.append(make('p','rv-e5-condition',check.error));
  for(const copy of detail.querySelectorAll(':scope > p')){
   if(copy.textContent.startsWith('Bonus napada')||
      (!check.ok&&copy.classList.contains('inventory-block')&&copy.textContent.includes(check.error)))copy.hidden=true;
  }
  detail.querySelector('.action-controls')?.before(compare);
 }

 function tree(snapshot){
  const page=app.querySelector('.v4-skills-page'), detail=page?.querySelector('.v4-skill-detail');
  if(!detail||page.classList.contains('rv-e5-progression'))return;
  page.classList.add('rv-e5-progression');
  identityChip(page.querySelector('.v4-skills-head > div'),snapshot.sheet?.identity);
  const selected=page.querySelector('.rv20-node[aria-pressed=true]');
  const branch=selected?.closest('.rv20-path');
  branch?.classList.add('rv-e5-current-path');
  const recommendation=page.querySelector('.rv20-node.open[data-id=bash]')||
   branch?.querySelector('.rv20-node.open')||page.querySelector('.rv20-node.open');
  if(recommendation){
   recommendation.classList.add('rv-e5-next-skill');
   recommendation.append(make('span','rv-e5-next-label','Sledeci korak'));
  }
 }

 function decorate(){
  const modal=document.getElementById('modal');
  if(!app.querySelector('.rv-e5-trace,.inventory-layout,.v4-skills-page')&&!modal?.open)return;
  const snapshot=root.RavanRPG?.snapshot();
  if(!snapshot?.trade)return;
  rewards(snapshot.trade.traceLoot||[]);
  compare(snapshot);
  tree(snapshot);
 }
 const observer=new MutationObserver(decorate);
 observer.observe(app,{subtree:true,childList:true});
 observer.observe(document.getElementById('modal'),{subtree:true,childList:true});
 decorate();
})(globalThis);
