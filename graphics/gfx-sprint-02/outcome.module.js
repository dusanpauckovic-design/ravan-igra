window.RavanFixtureOutcome=function createOutcomePort() {
  let serial=0, current=null, submissions=0;
  const copy=value=>JSON.parse(JSON.stringify(value));
  function open(kind){
    current={
      id:'result/'+(++serial), kind,
      title:kind==='victory'?'Prolaz je otvoren':'Druzina se povukla',
      summary:kind==='victory'?'Tihi lovac je savladan. Odaberi sta druzina nosi dalje.':'Prolaz je i dalje zatvoren. Vrati se na pocetak susreta.',
      rewards:kind==='victory'?[
        {id:'wood',name:'Drvo za kamp',effect:'+9 drveta za gradnju'},
        {id:'stone',name:'Kamen za zaklon',effect:'+3 kamena za obnovu'},
        {id:'gold',name:'Zlato iz zaliha',effect:'+18 zlata',reason:'Zaliha zlata je nedostupna u ovoj probi.'}
      ]:[]
    };
  }
  async function submit({type,resultId,rewardId}){
    if(!current||current.id!==resultId||current.finished)return {ok:false,reason:'Rezime vise nije aktivan.'};
    if(type==='claimReward'){
      const reward=current.rewards.find(r=>r.id===rewardId);
      if(current.claimed||!reward||reward.reason)return {ok:false,reason:reward?.reason||'Izbor vise nije dostupan.'};
      current.claimed=rewardId;
    }else if(type==='nextEncounter'&&current.kind==='victory'&&current.claimed) {
      current.finished=true;
    }else if(type==='loadCheckpoint'&&current.kind==='defeat'){
      current.finished=true;
    }else return {ok:false,reason:'Najpre izaberi dostupnu nagradu.'};
    submissions++;return {ok:true};
  }
  return {open,get:()=>copy(current),submit,count:()=>submissions};
};
window.RavanOutcomePanel=function mountOutcome(ui,port){
  const {$,button,text,screens,viewer,copy,scene,reset}=ui;
  let selected=null, busy=false, notice='';
  function show(kind) {
    port.open(kind);
    selected=null;notice='';busy=false;
    screens.open('outcome');
  }
  function draw(root){
    const model=port.get();
    root.textContent='';
    const title=text('h1',model.title);title.tabIndex=-1;
    root.append(text('p',model.kind==='victory'?'Pobeda':'Poraz','result-kind'),title,text('p',model.summary,'screen-desc'));
    const panel=text('section','','paper outcome-paper');
    if(model.kind==='victory'){
      panel.append(text('h2',model.claimed?'Izabrana nagrada':'Izaberi jednu nagradu'));
      const rewards=text('div','','builds reward-list');
      for(const r of model.rewards){
        const el=button('',()=>{selected=r.id;notice='';draw(root)},{className:'build',disabled:!!model.claimed || !!r.reason || busy});
        el.dataset.reward=r.id;el.setAttribute('aria-pressed',String((model.claimed||selected)===r.id));
        el.append(text('strong',r.name),text('span',r.effect));
        if(r.reason)el.append(text('small',r.reason));
        rewards.append(el);
      }
      panel.append(rewards);
      panel.append(model.claimed
        ? button('Sledeci susret',()=>send(root,'nextEncounter'),{className:'primary',id:'next-encounter',disabled:busy})
        : button('Potvrdi nagradu',()=>send(root,'claimReward'),{className:'primary',id:'claim-reward',disabled:!selected||busy}));
    }else {
      panel.append(text('h2','Checkpoint · Kameni prolaz'),text('p','Vraca pocetno stanje susreta.','screen-desc'),
        button('Vrati se na checkpoint',()=>send(root,'loadCheckpoint'),{id:'checkpoint',className:'primary',disabled:busy}));
    }
    const feedback=text('p',notice,'screen-desc');feedback.setAttribute('role','status');
    panel.append(feedback);root.append(panel);
  }
  async function send(root,type){
    if(busy)return;
    busy=true;
    const resultId=port.get().id;
    let response;
    try {response=await port.submit({type,resultId,rewardId:selected});}
    catch {response={ok:false,reason:'Odgovor trenutno nije dostupan.'};}
    if(port.get().id!==resultId)return;
    busy=false;
    if(!response.ok){notice=response.reason;if(screens.get()==='outcome')draw(root);return;}
    if(type==='claimReward'){
      notice='Izbor prihvacen u probi.'; if(screens.get()==='outcome')draw(root); return;
    }
    const next=copy(scene);
    if(type==='nextEncounter'){
      Object.assign(next.units[3],{name:'Divlja zver',x:4,y:4,hp:37,hpMax:37});
      $('arena-title').textContent='Patrola doline';
      $('objective').textContent='Cilj · Savladaj Divlju zver.';
    }else{
      $('arena-title').textContent='Kameni prolaz';
      $('objective').textContent='Cilj · Savladaj Tihog lovca.';
    }
    reset(next);screens.open('battle');
  }
  screens.register('outcome','Rezime',draw,{hidden:true});
  ui.onPlaybackComplete=show;
  $('detail-actions').append(button('Probni poraz',()=>show('defeat'),{id:'trial-defeat'}));
  return {show};
};
