window.RavanFixtureParty = function createPartyPort() {
  const copy=value=>JSON.parse(JSON.stringify(value));
  const roster=[
    {id:'a_radan',name:'Radan',role:'Zastitnik',weapon:'Dugi noz',rank:'Bronze',sprite:'figure_guard',
      builds:[{id:'stednja',name:'Poluga',effect:'Odgurivanje je bez troska energije.'},{id:'ciscenje',name:'Prekid',effect:'Odgurivanje prekida najavljeni napad.'}],
      techniques:[{id:'arenaPush',name:'Odgurivanje',available:true},{id:'charge',name:'Prodor',available:false,reason:'Tehnika jos nije naucena.'}], slots:['arenaPush',null,null]},
    {id:'a_iva',name:'Iva',role:'Izvidjac',weapon:'Luk',rank:'Silver',sprite:'figure_archer',
      builds:[{id:'duga',name:'Strpljiva oznaka',effect:'Oznaka traje jednu rundu duze.'},{id:'daleka',name:'Daleka oznaka',effect:'Oznaka ima domet 6.'}],
      techniques:[{id:'arenaMark',name:'Oznaka',available:true},{id:'aim',name:'Nisanjenje',available:true}],slots:['arenaMark',null,null]},
    {id:'a_merin',name:'Merin',role:'Ucenjak',weapon:'Stap',rank:'Silver',sprite:'figure_caster',
      builds:[{id:'otisak',name:'Otisak',effect:'Energetski udar ostavlja trag na polju pogotka.'},{id:'prenos',name:'Prenos',effect:'Sledeci saveznik koji pogodi metu obnavlja energiju.'}],
      techniques:[{id:'arenaTrail',name:'Energetski trag',available:true},{id:'bolt',name:'Energetski udar',available:true},{id:'heal',name:'Obnova',available:true}],slots:['arenaTrail',null,null]}
  ];
  async function submit({unitId,build,slot,technique}) {
    const unit=roster.find(u=>u.id===unitId);
    if(!unit) return {ok:false,reason:'Borac nije pronadjen.'};
    if(build!==undefined) {
      if(!unit.builds.some(b=>b.id===build)) return {ok:false,reason:'Build nije dostupan.'};
      unit.build=build;
    } else {
      const entry=unit.techniques.find(t=>t.id===technique);
      if(!Number.isInteger(slot)||slot<0||slot>=3||(technique&&!entry?.available)) return {ok:false,reason:'Tehnika ili slot nisu dostupni.'};
      if(technique && unit.slots.includes(technique) && unit.slots[slot]!==technique) return {ok:false,reason:'Tehnika je vec opremljena.'};
      unit.slots[slot]=technique || null;
    }
    return {ok:true};
  }
  return {get:()=>copy(roster),submit};
};
window.RavanPartyPanel = function mountParty(ui,port) {
  const {button,text,viewer,screens}=ui;
  let chosen='a_radan', slot=0, notice='', busy=false;
  function draw(root) {
    const units=port.get(), u=units.find(x=>x.id===chosen), actual=viewer.getSnapshot().units.find(x=>x.id===chosen);
    root.textContent='';
    const h=text('h1','Druzina'); h.tabIndex=-1;
    root.append(h);
    const layout=text('div','','party-layout'), list=text('div','','choice-list');
    for(const unit of units){
      const b=button('',()=>{choose(unit.id);draw(root);root.querySelector('[data-party="'+chosen+'"]').focus({preventScroll:true});},{className:'choice'});
      const portrait=document.createElement('img');portrait.src=ART[unit.sprite];portrait.alt='';
      const label=text('span','');label.append(text('strong',unit.name),text('small',unit.role));
      b.append(portrait,label);
      b.dataset.party=unit.id; b.setAttribute('aria-pressed',String(unit.id===chosen)); list.append(b);
    }
    const detail=text('section','','paper');
    const title=text('div','','profile sheet-profile');
    window.RavanVisuals.scenery(title,'center 54%');
    const image=document.createElement('img');image.src=ART[u.sprite];image.alt='';
    const heading=text('div','');
    heading.append(text('h2',u.name),text('p',u.role+' · '+u.rank),text('small',u.weapon+' · '+actual.hp+'/'+actual.hpMax+' HP'));
    const health=document.createElement('progress');
    health.max=actual.hpMax;health.value=actual.hp;health.setAttribute('aria-label','Zivot · '+u.name);
    heading.append(health);
    title.append(image,heading); detail.append(title,text('h3','Poredjenje buildova'));
    const builds=text('div','','builds');
    for(const b of u.builds){
      const el=button('',()=>submit(root,{build:b.id}),{className:'build',disabled:busy});
      el.dataset.build=b.id; el.setAttribute('aria-pressed',String(u.build===b.id));
      el.append(text('strong',b.name),text('span',b.effect)); builds.append(el);
    }
    detail.append(builds,text('h3','Aktivne tehnike'));
    const slots=text('div','','builds slots');
    u.slots.forEach((id,i)=>{
      const label=u.techniques.find(t=>t.id===id)?.name || 'Prazan';
      const el=button((i+1)+'. '+label,()=>{slot=i;draw(root)},{className:'slot'});
      el.dataset.slot=String(i);el.setAttribute('aria-pressed',String(i===slot));slots.append(el);
    });
    detail.append(slots);
    const techniques=text('div','','builds');
    for(const t of u.techniques){
      const already=u.slots.includes(t.id)&&u.slots[slot]!==t.id;
      const el=button(t.name,()=>submit(root,{slot,technique:t.id}),{disabled:!t.available||already||busy});
      el.dataset.technique=t.id;
      if(t.reason||already) el.append(text('small',t.reason||'Vec opremljeno'));
      techniques.append(el);
    }
    if(u.slots[slot]) techniques.append(button('Isprazni slot',()=>submit(root,{slot,technique:null}),{disabled:busy}));
    const result=text('p',notice,'screen-desc'); result.setAttribute('role','status');result.hidden=!notice;
    const onward=text('div','','action-controls');
    onward.append(button('Pregledaj vestine',()=>screens.open('skills'),{className:'primary',id:'party-skills'}),
      button('Nazad na borbu',()=>screens.open('battle'),{id:'party-back'}));
    detail.append(techniques,result,onward);
    layout.append(list,detail); root.append(layout);
  }
  async function submit(root,patch){
    if(busy)return;
    busy=true;
    try { const result=await port.submit({unitId:chosen,...patch}); notice=result.ok?'Izbor sacuvan u probi.':result.reason; }
    catch {notice='Izbor nije sacuvan.';}
    finally {busy=false;if(screens.get()==='party') draw(root);}
  }
  function choose(id) {chosen=id;slot=0;notice='';}
  screens.register('party','Druzina',draw);
  return {openMember(id){choose(id);screens.open('party');}};
};
