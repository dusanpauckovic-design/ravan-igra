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
  const {text,button,screens}=ui, visuals=window.RavanVisuals;
  const branches=[
    {name:'Oruzje',icon:'sword',tone:'brass',paths:[['marksmanship','longshot','steady'],['strength','charge','precision']]},
    {name:'Odbrana',icon:'shield',tone:'sage',paths:[['vitality','armor','mobility']]},
    {name:'Magija',icon:'spark',tone:'violet',paths:[['bolt','slow','farreach'],[null,'potisak','potisakPlus'],[null,'otisak','otisakPlus'],[null,'prenos','prenosPlus']]},
    {name:'Obnova',icon:'heal',tone:'teal',paths:[['heal','mastery','restoration']]}
  ];
  let branch=branches[0], id='longshot', notice='', busy=false, graph=null;
  const linkColor={learned:'#a6d7b4',open:'#e9c88f',locked:'#617471'};
  function drawLinks(){
    if(!graph?.isConnected)return;
    const canvas=graph.querySelector('canvas'), rect=graph.getBoundingClientRect();
    const dpr=Math.min(window.devicePixelRatio||1,3);
    canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
    const ctx=canvas.getContext('2d');
    ctx.scale(dpr,dpr);
    const points=new Map([...graph.querySelectorAll('[data-skill]')].map(el=>{
      const seal=el.firstElementChild.getBoundingClientRect();
      return [el.dataset.skill,{x:seal.left+seal.width/2-rect.left,y:seal.top+seal.height/2-rect.top,r:seal.width/2}];
    }));
    for(const [key,to] of points){
      const parent=catalog[key].requires, from=points.get(parent);
      if(!from)continue;
      const state=port.status(key).key;
      const start=from.x+from.r, end=to.x-to.r, mid=(start+end)/2;
      ctx.strokeStyle=linkColor[state];ctx.lineWidth=key===id||parent===id?2.5:1.5;
      ctx.setLineDash(state==='locked'?[4,5]:[]);
      ctx.beginPath();ctx.moveTo(start,from.y);ctx.lineTo(mid,from.y);
      ctx.lineTo(mid,to.y);ctx.lineTo(end,to.y);ctx.stroke();
    }
  }
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(drawLinks):null;
  window.addEventListener('resize',drawLinks);
  function draw(root){
    observer?.disconnect();
    root.textContent='';
    const heading=text('div','','screen-head');
    const title=text('h1','Vestine'); title.tabIndex=-1;
    heading.append(title,text('strong',port.points()+' poena','points'),
      button('Nazad na borbu',()=>screens.open('battle'),{id:'skills-back'}),
      button(ui.hasEnteredEncounter()?(ui.resumeTarget()==='outcome'?'Otvori rezime':'Nastavi susret'):'Udji u susret',()=>ui.enterEncounter(),{id:'start-encounter',className:'primary'}));
    root.append(heading);
    const tabs=text('nav','','skill-tabs visual-skill-tabs');
    tabs.setAttribute('aria-label','Grane vestina');
    for(const group of branches){
      const el=button('',()=>{branch=group;id=group.paths[0][0];notice='';draw(root);root.querySelector('[data-branch="'+group.tone+'"]').focus({preventScroll:true});});
      el.dataset.branch=group.tone;
      el.append(visuals.icon(group.icon),text('span',group.name));
      el.setAttribute('aria-pressed',String(branch===group));tabs.append(el);
    }
    root.append(tabs);
    const layout=text('div','','skill-atlas'), board=text('section','','skill-board');
    layout.dataset.tone=branch.tone;
    visuals.scenery(board);
    graph=text('div','','skill-graph');
    graph.setAttribute('role','group');graph.setAttribute('aria-label',branch.name+' · povezane vestine');
    const lines=document.createElement('canvas');lines.setAttribute('aria-hidden','true');graph.append(lines);
    for(const [row,path] of branch.paths.entries())for(const [column,key] of path.entries()){
      if(!key)continue;
      const node=catalog[key], state=port.status(key);
      const el=button('',()=>{
        id=key;notice='';draw(root);
        const detail=root.querySelector('.skill-detail h2');
        if(window.matchMedia('(max-width:770px)').matches)detail.focus();
        else root.querySelector('[data-skill="'+id+'"]').focus({preventScroll:true});
      },{className:'skill-node '+state.key});
      el.style.gridColumn=String(column+1);el.style.gridRow=String(row+1);
      el.dataset.skill=key;el.setAttribute('aria-pressed',String(id===key));
      el.setAttribute('aria-label',node.name+' · '+state.label);
      const seal=visuals.icon(node.icon,'skill-seal');
      seal.append(text('span',{learned:'✓',open:'+',locked:'−'}[state.key],'skill-sign'));
      el.append(seal,text('strong',node.name));graph.append(el);
    }
    const legend=text('div','','skill-legend');
    for(const [state,sign,label] of [['learned','✓','Nauceno'],['open','+','Dostupno'],['locked','−','Zakljucano']]){
      const key=text('span','','legend-'+state);key.append(text('b',sign),text('span',label));legend.append(key);
    }
    board.append(graph,legend);
    const panel=text('section','','paper skill-detail'), node=catalog[id], state=port.status(id);
    const detailTitle=text('h2',node.name);detailTitle.tabIndex=-1;
    panel.append(visuals.icon(node.icon,'skill-emblem'),detailTitle,
      text('p',state.label+' · '+(node.kind==='active'?'Aktivna':'Pasivna'),'skill-state'),
      text('p',node.desc,'skill-effect'));
    if(state.reason)panel.append(text('p',state.reason,'screen-desc'));
    const feedback=text('p',notice,'screen-desc');feedback.setAttribute('role','status');feedback.hidden=!notice;
    panel.append(button(state.key==='learned'?'Nauceno':'Nauci · '+node.cost+(node.cost===1?' poen':' poena'),()=>learn(root),{id:'learn',className:'primary',disabled:state.key!=='open'||busy}),feedback);
    panel.append(button('Nazad na stablo',()=>root.querySelector('[data-skill="'+id+'"]').focus(),{className:'skill-return'}));
    layout.append(board,panel);root.append(layout);
    drawLinks();observer?.observe(graph);
  }
  async function learn(root){
    if(busy||port.status(id).key!=='open')return;
    busy=true;const nodeId=id;
    try{const r=await port.submit({type:'learn',nodeId});notice=r.ok?'Vestina naucena.':r.reason;}
    catch{notice='Ucenje trenutno nije dostupno.';}
    finally{
      busy=false;
      if(screens.get()==='skills'){
        draw(root);root.querySelector('[data-skill="'+id+'"]')?.focus({preventScroll:true});
      }
    }
  }
  screens.register('skills','Vestine',draw);
};
