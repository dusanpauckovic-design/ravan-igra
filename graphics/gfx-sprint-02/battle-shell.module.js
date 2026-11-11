window.RavanBattleShell=function mountBattleShell(ui){
  const {$,viewer,canvas,screens}=ui;
  const app=$('app'), stage=$('battle'), dock=$('battle-dock');
  const fullscreen=$('fullscreen'), status=$('fullscreen-status');
  let section=null, busy=false, trigger=null;
  function resize(){
    if(stage.hidden)return;
    const rect=canvas.getBoundingClientRect();
    viewer.resize(rect.width,rect.height,{top:$('battle').querySelector('.battle-top').offsetHeight+13,
      bottom:dock.offsetHeight+18,dpr:window.devicePixelRatio||1});
  }
  function sync(){
    const active=document.fullscreenElement===app;
    fullscreen.textContent=active?'Izadji iz celog ekrana':'Ceo ekran';
    fullscreen.setAttribute('aria-pressed',String(active));
    resize();
  }
  function say(message){
    status.textContent=message;status.hidden=!message;
  }
  function denied(){
    say('Browser nije odobrio ceo ekran. Otvori HTML u zasebnom tabu i probaj ponovo. Borba i dalje koristi ceo dostupan prozor.');
    sync();
  }
  fullscreen.onclick=async()=>{
    if(busy)return;
    busy=true;say('');
    try{
      if(document.fullscreenElement===app)await document.exitFullscreen();
      else if(typeof app.requestFullscreen==='function' && document.fullscreenEnabled!==false)await app.requestFullscreen();
      else denied();
    }catch{denied();}
    finally{busy=false;sync();}
  };
  document.addEventListener('fullscreenchange',()=>{say('');sync();});
  document.addEventListener('fullscreenerror',denied);
  window.addEventListener('resize',resize);
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;
  for(const element of [canvas,dock,stage.querySelector('.battle-top')])observer?.observe(element);
  function close(restore=false){
    section=null;$('battle-drawer').hidden=true;
    for(const id of ['battle-details','battle-techniques','battle-settings'])$(id).setAttribute('aria-expanded','false');
    if(restore&&trigger?.isConnected)trigger.focus({preventScroll:true});
    trigger=null;
  }
  function open(name,source){
    if(section===name && source===trigger){close(true);return;}
    close();section=name;trigger=source;
    $('battle-drawer').hidden=false;
    $('drawer-title').textContent={inspect:'Detalji',techniques:'Tehnike',settings:'Prikaz i postavke'}[name];
    $('drawer-inspect').hidden=name!=='inspect';
    $('drawer-techniques').hidden=name!=='techniques';
    $('detail-actions').hidden=name!=='settings';
    if(source)source.setAttribute('aria-expanded','true');
    $('drawer-close').focus({preventScroll:true});
  }
  const controls={'battle-details':'inspect','battle-techniques':'techniques','battle-settings':'settings'};
  for(const [id,name] of Object.entries(controls)){
    $(id).setAttribute('aria-expanded','false');$(id).setAttribute('aria-controls','battle-drawer');
    $(id).onclick=()=>open(name,$(id));
  }
  $('drawer-close').onclick=()=>close(true);
  $('battle-exit').onclick=()=>screens.open('opening');
  $('battle-sheet').onclick=()=>screens.open('sheet');
  sync();
  return {resize,close,inspect:()=>open('inspect'),getSection:()=>section};
};
