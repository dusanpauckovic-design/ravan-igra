(function(root){
 'use strict';
 function polygon(ctx,points,fill){
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 }
 function oval(ctx,x,y,rx,ry,fill){
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
 }
 function cell(ctx,region,view,index,tile,low){
  if(region.biome==='dolina'||!['grass','wood','scree','cliff'].includes(tile.terrain))return false;
  const [x,y]=view.point(index), forest=region.biome==='suma';
  if(tile.terrain==='cliff'||tile.terrain==='scree'){
   if(!low)oval(ctx,x+.11,y+.15,.35,.10,'#29322c86');
   return false;
  }
  const color=forest?(tile.terrain==='wood'?'#263e32':'#739063'):'#827b62';
  oval(ctx,x,y,.43,.29,color);
  if(!low&&tile.decoration%3===0)
   oval(ctx,x-.12,y-.08,.23,.11,forest?'#aac17b33':'#dec59d44');
  return true;
 }
 function light(ctx,region,view){
  if(region.biome==='dolina')return;
  const forest=region.biome==='suma', x=view.width*(forest?.58:.31);
  const glow=ctx.createRadialGradient(x,view.top+3,.2,x,view.top+3,view.width*.70);
  glow.addColorStop(0,forest?'#d3d99835':'#efe4ca3c');
  glow.addColorStop(1,forest?'#112c285b':'#3434434a');
  ctx.fillStyle=glow;ctx.fillRect(0,view.top,view.width,view.bottom-view.top);
 }
 function tree(ctx,region,view,index,tile,low){
  if(region.biome==='dolina')return false;
  const [x,y]=view.point(index);
  if(region.biome==='prevoj'){
   oval(ctx,x,y,.23,.095,'#303c37');
   oval(ctx,x-.06,y-.065,.15,.11,'#626e51');
   return true;
  }
  const count=low?1:tile.decoration%3+1;
  for(let i=0;i<count;i++){
   const px=x+(i-(count-1)/2)*.23,py=y+i*.085,h=.37+((index+i*7)%11)*.025;
   oval(ctx,px+.12,py,.24,.08,'#142b22bd');
   ctx.fillStyle='#574835';ctx.fillRect(px-.024,py-h*.56,.047,h*.56);
   for(let layer=0;layer<3;layer++){
    const dy=py-h+layer*.105,w=.11+layer*.046;
    polygon(ctx,[[px,dy-.10],[px+w,dy+.27],[px-w,dy+.24]],['#456f52','#365b46','#294937'][layer]);
   }
  }
  return true;
 }
 function anchors(ctx,region,view){
  const id=Object.keys(region.places).find(key=>
   (region.biome==='dolina'?['river']:region.biome==='suma'?['ruins','research','forest']:['elite','pact','trail']).includes(key));
  if(!id)return;
  const [x,y]=view.point(region.places[id]);
  oval(ctx,x+.14,y+.09,.29,.105,'#1b231caa');
  polygon(ctx,[[x-.13,y],[x-.10,y-.34],[x+.08,y-.48],[x+.20,y-.31],[x+.22,y]],'#716f61');
  polygon(ctx,[[x-.10,y-.34],[x+.08,y-.48],[x+.10,y-.06],[x-.13,y]],'#b9b398');
 }
 root.RavanE6Terrain={cell,light,tree,anchors};
})(globalThis);
