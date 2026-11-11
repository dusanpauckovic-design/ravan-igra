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
  let selected = null, flat = false, behind = false, sequence = 0;
  const hit = (id, hp, delta) => ({ hp: [{ id, hp, delta }] });
  const melee = { id: 'probe/melee', type: 'melee', actor: 'a_radan', target: 'e_0', path: [], result: hit('e_0', 44, -14) };
  const ranged = { id: 'probe/ranged', type: 'ranged', actor: 'a_iva', target: 'e_0', path: [], result: hit('e_0', 46, -12) };
  const finalHit = { id: 'probe/final', type: 'melee', actor: 'a_radan', target: 'e_0', path: [], result: hit('e_0', 0, -12) };

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
    sequence++; behind = false; selected = null; viewer.reset(scene); select('a_radan');
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
  async function attack(event = melee) {
    reset();
    if (event === finalHit) {
      const weakened = JSON.parse(JSON.stringify(scene));
      weakened.units.find(u => u.id === 'e_0').hp = 12;
      viewer.renderSnapshot(weakened);
    }
    select(event.actor);
    $('message').textContent = event.type === 'ranged' ? 'Iva zateze luk.' : 'Radan zamahuje.';
    const outcome = await viewer.playEvent(event);
    if (outcome === 'complete') {
      $('message').textContent = event === finalHit ? 'Tihi lovac je pao · 0 HP.' :
        event.type === 'ranged' ? 'Strela je pogodila metu.' : 'Radan se vratio u stav.';
    }
    return outcome;
  }
  function toggleCover() {
    sequence++;
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
  const at = { x: 5, y: 3 };
  const stone = { x: 5, y: 4 };
  const mark = { id: 'combo/mark', type: 'mark', actor: 'a_iva', target: 'e_0',
    result: { marks: [{ id: 'e_0', mark: { by: 'a_iva', until: 3 } }] } };
  const place = { id: 'combo/place', type: 'trailPlace', actor: 'a_merin', at,
    result: { trails: [{ ...at, by: 'a_merin', until: 3 }] } };
  const spent = { id: 'combo/spent', type: 'markEnd', actor: 'a_radan', target: 'e_0',
    result: { marks: [{ id: 'e_0', mark: null }] } };
  const push = { id: 'combo/push', type: 'push', actor: 'a_radan', target: 'e_0',
    from: { x: 4, y: 3 }, path: [at], result: {} };
  const trigger = { id: 'combo/trigger', type: 'trailHit', target: 'e_0', at,
    result: { ...hit('e_0', 35, -11), trails: [] } };
  const damageCover = { id: 'stone/hit', type: 'cover', actor: 'a_radan', at: stone,
    result: { covers: [{ id: 'zaklon', hp: 7 }] } };
  const breakCover = { id: 'stone/break', type: 'cover', actor: 'a_radan', at: stone,
    result: { covers: [{ id: 'zaklon', hp: 0 }] } };
  const comboSteps = [
    [mark, 'Iva postavlja oznaku.'], [place, 'Merin postavlja trag.'],
    [{ ...melee, id: 'combo/strike', result: hit('e_0', 46, -12) }, 'Radan pogadja oznacenu metu.'],
    [spent, 'Oznaka je potrosena.'], [push, 'Meta je odgurnuta na trag.'],
    [trigger, 'Trag se aktivira.']
  ];
  const coverSteps = [[damageCover, 'Radan udara zaklon.'], [breakCover, 'Zaklon se lomi.']];
  function magicScene() {
    const state = JSON.parse(JSON.stringify(scene));
    state.trails = [];
    state.covers = state.covers.filter(c => c.id || c.y !== stone.y);
    Object.assign(state.covers.find(c => c.id === 'zaklon'), stone);
    return state;
  }
  async function run(steps, start, done) {
    reset();
    viewer.renderSnapshot(start);
    const stamp = sequence;
    for (const [event, label] of steps) {
      if (stamp !== sequence) return 'cancelled';
      if (event.actor) select(event.actor);
      $('message').textContent = label;
      if (await viewer.playEvent(event) !== 'complete') return 'cancelled';
    }
    if (stamp !== sequence) return 'cancelled';
    $('message').textContent = done;
    return 'complete';
  }
  const combo = () => run(comboSteps, magicScene(), 'Kombinacija zavrsena · 35 HP.');
  const cover = () => run(coverSteps, magicScene(), 'Zaklon je srusen · polje je otvoreno.');

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
    if (stage < 4) return;
    const hp = () => viewer.getSnapshot().units.find(u => u.id === 'e_0').hp;
    const shot = attack(ranged);
    check('preview has no HP change', hp() === 58);
    await shot;
    check('normal projectile changes supplied target HP', hp() === 46 && viewer.getSnapshot().units[1].hp === 61);
    setSpeed(2);
    await attack(ranged);
    check('fast shot ends at same HP', hp() === 46);
    check('duplicate event is ignored', await viewer.playEvent(ranged) === 'ignored' && hp() === 46);
    const fatal = attack(finalHit);
    viewer.skip();
    check('skip applies supplied fatal result once', await fatal === 'complete' && hp() === 0);
    await attack(finalHit);
    check('fatal hit replays to same result', hp() === 0);
    if (stage >= 5) {
      check('ordered combination completes', await combo() === 'complete');
      const after = viewer.getSnapshot(), enemy = after.units.find(u => u.id === 'e_0');
      check('push ends on trail and consumes mark', enemy.x === at.x && enemy.y === at.y && !enemy.mark);
      check('trigger removes trail and displays supplied HP', after.trails.length === 0 && enemy.hp === 35);
      await cover();
      check('cover HP reaches zero and leaves draw order', viewer.getSnapshot().covers.find(c => c.id === 'zaklon').hp === 0 && !viewer.getDrawOrder().includes('zaklon'));
      const interrupted = combo();
      await sleep(110); reset();
      check('reset stops entire combination', await interrupted === 'cancelled' && !viewer.getSnapshot().units.find(u => u.id === 'e_0').mark);
    }
    setSpeed(1);
  }
  function showcase() {
    viewer.setSpeed(.82);
    combo();
  }
  bind('Napad', () => attack(), true);
  bind('Ponovi', () => attack());
  bind('Projektil', () => attack(ranged));
  bind('Zavrsni pogodak', () => attack(finalHit));
  bind('Preskoci', () => viewer.skip());
  bind('Ispred/iza zaklona', toggleCover).classList.add('wide');
  Object.keys(walks).forEach(label => bind(label, () => walk(label)));
  bind('Oznaka → trag', combo);
  bind('Rusenje zaklona', cover);
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
