(() => {
  'use strict';
  const stage = document.getElementById('stage');
  const controls = document.querySelector('.review');
  let screen = 'menu';
  let look = 'ember';
  let intro = false;
  let setting = false;
  let action = 'attack';
  let target = false;
  let enemy = false;
  let details = false;
  let project = 'hearth';
  const built = new Set();
  let rested = false;
  let depart = false;

  function grid() {
    const cells = [];
    const corners = [[-42,0],[-21,-24],[21,-24],[42,0],[21,24],[-21,24]];
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 10; col++) {
        const x = 142 + col * 63;
        const y = 25 + row * 48 + col % 2 * 24;
        const selected = row === 3 && col === 7 && target;
        const reach = action === 'move' && col > 1 && col < 5 && row > 2;
        const points = corners.map(([dx,dy]) => {
          const depth = y + dy;
          return [425 + (x+dx-425)*(.59+depth*.00165), depth].join(',');
        });
        cells.push('<polygon class="'+(selected?'target':reach?'reach':'')+'" points="'+points.join(' ')+'"/>');
      }
    }
    return '<svg class="board" viewBox="0 0 850 320" preserveAspectRatio="none" aria-hidden="true">'+cells.join('')+'</svg>';
  }

  function menu() {
    return '<section class="frame cover'+(intro?' intro':'')+'"><div class="coverArt"><div class="coverPanel">'+
      (intro?'<h1>Na ivici doline</h1><p class="subtitle">Staza vodi prema prevoju.</p><div class="row"><button data-do="menu">Nazad</button><button data-do="enter" class="primary">Preskoci uvod</button></div>':
      '<h1>Ravan</h1><p class="subtitle">Secanja prve doline</p><div class="row"><button data-do="intro" class="primary">Nova igra</button><button data-do="enter">Nastavi igru</button></div>')+
      '</div></div><footer><div class="row">'+
      (setting?'<span>Predlog kontrola za muziku uvoda.</span><button data-do="settings">Zatvori</button>':'<button data-do="settings">Podesavanja</button>')+
      '</div></footer></section>';
  }

  function battle() {
    const actions = [['move','Kretanje'],['attack','Napad'],['guard','Gard'],['wait','Preskoci potez']];
    return '<section class="frame"><header><div><h1>Put do zaklona</h1><p>Pobedi sve neprijatelje.</p></div><div>'+
      (enemy?'<strong class="danger">Protivnik je na potezu</strong>':'<strong>Tvoj potez · Putnica</strong>')+
      '<p>Runda 1 · Sledeca: Divlja zver</p></div><button data-do="menu">Nazad</button></header>'+
      '<div class="field">'+grid()+
      '<div class="figure guard"><img src="__GUARD__" alt=""><span>Radan</span></div>'+
      '<div class="figure hero"><img src="__HERO__" alt=""><span>Putnica</span></div>'+
      '<div class="figure beast"><img src="__WOLF__" alt=""><span>Divlja zver</span></div>'+
      '<div class="figure other"><img src="__WOLF__" alt=""></div>'+
      '<button class="target-button" aria-label="Izaberi metu Divlja zver" data-do="target" '+(enemy?'disabled':'')+'></button>'+
      (details?'<aside class="context"><h2>Tehnike i detalji</h2><p>Potisak · pregled tehnike</p><p>Dnevnik borbe</p><button data-do="details">Zatvori</button></aside>':'')+
      '</div><footer><div><strong>Putnica · 77 HP</strong><p>'+(enemy?'Komande se otkljucavaju na tvom potezu.':target?'Meta · Divlja zver':action==='attack'?'Izaberi protivnika na bojistu.':action==='move'?'Izaberi polje kretanja.':action==='guard'?'Potvrdi gard.':'Potvrdi preskakanje poteza.')+
      '</p></div><div class="row">'+actions.map(([id,label])=>'<button data-do="'+id+'" aria-pressed="'+(action===id)+'" '+(enemy?'disabled':'')+'>'+label+'</button>').join('')+
      '<button data-do="details">Detalji</button><button data-do="confirm" class="primary" '+(enemy||action==='attack'&&!target?'disabled':'')+'>Potvrdi</button></div></footer></section>';
  }

  function camp() {
    const hearth = project === 'hearth';
    const name = hearth?'Ognjiste':'Radionica';
    return '<section class="frame"><header><div><h1>Kamp uz stazu</h1><p>'+ (rested?'Druzina odmorna.':'Pripremi se za put.')+'</p></div><strong>Gradja '+(40-built.size*9)+' · Kamen '+(25-built.size*4)+'</strong><button data-do="menu">Nazad</button></header>'+
      '<div class="camp"><div class="campScene'+(built.has('hearth')?' upgraded-hearth':'')+(built.has('tools')?' upgraded-tools':'')+'"><button class="hearth" data-do="hearth" aria-pressed="'+hearth+'">Ognjiste</button><button class="work" data-do="tools" aria-pressed="'+!hearth+'">Radionica</button></div>'+
      '<aside class="campDetail"><h2>'+name+'</h2>'+
      (built.has(project)?'<p>Nadogradnja je zavrsena.</p>':'<p>'+(hearth?'Odmor donosi i jednu oblogu kada ima mesta.':'Unapredjenje oruzja i oklopa trosi 4 zlata manje.')+'</p><p><strong>9 gradje · 4 kamena</strong></p><button data-do="upgrade" class="primary">Uredi '+name.toLowerCase()+'</button>')+
      '</aside></div><footer><div><strong>Spremnost druzine</strong><p>'+(depart?'Otvori mapu u igrivom E8 pregledu.':rested?'Odmorna':'Odmor kosta 2 zlata.')+'</p></div><div class="row"><button data-do="rest" '+(rested?'disabled':'')+'>Odmori druzinu</button><button data-do="depart" class="primary">Otvori mapu</button></div></footer></section>';
  }

  function render() {
    stage.dataset.look = look;
    for (const button of controls.querySelectorAll('button')) {
      const selected = button.dataset.look===look||button.dataset.screen===screen;
      button.setAttribute('aria-pressed', String(selected));
    }
    if (look === 'original') {
      const iframe = document.createElement('iframe');
      iframe.className = 'ref';
      iframe.title = 'Spojeni E8 prikaz za poredjenje';
      iframe.setAttribute('sandbox', 'allow-scripts');
      const base = JSON.parse(document.getElementById('ref-template').textContent);
      iframe.srcdoc = base.replace('__REF_SCENE__', screen);
      stage.replaceChildren(iframe);
    } else stage.innerHTML = {menu,battle,camp}[screen]();
  }

  controls.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    screen = button.dataset.screen || screen;
    look = button.dataset.look || look;
    render();
  });

  stage.addEventListener('click', event => {
    const key = event.target.closest('[data-do]')?.dataset.do;
    if (!key) return;
    if (key==='menu') {screen='menu';intro=false;}
    if (key==='intro') intro=true;
    if (key==='enter') screen='camp';
    if (key==='depart') depart=true;
    if (key==='settings') setting=!setting;
    if (key==='details') details=!details;
    if (key==='rest') rested=true;
    if (['hearth','tools'].includes(key)) project=key;
    if (key==='upgrade') built.add(project);
    if (['attack','move','guard','wait'].includes(key)) {action=key;target=false;}
    if (key==='target'&&action==='attack') target=true;
    if (key==='confirm') {
      enemy=true; target=false;
      window.setTimeout(() => {enemy=false;if (screen==='battle'&&look!=='original') render();},2400);
    }
    render();
  });

  render();
})();
