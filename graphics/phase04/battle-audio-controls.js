(function(){
 const audio=window.RavanBattleAudio, app=document.getElementById('app');
 let low=false, renderer=null;
 function mount(){
  const current=window.RavanCombat?.renderer;
  if(current!==renderer){renderer=current;renderer?.setTerrainStyle(!low);}
  const details=app.querySelector('.rv-viewport-commands details > div');
  audio.syncAmbient(!!details&&!document.hidden);
  if(!details||details.querySelector('[data-gfx-audio]'))return;
  const box=document.createElement('div');
  box.dataset.gfxAudio='';
  const toggle=document.createElement('button');
  toggle.type='button';toggle.className='v3-text-button';
  const label=document.createElement('label'), volume=document.createElement('input');
  volume.type='range';volume.min=0;volume.max=1;volume.step=.05;volume.value=audio.volume;
  label.append('Jacina zvuka ',volume);
  const sync=()=>{
   toggle.textContent=audio.enabled?'Iskljuci zvuk':'Ukljuci zvuk';
   toggle.setAttribute('aria-pressed',String(audio.enabled));
   audio.syncAmbient(!document.hidden);
  };
  toggle.addEventListener('click',()=>{audio.setEnabled(!audio.enabled);sync();});
  volume.addEventListener('input',()=>audio.setVolume(volume.value));
  const quality=document.createElement('button');
  quality.type='button';quality.className='v3-text-button';
  quality.textContent='Manje detalja terena';
  quality.setAttribute('aria-pressed',String(low));
  quality.addEventListener('click',()=>{low=!low;quality.setAttribute('aria-pressed',String(low));renderer?.setTerrainStyle(!low);});
  box.append(toggle,label,quality);details.append(box);sync();
 }
 new MutationObserver(mount).observe(app,{childList:true,subtree:true});
 document.addEventListener('visibilitychange',mount);
 mount();
})();
