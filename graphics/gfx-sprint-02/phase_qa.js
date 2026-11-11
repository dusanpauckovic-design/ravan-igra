window.runPhaseQA=async function(stage,check){
  const ui=window.ravanSprint,$=ui.$;
  await ui.viewer.ready;
  const tap=s=>{const b=document.querySelector(s);if(!b)throw Error('Nedostaje '+s);b.click();};
  const choose=(id)=>tap('[data-option="'+id+'"]');
  const name=value=>{$('creator-name').value=value;$('creator-name').dispatchEvent(new Event('input'));};
  const fill=(mode)=>{
    tap('#opening-new');tap('#creator-next');
    check('prazan identitet objasnjen',document.querySelector('#screen [role=status]').textContent.includes('ime'));
    name('Sava Dugo Ime Putnika');choose('figure_archer');tap('#creator-next');
    choose(stage>=5?'mason':'field');tap('#creator-back');check('nazad cuva ime i izgled',$('creator-name').value.includes('Sava')&&document.querySelector('[data-option=figure_archer]').getAttribute('aria-pressed')==='true');
    tap('#creator-next');tap('#creator-next');
    for(let i=0;i<(stage>=5?2:3);i++)tap('.attribute:first-child button:last-child');
    for(let i=0;i<2;i++)tap('.attribute:nth-child(2) button:last-child');
    choose(stage>=5?'steady':'eye');choose(stage>=5?'fragile':'rest');
    check('talenat, slabost i budzet su vidljivi',ui.characterPort.get().remaining===0 && document.querySelectorAll('[data-option]').length===10);
    tap('#creator-next');choose('marksmanship');choose(stage>=5?'leather':'bow');tap('#creator-next');tap('[data-mode='+mode+']');tap('#creator-next');
    if(mode==='story'){check('dijalog se moze preskociti',!!$('skip-talk'));tap('#skip-talk');}
    check('znacajan izbor nije preskocen',!!$('route-river')&&!ui.characterPort.get().hero.route);
    tap('#route-river');check('potvrda cuva izabrani put',ui.characterPort.get().hero.route==='river');
  };
  check('nova igra, nastavak i arena su odvojeni',!!$('opening-new')&&$('opening-resume').disabled&&!!$('opening-enter'));
  fill('skip');
  tap('[data-screen=opening]');fill('story');
  check('desktop nema horizontalni overflow',document.documentElement.scrollWidth<=innerWidth);
  if(stage===1){tap('[data-screen=opening]');tap('#opening-new');name('Sava');choose('figure_archer');return;}
  tap('[data-screen=sheet]');
  check('list zadrzava dugo ime, nula poena i zakljucan tier',$('screen').textContent.includes('Sava Dugo Ime Putnika') && $('screen').textContent.includes('0 poena') && $('screen').textContent.includes('jos nije otkljucan'));
  check('oprema prikazuje probno poredjenje napada',$('screen').textContent.includes((stage>=5?'14 → 16':'15 → 17')));
  tap('.sheet-stat summary');
  check('otvoreni breakdown pokazuje poreklo bonusa',document.querySelector('.sheet-stat').open && $('screen').textContent.includes(stage>=5?'Izdrzljivost +6':'Snaga +6'));
  tap('[data-sheet=a_radan]');
  check('saborac prikazuje trajan rang i aktivan status',$('screen').textContent.includes('Rang saborca je stalan') && $('screen').textContent.includes('Ranjen'));
  tap('[data-sheet=hero]');
  if(stage<3)return;
  tap('[data-screen=inventory]');
  const settle=()=>new Promise(r=>setTimeout(r,90));
  tap('[data-item=iron-knife]');tap('#item-equip');await settle();
  check('opremanje menja slot jednom',ui.inventoryPort.get().items.find(x=>x.equipped==='weapon').id==='iron-knife');
  tap('[data-item=iron-knife]');tap('#item-favorite');await settle();
  check('omiljeni status je sacuvan',ui.inventoryPort.get().items.find(x=>x.id==='iron-knife').favorite);
  tap('[data-item=heavy-axe]');check('neispunjeni zahtev je vidljiv',$('item-equip').disabled&&$('screen').textContent.includes('Potrebna Snaga'));
  $('inventory-search').value='zavoj';$('inventory-search').dispatchEvent(new Event('input'));
  check('pretraga filtrira stavke',document.querySelectorAll('[data-item]').length===1);
  tap('#item-use');tap('#item-cancel');await settle();check('otkaz cuva stack',ui.inventoryPort.get().items.find(x=>x.id==='bandage').quantity===2);
  tap('#item-use');tap('#item-confirm');await settle();
  check('koriscenje trosi jedan primerak',ui.inventoryPort.get().items.find(x=>x.id==='bandage').quantity===1);
  tap('#inventory-shop');tap('[data-item=chain-coat]');
  check('skupa roba prikazuje razlog',$('item-buy').disabled&&$('screen').textContent.includes('Nedovoljno zlata'));
  tap('[data-item=light-coat]');tap('#item-buy');const confirm=$('item-confirm');confirm.click();confirm.click();await settle();
  check('dvoklik kupuje samo jednom',ui.inventoryPort.get().gold===6&&ui.inventoryPort.get().items.filter(x=>x.id==='light-coat').length===1);
  tap('#inventory-loot');check('puna torba blokira plen',$('item-loot').disabled&&$('screen').textContent.includes('Torba je puna'));
  tap('#inventory-bag');tap('[data-item=bandage]');tap('#item-sell');tap('#item-confirm');await settle();
  tap('#inventory-loot');tap('#item-loot');await settle();
  check('prodaja oslobadja mesto za plen',ui.inventoryPort.get().items.some(x=>x.id==='resin')&&ui.inventoryPort.get().gold===8);
  tap('#inventory-bag');tap('[data-item=iron-knife]');
  if(stage<4)return;
  tap('[data-screen=camp]');
  tap('#camp-prepare');check('priprema trosi jednu zalihu i zakljucava ponavljanje',ui.worldPort.get().supplies===2&&$('camp-prepare').disabled);
  tap('#camp-rest');check('odmor menja stanje kampa',ui.worldPort.get().rested);
  tap('#camp-map');
  check('neotkriven prolaz nije dostupan',document.querySelector('[data-location=pass]').disabled);
  tap('[data-location=river]');
  check('brzi put ima razlog pre prve posete',$('world-fast').disabled&&$('screen').textContent.includes('prvom posetom'));
  tap('#world-travel');tap('#world-activity');
  check('putovanje otkriva prolaz i aktivnost daje zalihe',ui.worldPort.get().current==='river'&&ui.worldPort.get().supplies===4&&!document.querySelector('[data-location=pass]').disabled);
  tap('[data-location=camp]');tap('#world-fast');
  check('brzi povratak radi nakon posete',ui.worldPort.get().current==='camp'&&$('screen').textContent.includes('Ovde si'));
  if(stage<5)return;
  tap('[data-screen=inventory]');tap('[data-item=iron-knife]');tap('#screen-back');
  check('Nazad vraca mapu sa prethodnom selekcijom',ui.screens.get()==='map'&&document.querySelector('[data-location=camp]').getAttribute('aria-pressed')==='true');
  tap('[data-screen=inventory]');
  check('povratak cuva odabrani predmet',document.querySelector('[data-item=iron-knife]').getAttribute('aria-pressed')==='true');
  tap('#inventory-search');$('inventory-search').value='ne postoji';$('inventory-search').dispatchEvent(new Event('input'));
  check('prazna pretraga ima objasnjenje',$('screen').textContent.includes('Nema predmeta'));
  tap('[data-screen=camp]');
  if(stage>=6){
    ui.startEncounter();
    const board=$('arena').getBoundingClientRect(), dock=$('battle-dock').getBoundingClientRect();
    check('tabla puni viewport i zaglavlje je sklonjeno',board.width===innerWidth&&board.height===innerHeight&&document.querySelector('.mast').getBoundingClientRect().height===0);
    const verify=()=>{
      const state=ui.viewer.getSnapshot();
      for(let y=0;y<state.height;y++)for(let x=0;x<state.width;x++){
        const p=ui.viewer.boardToClient(ui.viewer.project({x,y}));
        const boardPoint=ui.viewer.clientToBoard(p.x,p.y), c=ui.viewer.hitTest(boardPoint.x,boardPoint.y);
        if(!c||c.x!==x||c.y!==y||p.y>=$('battle-dock').getBoundingClientRect().top)return false;
      }
      return true;
    };
    check('svaki heks je dostupan iznad trake',verify());
    $('view').click();check('2D i 2.5D imaju tacan hit-test',verify());$('view').click();
    $('move').click();
    let p=ui.viewer.boardToClient(ui.viewer.project({x:4,y:4}));
    $('arena').dispatchEvent(new MouseEvent('click',{clientX:p.x,clientY:p.y}));
    check('pregled prikazuje putanju bez kretanja',ui.viewer.getSnapshot().units[0].y===3&&$('confirm').textContent==='Potvrdi kretanje'&&ui.viewer.getTargeting().path.length===1);
    check('otvoren preview ne pokriva heksove',verify());
    $('cancel-action').click();
    $('battle-details').click();$('battle-settings').click();
    check('jedan panel prikazuje samo izabrani sadrzaj',$('drawer-inspect').hidden&&!$('detail-actions').hidden);
    $('drawer-close').click();
    $('battle-sheet').click();
    // Return to the campaign setup for the native-click path.
    ui.screens.open('camp');
  }
  window.__trusted=0;window.__trustedEnter=0;
  document.addEventListener('click',e=>{if(e.isTrusted)window.__trusted++;},true);
  document.addEventListener('keydown',e=>{if(e.isTrusted&&e.key==='Enter')window.__trustedEnter++;},true);
};
