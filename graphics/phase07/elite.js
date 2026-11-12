(function(root){
 'use strict';
 function stance(unit,event,t,facing,reduced){
  if(!unit.eliteMode)return null;
  const driven=unit.eliteMode==='driven';
  const transitional=!reduced&&event?.type==='eliteMode'&&event.actor===unit.id;
  return {height:driven?.91:1,width:driven?1.08:1,tilt:driven?facing*.085+(transitional?facing*.07*Math.sin(t*Math.PI):0):0};
 }
 function cue(ctx,event,t,state,project,reduced){
  if(event.type!=='eliteMode')return;
  const source=state.units.find(u=>u.id===event.actor);if(!source)return;
  const point=project(source), radius=reduced?26:21+t*16;
  ctx.save();ctx.strokeStyle='#e4bd83';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(point.x,point.y,radius,10,0,0,2*Math.PI);ctx.stroke();ctx.restore();
 }
 function decorate(){
  const board=document.querySelector('.rv-viewport');
  if(!board)return;
  const units=root.RavanGameplayUI?.snapshot().board?.units||[];
  const elite=units.find(u=>u.eliteMode&&u.hp>0);
  if(!elite)return;
  let status=board.querySelector('.rv-e7-elite');
  if(!status){
   status=document.createElement('small');status.className='rv-e7-elite';status.setAttribute('role','status');
   board.querySelector('.battle-goal')?.append(status);
  }
  const signal=elite.tactical==='prepare'?' · najava udara':elite.tactical==='interrupt'?' · priprema prekinuta':elite.tactical==='recover'?' · oporavak':'';
  const text=elite.name+' · '+(elite.eliteMode==='driven'?'Nalet':'Stabilan stav')+signal;
  if(status.textContent!==text)status.textContent=text;
  status.dataset.mode=elite.eliteMode;
 }
 root.RavanE7Elite={stance,cue};
 new MutationObserver(decorate).observe(document.getElementById('app'),{childList:true,subtree:true});
 decorate();
})(globalThis);
