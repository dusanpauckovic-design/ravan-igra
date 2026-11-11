/* E5-D2: terrain paint and an on-map view of the authoritative trace. */
(function(root){
 'use strict';
 const app=document.getElementById('app');
 const accents={open:'Otvoren prilaz',covered:'Zaklonjeni prilaz'};
 function cellRand(index,part){
  const value=Math.sin(index*183.17+part*71.13)*43758.5453;
  return value-Math.floor(value);
 }
 function stroke(ctx,points,color,width){
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();
 }
 function oval(ctx,x,y,w,h,color,angle=0){
  ctx.beginPath();ctx.ellipse(x,y,w,h,angle,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
 }
 function paintCell(ctx,region,projection,index,tile,low){
  if(region.biome!=='dolina')return false;
  const [x,y]=projection.point(index);
  const water=['water','bridge'].includes(tile.terrain);
  const shore=tile.terrain!=='road'&&[-region.width,region.width,-1,1].some(step=>
   ['water','bridge'].includes(region.cells[index+step]?.terrain));
  if(water){
   const ripple=ctx.createLinearGradient(x-.35,y-.36,x+.25,y+.30);
   ripple.addColorStop(0,'#23606c');ripple.addColorStop(.56,'#388486');ripple.addColorStop(1,'#1b5465');
   const polygon=projection.cell(index);
   ctx.beginPath();polygon.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();
   ctx.fillStyle=ripple;ctx.fill();
   if(!low)for(let n=1;n<4;n++){
    const dy=(cellRand(index,n)-.5)*.39;
    stroke(ctx,[[x-.29,y+dy],[x-.03,y+dy-.025],[x+.20,y+dy-.01]],'#95d2be76',.014);
   }
  }else if(shore){
   oval(ctx,x,y,.42,.23,'#9a8d65',-.10);
   oval(ctx,x+.10,y-.04,.26,.15,'#aea47770');
   if(!low)for(let n=0;n<5;n++){
    const dx=(cellRand(index,n)-.5)*.61,dy=(cellRand(index,n+5)-.5)*.29;
    oval(ctx,x+dx,y+dy,.038,.025,n%2?'#5b6153':'#d0b991',-.38);
   }
  }else if(['grass','wood'].includes(tile.terrain)){
   oval(ctx,x,y,.41,.26,tile.terrain==='wood'?'#304d3b':'#87965b40',-.1);
   if(!low&&tile.terrain==='grass'&&cellRand(index,8)>.68)
    stroke(ctx,[[x-.11,y+.07],[x-.06,y-.04],[x+.015,y+.065],[x+.07,y-.10]],'#aab67488',.018);
  }
  return true;
 }
 function paintLight(ctx,region,projection){
  if(region.biome!=='dolina')return;
  const w=projection.width, top=projection.top, bottom=projection.bottom;
  const glow=ctx.createRadialGradient(w*.36,top+(bottom-top)*.23,.3,w*.36,top+(bottom-top)*.23,w*.60);
  glow.addColorStop(0,'#f6d09638');glow.addColorStop(.56,'#dac1820d');glow.addColorStop(1,'#101f29a0');
  ctx.fillStyle=glow;ctx.fillRect(0,top,w,bottom-top);
 }
 function paintTrees(ctx,region,projection,index,tile,low){
  if(region.biome!=='dolina')return false;
  const [x,y]=projection.point(index);
  const tall=cellRand(index,1);
  const count=low||tall<.24?1:tall<.56?2:3;
  for(let i=0;i<count;i++){
   const xx=x+(i-(count-1)/2)*.21, yy=y+i*.10;
   const h=.28+cellRand(index,i+10)*.30;
   oval(ctx,xx+.15,yy+.045,.24,.067,'#15251ca8',.22);
   stroke(ctx,[[xx,yy],[xx-.02,yy-h*.68]],'#524b36',.05);
   oval(ctx,xx+.02,yy-h*.57,.22,h*.59,'#203e33',-.16);
   oval(ctx,xx-.043,yy-h*.65,.16,h*.49,'#496548',.20);
   oval(ctx,xx-.082,yy-h*.75,.095,h*.30,'#778451',.25);
  }
  return true;
 }
 function marker(snapshot,region){
  const trace=snapshot.trace, index=region.places.river;
  if(!trace||trace.status==='resolved'||!Number.isInteger(index))return null;
  return {id:trace.id,index,name:trace.name,sign:'⋮',trace:true};
 }
 function openTrace(stage){
  const panel=stage.closest('.rv19-map')?.querySelector('.rv-e5-trace');
  if(!panel)return;
  panel.hidden=false;stage.parentElement.classList.add('rv-e5-with-trace');panel.querySelector('h2')?.focus({preventScroll:true});
  if(innerWidth<760)panel.scrollIntoView({block:'nearest',behavior:'instant'});
 }
 function routePreview(snapshot,stage){
  const id=stage.dataset.tracePreview;
  const option=snapshot.trace?.approaches.find(item=>item.id===id);
  if(!Array.isArray(option?.path)||!option.path.length)return null;
  const cells=snapshot.regions[snapshot.region].cells;
  if(!option.path.every(i=>Number.isInteger(i)&&cells[i]?.cost>0))return null;
  return {path:option.path,approach:id};
 }
 function wrapTrace(){
  const map=app.querySelector('.rv19-map'), stage=map?.querySelector('.rv19-stage');
  if(!stage||map.dataset.traceStyled)return;
  map.dataset.traceStyled='true';
  const snapshot=root.RavanWorldPort.snapshot(), trace=snapshot?.trace;
  if(!trace)return;
  const panel=Array.from(map.querySelectorAll('section[aria-label]')).find(el=>el.getAttribute('aria-label')===trace.name);
  if(!panel)return;
  panel.classList.add('rv-e5-trace');
  panel.hidden=trace.status==='noticed'&&!trace.canInspect;
  const stageHost=stage.parentElement;
  stageHost.classList.add('rv-e5-world-layout');
  stageHost.append(panel);
  stageHost.classList.toggle('rv-e5-with-trace',!panel.hidden);
  const title=panel.querySelector('h2');
  title.tabIndex=-1;
  if(trace.status==='observed')panel.dataset.choices='true';
  if(trace.status==='approaching'){
   panel.dataset.route=trace.approach;
   panel.querySelector('p').textContent=accents[trace.approach]||trace.name;
  }
  for(const button of panel.querySelectorAll('[data-act="ow-approach"]')){
   const item=trace.approaches.find(option=>option.id===button.dataset.id);
   if(!item)continue;
   const card=button.parentElement;
   card.className='rv-e5-route';
   card.dataset.route=item.id;
   const name=document.createElement('strong');name.textContent=item.name;
   const cost=document.createElement('span');cost.textContent=item.cost+' koraka sata';
   const condition=document.createElement('span');condition.textContent=item.condition;
   button.textContent='Kreni';
   button.setAttribute('aria-label','Kreni: '+item.name);
   card.replaceChildren(name,cost,condition,button);
   if(Array.isArray(item.path)&&item.path.length){
    const preview=document.createElement('button');preview.type='button';
    preview.textContent='Prikazi put';preview.setAttribute('aria-pressed','false');
    preview.setAttribute('aria-label','Prikazi put: '+item.name);
    preview.addEventListener('click',()=>{
     stage.dataset.tracePreview=item.id;
     for(const other of panel.querySelectorAll('[aria-pressed]'))other.setAttribute('aria-pressed',String(other===preview));
     stage.dispatchEvent(new Event('ravan-trace-preview'));
    });
    button.before(preview);
   }
  }
 }
 root.RavanE5World={paintCell,paintLight,paintTrees,marker,openTrace,routePreview};
 new MutationObserver(wrapTrace).observe(app,{subtree:true,childList:true});
 wrapTrace();
})(globalThis);
