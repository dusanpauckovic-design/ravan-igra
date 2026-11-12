(function(root){
 'use strict';
 function ring(ctx,x,y,rx,ry){
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.stroke();
 }
 function draw(ctx,x,y,kind,p=1,quiet=false){
  ctx.save();ctx.translate(x,y);ctx.lineWidth=quiet?1.5:2;
  if(kind==='white'){
   ctx.strokeStyle='#d8f6ff';
   for(let i=0;i<(quiet?4:7);i++){
    ctx.rotate(Math.PI*2/(quiet?4:7));ctx.beginPath();
    ctx.moveTo(5,0);ctx.quadraticCurveTo(12,-5,13+p*13,2);ctx.stroke();
   }
   ctx.fillStyle='#ffd58b';ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();
  }else if(kind==='black'){
   ctx.fillStyle='#261e2d';ctx.strokeStyle='#a08199';
   ctx.beginPath();
   for(let i=0;i<24;i++){
    const a=i*Math.PI/12,r=10+Math.sin(i*1.7)*2+p*3;
    const px=Math.cos(a)*r,py=Math.sin(a)*r*.72;
    i?ctx.lineTo(px,py):ctx.moveTo(px,py);
   }
   ctx.closePath();ctx.fill();ctx.stroke();
  }else{
   ctx.fillStyle='#182432a8';ctx.beginPath();ctx.ellipse(0,0,16,8,0,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='#ccd8ee';ring(ctx,0,0,12+p*10,5+p*5);
   if(!quiet){ctx.strokeStyle='#849ab7';ring(ctx,0,0,18+p*13,7+p*7);}
  }
  ctx.restore();
 }
 function trail(ctx,point,zone){
  if(zone.effectId!=='energy.trace.place')return false;
  draw(ctx,point.x,point.y,'grey',.4,true);
  return true;
 }
 function cue(ctx,event,t,state,project,reduced,contact){
  if(!['energy.trace.place','energy.trace.hit'].includes(event.effectId)||!event.at)return false;
  const point=project(event.at);
  const unit=state.units.find(u=>u.id===event.actor);
  if(unit&&t<.35&&!reduced){
   const from=project(unit);
   ctx.save();ctx.strokeStyle='#c4d2ec99';ctx.beginPath();
   ctx.moveTo(from.x,from.y-30);ctx.lineTo(point.x,point.y);ctx.stroke();ctx.restore();
  }
  draw(ctx,point.x,point.y,'grey',reduced?.55:Math.min(1,t*1.4),reduced);
  const delta=event.result?.hp?.find(hp=>hp.id===event.target)?.delta;
  if(delta<0&&t>=contact){
   ctx.save();ctx.font='bold 14px sans-serif';ctx.fillStyle='#eff2ff';ctx.strokeStyle='#192430';ctx.lineWidth=3;
   ctx.strokeText(String(delta),point.x+18,point.y-32);ctx.fillText(String(delta),point.x+18,point.y-32);ctx.restore();
  }
  return true;
 }
 root.RavanE7Energy={draw,trail,cue};
})(globalThis);
