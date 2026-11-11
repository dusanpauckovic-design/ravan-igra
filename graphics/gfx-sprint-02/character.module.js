/* Read-only snapshots and commands for the phase-03 UI preview. */
window.RavanCharacterFixture=function createCharacterFixture(){
  const copy=x=>JSON.parse(JSON.stringify(x));
  const catalog={
    look:[['figure_guard','Putnik','Krzneni plast'],['figure_archer','Izvidjac','Kozna oprema'],['figure_caster','Ucenjak','Putnicka odora']],
    origin:[['road','Putnik','Poznaje staze i sigurna mesta.'],['camp','Zanatlija','Razume alat i opremu.'],['field','Travar','Prepoznaje korisne biljke.'],['archive','Pisac','Lakse tumaci zapise.']],
    talent:[['guard','Mirna ruka','Priprema za odbranu.'],['run','Brz korak','Naglasak na kretanju.'],['eye','Ostro oko','Naglasak na osmatranju.'],['craft','Vest zanat','Naglasak na popravci.'],['care','Prva pomoc','Naglasak na oporavku.'],['study','Pamcenje','Naglasak na ucenju.']],
    flaw:[['heavy','Tezak korak','Otezava prikradanje.'],['rest','Slab san','Oporavak trazi vise odmora.'],['fear','Nervoza','Prvi susret je tezi.'],['burden','Slaba ledja','Teze je nositi punu torbu.']],
    skill:[['marksmanship','Mirna tetiva','Pocetna vestina luka.'],['strength','Siguran udarac','Pocetna vestina bliske borbe.'],['vitality','Cvrsto telo','Pocetna vestina izdrzljivosti.']],
    kit:[['blade','Putnicki paket','Noz i zavoj.'],['bow','Izvidjacki paket','Luk i zavoj.'],['camp','Zanatski paket','Alat i zalihe za kamp.']]
  };
  const fresh=()=>({name:'',look:'',origin:'',talent:'',flaw:'',skill:'',kit:'',mode:'story',attributes:{Snaga:0,Spretnost:0,Volja:0}});
  let draft=fresh(),hero=null,scene=null;
  const remaining=()=>5-Object.values(draft.attributes).reduce((sum,n)=>sum+n,0);
  const errors=()=>[!draft.name.trim()||!draft.look?'Unesi ime i izaberi izgled.':'',!draft.origin?'Izaberi poreklo.':'',!draft.talent||!draft.flaw||remaining()!==0?'Raspodeli svih 5 poena i izaberi talenat i slabost.':'',!draft.skill||!draft.kit?'Izaberi vestinu i paket opreme.':''];
  function command(cmd){
    if(cmd.type==='newDraft'){draft=fresh();return {ok:true};}
    if(cmd.type==='set'){
      const {field,value}=cmd;
      if(field==='name'&&typeof value==='string')draft.name=value.slice(0,42);
      else if(field==='mode'&&['story','skip'].includes(value))draft.mode=value;
      else if(catalog[field]?.some(item=>item[0]===value))draft[field]=value;
      else return {ok:false,reason:'Izbor nije dostupan.'};
    }
    if(cmd.type==='attribute'){
      const previous=draft.attributes[cmd.key], next=previous+cmd.delta;
      if(!Number.isInteger(previous)||![-1,1].includes(cmd.delta)||next<0||next>3||cmd.delta>remaining())return {ok:false,reason:'Granica je 3 po atributu i 5 ukupno.'};
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
  return {get:()=>copy({draft,hero,scene,remaining:remaining(),errors:errors()}),catalog,command};
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
    panel.append(text('h2',labels[step]));
    if(step===0){
      const label=text('label','Ime lika','rpg-input');
      const input=document.createElement('input');input.id='creator-name';input.maxLength=42;input.value=d.name;
      input.oninput=()=>port.command({type:'set',field:'name',value:input.value});label.append(input);
      panel.append(label,cards(root,'look','Izgled · bez bonusa',state,draw));
    }
    if(step===1)panel.append(cards(root,'origin','Prethodni zivot',state,draw));
    if(step===2){
      const attrs=text('div','','attribute-row');
      for(const [key,n] of Object.entries(d.attributes)){
        const cell=text('div','','attribute');
        cell.append(text('strong',key),button('−',()=>setAttribute(key,-1),{disabled:n===0}),text('output',String(n)),button('+',()=>setAttribute(key,1),{disabled:n===3||state.remaining===0}));
        attrs.append(cell);
      }
      panel.append(text('p','Preostalo: '+state.remaining+' / 5','points'),attrs,cards(root,'talent','Talenat',state,draw),cards(root,'flaw','Slabost',state,draw));
    }
    if(step===3)panel.append(cards(root,'skill','Pocetna vestina',state,draw),cards(root,'kit','Paket opreme',state,draw));
    if(step===4){
      const summary=text('dl','','skill-compare');
      for(const [label,value] of [['Ime',d.name],['Poreklo',caption('origin',d.origin)],['Atributi',Object.entries(d.attributes).map(([k,v])=>k+' '+v).join(' · ')],['Talenat',caption('talent',d.talent)],['Slabost',caption('flaw',d.flaw)],['Vestina',caption('skill',d.skill)],['Oprema',caption('kit',d.kit)]])summary.append(text('dt',label),text('dd',value));
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
        if(result.ok)screens.open('intro');else {notice=result.reason;feedback.textContent=notice;}
      },{id:'creator-next',className:'primary'}));
    panel.append(feedback,controls);root.append(panel);
    function setAttribute(key,delta){port.command({type:'attribute',key,delta});draw(root);root.querySelectorAll('.attribute button:not(:disabled)')[0]?.focus();}
    function go(next){step=next;notice='';draw(root);root.querySelector('h1').focus();}
  }
  function intro(root){
    const {hero,scene}=port.get();
    const title=text('h1',scene==='dialogue'?'Na ivici doline':scene==='decision'?'Izbor prilaza':'Put je otvoren');title.tabIndex=-1;
    root.append(title);
    if(scene==='dialogue')root.append(text('p','Putnik na stazi pokazuje dva prilaza prevoju.','screen-desc'),button('Preskoci razgovor',()=>advance(),{id:'skip-talk'}),button('Nastavi razgovor',()=>advance()));
    if(scene==='decision')root.append(text('p','Izaberi put kojim ces uci u oblast.','screen-desc'),
      button('Visoki greben',()=>decide('ridge'),{id:'route-ridge'}),button('Staza uz reku',()=>decide('river'),{id:'route-river'}));
    if(scene==='ready')root.append(text('p',hero.name+' · '+(hero.route==='ridge'?'Visoki greben':'Staza uz reku'),'screen-desc'),button('Udji u igru',()=>ui.enterWorld?.()||ui.startEncounter(),{id:'enter-world',className:'primary'}));
    function advance(){port.command({type:'advance'});screens.open('intro');}
    function decide(choice){port.command({type:'decide',choice});screens.open('intro');}
  }
  screens.register('creator','Kreiranje',draw,{hidden:true});
  screens.register('intro','Uvod',intro,{hidden:true});
  return {newGame(){port.command({type:'newDraft'});step=0;notice='';screens.open('creator');}};
};
