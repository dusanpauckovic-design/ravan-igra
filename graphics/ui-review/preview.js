(() => {
  'use strict';
  const app = document.getElementById('app');
  const html = document.documentElement;
  let enhanced = true;
  let mapView;

  function element(tag, className, text = '') {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }

  const compare = element('button', 'rv-review-compare');
  compare.type = 'button';
  compare.setAttribute('aria-label', 'Novi izgled Ravana');
  compare.title = 'Promeni izgled (F8)';
  app.after(compare);

  const mapActions = [
    'ow-fight', 'ow-retreat', 'ow-pause', 'ow-cancel', 'ow-go',
    'ow-inspect-trace', 'ow-approach', 'ow-trace-loot', 'ow-cache',
    'world-fight', 'world-camp', 'world-interact', 'long-expedition'
  ];

  function mapContext(map, world) {
    if (world.encounter) {
      return [world.encounter.kind === 'firstTrace' ? 'Susret na Sumskom rubu' : 'Grupa ti je presekla put', 'Izaberi da li ulazis u borbu.'];
    }
    if (world.journey) {
      const heading = map.querySelector('.rv-e8-exp-goal')?.textContent;
      return [world.paused ? 'Putovanje je pauzirano' : 'Druzina je na putu', heading || 'Mozes da pauziras ili prekines put.'];
    }
    const active = map.querySelector('[data-act="ow-go"]');
    const selected = world.campaign.locations.find(location => location.id === world.selection && location.discovered);
    const expedition = map.querySelector('.rv-e8-exp-goal')?.textContent;
    const detail = selected?.reason && !active ? selected.reason :
      expedition || (active ? 'Proveri putanju i kreni.' : 'Izaberi odrediste na mapi.');
    return [selected?.name || (active ? 'Izabrano odrediste' : 'Mapa doline'), detail];
  }

  function attachMap(map) {
    if (map === mapView?.map) return;
    const world = window.RavanWorldPort.snapshot();
    if (!world) return;
    const dock = element('section', 'rv-review-map-dock');
    dock.setAttribute('aria-label', 'Trenutno stanje i radnje na mapi');
    const status = element('div', 'rv-review-map-status');
    const [title, detail] = mapContext(map, world);
    status.append(element('strong', '', title), element('small', '', detail));
    if (world.encounter) dock.dataset.encounter = 'true';
    const controls = element('div', 'rv-review-map-actions');
    for (const action of mapActions) {
      for (const button of map.querySelectorAll('button[data-act="' + action + '"]:not(:disabled)')) {
        if (action === 'long-expedition' && button.dataset.id !== 'guide') continue;
        const label = button.getAttribute('aria-label') || button.textContent.trim();
        const shortcut = element('button', '', label);
        shortcut.type = 'button';
        shortcut.dataset.reviewAction = action;
        shortcut.onclick = () => { if (button.isConnected) button.click(); };
        controls.append(shortcut);
      }
    }
    const destinations = Array.from(map.querySelectorAll('details'))
      .find(group => group.querySelector('button[data-act=ow-select]'));
    if (destinations?.querySelector('[data-act="ow-select"]')) {
      const locator = element('button', 'rv-review-locations', 'Odredista');
      locator.type = 'button';
      locator.onclick = () => {
        destinations.open = !destinations.open;
        if (destinations.open) {
          destinations.scrollIntoView({block: 'center'});
          destinations.querySelector('summary')?.focus({preventScroll: true});
        }
      };
      controls.append(locator);
    }
    dock.append(status, controls);
    map.append(dock);
    map.classList.add('rv-review-map');
    mapView = {map, dock};
  }

  function restoreMap() {
    if (!mapView) return;
    const {map, dock} = mapView;
    dock.remove();
    map.classList.remove('rv-review-map');
    mapView = undefined;
  }

  function attachBattle(view) {
    const battle = typeof state !== 'undefined' && state?.battle;
    const top = view?.querySelector('.battle-top');
    if (!battle || !top || top.querySelector('.rv-review-turn')) return;
    const actor = window.RavanCore.selectedActor(battle);
    const next = top.querySelector(':scope > span');
    const status = element('div', 'rv-review-turn');
    status.dataset.side = actor?.team || '';
    status.append(element('strong', '', battle.outcome ? 'Borba zavrsena' : actor?.team === 'ally' ? 'Tvoj potez' : 'Protivnik je na potezu'));
    if (next?.textContent) status.append(element('small', '', next.textContent));
    top.append(status);
  }

  function sync() {
    if (mapView && !mapView.map.isConnected) mapView = undefined;
    if (!enhanced) return;
    const map = app.querySelector('.rv19-map');
    if (map) attachMap(map);
    attachBattle(app.querySelector('.rv-viewport'));
  }

  function switchLook() {
    html.classList.toggle('rv-review', enhanced);
    compare.textContent = enhanced ? 'Novi izgled · F8' : 'E8 izgled · F8';
    compare.setAttribute('aria-pressed', String(enhanced));
    if (enhanced) sync();
    else restoreMap();
  }

  compare.onclick = () => { enhanced = !enhanced; switchLook(); };
  document.addEventListener('keydown', event => {
    if (event.key !== 'F8' || event.repeat || document.getElementById('modal')?.open) return;
    event.preventDefault();
    compare.click();
  });

  new MutationObserver(sync).observe(app, {childList: true, subtree: true});
  switchLook();
})();
