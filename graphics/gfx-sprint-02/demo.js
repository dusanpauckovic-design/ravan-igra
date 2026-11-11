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
  let actionPanel;
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
    $('selection').textContent = current ? 'Izabrano · '+current.name : '';
    const roster = $('roster');
    const priorFocus = roster.contains(document.activeElement) ? document.activeElement.dataset.unit : null;
    roster.textContent = '';
    for (const unit of state.units.filter(u=>u.team==='ally')) {
      const el = button('',()=>select(unit.id),{className:'unit'});
      el.dataset.unit = unit.id;
      el.setAttribute('aria-pressed',String(unit.id===selected));
      const image=document.createElement('img'); image.src=ART[unit.sprite]; image.alt='';
      const label=text('span','');
      label.append(text('strong',unit.name),text('small',unit.id===state.active ? 'Na potezu · '+unit.role : unit.role));
      el.append(image,label,text('output',unit.hp+'/'+unit.hpMax));
      roster.append(el);
      if (priorFocus===unit.id) el.focus({preventScroll:true});
    }
  }
  function select(id) { selected=id; viewer.select(id); drawHUD(viewer.getSnapshot()); }
  function reset(snapshot = scene) {
    actionPanel?.cancel(); selected=snapshot.active;
    viewer.reset(snapshot); select(selected);
    $('message').textContent='';
  }
  function cellAt(event) {
    const rect=canvas.getBoundingClientRect();
    return viewer.hitTest((event.clientX-rect.left)*canvas.width/rect.width,(event.clientY-rect.top)*canvas.height/rect.height);
  }
  canvas.onpointermove = event => {
    const cell=cellAt(event); viewer.hover(cell);
    if(!cell){$('hex').textContent='Izvan table';return;}
    const entry=viewer.describeCell(cell);
    const type={earth:'zemlja',grass:'trava',mud:'blato',stone:'kamen'}[entry.kind];
    const label=entry.cover ? entry.cover.breakable ? ' · lomljiv zaklon '+entry.cover.hp+' HP' : ' · prepreka' : '';
    $('hex').textContent='Hex '+cell.x+', '+cell.y+' · '+type+label;
  };
  canvas.onpointerleave = () => { viewer.hover(null); $('hex').textContent='Pomeri pokazivac preko table.'; };
  canvas.onclick = event => {
    const cell=cellAt(event);
    if(actionPanel.pick(cell)) return;
    const unit=viewer.getSnapshot().units.find(u=>cell && u.hp>0 && u.x===cell.x && u.y===cell.y);
    if(unit) select(unit.id);
  };
  $('view').onclick=()=>{
    flat=!flat; viewer.setMode(flat?'flat':'angled'); $('view').setAttribute('aria-pressed',String(flat));
    $('view').textContent=flat?'2.5D prikaz':'2D prikaz';
  };
  const actionPort=RavanFixtureActions();
  actionPanel=RavanActionPanel(view,actionPort);
  Object.assign(view,{actionPanel,actionPort});
  view.screens=RavanScreens(view);
  view.partyPort=RavanFixtureParty();
  RavanPartyPanel(view,view.partyPort);
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
  reset();
  window.ravanSprint = view;
})();
