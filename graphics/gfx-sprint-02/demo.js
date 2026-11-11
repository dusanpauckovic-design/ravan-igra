(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const copy = value => JSON.parse(JSON.stringify(value));
  const canvas = $('arena');
  const scene = {
    width: 9, height: 6, active: 'a_radan', trails: [], danger: [{x:6,y:3}],
    units: [
      { id:'a_radan', name:'Radan', role:'Zastitnik', team:'ally', sprite:'figure_guard', x:3, y:3, hp:64, hpMax:78 },
      { id:'a_iva', name:'Iva', role:'Izvidjac', team:'ally', sprite:'figure_archer', x:2, y:2, hp:61, hpMax:61 },
      { id:'a_merin', name:'Merin', role:'Ucenjak', team:'ally', sprite:'figure_caster', x:3, y:4, hp:60, hpMax:60 },
      { id:'e_0', name:'Tihi lovac', role:'Protivnik', team:'enemy', sprite:'figure_wolf', x:4, y:3, hp:58, hpMax:58 }
    ],
    terrain:[
      ...[[1,2],[2,2],[1,3],[2,3],[1,4],[2,5],[7,4],[8,4],[8,5]].map(([x,y])=>({x,y,kind:'grass'})),
      ...[[6,2],[6,3],[6,4],[7,3]].map(([x,y])=>({x,y,kind:'mud'})),
      ...[[4,1],[5,1],[5,2],[5,3],[5,4],[6,5]].map(([x,y])=>({x,y,kind:'stone'}))
    ],
    covers:[0,1,2,4,5].map(y=>({x:5,y})).concat([{id:'zaklon',x:5,y:3,hp:18,hpMax:18}])
  };
  let selected = scene.active, flat = false;
  let encounter={title:'Kameni prolaz',objective:'Savladaj Tihog lovca.',snapshot:scene};
  let actionPanel, enteredEncounter=false;
  const viewer = RavanGraphics.createRenderer(canvas, ART, drawHUD);
  const view = { $, copy, canvas, scene, viewer, text, button, select, reset, cellAt, drawHUD };
  const selectedUnit = state => state.units.find(u=>u.id===selected);
  const activeUnit = state => state.units.find(u=>u.id===state.active);
  function text(tag, value, className) {
    const el = document.createElement(tag); el.textContent = value;
    if (className) el.className = className;
    return el;
  }
  function button(label, callback, options = {}) {
    const el = text('button', label, options.className);
    el.type = 'button'; el.id = options.id || ''; el.disabled = !!options.disabled;
    el.addEventListener('click', callback);
    return el;
  }
  function drawHUD(state) {
    const active = activeUnit(state), current = selectedUnit(state);
    $('turn').textContent = '';
    const turn = text('div','','turn-card');
    turn.append(text('span','NA POTEZU','active-tag'), text('strong',active?.name || '—'));
    $('turn').append(turn);
    const order=$('battle-order');
    const allies=state.units.filter(unit=>unit.team==='ally'&&unit.hp>0);
    const next=allies.findIndex(unit=>unit.id===state.active);
    order.textContent='';
    if(next>=0)for(const u of [...allies.slice(next),...allies.slice(0,next)]){
      const b=button(u.name,()=>{select(u.id);view.battleShell.inspect();},{className:'order-person'});
      b.setAttribute('aria-label','Detalji · '+u.name);
      if(u.id===state.active)b.setAttribute('aria-current','true');
      order.append(b);
    }
    $('selection').textContent = current ? 'Izabrano · '+current.name : '';
    const roster = $('roster');
    const priorFocus = roster.contains(document.activeElement) ? document.activeElement.dataset.unit : null;
    roster.textContent = '';
    for (const unit of state.units) {
      const el = button('',()=>select(unit.id),{className:'unit'});
      el.dataset.unit = unit.id;
      el.setAttribute('aria-pressed',String(unit.id===selected));
      const image=document.createElement('img'); image.src=ART[unit.sprite]; image.alt='';
      const label=text('span','');
      label.append(text('strong',unit.name),text('small',unit.id===state.active ? 'Na potezu · '+unit.role : unit.role));
      const health=text('div','','unit-health');
      const meter=document.createElement('progress');
      meter.max=unit.hpMax;meter.value=unit.hp;meter.setAttribute('aria-label','Zivot · '+unit.name);
      health.append(text('output',unit.hp+'/'+unit.hpMax),meter);
      el.append(image,label,health);
      roster.append(el);
      if (priorFocus===unit.id) el.focus({preventScroll:true});
    }
  }
  function select(id) { selected=id; viewer.select(id); drawHUD(viewer.getSnapshot()); }
  function reset(snapshot = encounter.snapshot) {
    view.onReset?.(); view.battleShell?.close(); actionPanel?.cancel(); selected=snapshot.active;
    viewer.reset(snapshot); select(selected);
    $('message').textContent='';
    view.hints?.set('choose');
  }
  function loadEncounter(title,objective,snapshot){
    encounter={title,objective,snapshot:copy(snapshot)};
    enteredEncounter=true;
    $('arena-title').textContent=title;
    $('objective').textContent='Cilj · '+objective;
    reset();
    view.screens.open('battle');
  }
  function cellAt(event) {
    const point=viewer.clientToBoard(event.clientX,event.clientY);
    return viewer.hitTest(point.x,point.y);
  }
  function describe(cell){
    const entry=viewer.describeCell(cell);
    const type={earth:'zemlja',grass:'trava',mud:'blato',stone:'kamen'}[entry.kind];
    const label=entry.cover ? entry.cover.breakable ? ' · lomljiv zaklon '+entry.cover.hp+' HP' : ' · prepreka' : '';
    $('hex').textContent='Hex '+cell.x+', '+cell.y+' · '+type+label;
  }
  canvas.onpointermove = event => viewer.hover(cellAt(event));
  canvas.onpointerleave = () => viewer.hover(null);
  canvas.onclick = event => {
    const cell=cellAt(event);
    if(!cell||view.isReplayRunning?.()||actionPanel.pick(cell)) return;
    const unit=viewer.getSnapshot().units.find(u=>u.hp>0 && u.x===cell.x && u.y===cell.y);
    if(unit)select(unit.id);
    describe(cell);view.battleShell.inspect();
  };
  $('view').onclick=()=>{
    flat=!flat; viewer.setMode(flat?'flat':'angled'); $('view').setAttribute('aria-pressed',String(flat));
    $('view').textContent=flat?'2.5D prikaz':'2D prikaz';
  };
  const actionPort=RavanFixtureActions();
  actionPanel=RavanActionPanel(view,actionPort);
  Object.assign(view,{actionPanel,actionPort});
  view.screens=RavanScreens(view);
  view.battleShell=RavanBattleShell(view);
  view.partyPort=RavanFixtureParty();
  view.partyView=RavanPartyPanel(view,view.partyPort);
  view.skillPort=RavanFixtureSkills(RavanSkillCatalog);
  RavanSkillPanel(view,RavanSkillCatalog,view.skillPort);
  $('detail-actions').append(button('Ponovi scenu',()=>reset(),{id:'reset'}));
  let terrain=true;
  $('detail-actions').append(button('Teren pre/posle',()=>{
    terrain=!terrain;viewer.setTerrainStyle(terrain);
  },{id:'terrain-compare'}));
  let figures=true;
  $('detail-actions').append(button('Figure pre/posle',()=>{
    figures=!figures;viewer.setFigureStyle(figures);
  },{id:'figure-compare'}),button('Grupa uz zaklon',()=>{
    const group=copy(scene);
    Object.assign(group.units[1],{x:5,y:2});
    Object.assign(group.units[2],{x:5,y:4});
    group.covers=group.covers.filter(c=>c.id||c.y!==2&&c.y!==4);
    reset(group);select('a_iva');
  },{id:'figure-group'}));
  view.replay=RavanReplayPanel(view);
  view.outcomePort=RavanFixtureOutcome();
  view.outcome=RavanOutcomePanel(view,view.outcomePort);
  view.hints=RavanHints(view);
  view.loadEncounter=loadEncounter;
  view.getEncounter=()=>encounter;
  view.startEncounter=()=>{
    const start=copy(scene);
    start.units[3].hp=28;
    loadEncounter('Kameni prolaz','Savladaj Tihog lovca.',start);
  };
  view.hasEnteredEncounter=()=>enteredEncounter;
  view.resumeTarget=()=>{
    const result=view.outcomePort.get();
    const defeated=viewer.getSnapshot().units.every(unit=>unit.team!=='enemy'||unit.hp<=0);
    return result && !result.finished && (result.kind==='defeat'||defeated) ? 'outcome' : 'battle';
  };
  view.enterEncounter=()=>enteredEncounter ? view.screens.open(view.resumeTarget()) : view.startEncounter();
  view.onActionComplete=response=>{
    enteredEncounter=true;
    if(response.outcome) view.outcome.show(response.outcome);
  };
  view.characterPort=RavanCharacterFixture();
  view.creator=RavanCharacterCreation(view,view.characterPort);
  view.sheetPort=RavanSheetFixture(view);
  RavanSheet(view,view.sheetPort);
  view.feedback=RavanFeedback(view);
  view.inventoryPort=RavanInventoryFixture(view.characterPort);
  view.inventory=RavanInventory(view,view.inventoryPort);
  view.worldPort=RavanWorldFixture();
  view.world=RavanWorld(view,view.worldPort);
  view.enterWorld=view.world.openCurrent;
  view.startQuickArena=()=>{view.expeditionActive=false;view.startEncounter();};
  view.completeExpedition=()=>{
    view.expeditionActive=false;view.worldPort.finish();view.world.openCurrent();
    view.feedback.announce('Druzina se vratila u kamp.');
  };
  view.newCampaign=()=>{
    view.expeditionActive=false;view.worldPort.reset();view.inventoryPort.reset();
  };
  RavanOpening(view);
  reset();
  window.ravanSprint = view;
  view.screens.open('opening');
})();
