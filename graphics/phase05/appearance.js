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
  road:{name:'Putni ogrtac',color:'#855841',edge:'#ae8a66',hem:1},
  wood:{name:'Sumarski plast',color:'#52715b',edge:'#9da77a',hem:.88},
  stone:{name:'Siva kabanica',color:'#657689',edge:'#b3b2a6',hem:.75}
 };
 const images=new Map();
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
 function paint(canvas,figure,face,outfit){
  const dpr=Math.min(2,root.devicePixelRatio||1);
  const w=canvas.width=Math.round(220*dpr), h=canvas.height=Math.round(260*dpr);
  const ctx=canvas.getContext('2d');
  const scale=Math.min(w*.93/figure.width,h*.95/figure.height);
  const iw=figure.width*scale,ih=figure.height*scale;
  ctx.translate((w-iw)/2,h-ih);
  ctx.drawImage(figure,0,0,iw,ih);
  const shape=face.cloth.map(([x,y])=>[x,.16+(y-.16)*outfit.hem]);
  ctx.save();
  path(ctx,shape,iw,ih);ctx.clip();
  ctx.globalCompositeOperation='source-atop';
  ctx.globalAlpha=.65;ctx.fillStyle=outfit.color;ctx.fillRect(0,0,iw,ih);
  ctx.globalAlpha=.34;ctx.strokeStyle=outfit.edge;ctx.lineWidth=Math.max(1,iw*.022);
  path(ctx,shape,iw,ih);ctx.stroke();
  ctx.restore();
 }
 function draw(canvas,appearance,assets){
  const face=faces[appearance.face],outfit=outfits[appearance.outfit];
  if(!face||!outfit||!assets[face.figure])return Promise.resolve(false);
  const key=appearance.face+'/'+appearance.outfit;
  canvas.dataset.appearance=key;
  return image(assets[face.figure]).then(figure=>{
   if(canvas.dataset.appearance!==key)return false;
   paint(canvas,figure,face,outfit);
   canvas.dataset.ready=key;
   return true;
  }).catch(()=>false);
 }
 root.RavanAppearance=Object.freeze({faces,outfits,draw});
})(globalThis);
