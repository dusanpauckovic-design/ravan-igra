/* D1 visual catalog. Face and clothing IDs are presentation values. */
(function(root){
 'use strict';
 const faces={
  hero:{name:'Putnik',portrait:'hero_framed',figure:'figure_hero',
   cloth:[[.53,.15],[.76,.22],[.69,.36],[.50,.53],[.35,.78],[.05,.89],[.04,.81],[.26,.54],[.43,.25]]},
  hero_alt:{name:'Putnica',portrait:'hero_alt_framed',figure:'figure_scout',
   cloth:[[.49,.21],[.64,.26],[.69,.36],[.56,.42],[.39,.48],[.28,.66],[.11,.70],[.11,.55],[.26,.39]]}
 };
 const outfits={
  earth:{name:'Putni ogrtac',color:'#855841',edge:'#ae8a66',hem:1},
  forest:{name:'Sumarski plast',color:'#52715b',edge:'#9da77a',hem:.88},
  stone:{name:'Siva kabanica',color:'#657689',edge:'#b3b2a6',hem:.75}
 };
 const images=new Map(), textures=new WeakMap(), urls=new WeakMap();
 function image(src){
  if(!images.has(src))images.set(src,new Promise((resolve,reject)=>{
   const picture=new Image();picture.onload=()=>resolve(picture);picture.onerror=reject;picture.src=src;
  }));
  return images.get(src);
 }
 function path(ctx,points,w,h){
  ctx.beginPath();
  points.forEach(([x,y],i)=>i?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));
  ctx.closePath();
 }
 function texture(figure,identity){
  const look=normalize(identity);
  if(!look||!figure.naturalWidth)return null;
  const {face,outfit}=look, key=face+'/'+outfit, material=outfits[outfit];
  if(!textures.has(figure))textures.set(figure,new Map());
  const variants=textures.get(figure);
  if(variants.has(key))return variants.get(key);
  const canvas=document.createElement('canvas');
  const w=canvas.width=figure.naturalWidth,h=canvas.height=figure.naturalHeight;
  const ctx=canvas.getContext('2d');
  ctx.drawImage(figure,0,0);
  const shape=faces[face].cloth.map(([x,y])=>[x,.16+(y-.16)*material.hem]);
  path(ctx,shape,w,h);ctx.clip();
  ctx.globalCompositeOperation='source-atop';
  ctx.globalAlpha=.65;ctx.fillStyle=material.color;ctx.fillRect(0,0,w,h);
  ctx.globalAlpha=.34;ctx.strokeStyle=material.edge;ctx.lineWidth=Math.max(1,w*.022);
  path(ctx,shape,w,h);ctx.stroke();
  variants.set(key,canvas);
  return canvas;
 }
 function url(identity,assets){
  const look=normalize(identity), src=look&&assets[faces[look.face].figure];
  if(!src)return Promise.resolve(null);
  return image(src).then(figure=>{
   const art=texture(figure,identity);
   if(!urls.has(art))urls.set(art,art.toDataURL());
   return urls.get(art);
  }).catch(()=>null);
 }
 function paint(canvas,figure,look){
  const dpr=Math.min(2,root.devicePixelRatio||1);
  const w=canvas.width=Math.round(220*dpr), h=canvas.height=Math.round(260*dpr);
  const art=texture(figure,{version:1,portrait:look.face,palette:look.outfit});
  const scale=Math.min(w*.93/art.width,h*.95/art.height);
  const iw=art.width*scale, ih=art.height*scale;
  canvas.getContext('2d').drawImage(art,(w-iw)/2,h-ih,iw,ih);
 }
 function normalize(identity){
  if(!identity||identity.version!==1||!Object.prototype.hasOwnProperty.call(faces,identity.portrait)||
   !Object.prototype.hasOwnProperty.call(outfits,identity.palette))return null;
  return {face:identity.portrait,outfit:identity.palette};
 }
 function choose(port,face,outfit){
  const snapshot=port?.snapshot();
  if(!snapshot?.appearanceCatalog||!normalize(snapshot.draft?.identity))return null;
  return port.dispatch({version:1,revision:snapshot.revision,type:'appearance',portrait:face,palette:outfit});
 }
 function draw(canvas,appearance,assets){
  const face=faces[appearance.face],outfit=outfits[appearance.outfit];
  if(!face||!outfit||!assets[face.figure])return Promise.resolve(false);
  const key=appearance.face+'/'+appearance.outfit;
  canvas.dataset.appearance=key;
  return image(assets[face.figure]).then(figure=>{
   if(canvas.dataset.appearance!==key)return false;
   paint(canvas,figure,appearance);
   canvas.dataset.ready=key;
   return true;
  }).catch(()=>false);
 }
 root.RavanAppearance=Object.freeze({faces,outfits,normalize,choose,draw,texture,url});
})(globalThis);
