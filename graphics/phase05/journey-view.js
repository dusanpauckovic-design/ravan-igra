/* E5-D5: guide existing actions and show the world consequence of the first trace. */
(function(root){
 'use strict';
 const app=document.getElementById('app');
 const stages={
  camp:'Utociste',map:'Dolina',battle:'Bojiste',skills:'Vestine'
 };
 const sceneHelp={
  crossing:'Izaberi kako ces reagovati.',
  weaponOffer:'Izaberi oruzje za prvu borbu.',
  bond:'Izaberi sta ces reci Radanu.'
 };
 let pathCache=null;

 function markedPath(snapshot,region){
  if(snapshot.region!==0||!snapshot.campaign.markedForestPath)return null;
  const {river,forest}=region.places;
  const from=snapshot.campaign.position==='forest'?forest:river;
  const to=from===river?forest:river;
  const key=snapshot.seed+'/'+from+'/'+to;
  if(pathCache?.key===key)return pathCache.path;
  const route=root.RavanOverworld?.route(region,from,to);
  if(!route?.path.length)return null;
  const path=[from,...route.path];
  pathCache={key,path};
  return path;
 }
 root.RavanE5Journey=Object.freeze({markedPath});

 function markAction(scope,selector){
  const next=Array.from(scope.querySelectorAll(selector)).find(button=>!button.disabled);
  for(const old of scope.querySelectorAll('.rv-e5-primary')){
   if(old!==next)old.classList.remove('rv-e5-primary');
  }
  if(next)next.classList.add('rv-e5-primary');
 }

 function title(){
  const cover=app.querySelector('.rv-title');
  if(!cover||cover.classList.contains('rv-e5-entry'))return;
  cover.classList.add('rv-e5-entry');
  const button=cover.querySelector('[data-act="continue"]');
  const saved=root.RavanRPG?.snapshot().saved;
  if(!button||!saved||!stages[saved.screen])return;
  const meta=document.createElement('small');
  meta.className='rv-e5-continue-place';
  meta.textContent=stages[saved.screen];
  button.append(meta);
 }

 function story(){
  const scene=app.querySelector('.v5-cinema');
  if(!scene||scene.classList.contains('rv-e5-journey-scene'))return;
  const controls=scene.querySelector('.v5-story-controls');
  if(!controls)return;
  scene.classList.add('rv-e5-journey-scene');
  const toggle=controls.querySelector('[data-act="rpg-dialogue"]');
  if(toggle){
   toggle.classList.add('rv-e5-dialogue-mode');
   const container=scene.querySelector('.v5-story-foot');
   if(container)container.replaceChildren(toggle);
  }
  markAction(controls,'[data-act="v4-story-next"],[data-act="v4-accept-recruit"]');
  const copy=sceneHelp[scene.dataset.scene];
  if(copy){
   const help=document.createElement('p');help.className='rv-e5-scene-help';help.textContent=copy;
   controls.before(help);
  }
 }

 function world(){
  const map=app.querySelector('.rv19-map');
  if(!map)return;
  const state=root.RavanWorldPort?.snapshot(), trace=state?.trace;
  if(!state)return;
  const selector=state.encounter?'[data-act="ow-fight"]':
   state.journey?'[data-act="ow-pause"]':
   trace?.canInspect?'[data-act="ow-inspect-trace"]':
   '[data-act="ow-go"]';
  markAction(map,selector);
  if(!state.campaign.markedForestPath||state.region!==0||map.querySelector('.rv-e5-marked-caption'))return;
  const stage=map.querySelector('.rv19-stage');
  if(!stage)return;
  const caption=document.createElement('p');
  caption.className='rv-e5-marked-caption';
  caption.textContent='Obelezena staza · Recna obala i Sumski rub';
  stage.before(caption);
  const panel=map.querySelector('.rv-e5-trace');
  if(panel){
   panel.classList.add('rv-e5-resolved');
   if(!panel.querySelector('.rv-e5-reward')){
    const desc=panel.querySelector('p');
    if(desc)desc.textContent='Mozes direktno izmedju obale i sumskog ruba.';
   }
  }
 }

 function sync(){
  title();story();world();
  const next=app.querySelector('#creator-next');
  if(next&&!next.disabled)next.classList.add('rv-e5-primary');
  const battle=app.querySelector('.rv-viewport-context');
  if(battle)markAction(battle,'[data-act="execute-action"]:not([disabled])');
 }

 const focusRoute={
  'rpg-new':'#creator-name',
  'continue':'.rv19-map h1,.rv-viewport .battle-goal,.v5-cinema h1',
  'ow-fight':'.rv-viewport .battle-goal',
  'v4-story-next':'.v5-cinema h1,.rv-viewport .battle-goal',
  'v4-story-choice':'.v5-cinema h1,.rv-viewport .battle-goal',
  'v5-weapon':'.v5-cinema h1,.rv-viewport .battle-goal'
 };
 app.addEventListener('click',event=>{
  const control=event.target.closest?.('[data-act]');
  const selector=control&&focusRoute[control.dataset.act];
  if(!selector||event.detail!==0)return;
  requestAnimationFrame(()=>{
   if(control.isConnected||document.getElementById('modal').open)return;
   const target=app.querySelector(selector);
   if(!target)return;
   if(!target.matches('input,button,[tabindex]'))target.tabIndex=-1;
   target.focus({preventScroll:true});
  });
 },true);
 new MutationObserver(sync).observe(app,{subtree:true,childList:true});
 sync();
})(globalThis);
