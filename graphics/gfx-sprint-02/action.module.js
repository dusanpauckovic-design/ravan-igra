/* The view requests a preview and submits its opaque token once. */
window.RavanActionPanel = function mountActions(ui, port) {
  const {$,button,text,viewer,canvas} = ui;
  const actions = [['attack','Napad'],['move','Kretanje'],['heal','Lecenje'],['guard','Gard'],['pass','Preskoci'],['mark','Oznaci']];
  const labels=new Map(actions);
  const confirmations={attack:'Potvrdi napad',move:'Potvrdi kretanje',heal:'Potvrdi lecenje',guard:'Potvrdi gard',pass:'Potvrdi preskakanje',mark:'Potvrdi oznaku'};
  let action = null, target = null, cursor = null, preview = null, candidates = [], pending = false, revision = 0;
  const setMessage = value => { $('message').textContent = value; };
  function draw() {
    const panel = $('action-panel'); panel.textContent='';
    for(const [key] of actions) $(key).setAttribute('aria-pressed',String(key===action));
    if(!action) return;
    panel.append(text('strong',pending?'Potez se izvodi':preview?.ok?'Pregled poteza':'Izaberi metu'));
    if(!pending) panel.append(text('p',preview?.ok?preview.summary:preview?.reason || labels.get(action)+' · Izaberi metu na tabli.'));
    if(preview?.ok) panel.append(text('small',preview.cost));
    const controls=text('div','','action-controls');
    controls.append(button(confirmations[action],confirm,{id:'confirm',disabled:!preview?.ok||pending,className:'primary'}),
      button('Odustani',returnToAction,{id:'cancel-action',disabled:pending}));
    panel.append(controls);
  }
  function guide() {
    viewer.setTargeting?.(action && !pending ? { candidates, target, path:preview?.path || [], blocked:!!preview && !preview.ok } : null);
  }
  function cancel() {
    revision++; pending=false; action=null; target=null; cursor=null; preview=null; candidates=[];
    guide(); viewer.hover(null); draw();
  }
  function choose(key) {
    if(pending || ui.isReplayRunning?.()) return;
    ui.battleShell?.close();
    const state=viewer.getSnapshot();
    cursor=state.units.find(u=>u.id===state.active) || {x:0,y:0};
    action=key; target=null; preview=null;
    candidates=port.targets?.({action,state}) || [];
    setMessage(''); draw(); guide(); ui.onActionStage?.('target');
    if(['guard','pass'].includes(key)||port.blocked?.({action,state})){pick(cursor);return;}
    canvas.focus({preventScroll:true});
    describeCursor();
  }
  function describeCursor() {
    viewer.hover(cursor);
    $('hex').textContent='Hex '+cursor.x+', '+cursor.y;
  }
  function returnToAction() {
    const previous=action;
    cancel(); ui.onActionStage?.('choose');
    $(previous)?.focus({preventScroll:true});
  }
  function pick(cell) {
    if(!action || pending) return !!action;
    if(!cell) return true;
    target=cell; cursor=cell;
    preview=port.preview({action,target,state:viewer.getSnapshot()});
    draw(); guide(); describeCursor();
    ui.onActionStage?.(preview.ok?'preview':'blocked');
    if(preview.ok) $('confirm').focus({preventScroll:true});
    return true;
  }
  async function confirm() {
    if(!preview?.ok||pending) return;
    pending=true;
    const stamp=revision, token=preview.token;
    preview=null; draw(); guide();
    let response;
    try { response=await port.submit(token); }
    catch { response={ok:false,reason:'Potvrda nije stigla. Ponovi pregled.'}; }
    if(stamp!==revision) return;
    if(!response.ok) { cancel(); setMessage(response.reason); return; }
    const result=await viewer.playEvent(response.event);
    if(stamp!==revision) return;
    cancel();
    if(result==='complete') {
      setMessage(response.message); ui.onActionStage?.('complete');
      ui.onActionComplete?.(response);
    }
  }
  for(const [key,label] of actions){
    const root=key==='mark'?$('drawer-techniques'):$('actions');
    root.append(button(label,()=>choose(key),{id:key}));
  }
  canvas.addEventListener('keydown',event=>{
    if(!action || pending) return;
    if(event.key==='Enter') {
      event.preventDefault();
      if(!event.repeat) pick(cursor);
      return;
    }
    const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if(!direction) return;
    event.preventDefault();
    const {width,height}=viewer.getSnapshot();
    cursor={
      x:Math.max(0,Math.min(width-1,cursor.x+direction[0])),
      y:Math.max(0,Math.min(height-1,cursor.y+direction[1]))
    };
    describeCursor();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Enter' && event.repeat && event.target.id==='confirm')event.preventDefault();
    if(event.key==='Escape' && action && !pending) { returnToAction(); setMessage('Potez otkazan.'); }
  });
  return {pick,cancel,choose,isPending:()=>pending,get:()=>({action,preview,pending})};
};
window.RavanFixtureActions = function createFixtureActions() {
  let next=0, current=null, count=0;
  const key=p=>p.x+','+p.y;
  function blocked({action,state}){
    if(action==='mark'&&state.active!=='a_iva')return 'Oznaku moze da postavi Iva kada je na potezu.';
    return '';
  }
  function plan({action,target,state}) {
    const actor=state.units.find(u=>u.id===state.active);
    const unit=state.units.find(u=>u.x===target.x && u.y===target.y && u.hp>0);
    const reject=reason=>({ok:false,reason});
    if(!actor || actor.hp===0) return reject('Borac nije dostupan.');
    const reason=blocked({action,state});
    if(reason)return reject(reason);
    let event,summary,cost,outcome;
    if(action==='guard'||action==='pass'){
      const order=state.units.filter(u=>u.team==='ally'&&u.hp>0);
      const following=order[(order.indexOf(actor)+1)%order.length];
      event={type:action==='guard'?'guard':'sync',actor:actor.id,duration:240,result:{active:following.id}};
      summary=action==='guard'?actor.name+' zauzima gard.':actor.name+' zavrsava potez.';
      cost='Sledeci: '+following.name;
    }else if(action==='mark'){
      if(unit?.team!=='enemy')return reject('Izaberi protivnika za oznaku.');
      event={type:'mark',actor:actor.id,target:unit.id,duration:360,result:{marks:[{id:unit.id,mark:{by:actor.id}}]}};
      summary='Oznaci metu · '+unit.name;cost='Cena · tehnika u probi';
    }else if(action==='attack'){
      if(unit?.team!=='enemy') return reject('Za napad izaberi protivnika.');
      const a=actor.x-(actor.y-(actor.y&1))/2, b=unit.x-(unit.y-(unit.y&1))/2, dy=actor.y-unit.y;
      if(Math.max(Math.abs(a-b),Math.abs(dy),Math.abs(a-b+dy))>1) return reject('Meta je van dometa bliskog napada.');
      const hp=Math.max(0,unit.hp-14);
      event={type:'melee',actor:actor.id,target:unit.id,result:{hp:[{id:unit.id,hp,delta:hp-unit.hp}]}};
      summary=unit.name+' · '+unit.hp+' → '+hp+' HP'; cost='Cena · glavna akcija';
      if(hp===0 && !state.units.some(u=>u.team==='enemy'&&u.id!==unit.id&&u.hp>0))outcome='victory';
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
    return {ok:true,event,summary,cost,outcome};
  }
  function targets({action,state}) {
    const cells=[];
    for(let y=0;y<state.height;y++) {
      for(let x=0;x<state.width;x++) {
        const target={x,y};
        if(plan({action,target,state}).ok) cells.push(target);
      }
    }
    return cells;
  }
  function preview(input) {
    current=null;
    const result=plan(input);
    if(!result.ok) return result;
    const token='intent/'+(++next);
    const {event,summary,cost,outcome}=result;
    current={token,event:{...event,id:token},summary,outcome};
    return {ok:true,token,summary,cost,path:event.path || []};
  }
  async function submit(token) {
    if(!current || current.token!==token) return {ok:false,reason:'Pregled vise nije vazeci.'};
    const {event,summary,outcome}=current; current=null; count++;
    return {ok:true,event,message:summary,outcome};
  }
  return {preview,targets,submit,blocked,count:()=>count};
};
