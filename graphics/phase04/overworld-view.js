(function(root){
'use strict';
const palettes={
 dolina:['#68824f','#35583e','#8f8366','#18576a','#bed694'],
 suma:['#5b7454','#214635','#808275','#265c60','#a6c5a0'],
 prevoj:['#8c866b','#4a5746','#958878','#285b66','#ded0ac']
};
const biomes={dolina:'Recna dolina',suma:'Duboka suma',prevoj:'Kameniti prevoj'};
const ink='#ffe1a0';
function node(tag,className,label){
 const item=document.createElement(tag);
 item.className=className;
 if(label)item.textContent=label;
 return item;
}
function makeProjection(region){
 const corners=[];
 for(let y=0;y<=region.height;y++)for(let x=0;x<=region.width;x++){
  let total=0,count=0;
  for(let row=y-1;row<=y;row++)for(let col=x-1;col<=x;col++){
   if(row<0||col<0||row>=region.height||col>=region.width)continue;
   total+=region.cells[row*region.width+col].height;count++;
  }
  corners.push([x+.24*y,y*.76-total/count*.19]);
 }
 const corner=(x,y)=>corners[y*(region.width+1)+x];
 const cell=index=>{
  const x=index%region.width,y=Math.floor(index/region.width);
  return [corner(x,y),corner(x+1,y),corner(x+1,y+1),corner(x,y+1)];
 };
 const point=index=>cell(index).reduce(([x,y],[px,py])=>[x+px/4,y+py/4],[0,0]);
 const heights=corners.map(p=>p[1]);
 return {cell,point,width:region.width+.24*region.height,top:Math.min(...heights),bottom:Math.max(...heights)};
}
function fillPolygon(ctx,points,color){
 ctx.beginPath();
 points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
 ctx.closePath();ctx.fillStyle=color;ctx.fill();
}
function routeStroke(ctx,path,color,width){
 if(path.length<2)return;
 ctx.beginPath();
 path.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();
}
function ground(region,projection,low){
 const finish=root.RavanE5World;
 const canvas=node('canvas','');
 canvas.width=Math.ceil(projection.width*36);
 canvas.height=Math.ceil((projection.bottom-projection.top+2)*36);
 const ctx=canvas.getContext('2d');
 const [grass,wood,rock,water,light]=palettes[region.biome]||palettes.dolina;
 const surface={grass,wood,scree:rock,cliff:'#635b52',water,road:grass,bridge:water};
 ctx.scale(36,36);ctx.translate(0,1-projection.top);
 for(const [index,tile] of region.cells.entries()){
  const polygon=projection.cell(index);
  fillPolygon(ctx,polygon,surface[tile.terrain]||grass);
  if(root.RavanE6Terrain?.cell(ctx,region,projection,index,tile,low))continue;
  if(finish?.paintCell(ctx,region,projection,index,tile,low))continue;
  ctx.save();ctx.globalAlpha=.15;ctx.translate(.014,0);
  fillPolygon(ctx,polygon,tile.decoration%2?light:'#15251f');ctx.restore();
 }
 for(const [index,tile] of region.cells.entries()){
  const center=projection.point(index);
  const x=index%region.width;
  if(tile.terrain==='road'||tile.terrain==='bridge'){
   const neighbors=[index-region.width,index+region.width,x>0?index-1:-1,x<region.width-1?index+1:-1];
   for(const adjacent of neighbors){
    if(!['road','bridge'].includes(region.cells[adjacent]?.terrain))continue;
    const [px,py]=projection.point(adjacent);
    const segment=[center,[(center[0]+px)/2,(center[1]+py)/2]];
    routeStroke(ctx,segment,'#4a3b2b',.44);
    routeStroke(ctx,segment,tile.terrain==='bridge'?'#d0a66e':'#aa9165',.29);
   }
  }
  if(tile.terrain==='cliff'||tile.terrain==='scree'){
   const [cx,cy]=center, height=tile.terrain==='cliff'?.66:.22;
   fillPolygon(ctx,[[cx-.39,cy+.27],[cx-.23,cy-height*.4],[cx+.02,cy-height],[cx+.43,cy+.23]],'#393b38');
   fillPolygon(ctx,[[cx-.39,cy+.27],[cx+.02,cy-height],[cx+.12,cy+.20]],rock);
  }
  if(!finish&&tile.terrain==='water'&&!low){
   const [cx,cy]=center;
   routeStroke(ctx,[[cx-.24,cy-.16],[cx-.03,cy-.10],[cx+.16,cy-.12]],'#68a49d',.025);
  }
 }
 if(finish)finish.paintLight(ctx,region,projection);
 root.RavanE6Terrain?.light(ctx,region,projection);
 // Paint forest clusters in scan order so nearer crowns cover distant trunks.
 for(const [index,tile] of region.cells.entries()){
  if(tile.terrain!=='wood')continue;
  const [cx,cy]=projection.point(index);
  if(root.RavanE6Terrain?.tree(ctx,region,projection,index,tile,low))continue;
  if(finish?.paintTrees(ctx,region,projection,index,tile,low))continue;
  const count=low?1:2+tile.decoration%3;
  for(let n=0;n<count;n++){
   const x=cx+(n-(count-1)/2)*.22,y=cy+(n%2)*.13;
   const height=.34+(tile.decoration+n)%5*.038;
   ctx.fillStyle='#1b2a23a6';ctx.beginPath();ctx.ellipse(x+.08,y+.04,.15,.07,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#584734';ctx.fillRect(x-.025,y-.16,.05,.17);
   fillPolygon(ctx,[[x-.18,y-.08],[x,y-height],[x+.16,y-.08]],'#183c31');
   fillPolygon(ctx,[[x-.16,y-.11],[x,y-height],[x+.018,y-.10]],region.biome==='suma'?'#56775c':'#6f8256');
  }
 }
 root.RavanE6Terrain?.anchors(ctx,region,projection);
 return canvas;
}
function mount(host,port,camera={}){
 const stage=node('div','rv19-stage');
 const canvas=node('canvas','rv19-canvas');
 canvas.setAttribute('aria-hidden','true');
 const markers=node('div','rv19-markers');
 const toolbar=node('div','rv19-tools');
 const overview=node('div','rv19-overview');
 overview.hidden=true;
 stage.append(canvas,markers,toolbar,overview);
 host.append(stage);
 let key='',projection,region,terrain,cacheRegion,cacheSeed,markerKey='',transform=null;
 let low=!!camera.low,zoom=camera.zoom||1,pan=camera.pan||[0,0],centered=!!camera.centered,pointList=[];
 function control(label,title,run){
  const b=node('button','',label);b.type='button';b.title=title;b.setAttribute('aria-label',title);
  b.addEventListener('click',run);toolbar.append(b);return b;
 }
 function change(scale,dx=0,dy=0){
  centered=false;zoom=Math.max(1,Math.min(3,zoom*scale));
  pan=[pan[0]+dx,pan[1]+dy];draw();
 }
 control('-','Umanji mapu',()=>change(1/1.25));
 control('+','Uvecaj mapu',()=>change(1.25));
 control('Levo','Pomeri mapu ulevo',()=>change(1,90,0));
 control('Desno','Pomeri mapu udesno',()=>change(1,-90,0));
 control('Gore','Pomeri mapu nagore',()=>change(1,0,75));
 control('Dole','Pomeri mapu nadole',()=>change(1,0,-75));
 control('Druzina','Centriraj druzinu',()=>{centered=true;draw();});
 const world=control('Regije','Pregled regija',()=>{overview.hidden=!overview.hidden;world.setAttribute('aria-expanded',String(!overview.hidden));});
 world.setAttribute('aria-expanded','false');
 const quality=control('Detalji','Smanji graficke detalje',()=>{
  low=!low;quality.setAttribute('aria-pressed',String(low));terrain=null;draw();
 });
 quality.setAttribute('aria-pressed',String(low));
 root.RavanE6Consequences?.tools(stage,toolbar,camera);
 function markersFor(s){
  const names=new Map(s.campaign.locations.map(location=>[location.id,location.name]));
  const entries=Object.entries(region.places);
  if(s.region>0)entries.push(['previous',region.entry]);
  if(s.region<s.regions.length-1)entries.push(['next',region.exit]);
  const visibleGroups=(s.groups||[]).filter(g=>g.visible===true&&g.region===s.region&&Number.isInteger(g.index)&&region.cells[g.index]);
  const list=entries.map(([id,index])=>({
   id,index,name:names.get(id)||(id==='next'?'Sledeca regija':'Prethodna regija'),
   sign:id==='next'?'›':id==='previous'?'‹':id==='camp'?'⌂':'◆'
  }));
  const trace=root.RavanE5World?.marker(s,region);
  if(trace)list.push(trace);
  for(const group of visibleGroups)list.push(root.RavanE6Groups?.marker(group)||{id:group.id,index:group.index,name:group.name||'Grupa',sign:'●',group:true});
  root.RavanE6Groups?.sync(stage,s,camera);
  list.push(...(root.RavanE6Journal?.markers(s,region)||[]));
  const signature=JSON.stringify(list);
  if(markerKey===signature)return;
  markerKey=signature;markers.textContent='';
  pointList=list.map(entry=>{
   const button=node('button','rv19-marker');
   button.type='button';
   button.setAttribute('aria-label',entry.name);
   const badge=node('span','rv19-pin',entry.sign), name=node('span','rv19-name',entry.name);
   badge.setAttribute('aria-hidden','true');
   button.append(badge,name);
   if(entry.trace){
    button.classList.add('rv-e5-trace-pin');
    button.addEventListener('click',()=>root.RavanE5World.openTrace(stage));
   }else if(entry.evidence){
    button.classList.add('rv-e6-evidence');button.dataset.certainty=entry.certainty;
    button.addEventListener('click',()=>root.RavanE6Journal?.open(stage,entry.id));
   }else if(entry.group){
    if(entry.kind)button.dataset.kind=entry.kind;
    button.addEventListener('click',()=>{
     if(root.RavanE6Groups)root.RavanE6Groups.select(stage,port.snapshot(),entry.id,camera);
     else showGroup(entry);
    });
   }
   else{button.dataset.act='ow-select';button.dataset.id=entry.id;}
   markers.append(button);
   return {...entry,button};
  });
 }
 const groupDetail=node('p','rv19-group');
 groupDetail.hidden=true;stage.append(groupDetail);
 function showGroup(entry){groupDetail.textContent=entry.name;groupDetail.hidden=false;}
 function draw(){
  const s=port.snapshot(), width=stage.clientWidth,height=stage.clientHeight;
  if(!s||!width||!height)return;
  region=s.regions[s.region];
  const nextKey=s.seed+' / '+s.region;
  if(cacheSeed!==s.seed||cacheRegion!==s.region||!terrain){
   projection=makeProjection(region);terrain=ground(region,projection,low);
   cacheSeed=s.seed;cacheRegion=s.region;
  }
  if(key!==nextKey){
   key=nextKey;
   if(camera.key!==key){
    const saved=camera.regionalViews?.get(key);
    zoom=saved?.zoom||1;pan=saved?.pan||[0,0];centered=!!saved?.centered;
   }
   groupDetail.hidden=true;overview.textContent='';
   s.regions.forEach((item,index)=>{
    const card=node('div','rv19-region');
    const mapProjection=makeProjection(item);
    const image=ground(item,mapProjection,true);
    image.setAttribute('aria-hidden','true');
    card.append(image,node('strong','',(index+1)+'. '+(biomes[item.biome]||item.biome)));
    if(s.region===index)card.setAttribute('aria-current','location');
    overview.append(card);
   });
  }
  root.RavanE6Consequences?.overview(overview,s);
  markersFor(s);
  const started=performance.now(), dpr=Math.min(root.devicePixelRatio||1,2);
  const backing=[Math.round(width*dpr),Math.round(height*dpr)];
  if(canvas.width!==backing[0]||canvas.height!==backing[1]){canvas.width=backing[0];canvas.height=backing[1];}
  const ctx=canvas.getContext('2d'), mapHeight=projection.bottom-projection.top+2;
  const scale=Math.min((width-22)/projection.width,(height-62)/mapHeight)*zoom;
  const home=projection.point(s.index);
  const maxX=Math.max(0,(projection.width*scale-width)/2+width*.23);
  const maxY=Math.max(0,(mapHeight*scale-height)/2+height*.23);
  if(centered)pan=[(projection.width/2-home[0])*scale,((projection.top+projection.bottom)/2-home[1])*scale];
  pan=[Math.max(-maxX,Math.min(maxX,pan[0])),Math.max(-maxY,Math.min(maxY,pan[1]))];
  const ox=(width-projection.width*scale)/2+pan[0],oy=(height-mapHeight*scale)/2+(1-projection.top)*scale+pan[1];
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
  ctx.drawImage(terrain,0,projection.top-1,projection.width,mapHeight);
  const discovered=new Set(s.discovered[s.region]||[]);
  for(let i=0;i<region.cells.length;i++)if(!discovered.has(i))fillPolygon(ctx,projection.cell(i),'#101d2082');
  const markedPath=root.RavanE5Journey?.markedPath(s,region);
  if(markedPath?.length){
   const points=markedPath.map(projection.point);
   routeStroke(ctx,points,'#203e31',.26);
   ctx.setLineDash([.065,.11]);
   routeStroke(ctx,points,'#d0e8a2',.115);
   ctx.setLineDash([]);
  }
  const tracePreview=root.RavanE5World?.routePreview(s,stage);
  const plan=s.journey||tracePreview||(s.selection?port.preview(s.selection)?.plan:null);
  if(plan?.path.length){
   const path=[s.index,...plan.path].map(projection.point);
   routeStroke(ctx,path,'#1d241d',.20);
   if(plan.approach==='covered')ctx.setLineDash([.18,.12]);
   routeStroke(ctx,path,plan.approach==='covered'?'#b2e2c7':ink,.092);
   ctx.setLineDash([]);
  }
  ctx.restore();
  transform={ox,oy,scale};
  const [x,y]=home;
  ctx.beginPath();ctx.arc(ox+x*scale,oy+y*scale,6,0,Math.PI*2);
  ctx.fillStyle=ink;ctx.fill();ctx.strokeStyle='#283222';ctx.lineWidth=2;ctx.stroke();
  for(const entry of pointList){
   const [x,y]=projection.point(entry.index);
   const px=ox+x*scale,py=oy+y*scale;
   entry.button.hidden=px<12||px>width-12||py<24||py>height-48;
   entry.button.style.left=px+'px';entry.button.style.top=py+'px';
   entry.button.classList.toggle('known',discovered.has(entry.index));
   const marked=!!markedPath?.length&&['river','forest'].includes(entry.id);
   entry.button.classList.toggle('rv-e5-marked-end',marked);
   if(marked)entry.button.setAttribute('aria-label',entry.name+' · Obelezena staza');
   else if(entry.button.getAttribute('aria-label')!==entry.name)entry.button.setAttribute('aria-label',entry.name);
   entry.button.setAttribute('aria-pressed',String(s.selection===entry.id||s.journey?.id===entry.id));
  }
  root.RavanE6Consequences?.markers(pointList,s);
  Object.assign(camera,{key,zoom,pan,centered,low});
  if(root.RavanE6Consequences){
   camera.regionalViews??=new Map();
   camera.regionalViews.set(key,{zoom,pan,centered});
  }
  stage.dataset.drawMs=(performance.now()-started).toFixed(2);
  stage.dataset.visible=String(pointList.filter(entry=>!entry.button.hidden).length);
  stage.dataset.region=String(s.region);
  const heading=host.closest('.rv19-map')?.querySelector('h1');
  if(heading&&heading.textContent!==biomes[region.biome])heading.textContent=biomes[region.biome]||region.biome;
 }
 stage.addEventListener('ravan-trace-preview',draw);
 stage.addEventListener('ravan-e6-locate',event=>{
  const index=event.detail, s=port.snapshot();
  if(!transform||!s.discovered[s.region]?.includes(index))return;
  const [x,y]=projection.point(index);
  pan=[(projection.width/2-x)*transform.scale,((projection.top+projection.bottom)/2-y)*transform.scale];
  centered=false;draw();
 });
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(draw):null;
 observer?.observe(stage);
 draw();
 function worldToScreen(index){
  if(!transform||!region.cells[index])return null;
  const [x,y]=projection.point(index),{ox,oy,scale}=transform;
  return {x:ox+x*scale,y:oy+y*scale};
 }
 function screenToWorld(x,y){
  if(!transform)return null;
  const {ox,oy,scale}=transform,px=(x-ox)/scale,py=(y-oy)/scale;
  for(let index=0;index<region.cells.length;index++){
   const polygon=projection.cell(index);
   if(polygon.every(([x,y],i)=>{
    const [nx,ny]=polygon[(i+1)%polygon.length];
    return (nx-x)*(py-y)-(ny-y)*(px-x)>=-1e-7;
   }))return index;
  }
  return null;
 }
 return {draw,worldToScreen,screenToWorld,destroy:()=>observer?.disconnect()};
}
root.RavanWorldView={mount,makeProjection,regionThumbnail:region=>ground(region,makeProjection(region),true)};
})(globalThis);
