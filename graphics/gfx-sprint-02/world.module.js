window.RavanWorldFixture=function createWorldFixture(){
  const copy=x=>JSON.parse(JSON.stringify(x));
  const locations=[
    {id:'camp',name:'Kamp uz stazu',type:'Skloniste',x:18,y:70,danger:'Niska',description:'Skloniste, odmor i priprema sledeceg izlaska.',activity:'Kamp'},
    {id:'river',name:'Recna obala',type:'Resursi',x:44,y:77,danger:'Niska',description:'Mirniji prilaz kroz plitku vodu.',activity:'Sakupi zalihe'},
    {id:'ridge',name:'Vidikovac',type:'Osmatranje',x:48,y:27,danger:'Srednja',description:'Sa grebena mozes da vidis drugi prilaz.',activity:'Osmotri prolaz'},
    {id:'pass',name:'Kameni prolaz',type:'Susret',x:79,y:48,danger:'Visoka',description:'Tihi lovac drzi uzak prolaz.',activity:'Udji u susret'}
  ];
  const roads=[['camp','river'],['camp','ridge'],['river','pass'],['ridge','pass']];
  let current='camp',supplies=3,rested=false,prepared=false;
  const discovered=new Set(['camp','river','ridge']), visited=new Set(['camp']), resolved=new Set();
  const link=(a,b)=>roads.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
  function reason(type,id){
    if(type==='rest'||type==='prepare'){
      if(current!=='camp')return 'Vrati se u kamp.';
      if(type==='rest'&&rested)return 'Druzina se vec odmorila.';
      if(type==='prepare'&&prepared)return 'Priprema je vec zavrsena.';
      if(type==='prepare'&&!supplies)return 'Potrebna je jedna zaliha.';
      return '';
    }
    if(!discovered.has(id))return 'Lokacija jos nije otkrivena.';
    if(type==='activity')return current!==id?'Prvo dodji na lokaciju.':resolved.has(id)?'Aktivnost je zavrsena.':'';
    if(current===id)return 'Vec si na ovoj lokaciji.';
    if(type==='fast'&&!visited.has(id))return 'Brzo putovanje se otkljucava prvom posetom.';
    if(type==='travel'&&!link(current,id))return 'Izaberi povezanu lokaciju.';
    return '';
  }
  function command({type,id}){
    const blocked=reason(type,id);
    if(blocked)return {ok:false,reason:blocked};
    if(type==='travel'||type==='fast'){
      current=id;visited.add(id);
      for(const [a,b] of roads){if(a===id)discovered.add(b);if(b===id)discovered.add(a);}
    }
    if(type==='rest')rested=true;
    if(type==='prepare'){supplies--;prepared=true;}
    if(type==='activity'&&id==='river'){supplies+=2;resolved.add(id);}
    if(type==='activity'&&id==='ridge'){discovered.add('pass');resolved.add(id);}
    return {ok:true,enterBattle:type==='activity'&&id==='pass'};
  }
  return {get:()=>copy({locations,roads,current,supplies,rested,prepared,discovered:[...discovered],visited:[...visited],resolved:[...resolved]}),reason,command,
    finish(){resolved.add('pass');current='camp';},};
};
window.RavanWorld=function mountWorld(ui,port){
  const {text,button,screens}=ui;
  let selected='camp',notice='';
  function map(root){
    root.textContent='';
    const model=port.get(), title=text('h1','Dolina prevoja');title.tabIndex=-1;
    root.append(title);
    const layout=text('div','','map-layout'), field=text('div','','map-field');
    field.style.backgroundImage='linear-gradient(#151e19a0,#172219b0),url("'+ART.battle_vista+'")';
    const loc=id=>model.locations.find(l=>l.id===id);
    const svgNS='http://www.w3.org/2000/svg';
    const roads=document.createElementNS(svgNS,'svg');
    roads.setAttribute('viewBox','0 0 100 100');roads.setAttribute('preserveAspectRatio','none');
    roads.setAttribute('aria-hidden','true');roads.setAttribute('class','map-roads');
    for(const [from,to] of model.roads){
      const a=loc(from), b=loc(to), line=document.createElementNS(svgNS,'line');
      for(const [key,value] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y}))line.setAttribute(key,value);
      line.setAttribute('vector-effect','non-scaling-stroke');
      roads.append(line);
    }
    field.append(roads);
    for(const l of model.locations){
      const seen=model.discovered.includes(l.id), here=model.current===l.id;
      const name=seen?l.name:'Neotkriveno';
      const status=here?'Ovde si':model.resolved.includes(l.id)?'Reseno':model.visited.includes(l.id)?'Poseceno':seen?'Otkriveno':'';
      const pin=button('',()=>{selected=l.id;notice='';map(root);root.querySelector('[data-location="'+l.id+'"]').focus({preventScroll:true});},{className:'map-pin',disabled:!seen});
      pin.style.left=l.x+'%';pin.style.top=l.y+'%';pin.dataset.location=l.id;
      pin.setAttribute('aria-pressed',String(selected===l.id));pin.append(text('strong',name));
      if(status)pin.append(text('small',status));
      field.append(pin);
    }
    const panel=text('section','','paper'), l=loc(selected);
    panel.append(text('h2',l.name),text('p',l.type+' · Opasnost: '+l.danger,'skill-state'),text('p',l.description,'screen-desc'));
    for(const [type,label] of [['travel','Putuj'],['fast','Brzo putuj'],['activity',l.activity]]){
      const reason=port.reason(type,l.id);
      panel.append(button(label,()=>act(type,l.id,root,map),{id:'world-'+type,disabled:!!reason}));
      if(reason)panel.append(text('small',reason,'world-reason'));
    }
    panel.append(text('p',notice,'screen-desc'));
    layout.append(field,panel);root.append(layout);
  }
  function camp(root){
    root.textContent='';
    const state=port.get(),title=text('h1','Kamp uz stazu');title.tabIndex=-1;
    root.append(title,text('p','Zalihe · '+state.supplies,'points'));
    const grid=text('div','','camp-grid');
    for(const [name,desc,id,run,reason] of [
      ['Druzina','Pregledaj borce i opremu.','camp-party',()=>screens.open('sheet'),''],
      ['Odmor',state.rested?'Druzina se odmorila.':'Odmori druzinu.','camp-rest',()=>act('rest','camp',root,camp),port.reason('rest','camp')],
      ['Priprema',state.prepared?'Priprema zavrsena.':'Trosi jednu zalihu.','camp-prepare',()=>act('prepare','camp',root,camp),port.reason('prepare','camp')],
      ['Zalihe','Otvori torbu ili trgovca.','camp-inventory',()=>ui.inventory.open(),'']
    ]){
      const card=text('section','','paper');card.append(text('h2',name),text('p',desc,'screen-desc'),button('Otvori',run,{id,disabled:!!reason}));
      if(reason)card.append(text('small',reason,'world-reason'));grid.append(card);
    }
    root.append(grid,button('Otvori mapu',()=>screens.open('map'),{id:'camp-map',className:'primary'}),text('p',notice,'screen-desc'));
  }
  function act(type,id,root,draw){
    if(type==='activity'&&id==='camp'){screens.open('camp');return;}
    const result=port.command({type,id});
    if(result.enterBattle){ui.startEncounter();return;}
    notice=result.ok?'Radnja prihvacena u probi.':result.reason;
    draw(root);
  }
  screens.register('map','Mapa',map);
  screens.register('camp','Kamp',camp);
  return {openCamp(){screens.open('camp');return true;}};
};
