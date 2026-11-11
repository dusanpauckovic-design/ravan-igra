(function(root){
 'use strict';
 const app=document.getElementById('app');
 const palettes={
  'Recna obala':['river','#a8d1c8','#234d54'],
  'Recni prelaz':['river','#a8d1c8','#234d54'],
  'Sumska cistina':['forest','#d2d79e','#29473c'],
  'Uzak prevoj':['pass','#e1d1b3','#504b51']
 };
 function paint(ctx,context,w,h){
  if(!palettes[context?.terrain])return;
  const [kind,light,dark]=palettes[context.terrain];
  const gradient=ctx.createLinearGradient(0,0,w,h);
  gradient.addColorStop(0,light+'43');gradient.addColorStop(.46,dark+'00');gradient.addColorStop(1,dark+'93');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  if(kind==='river'){
   ctx.strokeStyle=light+'60';ctx.lineWidth=2;
   for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(0,h*.52+i*9);ctx.quadraticCurveTo(40,h*.54+i*8,84-i*3,h*.52+i*9);ctx.stroke();}
  }else{
   ctx.fillStyle=dark+'bd';
   for(let i=0;i<4;i++){
    const x=w-14-i*17,y=h*.36+i*15;
    ctx.beginPath();ctx.moveTo(x-19,y+32);ctx.lineTo(x,y-(kind==='forest'?31:7));ctx.lineTo(x+19,y+32);ctx.fill();
   }
  }
 }
 function decorate(){
  const map=app.querySelector('.rv19-map');
  const fight=map?.querySelector('[data-act="ow-fight"]');
  if(fight&&!fight.closest('.rv-e6-contact')){
   const info=root.RavanWorldPort.snapshot()?.encounterContext;
   const stage=map.querySelector('.rv19-stage');
   if(info&&stage&&palettes[info.terrain]){
    const box=document.createElement('section');box.className='rv-e6-contact';
    box.dataset.terrain=palettes[info.terrain][0];
    const title=document.createElement('h2');title.textContent=info.terrain;
    const copy=document.createElement('p');copy.textContent=[info.approach,'Kontakt · put zaustavljen'].filter(Boolean).join(' · ');
    const back=map.querySelector('[data-act="ow-retreat"]');
    const raw=fight.previousElementSibling;
    if(raw?.matches('p')&&raw.textContent.includes(info.terrain))raw.hidden=true;
    box.append(title,copy,fight);if(back)box.append(back);
    stage.after(box);
   }
  }
  const battle=app.querySelector('.rv-viewport');
  if(!battle||battle.dataset.e6Terrain)return;
  const context=root.RavanGameplayUI?.snapshot().board?.context;
  if(!palettes[context?.terrain])return;
  battle.dataset.e6Terrain=palettes[context.terrain][0];
 }
 root.RavanE6Contact={paint};
 new MutationObserver(decorate).observe(app,{childList:true,subtree:true});decorate();
})(globalThis);
