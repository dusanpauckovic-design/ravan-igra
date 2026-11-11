/* Graphics only. Coordinates use the RV-03 odd-row offset convention. */
(function (root) {
  'use strict';
  const W = 960, H = 570, R = 49, STEP = Math.sqrt(3) * R;
  const same = (a, b) => a && b && a.x === b.x && a.y === b.y;
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
  const ease = t => t * t * (3 - 2 * t);
  const TAU = Math.PI * 2;
  const copy = value => JSON.parse(JSON.stringify(value));

  function createRenderer(canvas, sources, onChange = () => {}) {
    const ctx = canvas.getContext('2d');
    const images = {};
    let state, mode = 'angled', selected = null, hovered = null, speed = 1;
    let active = null, frame = 0;
    let landscape = null;
    const seen = new Set();
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

    function drawCover(cover, p) {
      ellipse(p.x + 4, p.y + 3, 31, 10, '#10150e66');
      image('terrain_rock', p.x - 33, p.y - 42, 66, 46);
      if (cover.hpMax) tag(p.x, p.y - 40, String(cover.hp), '#e8d1a8');
    }

    function tag(x, y, label, color) {
      ctx.font = '600 12px system-ui';
      ctx.textAlign = 'center';
      const width = ctx.measureText(label).width + 12;
      ctx.fillStyle = '#141b16e8'; ctx.fillRect(x - width / 2, y - 13, width, 17);
      ctx.fillStyle = color; ctx.fillText(label, x, y);
    }

    function drawUnit(unit, p, t) {
      const chosen = selected === unit.id;
      const ally = unit.team !== 'enemy';
      const attack = active?.event;
      const target = attack && state.units.find(u => u.id === attack.target);
      let offset = 0;
      if (attack?.type === 'melee' && attack.actor === unit.id && target) {
        offset = Math.sign(project(target).x - p.x) * Math.sin(Math.PI * t) * 19;
      }
      const x = p.x + offset;
      ellipse(x + 3, p.y + 2, 24, 8, '#12171191');
      if (chosen) ellipse(x, p.y, 26, 9, '#dcc18c21', '#efd199');
      const img = images[unit.sprite];
      const h = unit.sprite === 'figure_wolf' ? 58 : 102;
      const w = img?.naturalHeight ? h * img.naturalWidth / img.naturalHeight : h * .75;
      image(unit.sprite, x - w / 2, p.y - h, w, h);
      const hp = unit.hp / unit.hpMax;
      ctx.fillStyle = '#131914'; ctx.fillRect(x - 20, p.y - h - 11, 40, 5);
      ctx.fillStyle = ally ? '#b4c38a' : '#e29276'; ctx.fillRect(x - 20, p.y - h - 11, 40 * hp, 5);
      if (chosen) tag(x, p.y - h - 17, unit.name, '#f4daa5');
    }

    function draw(time = performance.now()) {
      if (!state) return;
      const t = active ? Math.min(1, (time - active.start) * speed / active.duration) : 0;
      background();
      cells().forEach(drawTile);
      const entries = [
        ...state.covers.filter(c => c.hp !== 0).map(c => ({ item: c, cover: true, p: project(c) })),
        ...state.units.filter(u => u.hp > 0).map(u => ({ item: u, cover: false, p: project(u) }))
      ].sort((a, b) => a.p.y - b.p.y || Number(b.cover) - Number(a.cover));
      entries.forEach(e => e.cover ? drawCover(e.item, e.p) : drawUnit(e.item, e.p, t));
      if (active?.event.type === 'melee' && t > .35 && t < .7) {
        const target = state.units.find(u => u.id === active.event.target);
        if (target) {
          const p = project(target);
          ctx.globalAlpha = 1 - Math.abs(t - .5) * 4;
          ellipse(p.x - 11, p.y - 33, 19, 3, '#f7d4a1');
          ctx.globalAlpha = 1;
        }
      }
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
      seen.clear();
      selected = null; hovered = null;
      renderSnapshot(snapshot);
    }

    function playEvent(event) {
      if (!state || !event?.id || seen.has(event.id) || active) return Promise.resolve('ignored');
      const safe = copy(event);
      const duration = safe.duration || 680;
      return new Promise(resolve => {
        active = { event: safe, start: performance.now(), duration, resolve };
        function step(time) {
          draw(time);
          if ((time - active.start) * speed < duration) {
            frame = requestAnimationFrame(step);
            return;
          }
          seen.add(safe.id);
          stop('complete'); draw();
        }
        frame = requestAnimationFrame(step);
      });
    }

    return {
      ready, project, hitTest, renderSnapshot, reset, playEvent,
      cancel() { stop(); draw(); },
      select(id) { selected = id; draw(); },
      hover(cell) { hovered = cell; draw(); },
      setMode(next) { mode = next; draw(); },
      setSpeed(next) { speed = next; },
      getSnapshot() { return copy(state); }
    };
  }
  root.RavanGraphics = { createRenderer };
})(globalThis);
