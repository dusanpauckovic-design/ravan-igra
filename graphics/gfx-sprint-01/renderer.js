/* Graphics only. Coordinates use the RV-03 odd-row offset convention. */
(function (root) {
  'use strict';
  const W = 960, H = 570, R = 49, STEP = Math.sqrt(3) * R;
  const same = (a, b) => a && b && a.x === b.x && a.y === b.y;
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
  const ease = t => t * t * (3 - 2 * t);
  const TAU = Math.PI * 2;
  const SIZES = {
    figure_guard: { height: 101, foot: .48 },
    figure_archer: { height: 94, foot: .53 },
    figure_caster: { height: 99, foot: .49 },
    figure_wolf: { height: 57, foot: .52 }
  };
  const contactAt = event => event.type === 'ranged' ? .69 : .46;
  const attackTypes = new Set(['melee', 'ranged']);
  const copy = value => JSON.parse(JSON.stringify(value));

  function createRenderer(canvas, sources, onChange = () => {}) {
    const ctx = canvas.getContext('2d');
    const images = {};
    let state, mode = 'angled', selected = null, hovered = null, speed = 1;
    let active = null, frame = 0;
    let landscape = null;
    const seen = new Set();
    const facings = new Map();
    const ready = Promise.all(Object.entries(sources).map(([key, src]) => new Promise(resolve => {
      const img = images[key] = new Image();
      img.onload = img.onerror = resolve;
      img.src = src;
    }))).then(() => { landscape = null; if (state) draw(); });

    function world(cell) {
      return { x: (cell.x + (cell.y & 1) / 2 - (state.width - 1) / 2) * STEP, y: cell.y * R * 1.5 };
    }

    function camera(p) {
      if (mode === 'flat') {
        const s = Math.min(1, 9 / state.width, 6 / state.height);
        return { x: W / 2 + p.x * s, y: H / 2 + (p.y - (state.height - 1) * R * .75) * s };
      }
      const s = Math.min(1, 9 / state.width, 6 / state.height);
      const depth = .81 + .17 * p.y / Math.max(R, (state.height - 1) * R * 1.5);
      return { x: W / 2 + (p.x * depth + p.y * .16 - 30) * s, y: H / 2 + 5 + (p.y - (state.height - 1) * R * .75) * s * .72 };
    }

    function project(cell) { return camera(world(cell)); }

    function polygon(cell) {
      const p = world(cell);
      return Array.from({ length: 6 }, (_, i) => {
        const angle = (i * 60 + 30) * Math.PI / 180;
        return camera({ x: p.x + R * Math.cos(angle), y: p.y + R * Math.sin(angle) });
      });
    }

    function cells() {
      return Array.from({ length: state.width * state.height }, (_, i) => ({
        x: i % state.width, y: Math.floor(i / state.width)
      }));
    }

    function path(points) {
      ctx.beginPath();
      points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.closePath();
    }

    function hitTest(x, y) {
      if (!state) return null;
      return cells().find(cell => {
        const corners = polygon(cell);
        return corners.every((a, i) => {
          const b = corners[(i + 1) % 6];
          return (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x) >= -0.0001;
        });
      }) || null;
    }

    function image(key, x, y, width, height) {
      const img = images[key];
      if (img?.naturalWidth) ctx.drawImage(img, x, y, width, height);
    }

    function ellipse(x, y, rx, ry, fill, stroke) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
    }

    function background() {
      if (!landscape) {
        landscape = document.createElement('canvas');
        landscape.width = W; landscape.height = H;
        const base = landscape.getContext('2d');
        base.fillStyle = '#26332b'; base.fillRect(0, 0, W, H);
        const vista = images.battle_vista;
        if (vista?.naturalWidth) base.drawImage(vista, 0, 0, W, H);
        const layer = document.createElement('canvas');
        layer.width = W; layer.height = H;
        const ground = layer.getContext('2d');
        const img = images.battle_ground;
        if (img?.naturalWidth) {
          ground.drawImage(img, 0, 95, W, H - 95);
          ground.globalCompositeOperation = 'destination-in';
          const blend = ground.createLinearGradient(0, 114, 0, 310);
          blend.addColorStop(0, 'transparent'); blend.addColorStop(1, '#fff');
          ground.fillStyle = blend; ground.fillRect(0, 0, W, H);
          base.drawImage(layer, 0, 0);
        }
        const shade = base.createRadialGradient(490, 287, 200, 490, 287, 565);
        shade.addColorStop(0, 'rgba(26,27,15,.04)'); shade.addColorStop(1, 'rgba(8,16,13,.82)');
        base.fillStyle = shade; base.fillRect(0, 0, W, H);
      }
      ctx.drawImage(landscape, 0, 0);
    }

    function drawTile(cell) {
      const unit = state.units.find(u => u.id === selected && u.hp > 0 && same(u, cell));
      const hover = same(hovered, cell);
      path(polygon(cell));
      ctx.fillStyle = unit ? '#c2a36654' : hover ? '#ede1a346' : (cell.x + cell.y) % 3 ? '#aeb18d0e' : '#322c151e';
      ctx.fill();
      ctx.strokeStyle = unit ? '#f2d393' : hover ? '#d9cfaa' : '#d8d5ad33';
      ctx.lineWidth = unit || hover ? 2 : 1;
      ctx.stroke();
    }

    function shadow(p, rx, ry, strength = .58) {
      ctx.save();
      ctx.translate(p.x + 7, p.y + 3);
      ctx.scale(rx, ry);
      const shade = ctx.createRadialGradient(0, 0, .08, 0, 0, 1);
      shade.addColorStop(0, 'rgba(9,13,8,' + strength + ')');
      shade.addColorStop(1, 'rgba(9,13,8,0)');
      ellipse(0, 0, 1, 1, shade);
      ctx.restore();
    }

    function drawCover(cover, p, selectedPoint) {
      const softened = selectedPoint && p.y > selectedPoint.y &&
        p.y - selectedPoint.y < 63 && Math.abs(p.x - selectedPoint.x) < 56;
      shadow(p, 42, 13);
      ctx.save();
      ctx.globalAlpha = softened ? .48 : 1;
      const large = cover.hpMax > 0;
      image('terrain_rock', p.x - (large ? 48 : 33), p.y - (large ? 60 : 42),
        large ? 96 : 66, large ? 65 : 46);
      ctx.restore();
      if (large) tag(p.x + 17, p.y - 49, String(cover.hp), '#e8d1a8');
    }

    function tag(x, y, label, color) {
      ctx.font = '600 12px system-ui';
      ctx.textAlign = 'center';
      const width = ctx.measureText(label).width + 12;
      ctx.fillStyle = '#141b16e8'; ctx.fillRect(x - width / 2, y - 13, width, 17);
      ctx.fillStyle = color; ctx.fillText(label, x, y);
    }

    function eventPoints(event) {
      const actor = state.units.find(u => u.id === event.actor);
      const target = state.units.find(u => u.id === event.target) || event.at;
      return actor && target ? { from: project(actor), to: project(target) } : null;
    }

    function unitPose(unit, p, t) {
      const attack = active?.event;
      const points = attack && attackTypes.has(attack.type) && eventPoints(attack);
      let offset = 0, tilt = 0;
      let facing = facings.get(unit.id) || (unit.team === 'enemy' ? -1 : 1);
      if (points) {
        const direction = Math.sign(points.to.x - points.from.x) || facing;
        const contact = contactAt(attack);
        if (attack.actor === unit.id) {
          facing = direction;
          if (attack.type === 'melee') {
            const lunge = t < .22 ? -6 * ease(t / .22) : t < contact ?
              lerp(-6, 28, ease((t - .22) / (contact - .22))) :
              28 * (1 - ease((t - contact) / (1 - contact)));
            offset = direction * lunge;
            tilt = direction * lunge * .004;
          } else {
            tilt = direction * (t < .30 ? -.10 * Math.sin(Math.PI * t / .30) : .04 * (1 - t));
          }
        }
        if (attack.target === unit.id && t >= contact) {
          const recoil = Math.max(0, 1 - (t - contact) * 3.4);
          offset = direction * 10 * recoil;
          tilt = direction * .14 * recoil;
        }
      }
      if (unit.hp === 0) {
        const fall = points && attack.target === unit.id ? ease(Math.min(1, Math.max(0, (t - contactAt(attack)) * 3.6))) : 1;
        tilt += facing * fall * 1.32;
      }
      const profile = SIZES[unit.sprite] || SIZES.figure_guard;
      const img = images[unit.sprite];
      const height = profile.height;
      const width = img?.naturalHeight ? height * img.naturalWidth / img.naturalHeight : height * .75;
      return { x: p.x + offset, y: p.y, width, height, foot: profile.foot, facing, tilt };
    }

    function movingPose(unit, t) {
      const event = active?.event;
      if (event?.type !== 'move' || event.actor !== unit.id || !event.path?.length) return null;
      const points = [event.from || unit, ...event.path];
      const position = t * event.path.length;
      const segment = Math.min(event.path.length - 1, Math.floor(position));
      const phase = position - segment;
      const a = project(points[segment]), b = project(points[segment + 1]);
      const easing = event.path.length === 1 ? ease(phase) :
        segment === 0 ? phase * phase * (2 - phase) :
        segment === event.path.length - 1 ? 1 - (1 - phase) ** 2 * (1 + phase) : phase;
      const p = mix(a, b, easing);
      const envelope = Math.min(1, position * 5, (event.path.length - position) * 5);
      return { p, gait: Math.sin(position * TAU) * envelope,
        facing: Math.sign(b.x - a.x) || facings.get(unit.id) || 1 };
    }

    function drawSprite(unit, pose) {
      const { x, y, width, height, foot, facing = 1, gait = 0 } = pose;
      const img = images[unit.sprite];
      if (!img?.naturalWidth) return;
      const mirror = (unit.sprite === 'figure_wolf' ? -1 : 1) !== facing;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(pose.tilt || 0);
      if (unit.hp === 0) ctx.globalAlpha = .55;
      ctx.scale(mirror ? -1 : 1, 1);
      const left = -width * foot;
      if (Math.abs(gait) < .05) {
        ctx.drawImage(img, left, -height, width, height);
      } else {
        const bob = Math.abs(gait) * 2.3;
        const cut = Math.floor(img.naturalHeight * .76);
        const top = height * cut / img.naturalHeight;
        ctx.transform(1, 0, -Math.abs(gait) * .035, 1, 0, 0);
        ctx.drawImage(img, 0, 0, img.naturalWidth, cut, left, -height - bob, width, top + 1);
        const half = Math.floor(img.naturalWidth / 2);
        for (const [sx, sw, stride] of [[0, half, gait], [half, img.naturalWidth - half, -gait]]) {
          const part = img.naturalHeight - cut;
          const dx = left + width * sx / img.naturalWidth;
          ctx.drawImage(img, sx, cut, sw, part, dx + stride * 2.2, -height + top - bob,
            width * sw / img.naturalWidth + .4, height - top + bob - Math.max(0, stride) * 3);
        }
      }
      ctx.restore();
    }

    function drawUnit(unit, pose) {
      const { x, y } = pose;
      shadow({ x, y }, unit.sprite === 'figure_wolf' ? 41 : 29, 11);
      if (selected === unit.id && unit.hp > 0) ellipse(x, y, 25, 8, '#dcc18c2c', '#efd199');
      drawSprite(unit, pose);
    }

    function drawUnitStatus(unit, pose) {
      const { x, y, height } = pose;
      const hp = unit.hp / unit.hpMax;
      ctx.fillStyle = '#131914'; ctx.fillRect(x - 20, y - height - 11, 40, 5);
      ctx.fillStyle = unit.team === 'enemy' ? '#e29276' : '#b4c38a';
      ctx.fillRect(x - 20, y - height - 11, 40 * hp, 5);
      if (selected === unit.id) tag(x, y - height - 17, unit.name + '  ' + unit.hp + '/' + unit.hpMax, '#f4daa5');
    }

    function sceneEntries(t = 0) {
      return [
        ...state.covers.filter(c => c.hp !== 0).map(c => ({ item: c, cover: true, p: project(c) })),
        ...state.units.map(u => {
          const motion = movingPose(u, t);
          return { item: u, cover: false, p: motion?.p || project(u), motion };
        })
      ].sort((a, b) => a.p.y - b.p.y || Number(b.cover) - Number(a.cover));
    }

    function draw() {
      if (!state) return;
      const t = active ? Math.min(1, active.elapsed / active.duration) : 0;
      background();
      cells().forEach(drawTile);
      const entries = sceneEntries(t);
      const chosen = entries.find(e => !e.cover && e.item.id === selected);
      const statuses = [];
      for (const entry of entries) {
        if (entry.cover) {
          drawCover(entry.item, entry.p, chosen?.p);
        } else {
          const pose = unitPose(entry.item, entry.p, t);
          if (entry.motion) pose.facing = entry.motion.facing;
          pose.gait = entry.motion?.gait || 0;
          drawUnit(entry.item, pose);
          if (entry.item.hp > 0) statuses.push([entry.item, pose]);
        }
      }
      statuses.forEach(([unit, pose]) => drawUnitStatus(unit, pose));
      if (active && attackTypes.has(active.event.type)) drawAttack(active.event, t);
    }

    function drawAttack(event, t) {
      const points = eventPoints(event);
      if (!points) return;
      const { from, to } = points;
      const contact = contactAt(event);
      if (event.type === 'ranged' && t >= .30 && t < contact) {
        const f = (t - .30) / (contact - .30);
        const arrow = mix({ x: from.x, y: from.y - 55 }, { x: to.x, y: to.y - 24 }, f);
        const arc = Math.sin(f * Math.PI) * 28;
        const angle = Math.atan2(to.y + 31 - from.y - Math.cos(f * Math.PI) * 28, to.x - from.x);
        ctx.save(); ctx.translate(arrow.x, arrow.y - arc); ctx.rotate(angle);
        ctx.strokeStyle = '#ffe3ad'; ctx.lineWidth = 2.1;
        ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(5, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(5, 0); ctx.lineTo(0, 3); ctx.stroke();
        ctx.restore();
      }
      const impact = t - contact;
      if (impact < 0 || impact > .30) return;
      ctx.save();
      const x = to.x, y = to.y - 26;
      ctx.globalAlpha = 1 - impact / .30;
      ctx.strokeStyle = '#ffe0a0';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const angle = i * TAU / 6 + .2, radius = 6 + 70 * impact;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
        ctx.lineTo(x + Math.cos(angle) * (radius + 6), y + Math.sin(angle) * (radius + 6));
        ctx.stroke();
      }
      const delta = event.result?.hp?.find(h => h.id === event.target)?.delta;
      if (delta < 0) tag(x + 28, y - 25 - 45 * impact, String(delta), '#ffd098');
      ctx.restore();
    }

    function applyContact(event) {
      if (active.contacted) return;
      active.contacted = true;
      for (const update of event.result?.hp || []) {
        const unit = state.units.find(u => u.id === update.id);
        if (unit) unit.hp = update.hp;
      }
      if (event.result?.hp?.length) onChange(copy(state));
    }

    function stop(status = 'cancelled') {
      cancelAnimationFrame(frame);
      if (active) active.resolve(status);
      active = null;
    }

    function renderSnapshot(snapshot) {
      stop();
      state = copy(snapshot);
      draw();
      onChange(copy(state));
    }

    function reset(snapshot) {
      seen.clear(); facings.clear();
      selected = null; hovered = null;
      renderSnapshot(snapshot);
    }

    function finishEvent(event) {
      applyContact(event);
      if (event.type === 'move' && event.path?.length) {
        const unit = state.units.find(u => u.id === event.actor);
        if (unit) {
          const pose = movingPose(unit, 1);
          facings.set(unit.id, pose.facing);
          const last = event.path[event.path.length - 1];
          Object.assign(unit, { x: last.x, y: last.y });
        }
      }
      seen.add(event.id);
      stop('complete');
      draw();
      onChange(copy(state));
    }

    function playEvent(event) {
      if (!state || !event?.id || seen.has(event.id) || active) return Promise.resolve('ignored');
      const safe = copy(event);
      const duration = safe.duration || (safe.type === 'move' ? 290 * (safe.path?.length || 1) : safe.type === 'ranged' ? 890 : 750);
      return new Promise(resolve => {
        active = { event: safe, previous: performance.now(), elapsed: 0, duration, resolve, contacted: false };
        function step(time) {
          active.elapsed += Math.max(0, time - active.previous) * speed;
          active.previous = time;
          if (active.elapsed / duration >= contactAt(safe)) applyContact(safe);
          if (active.elapsed >= duration) {
            finishEvent(safe);
          } else {
            draw();
            frame = requestAnimationFrame(step);
          }
        }
        frame = requestAnimationFrame(step);
      });
    }

    return {
      ready, project, hitTest, renderSnapshot, reset, playEvent,
      cancel() { stop(); draw(); },
      skip() { if (active) finishEvent(active.event); },
      select(id) { selected = id; draw(); },
      hover(cell) { hovered = cell; draw(); },
      setMode(next) { mode = next; draw(); },
      setSpeed(next) { if (Number.isFinite(next) && next > 0) speed = next; },
      getDrawOrder() { return sceneEntries().map(e => e.item.id || 'rock:' + e.item.x + ',' + e.item.y); },
      getSnapshot() { return copy(state); }
    };
  }
  root.RavanGraphics = { createRenderer };
})(globalThis);
