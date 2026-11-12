(function(root){
 'use strict';
 const app=document.getElementById('app');
 const names={hearth:'Ognjiste',tools:'Radionica',rest:'Odmor',study:'Recept',supply:'Obloge',bench:'Radni sto'};
 const materials={wood:'gradje',stone:'kamena',gold:'zlata',insight:'znanja'};
 let selected='hearth';
 function el(tag,text,cls){
  const item=document.createElement(tag);
  if(text)item.textContent=text;
  if(cls)item.className=cls;
  return item;
 }
 function fire(ctx,hearth){
  const y=139;
  ctx.fillStyle='#201a14';ctx.beginPath();ctx.ellipse(90,y,44,12,0,0,2*Math.PI);ctx.fill();
  ctx.strokeStyle=hearth?'#b7a48b':'#776451';ctx.lineWidth=hearth?7:3;
  ctx.beginPath();ctx.ellipse(90,y,33,9,0,0,2*Math.PI);ctx.stroke();
  ctx.fillStyle='#dd924f';ctx.beginPath();ctx.moveTo(78,y);ctx.quadraticCurveTo(68,122,91,98);ctx.quadraticCurveTo(89,124,105,113);ctx.quadraticCurveTo(110,130,101,y);ctx.fill();
  ctx.fillStyle='#ffe6a1';ctx.beginPath();ctx.moveTo(87,y);ctx.quadraticCurveTo(84,130,96,120);ctx.quadraticCurveTo(104,134,96,y);ctx.fill();
  if(hearth){
   ctx.fillStyle='#7e6850';ctx.fillRect(30,128,27,7);ctx.fillRect(120,128,29,7);
   ctx.fillStyle='#ab9272';ctx.fillRect(30,125,27,4);ctx.fillRect(120,125,29,4);
  }
 }
 function tools(ctx,finished){
  ctx.fillStyle='#221e19';ctx.fillRect(245,121,65,21);
  ctx.fillStyle=finished?'#aa8961':'#70634f';ctx.fillRect(240,110,73,12);
  if(!finished)return;
  ctx.strokeStyle='#7a5738';ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(245,111);ctx.lineTo(313,103);ctx.stroke();
  ctx.fillStyle='#c0c0a8';ctx.fillRect(270,99,18,8);
  ctx.fillStyle='#666e65';ctx.fillRect(277,105,6,7);
  ctx.fillStyle='#957d58';ctx.fillRect(243,86,7,25);ctx.fillRect(301,84,7,27);
 }
 function attach(){
  const map=app.querySelector('#camp-map');
  const banner=map?.closest('.camp-hero');
  if(!banner||banner.dataset.e8Camp)return;
  const snapshot=root.RavanRPG.snapshot(), camp=snapshot.camp;
  if(!camp?.home||!camp.actions)return;
  banner.dataset.e8Camp='true';
  const scene=el('section','','rv-e8-camp');
  scene.setAttribute('aria-label','Priprema kampa');
  const stage=el('div','','rv-e8-camp-stage');
  const canvas=el('canvas');canvas.width=360;canvas.height=165;canvas.setAttribute('aria-hidden','true');
  const ctx=canvas.getContext('2d');fire(ctx,camp.hearth);tools(ctx,camp.tools);
  stage.append(canvas);
  const detail=el('section','','rv-e8-camp-detail');
  const list=el('div','','rv-e8-camp-actions');
  const buttons=new Map();
  function choose(id){
   selected=id;
   const action=camp.actions.find(a=>a.id===id);if(!action)return;
   for(const [key,button] of buttons)button.setAttribute('aria-pressed',String(key===id));
   const cost=Object.entries(action.costs).map(([key,value])=>value+' '+materials[key]).join(' · ');
   const confirm=el('button',action.name);confirm.type='button';confirm.disabled=!action.available;
   const message=el('p',action.reason||'', 'rv-e8-note');message.setAttribute('role','status');
   confirm.onclick=()=>{
    const port=root.RavanRPG;
    const outcome=port.dispatch({version:1,revision:port.snapshot().revision,type:'campService',id});
    if(!outcome.ok)message.textContent=outcome.error;
   };
   detail.replaceChildren(el('h2',names[id]),el('p',action.detail),el('small',cost||'Bez troska'),message,confirm);
  }
  for(const action of camp.actions){
   const button=el('button',names[action.id]);button.type='button';button.dataset.service=action.id;
   button.onclick=()=>choose(action.id);buttons.set(action.id,button);
   (['hearth','tools'].includes(action.id)?stage:list).append(button);
  }
  scene.append(stage,detail,list);
  banner.after(scene);
  const heading=el('p',(camp.hearth?'Uredjeno ognjiste':'Privremeno ognjiste')+' · '+(camp.tools?'Radionica spremna':'Radionica u pripremi')+' · '+(camp.rested?'Druzina odmorna':'Druzina nije odmorena'),'rv-e8-camp-readiness');
  map.before(heading);
  const holder=banner.parentElement;
  for(const item of holder.children){
   if(!item.matches('button,p'))continue;
   if(camp.actions.some(a=>item.textContent.startsWith(a.name+' · ')))item.hidden=true;
  }
  choose(selected);
 }
 new MutationObserver(attach).observe(app,{childList:true,subtree:true});attach();
})(globalThis);
