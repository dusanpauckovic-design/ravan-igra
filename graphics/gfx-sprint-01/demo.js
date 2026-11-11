(function () {
  const $ = id => document.getElementById(id);
  const canvas = $('arena');
  const scene = {
    width: 9, height: 6,
    units: [
      { id: 'a_radan', name: 'Radan', role: 'Zastitnik', team: 'ally', sprite: 'figure_guard', x: 3, y: 3, hp: 78, hpMax: 78 },
      { id: 'a_iva', name: 'Iva', role: 'Izvidjac', team: 'ally', sprite: 'figure_archer', x: 2, y: 2, hp: 61, hpMax: 61 },
      { id: 'a_merin', name: 'Merin', role: 'Ucenjak', team: 'ally', sprite: 'figure_caster', x: 3, y: 4, hp: 60, hpMax: 60 },
      { id: 'e_0', name: 'Tihi lovac', role: 'Protivnik', team: 'enemy', sprite: 'figure_wolf', x: 4, y: 3, hp: 58, hpMax: 58 }
    ],
    covers: [0, 1, 2, 4, 5].map(y => ({ x: 5, y })).concat([{ id: 'zaklon', x: 5, y: 3, hp: 18, hpMax: 18 }])
  };
  const viewer = RavanGraphics.createRenderer(canvas, ART, updateRoster);
  let selected = null, flat = false, behind = false;
  const melee = { id: 'probe/melee', type: 'melee', actor: 'a_radan', target: 'e_0', path: [], result: {} };

  function updateRoster(state) {
    const roster = $('roster');
    roster.textContent = '';
    roster.append(...state.units.map(u => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'unit';
      button.setAttribute('aria-pressed', u.id === selected);
      const image = document.createElement('img');
      image.src = ART[u.sprite]; image.alt = '';
      const info = document.createElement('span');
      const name = document.createElement('strong'); name.textContent = u.name;
      const role = document.createElement('small'); role.textContent = u.role;
      info.append(name, role);
      const hp = document.createElement('output'); hp.textContent = u.hp + '/' + u.hpMax;
      button.append(image, info, hp);
      button.onclick = () => select(u.id);
      return button;
    }));
  }
  function select(id) {
    selected = id; viewer.select(id);
    const unit = viewer.getSnapshot().units.find(u => u.id === id);
    if (unit) $('message').textContent = unit.name + ' · ' + unit.role;
    for (const [i, b] of [...$('roster').children].entries()) b.setAttribute('aria-pressed', viewer.getSnapshot().units[i].id === selected);
  }
  function reset() {
    behind = false; selected = null; viewer.reset(scene); select('a_radan');
    $('hex').textContent = 'Hex —';
  }
  function bind(label, action, primary = false) {
    const b = document.createElement('button'); b.type = 'button';
    b.textContent = label; b.onclick = action;
    if (primary) b.className = 'primary';
    $('actions').append(b); return b;
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return viewer.hitTest((event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height);
  }
  canvas.onpointermove = event => {
    const cell = point(event); viewer.hover(cell);
    $('hex').textContent = cell ? 'Hex ' + cell.x + ', ' + cell.y : 'Hex —';
  };
  canvas.onpointerleave = () => { viewer.hover(null); $('hex').textContent = 'Hex —'; };
  canvas.onclick = event => {
    const cell = point(event);
    const unit = viewer.getSnapshot().units.find(u => cell && u.hp > 0 && u.x === cell.x && u.y === cell.y);
    if (unit) select(unit.id);
  };
  $('view').onclick = () => {
    flat = !flat; viewer.setMode(flat ? 'flat' : 'angled');
    $('view').setAttribute('aria-pressed', flat);
    $('view').textContent = flat ? 'Prikazi 2.5D' : 'Prikazi 2D osnovu';
  };
  async function attack() {
    reset();
    $('message').textContent = 'Radan zamahuje.';
    if (await viewer.playEvent(melee) === 'complete') $('message').textContent = 'Radan se vratio u stav.';
  }
  function toggleCover() {
    const changed = JSON.parse(JSON.stringify(scene));
    changed.covers = changed.covers.filter(c => c.id || ![2, 4].includes(c.y));
    behind = !behind;
    Object.assign(changed.units[0], { x: 5, y: behind ? 2 : 4 });
    viewer.reset(changed);
    select('a_radan');
    $('message').textContent = behind ? 'Radan je iza zaklona.' : 'Radan je ispred zaklona.';
  }
  const walks = {
    'Prava putanja': [{x:2,y:3}, {x:1,y:3}, {x:0,y:3}],
    'Obilazak': [{x:3,y:2}, {x:3,y:1}, {x:4,y:1}, {x:4,y:0}],
    'Promena smera': [{x:2,y:3}, {x:2,y:2}, {x:1,y:2}, {x:0,y:3}]
  };
  async function walk(label) {
    reset();
    $('message').textContent = label + ' · Radan se krece.';
    const outcome = await viewer.playEvent({ id: 'walk/' + label, type: 'move', actor: 'a_radan', path: walks[label], result: {} });
    if (outcome === 'complete') $('message').textContent = label + ' · Radan je stao.';
    return outcome;
  }
  function setSpeed(speed) {
    viewer.setSpeed(speed);
    $('speed').value = String(speed);
  }
  async function qa(stage, check, sleep) {
    toggleCover();
    let order = viewer.getDrawOrder();
    check('Radan behind cover', order.indexOf('a_radan') < order.indexOf('zaklon'));
    toggleCover();
    order = viewer.getDrawOrder();
    check('Radan in front of cover', order.indexOf('a_radan') > order.indexOf('zaklon'));
    const picked = $('roster').children[0];
    check('selected Radan and HP stay readable', picked.getAttribute('aria-pressed') === 'true' && picked.textContent.includes('78/78'));
    setSpeed(2);
    for (const [label, path] of Object.entries(walks)) {
      const outcome = await walk(label);
      const end = path[path.length - 1], unit = viewer.getSnapshot().units[0];
      check(label + ' ends at supplied hex', outcome === 'complete' && unit.x === end.x && unit.y === end.y);
    }
    const old = walk('Obilazak');
    await sleep(125); reset();
    check('reset cancels in-flight walk', await old === 'cancelled');
    await sleep(250);
    check('cancelled frames cannot move Radan later', viewer.getSnapshot().units[0].x === scene.units[0].x && viewer.getSnapshot().units[0].y === scene.units[0].y);
    check('movement replays after reset', await walk('Promena smera') === 'complete');
    setSpeed(1);
  }
  function showcase() {
    viewer.setSpeed(.45);
    walk('Promena smera');
  }
  bind('Napad', attack, true);
  bind('Ponovi', attack);
  bind('Ispred/iza zaklona', toggleCover).classList.add('wide');
  Object.keys(walks).forEach(label => bind(label, () => walk(label)));
  bind('Reset', reset);
  const speedLabel = document.createElement('label');
  speedLabel.className = 'option wide';
  speedLabel.append('Brzina ');
  const speed = document.createElement('select');
  speed.id = 'speed';
  speed.append(new Option('Normalno', '1'), new Option('Brzo ×2', '2'));
  speed.onchange = () => viewer.setSpeed(Number(speed.value));
  speedLabel.append(speed); $('actions').append(speedLabel);
  reset();
  window.ravanDemo = { viewer, scene, reset, qa, toggleCover, showcase };
})();
