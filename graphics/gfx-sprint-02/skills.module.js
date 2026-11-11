window.RavanFixtureSkills=function createSkillPort(catalog) {
  const learned=new Set(['marksmanship','strength','heal']);
  let points=3;
  function status(id) {
    const n=catalog[id];
    if(learned.has(id)) return {key:'learned',label:'Nauceno'};
    if(n.requires&&!learned.has(n.requires)) return {key:'locked',label:'Zakljucano',reason:'Prvo nauci '+catalog[n.requires].name+'.'};
    if(n.cost>points) return {key:'locked',label:'Zakljucano',reason:'Potrebno je '+n.cost+' poena.'};
    return {key:'open',label:'Dostupno'};
  }
  async function submit({type,nodeId}) {
    if(type!=='learn'||!catalog[nodeId]||status(nodeId).key!=='open') return {ok:false,reason:'Cvor trenutno nije dostupan.'};
    learned.add(nodeId);points-=catalog[nodeId].cost;return {ok:true};
  }
  return {status,points:()=>points,submit};
};
window.RavanSkillPanel=function mountSkillPanel(ui,catalog,port){
  const {text,button,screens}=ui;
  const groups={
    'Oruzje':['marksmanship','longshot','steady','strength','charge','precision'],
    'Odbrana':['vitality','armor','mobility'],
    'Magija':['bolt','slow','farreach','potisak','potisakPlus','otisak','otisakPlus','prenos','prenosPlus'],
    'Obnova':['heal','mastery','restoration']
  };
  let group='Oruzje', id='longshot', notice='', busy=false;
  function draw(root){
    root.textContent='';
    const heading=text('div','','screen-head');
    const title=text('h1','Vestine'); title.tabIndex=-1;
    heading.append(title,text('strong',port.points()+' poena','points'),
      button('Nazad na borbu',()=>screens.open('battle'),{id:'skills-back'}),
      button(ui.hasEnteredEncounter()?(ui.resumeTarget()==='outcome'?'Otvori rezime':'Nastavi susret'):'Udji u susret',()=>ui.enterEncounter(),{id:'start-encounter',className:'primary'}));
    root.append(heading);
    const tabs=text('nav','','skill-tabs');
    for(const [name,keys] of Object.entries(groups)){
      const el=button(name,()=>{group=name;id=keys[0];notice='';draw(root)});
      el.setAttribute('aria-pressed',String(name===group)); tabs.append(el);
    }
    root.append(tabs);
    const layout=text('div','','skills-layout'), graph=text('div','','skill-list');
    const depth=key=>catalog[key].requires?1+depth(catalog[key].requires):0;
    for(const key of groups[group]){
      const node=catalog[key], state=port.status(key);
      const el=button('',()=>{id=key;notice='';draw(root)},{className:'node '+state.key});
      el.style.setProperty('--depth',depth(key));
      el.dataset.skill=key;
      el.setAttribute('aria-pressed',String(id===key));
      const copy=text('span','','node-label');copy.append(text('strong',node.name));
      if(node.requires)copy.append(text('small','Posle: '+catalog[node.requires].name));
      el.append(copy,text('span',state.label,'node-state'));graph.append(el);
    }
    const panel=text('section','','paper');
    const node=catalog[id], state=port.status(id);
    panel.append(text('h2',node.name),text('p',state.label+' · '+(node.kind==='active'?'Aktivna':'Pasivna'),'skill-state'));
    const comparison=text('dl','','skill-compare');
    const rows=[
      ['Trenutno',state.key==='learned'?'Efekat je otkljucan.':'Efekat jos nije otkljucan.'],
      ['Efekat',node.desc],
      ['Preduslov',node.requires?catalog[node.requires].name:'Nema'],
      ['Cena',node.cost+' poena']
    ];
    for(const [label,value] of rows) comparison.append(text('dt',label),text('dd',value));
    panel.append(comparison);
    if(state.reason)panel.append(text('p',state.reason,'screen-desc'));
    const feedback=text('p',notice,'screen-desc');feedback.setAttribute('role','status');feedback.hidden=!notice;
    panel.append(button(state.key==='learned'?'Nauceno':'Nauci',()=>learn(root),{id:'learn',className:'primary',disabled:state.key!=='open'||busy}),feedback);
    layout.append(graph,panel);root.append(layout);
  }
  async function learn(root){
    if(busy||port.status(id).key!=='open')return;
    busy=true;const nodeId=id;
    try{const r=await port.submit({type:'learn',nodeId});notice=r.ok?'Vestina naucena u probi.':r.reason;}
    catch{notice='Ucenje trenutno nije dostupno.';}
    finally{busy=false;if(screens.get()==='skills')draw(root);}
  }
  screens.register('skills','Vestine',draw);
};
