/* The view requests a preview and submits its opaque token once. */
window.RavanActionPanel = function mountActions(ui, port) {
  const {$,button,text,viewer,scene} = ui;
  const actions = [['attack','Napad'],['move','Kretanje'],['heal','Lecenje']];
  let action = null, target = null, preview = null, pending = false, revision = 0;
  const setMessage = value => { $('message').textContent = value; };
  function draw() {
    const panel = $('action-panel'); panel.textContent='';
    for(const [key] of actions) $(key).setAttribute('aria-pressed',String(key===action));
    if(!action) return;
    panel.append(text('strong',preview?.ok?'Pregled poteza':'Izaberi metu'));
    panel.append(text('p',preview?.ok?preview.summary:preview?.reason || (action==='move'?'Izaberi slobodan hex.':'Izaberi borca na tabli.')));
    if(preview?.ok) panel.append(text('small',preview.cost));
    const controls=text('div','','action-controls');
    controls.append(button('Potvrdi',confirm,{id:'confirm',disabled:!preview?.ok||pending,className:'primary'}),
      button('Odustani',cancel,{id:'cancel-action',disabled:pending}));
    panel.append(controls);
  }
  function cancel() { revision++; pending=false; action=null; target=null; preview=null; viewer.hover(null); draw(); }
  function choose(key) {
    if(pending || ui.isReplayRunning?.()) return;
    action=key; target=null; preview=null; setMessage(''); draw();
  }
  function pick(cell) {
    if(!action || pending) return !!action;
    if(!cell) return true;
    target=cell;
    preview=port.preview({action,target,state:viewer.getSnapshot()});
    draw();
    if(preview.ok) $('confirm').focus({preventScroll:true});
    return true;
  }
  async function confirm() {
    if(!preview?.ok||pending) return;
    pending=true;
    const stamp=revision, token=preview.token;
    preview=null; draw();
    let response;
    try { response=await port.submit(token); }
    catch { response={ok:false,reason:'Potvrda nije stigla. Ponovi pregled.'}; }
    if(stamp!==revision) return;
    if(!response.ok) { cancel(); setMessage(response.reason); return; }
    const result=await viewer.playEvent(response.event);
    if(stamp!==revision) return;
    cancel();
    if(result==='complete') {
      setMessage(response.message);
      ui.onActionComplete?.(response);
    }
  }
  for(const [key,label] of actions) $('actions').append(button(label,()=>choose(key),{id:key}));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape' && action && !pending) { cancel(); setMessage('Potez otkazan.'); $('actions').firstElementChild.focus(); }
  });
  return {pick,cancel,choose,isPending:()=>pending,get:()=>({action,preview,pending})};
};
window.RavanFixtureActions = function createFixtureActions() {
  let next=0, current=null, count=0;
  const key=p=>p.x+','+p.y;
  function preview({action,target,state}) {
    current=null;
    const actor=state.units.find(u=>u.id===state.active);
    const unit=state.units.find(u=>u.x===target.x && u.y===target.y && u.hp>0);
    const reject=reason=>({ok:false,reason});
    if(!actor || actor.hp===0) return reject('Borac nije dostupan.');
    let event,summary,cost;
    if(action==='attack'){
      if(unit?.team!=='enemy') return reject('Za napad izaberi protivnika.');
      const a=actor.x-(actor.y-(actor.y&1))/2, b=unit.x-(unit.y-(unit.y&1))/2, dy=actor.y-unit.y;
      if(Math.max(Math.abs(a-b),Math.abs(dy),Math.abs(a-b+dy))>1) return reject('Meta je van dometa bliskog napada.');
      const hp=Math.max(0,unit.hp-14);
      event={type:'melee',actor:actor.id,target:unit.id,result:{hp:[{id:unit.id,hp,delta:hp-unit.hp}]}};
      summary=unit.name+' · '+unit.hp+' → '+hp+' HP'; cost='Cena · glavna akcija';
    }else if(action==='heal'){
      if(unit?.id!==actor.id) return reject('Zavoj je dostupan samo aktivnom borcu.');
      if(unit.hp===unit.hpMax) return reject('Zivot je vec pun.');
      const hp=Math.min(unit.hpMax,unit.hp+12);
      event={type:'sync',actor:actor.id,target:unit.id,duration:300,result:{hp:[{id:unit.id,hp,delta:hp-unit.hp}]}};
      summary=unit.name+' · '+unit.hp+' → '+hp+' HP'; cost='Cena · 1 zavoj u probi';
    }else{
      if(unit || state.covers.some(c=>key(c)===key(target) && c.hp!==0)) return reject('Polje je zauzeto ili blokirano.');
      const paths={'2,3':[{x:2,y:3}],'2,4':[{x:2,y:3},{x:2,y:4}],'4,4':[{x:4,y:4}]};
      const path=paths[key(target)];
      if(!path || key(actor)!=='3,3') return reject('Polje nije u probnoj putanji ovog borca.');
      event={type:'move',actor:actor.id,path,result:{}};
      summary='Odrediste · hex '+target.x+', '+target.y; cost='Putanja · '+path.length+' polja';
    }
    const token='intent/'+(++next);
    current={token,event:{...event,id:token},summary};
    return {ok:true,token,summary,cost};
  }
  async function submit(token) {
    if(!current || current.token!==token) return {ok:false,reason:'Pregled vise nije vazeci.'};
    const {event,summary}=current; current=null; count++;
    return {ok:true,event,message:summary};
  }
  return {preview,submit,count:()=>count};
};
