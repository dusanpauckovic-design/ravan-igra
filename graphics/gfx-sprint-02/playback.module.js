window.RavanReplayPanel=function mountReplay(ui) {
  const {$,button,text,viewer,scene,copy,reset,select}=ui;
  let generation=0, running=false;
  const reducedDefault=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const speed=document.createElement('select');
  speed.id='replay-speed';speed.setAttribute('aria-label','Brzina animacije');
  for(const [value,label] of [['normal','Normalno'],['fast','Brzo ×2'],['reduced','Smanjeno kretanje']]){
    const item=document.createElement('option');item.value=value;item.textContent=label;speed.append(item);
  }
  speed.value=reducedDefault?'reduced':'normal';
  function applySpeed(){
    viewer.setSpeed(speed.value==='fast'?2:1);
    viewer.setReducedMotion(speed.value==='reduced');
  }
  speed.onchange=applySpeed;
  viewer.setCameraEffects(false);
  applySpeed();
  const health=(id,hp,delta)=>({hp:[{id,hp,delta}]});
  const sample=[
    {type:'guard',actor:'a_radan',duration:270,label:'Radan zauzima gard.'},
    {type:'observe',actor:'a_merin',target:'e_0',duration:300,label:'Merin posmatra metu.'},
    {type:'move',actor:'a_iva',path:[{x:3,y:2}],label:'Iva prelazi na slobodno polje.'},
    {type:'ranged',actor:'a_iva',target:'e_0',result:health('e_0',46,-12),label:'Iva ispaljuje strelu.'},
    {type:'mark',actor:'a_iva',target:'e_0',duration:340,result:{marks:[{id:'e_0',mark:{by:'a_iva'}}]},label:'Iva oznacava metu.'},
    {type:'trailPlace',actor:'a_merin',at:{x:5,y:3},duration:340,result:{trails:[{x:5,y:3,by:'a_merin'}]},label:'Merin priprema trag.'},
    {type:'melee',actor:'a_radan',target:'e_0',result:health('e_0',29,-17),label:'Radan pogadja oznacenu metu.'},
    {type:'markEnd',target:'e_0',duration:160,result:{marks:[{id:'e_0',mark:null}]},label:'Oznaka je potrosena.'},
    {type:'push',actor:'a_radan',target:'e_0',from:{x:4,y:3},path:[{x:5,y:3}],duration:280,label:'Meta ulazi na trag.'},
    {type:'trailHit',at:{x:5,y:3},target:'e_0',duration:410,result:{...health('e_0',18,-11),trails:[]},label:'Trag se aktivira.'},
    {type:'cover',actor:'a_radan',at:{x:5,y:4},duration:470,result:{covers:[{id:'zaklon',hp:0}]},label:'Zaklon se lomi.'},
    {type:'move',actor:'a_radan',path:[{x:4,y:3}],label:'Radan prilazi.'},
    {type:'melee',actor:'a_radan',target:'e_0',result:health('e_0',0,-18),label:'Zavrsni kontakt.'}
  ];
  async function play() {
    if(running||ui.actionPanel.isPending())return 'ignored';
    const start=copy(scene);
    start.covers=start.covers.filter(c=>c.id||c.y!==4);
    Object.assign(start.covers.find(c=>c.id==='zaklon'),{x:5,y:4});
    reset(start);applySpeed();
    running=true;
    const stamp=++generation;
    try{
      for(const [index,event] of sample.entries()){
        if(stamp!==generation)return 'cancelled';
        if(event.actor){viewer.setActive(event.actor);select(event.actor);}
        $('message').textContent=event.label;
        ui.onReplayEvent?.(event);
        const result=await viewer.playEvent({...event,id:'replay/'+index});
        if(result!=='complete'||stamp!==generation)return 'cancelled';
      }
      $('message').textContent='Probna borba zavrsena.';
      ui.onPlaybackComplete?.('victory');
      return 'complete';
    } finally {
      if(stamp===generation)running=false;
    }
  }
  ui.onReset=()=>{generation++;running=false;};
  ui.isReplayRunning=()=>running;
  const label=text('label','Brzina ');
  label.append(speed);
  $('detail-actions').prepend(button('Pusti probnu borbu',play,{id:'replay',className:'primary'}),label);
  return {play,speed,applySpeed};
};
