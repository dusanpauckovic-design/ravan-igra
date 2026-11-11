window.RavanSheetFixture=function createSheetFixture(ui){
  const bonus=(label,value)=>({label,value});
  const entry=(label,base,bonuses=[])=>({label,value:base+bonuses.reduce((sum,b)=>sum+b.value,0),base,bonuses});
  return {get(){
    const {hero}=ui.characterPort.get(), state=ui.viewer.getSnapshot();
    const members=ui.partyPort.get().map(member=>{
      const actor=state.units.find(u=>u.id===member.id);
      return {...member,stats:[entry('Maksimalni HP',actor.hpMax),entry('Trenutni HP',actor.hp)],equipment:[member.weapon],
        profession:null,status:actor.hp===0?'Pao':actor.hp<actor.hpMax?'Ranjen':'Spreman',
        advancement:{rank:member.rank,points:null,locked:'Rang saborca je stalan.'}};
    });
    if(!hero)return {members};
    const {name,look,attributes,tier,points,skill,kit,origin}=hero;
    const catalog=ui.characterPort.catalog;
    const option=(key,id)=>catalog[key].find(row=>row[0]===id)?.[1];
    const item=ui.inventoryPort?.get().items.find(x=>x.equipped==='weapon');
    const startAttack=2;
    const held=item?bonus(item.name,item.attack):bonus(option('kit',kit),startAttack);
    const preview=ui.inventoryPort ? ui.inventoryPort.get().items.find(x=>x.id==='iron-knife'&&x.id!==item?.id) : {name:'Gvozdeni noz (proba)',attack:4};
    members.unshift({id:'hero',name,sprite:look,role:'Glavni lik',profession:option('origin',origin),
      stats:[
        entry('Maksimalni HP',60,[bonus('Izdrzljivost',attributes.hp*3)]),
        entry('Napad',10,[bonus('Snaga',attributes.atk),...(held?[held]:[])]),
        entry('Odbrana',2,[bonus('Odbrana',attributes.def)]),
        entry('Inicijativa',3,[bonus('Okretnost',attributes.speed)])
      ],
      equipment:[item?.name||option('kit',kit)],techniques:[{id:skill,name:option('skill',skill)}],slots:[skill],
      status:'Spreman',advancement:{tier,points,locked:'Sledeci tier jos nije otkljucan.'},
      comparison:preview?{label:preview.name,before:10+attributes.atk+(held?.value||0),after:10+attributes.atk+preview.attack}:null});
    return {members};
  }};
};

window.RavanSheet=function mountSheet(ui,port){
  const {text,button,screens}=ui;
  let selected=null;
  function draw(root){
    root.textContent='';
    const {members}=port.get();
    const member=members.find(m=>m.id===selected)||members[0];
    const title=text('h1','List lika');title.tabIndex=-1;root.append(title);
    if(!member){root.append(text('p','Nema dostupnih clanova.','screen-desc'));return;}
    selected=member.id;
    const layout=text('div','','party-layout sheet-layout'), list=text('div','','choice-list');
    for(const actor of members){
      const item=button(actor.name,()=>{selected=actor.id;draw(root);root.querySelector('[data-sheet="'+selected+'"]').focus({preventScroll:true});},{className:'choice'});
      item.dataset.sheet=actor.id;item.setAttribute('aria-pressed',String(actor.id===selected));list.append(item);
    }
    const panel=text('section','','paper sheet-paper');
    const profile=text('div','','profile sheet-profile'), portrait=document.createElement('img');portrait.src=ART[member.sprite];portrait.alt='';
    const heading=text('div','');
    heading.append(text('h2',member.name),text('p',member.role+' · '+member.status));
    if(member.profession)heading.append(text('small','Profesija · '+member.profession));
    window.RavanVisuals.scenery(profile,'center 58%');
    profile.append(portrait,heading);panel.append(profile);
    const stats=text('div','','sheet-stats');
    for(const stat of member.stats){
      const cell=text('details','','sheet-stat');
      const summary=text('summary','');
      summary.append(text('strong',String(stat.value)),text('span',stat.label));
      cell.append(summary,text('p','Osnova '+stat.base));
      for(const b of stat.bonuses)cell.append(text('p',b.label+' '+(b.value>=0?'+':'')+b.value));
      stats.append(cell);
    }
    panel.append(stats);
    const sections=text('div','','sheet-sections'), gear=text('section',''), tech=text('section',''), advancement=text('section','');
    gear.append(text('h3','Oprema'),text('p',member.equipment.join(' · ')||'Prazno'));
    if(member.comparison)gear.append(text('small',member.comparison.label+' · napad '+member.comparison.before+' → '+member.comparison.after));
    tech.append(text('h3','Aktivne tehnike'),text('p',member.techniques.filter(t=>member.slots.includes(t.id)).map(t=>t.name).join(' · ')||'Nema aktivnih tehnika'));
    advancement.append(text('h3','Razvoj'),text('p',member.advancement.tier?'Tier '+member.advancement.tier+' · '+member.advancement.points+' poena':member.advancement.rank),text('small',member.advancement.locked));
    sections.append(gear,tech,advancement);
    const controls=text('div','','action-controls');
    controls.append(button('Druzina',()=>screens.open('party')),button('Vestine',()=>screens.open('skills')));
    if(ui.inventoryPort)controls.append(button('Inventar',()=>screens.open('inventory')));
    panel.append(sections,controls);
    layout.append(list,panel);root.append(layout);
  }
  screens.register('sheet','List lika',draw);
};
