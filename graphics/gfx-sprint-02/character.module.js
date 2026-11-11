/* Read-only snapshots and commands for the phase-03 UI preview. */
window.RavanCharacterFixture=function createCharacterFixture(){
  const copy=x=>JSON.parse(JSON.stringify(x));
  const attributes={hp:'Izdrzljivost',atk:'Snaga',def:'Odbrana',speed:'Okretnost'};
  const budget=4,limit=2;
  const catalog={
    look:[['figure_guard','Putnik','Krzneni plast'],['figure_archer','Izvidjac','Kozna oprema']],
    origin:[['hunter','Lovac','Napad +1'],['mason','Zidar','HP +6'],['runner','Glasnik','Inicijativa +2'],['sentry','Strazar','Odbrana +1']],
    talent:[['steady','Siguran zamah','Napad +2'],['brace','Cvrst oslonac','Odbrana +1'],['stamina','Zilavost','HP +8'],['quick','Brza reakcija','Inicijativa +2'],['stride','Dug korak','Kretanje +1'],['focus','Sabranost','Energija +1']],
    flaw:[['fragile','Stara povreda','HP −8'],['open','Otvoren gard','Odbrana −1'],['weak','Slabiji stisak','Napad −2'],['heavy','Tezak korak','Kretanje −1']],
    skill:[['marksmanship','Mirna tetiva','Pocetna vestina luka.'],['strength','Siguran udarac','Pocetna vestina bliske borbe.'],['vitality','Cvrsto telo','Pocetna vestina izdrzljivosti.']],
    kit:[['leather','Putni prsluk','Prsluk.'],['guard','Oprema strazara','Stit i rukavice.'],['field','Poljska torba','Kapa i obloga.']]
  };
  const fresh=()=>({name:'',look:'',origin:'',talent:'',flaw:'',skill:'',kit:'',mode:'story',attributes:{hp:0,atk:0,def:0,speed:0}});
  let draft=fresh(),hero=null,scene=null;
  const remaining=()=>budget-Object.values(draft.attributes).reduce((sum,n)=>sum+n,0);
  const errors=()=>[!draft.name.trim()||!draft.look?'Unesi ime i izaberi izgled.':'',!draft.origin?'Izaberi poreklo.':'',!draft.talent||!draft.flaw||remaining()!==0?'Raspodeli svih '+budget+' poena i izaberi talenat i slabost.':'',!draft.skill||!draft.kit?'Izaberi vestinu i paket opreme.':''];
  function command(cmd){
    if(cmd.type==='newDraft'){draft=fresh();return {ok:true};}
    if(cmd.type==='set'){
      const {field,value}=cmd;
      if(field==='name'&&typeof value==='string')draft.name=value.slice(0,24);
      else if(field==='mode'&&['story','skip'].includes(value))draft.mode=value;
      else if(catalog[field]?.some(item=>item[0]===value))draft[field]=value;
      else return {ok:false,reason:'Izbor nije dostupan.'};
    }
    if(cmd.type==='attribute'){
      const previous=draft.attributes[cmd.key], next=previous+cmd.delta;
      if(!Number.isInteger(previous)||![-1,1].includes(cmd.delta)||next<0||next>limit||cmd.delta>remaining())return {ok:false,reason:'Granica je '+limit+' po atributu i '+budget+' ukupno.'};
      draft.attributes[cmd.key]=next;
    }
    if(cmd.type==='create'){
      const reason=errors().find(Boolean);
      if(reason)return {ok:false,reason};
      hero=copy(draft);hero.tier=1;hero.points=0;
      scene=hero.mode==='skip'?'decision':'dialogue';
    }
    if(cmd.type==='advance'&&scene==='dialogue')scene='decision';
    if(cmd.type==='decide'&&scene==='decision'&&['ridge','river'].includes(cmd.choice)){
      hero.route=cmd.choice;scene='ready';
    }
    return {ok:true};
  }
  return {get:()=>copy({draft,hero,scene,remaining:remaining(),budget,limit,attributes,errors:errors()}),catalog,command};
};
window.RavanCharacterCreation=function mountCreation(ui,port){
  const {text,button,screens}=ui;
  const labels=['Identitet','Poreklo','Atributi','Vestina i oprema','Pregled'];
  let step=0,notice='';
  const caption=(field,id)=>port.catalog[field].find(row=>row[0]===id)?.[1]||'—';
  function cards(root,field,label,state,draw){
    const group=text('fieldset','','rpg-field');
    group.append(text('legend',label));
    const choices=text('div','','rpg-cards');
    for(const [id,name,hint] of port.catalog[field]){
      const item=button('',()=>{port.command({type:'set',field,value:id});draw(root);root.querySelector('[data-option="'+id+'"]').focus();},{className:'rpg-option'});
      item.dataset.option=id;item.setAttribute('aria-pressed',String(state.draft[field]===id));
      if(field==='look'){const img=document.createElement('img');img.src=ART[id];img.alt='';item.append(img);}
      item.append(text('strong',name),text('small',hint));choices.append(item);
    }
    group.append(choices);return group;
  }
  function draw(root){
    root.textContent='';
    const state=port.get(),d=state.draft;
    const title=text('h1','Kreiraj lika');title.tabIndex=-1;
    root.append(title);
    const tabs=text('ol','','creator-steps');
    labels.forEach((label,i)=>{
      const li=text('li',label);
      if(i===step)li.setAttribute('aria-current','step');
      tabs.append(li);
    });
    root.append(tabs);
    const panel=text('section','','paper creator-panel');
    panel.dataset.step=String(step);
    panel.append(text('h2',labels[step]));
    if(step===0){
      const label=text('label','Ime lika','rpg-input');
      const input=document.createElement('input');input.id='creator-name';input.maxLength=24;input.value=d.name;
      input.oninput=()=>port.command({type:'set',field:'name',value:input.value});label.append(input);
      const identity=text('div','','creator-identity');
      window.RavanVisuals.scenery(identity);
      identity.append(label,cards(root,'look','Izgled · bez bonusa',state,draw));
      panel.append(identity);
    }
    if(step===1)panel.append(cards(root,'origin','Prethodni zivot',state,draw));
    if(step===2){
      const attrs=text('div','','attribute-row');
      const icons=['sword','map','spark','heart','shield','eye'];
      for(const [index,[key,n]] of Object.entries(d.attributes).entries()){
        const cell=text('div','','attribute');
        cell.append(window.RavanVisuals.icon(icons[index]),text('strong',state.attributes[key]),button('−',()=>setAttribute(key,-1),{disabled:n===0}),text('output',String(n)),button('+',()=>setAttribute(key,1),{disabled:n===state.limit||state.remaining===0}));
        attrs.append(cell);
      }
      panel.append(text('p','Preostalo: '+state.remaining+' / '+state.budget,'points'),attrs,cards(root,'talent','Talenat',state,draw),cards(root,'flaw','Slabost',state,draw));
    }
    if(step===3)panel.append(cards(root,'skill','Pocetna vestina',state,draw),cards(root,'kit','Paket opreme',state,draw));
    if(step===4){
      const summary=text('dl','','skill-compare');
      for(const [label,value] of [['Ime',d.name],['Poreklo',caption('origin',d.origin)],['Atributi',Object.entries(d.attributes).map(([k,v])=>state.attributes[k]+' '+v).join(' · ')],['Talenat',caption('talent',d.talent)],['Slabost',caption('flaw',d.flaw)],['Vestina',caption('skill',d.skill)],['Oprema',caption('kit',d.kit)]])summary.append(text('dt',label),text('dd',value));
      const mode=text('div','','action-controls');
      for(const [id,label] of [['story','Sa pricom'],['skip','Bez dijaloga']]){
        const b=button(label,()=>{port.command({type:'set',field:'mode',value:id});draw(root);root.querySelector('[data-mode="'+id+'"]').focus();});b.dataset.mode=id;b.setAttribute('aria-pressed',String(d.mode===id));mode.append(b);
      }
      panel.append(summary,mode);
    }
    const feedback=text('p',notice,'screen-desc');feedback.setAttribute('role','status');
    const controls=text('div','','action-controls');
    controls.append(button(step?'Nazad':'Pocetak',()=>{if(step)go(step-1);else screens.open('opening');},{id:'creator-back'}),
      button(step===4?'Potvrdi lika':'Dalje',()=>{
        const error=port.get().errors[step];
        if(error){notice=error;feedback.textContent=error;return;}
        if(step<4){go(step+1);return;}
        const result=port.command({type:'create'});
        if(result.ok){ui.newCampaign?.();screens.open('intro');}else {notice=result.reason;feedback.textContent=notice;}
      },{id:'creator-next',className:'primary'}));
    panel.append(feedback,controls);root.append(panel);
    function setAttribute(key,delta){port.command({type:'attribute',key,delta});draw(root);root.querySelectorAll('.attribute button:not(:disabled)')[0]?.focus();}
    function go(next){step=next;notice='';draw(root);root.querySelector('h1').focus();}
  }
  function intro(root){
    const {hero,scene}=port.get();
    const title=text('h1',scene==='dialogue'?'Na ivici doline':scene==='decision'?'Izbor prilaza':'Put je otvoren');title.tabIndex=-1;
    const scenePanel=text('section','','intro-scene');
    window.RavanVisuals.scenery(scenePanel,'center 62%');
    root.append(scenePanel);
    scenePanel.append(title);
    if(scene==='dialogue')scenePanel.append(text('p','Putnik na stazi pokazuje dva prilaza prevoju.','screen-desc'),button('Preskoci razgovor',()=>advance(),{id:'skip-talk'}),button('Nastavi razgovor',()=>advance()));
    if(scene==='decision')scenePanel.append(text('p','Izaberi put kojim ces uci u oblast.','screen-desc'),
      button('Visoki greben',()=>decide('ridge'),{id:'route-ridge'}),button('Staza uz reku',()=>decide('river'),{id:'route-river'}));
    if(scene==='ready')scenePanel.append(text('p',hero.name+' · '+(hero.route==='ridge'?'Visoki greben':'Staza uz reku'),'screen-desc'),button('Udji u igru',()=>ui.enterWorld?.()||ui.startEncounter(),{id:'enter-world',className:'primary'}));
    function advance(){port.command({type:'advance'});screens.open('intro');}
    function decide(choice){port.command({type:'decide',choice});screens.open('intro');}
  }
  screens.register('creator','Kreiranje',draw,{hidden:true});
  screens.register('intro','Uvod',intro,{hidden:true});
  return {newGame(){port.command({type:'newDraft'});step=0;notice='';screens.open('creator');}};
};
