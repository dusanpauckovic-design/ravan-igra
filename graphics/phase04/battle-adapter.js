/* Read-only mapper for committed RV-03 battle data. */
(function (root) {
  'use strict';
  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const hex = p => ({ x: p.x, y: p.y });
  const same = (a, b) => !!a && !!b && a.x === b.x && a.y === b.y;
  const heroes = { radan: 'figure_guard', branik: 'figure_guard', iva: 'figure_archer',
    merin: 'figure_caster', apo: 'figure_caster' };
  const beasts = new Set(['wolf', 'hound', 'stalker', 'beast', 'wounded']);
  const enemySprites={bow:'figure_archer',scout:'figure_archer',seer:'figure_caster'};
  const labels = {
    move: 'Kretanje', push: 'Odgurivanje', melee: 'Bliski napad', ranged: 'Daljinski napad',
    trailPlace: 'Postavljanje traga', trailHit: 'Aktivacija traga', mark: 'Oznaka',
    markEnd: 'Istek ili potrosnja oznake', cover: 'Zaklon', sync: 'Rezultat akcije',
    prepare:'Priprema', release:'Najavljeni udar', interrupt:'Prekinuta priprema'
  };

  const identitySprites = { hero:'figure_hero', hero_alt:'figure_scout' };
  function mainIdentity(unit) {
    const identity = unit.identity;
    if (unit.heroId === 'main' && identity?.version === 1 &&
        Object.prototype.hasOwnProperty.call(identitySprites, identity.portrait) &&
        ['earth','forest','stone'].includes(identity.palette)) return clone(identity);
    return null;
  }

  function snapshot(battle, { width = 11, height = 7, pickSprite } = {}) {
    return {
      width, height, biome:battle.generated?.biome, approach:battle.generated?.approach,
      terrain:(battle.terrain?.mud||[]).map(cell=>({...hex(cell),kind:'mud'})), active: battle.current || null,
      units: battle.units.map(unit => {
        const identity = mainIdentity(unit);
        return {
          ...hex(unit), id: unit.id, name: unit.name, role: unit.role || '', team: unit.team,
          kind:unit.kind, elite:!!unit.elite, guarding:!!unit.guarding,
          hp: unit.hp, hpMax: unit.hpMax, mark: clone(unit.mark) || null,
          ...(identity && {identity}),
          ...(battle.generated?.approach && {tactical:unit.intent?.length?'prepare':unit.aiPhase==='interrupted'?'interrupt':null}),
          sprite: pickSprite?.(unit) || (identity && identitySprites[identity.portrait]) || heroes[unit.heroId] || (unit.team==='enemy'&&enemySprites[unit.kind]) || (beasts.has(unit.kind) ? 'figure_wolf' : 'figure_guard')
        };
      }),
      covers: battle.obstacles.map(cover => ({ ...hex(cover), id: cover.id, hp: cover.hp, hpMax: cover.hpMax })),
      trails: clone(battle.trails || []),
      danger: battle.units.flatMap(u => (Array.isArray(u.intent) ? u.intent : u.intent?.cells || [])).filter(p => Number.isInteger(p.x) && Number.isInteger(p.y)).map(hex)
    };
  }

  function sameMark(a, b) {
    return (a?.by || null) === (b?.by || null) && (a?.until ?? null) === (b?.until ?? null);
  }

  function visualEvents(visuals) {
    const events = [];
    for (let i = 0; i < visuals.length; i++) {
      const v = visuals[i];
      if (v.type === 'move') {
        // A receipt lists the whole move before its trail activations. Split
        // the path at contiguous trail events so an intermediate hex fires in place.
        const path = (v.path || []).map(hex);
        let from = clone(v.from), offset = 0;
        const appendMove = end => {
          if (end === offset) return;
          events.push({ type:'move', actor:v.actor, from, path:path.slice(offset, end) });
          from = path[end - 1]; offset = end;
        };
        while (visuals[i + 1]?.type === 'trail' && visuals[i + 1].target === v.actor) {
          const trail = visuals[i + 1];
          const index = path.findIndex((p, j) => j >= offset && same(p, trail.at));
          if (index < 0) break;
          appendMove(index + 1);
          events.push({ type:'trailHit', actor:trail.by, target:trail.target, at:hex(trail.at) });
          i++;
        }
        appendMove(path.length);
      } else if (v.type === 'attack') {
        events.push({ type:v.ranged ? 'ranged' : 'melee', actor:v.actor, target:v.target, at:clone(v.at), outcome:v.outcome });
      } else if (v.type === 'push') {
        events.push({ type:'push', actor:v.actor, target:v.target, from:clone(v.from), path:[hex(v.to)] });
      } else if (v.type === 'trail') {
        events.push({ type:'trailHit', actor:v.by, target:v.target, at:hex(v.at) });
      } else if (v.type === 'markSpent') {
        events.push({ type:'markEnd', actor:v.actor, target:v.target,
          result:{ marks:[{id:v.target,mark:null}] } });
      } else if (['prepare','release','interrupt'].includes(v.type)) {
        events.push({type:v.type,actor:v.actor,target:v.target,cells:(v.cells||[]).map(hex)});
      } else if (v.type === 'cover') {
        events.push({ type:'cover', at:hex(v.at) });
      }
    }
    return events;
  }

  function mapReceipt(battleId, beforeBattle, afterBattle, receipt, options) {
    if (typeof battleId !== 'string' || !battleId || !Number.isInteger(receipt?.seq) ||
        (afterBattle.revision !== undefined && receipt.seq !== afterBattle.revision)) {
      throw new TypeError('Pass an identified battle and its latest committed RV-03 receipt.');
    }
    const before = snapshot(beforeBattle, options), after = snapshot(afterBattle, options);
    const events = visualEvents(receipt.visuals || []);
    const oldUnits = new Map(before.units.map(u => [u.id, u]));
    const oldTrails = before.trails;
    const append = (event, field, value) => {
      const result = event.result ||= {};
      (result[field] ||= []).push(value);
    };

    const tactical = [...events].reverse().find(event=>['prepare','release','interrupt'].includes(event.type));
    if(tactical){
      tactical.result={danger:after.danger,tactical:after.units.map(unit=>({id:unit.id,status:unit.tactical}))};
    }

    for (const unit of after.units) {
      const old = oldUnits.get(unit.id);
      if (!old || sameMark(old.mark, unit.mark)) continue;
      const existing = events.find(e => e.type === 'markEnd' && e.target === unit.id);
      if (!existing) {
        const event = unit.mark ?
          { type:'mark', actor:unit.mark.by, target:unit.id } :
          { type:'markEnd', target:unit.id };
        if (unit.mark) events.unshift(event); else events.push(event);
        append(event, 'marks', { id:unit.id, mark:unit.mark });
      }
    }

    for (const trail of after.trails.filter(t => !oldTrails.some(old => same(old, t)))) {
      events.unshift({ type:'trailPlace', actor:trail.by, at:hex(trail) });
    }
    let trailState = clone(oldTrails);
    for (const event of events) {
      if (event.type === 'trailPlace') {
        trailState.push(after.trails.find(t => same(t, event.at)));
      } else if (event.type === 'trailHit') {
        trailState = trailState.filter(t => !same(t, event.at));
      } else {
        continue;
      }
      (event.result ||= {}).trails = clone(trailState);
    }

    for (const old of before.covers.filter(c => c.id && c.hpMax > 0)) {
      const current = after.covers.find(c => c.id === old.id);
      const hp = current?.hp ?? 0;
      if (hp === old.hp) continue;
      let event = events.find(e => e.type === 'cover' && same(e.at, old));
      if (!event && hp > 0) event = events.find(e => (e.type === 'ranged' || e.type === 'melee') && same(e.at, old));
      if (!event) {
        event = { type:'cover', at:hex(old) };
        events.push(event);
      }
      append(event, 'covers', { id:old.id, hp });
    }

    for (const change of receipt.changes || []) {
      if (!change.delta) continue;
      // Receipt HP is aggregate. Apply it once at the last matching damage
      // event instead of inventing intermediate values for a combination.
      let event = [...events].reverse().find(e => e.target === change.id &&
        ['melee', 'ranged', 'trailHit'].includes(e.type));
      if (!event&&change.delta<0&&tactical?.type==='release'&&
          tactical.cells.some(cell=>same(cell,oldUnits.get(change.id))))event=tactical;
      if (!event && change.delta < 0 && typeof receipt.target === 'string' && receipt.target === change.id) {
        const attacker = oldUnits.get(receipt.actor), target = oldUnits.get(change.id);
        if (attacker && target && receipt.actor !== change.id) {
          const ax = attacker.x - (attacker.y - (attacker.y & 1)) / 2;
          const tx = target.x - (target.y - (target.y & 1)) / 2;
          const dy = attacker.y - target.y;
          const distance = Math.max(Math.abs(ax - tx), Math.abs(dy), Math.abs(ax - tx + dy));
          event = { type:distance > 1 || receipt.action === 'bolt' ? 'ranged' : 'melee',
            actor:receipt.actor, target:change.id };
          events.push(event);
        }
      }
      if (!event) {
        event = change.delta>0 ? {type:'heal',target:change.id,duration:440} : {type:'sync',duration:1};
        events.push(event);
      }
      append(event, 'hp', { id:change.id, hp:change.after, delta:change.delta });
    }

    return {
      before, after,
      events: events.map((event, index) => ({
        ...event, guarded:!!oldUnits.get(event.target)?.guarding, id:JSON.stringify([battleId, receipt.seq, index]), path:event.path || [],
        label:labels[event.type], result:event.result || {}
      }))
    };
  }

  function createPlayback(renderer) {
    let generation = 0, applied = 0, activeBattle = null, busy = false;
    return {
      reset(id, state) {
        generation++;
        activeBattle = id;
        applied = 0; busy = false;
        renderer.reset(state);
      },
      cancel() { generation++; busy = false; renderer.cancel(); },
      async play(battleId, beforeBattle, afterBattle, receipt, options) {
        if (activeBattle !== battleId || busy || !receipt || receipt.seq <= applied) return 'ignored';
        const mapped = mapReceipt(battleId, beforeBattle, afterBattle, receipt, options);
        const stamp = generation;
        busy = true;
        try {
          renderer.reset(mapped.before);
          for (const event of mapped.events) {
            if (stamp !== generation) return 'cancelled';
            if (event.actor) renderer.setActive(event.actor);
            if (await renderer.playEvent(event) !== 'complete') return 'cancelled';
          }
          if (stamp !== generation) return 'cancelled';
          renderer.renderSnapshot(mapped.after);
          applied = receipt.seq;
          return 'complete';
        } finally {
          if (stamp === generation) busy = false;
        }
      }
    };
  }

  const api = { snapshot, mapReceipt, createPlayback };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.RavanGraphicsRV03 = api;
})(globalThis);
