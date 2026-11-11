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
  let selected = null, flat = false;
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
    selected = null; viewer.reset(scene); select('a_radan');
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
  bind('Napad', attack, true);
  bind('Ponovi', attack);
  reset();
  window.ravanDemo = { viewer, scene, reset };
})();
