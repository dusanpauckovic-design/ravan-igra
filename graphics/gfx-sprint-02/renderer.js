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
  const contactAt = event => ({ ranged: .64, mark: .30, trailPlace: .35, trailHit: .25, cover: .43 })[event.type] || .46;
  const attackTypes = new Set(['melee', 'ranged']);
  const SILHOUETTES = {
    figure_guard:{height:104,foot:.55},
    figure_archer:{height:98,foot:.49},
    figure_caster:{height:101,foot:.53}
  };
  const copy = value => JSON.parse(JSON.stringify(value));

  function createRenderer(canvas, sources, onChange = () => {}) {
    const ctx = canvas.getContext('2d');
    const images = {};
    let state, mode = 'angled', selected = null, hovered = null, speed = 1;
    let active = null, frame = 0, cameraEffects = true, reducedMotion = false;
    let landscape = null, terrainLayer = null, enhancedTerrain = true, enhancedFigures = true;
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

    function terrainAt(cell) {
      return state.terrain?.find(t => same(t, cell))?.kind || 'earth';
    }

    function describeCell(cell) {
      const cover = state.covers.find(c=>same(c,cell) && c.hp!==0);
      return { kind:terrainAt(cell), cover:cover ? { breakable:cover.hpMax>0, hp:cover.hp } : null };
    }

    function drawMaterials() {
      if(!enhancedTerrain || !state.terrain?.length) return;
      if(!terrainLayer) {
        terrainLayer=document.createElement('canvas');
        terrainLayer.width=W;terrainLayer.height=H;
        const layer=terrainLayer.getContext('2d');
        const palette={grass:['#73864b99','#53663c00'],mud:['#3b312ad9','#59473800'],stone:['#9d99858c','#a2a49300']};
        for(const tile of state.terrain){
          const colors=palette[tile.kind];
          if(!colors) continue;
          const p=project(tile);
          layer.save();
          layer.translate(p.x,p.y);layer.scale(1,mode==='flat'?.9:.61);
          const g=layer.createRadialGradient(0,0,2,0,0,48);
          g.addColorStop(0,colors[0]);g.addColorStop(1,colors[1]);
          layer.fillStyle=g;layer.fillRect(-50,-50,100,100);
          for(let i=0;i<13;i++){
            const dx=((i*31+tile.x*9)%63)-31,dy=((i*17+tile.y*7)%49)-24;
            if(tile.kind==='grass') {
              layer.strokeStyle=i%2?'#a0a66f70':'#4a57368c';layer.lineWidth=1.4;
              layer.beginPath();layer.moveTo(dx,dy);layer.quadraticCurveTo(dx-2,dy-4,dx+(i%2?3:-4),dy-9);layer.stroke();
            } else if(tile.kind==='stone') {
              layer.fillStyle=i%2?'#c2c0a55b':'#383d3565';
              layer.fillRect(dx,dy,2+i%4,1+i%3);
            }
          }
          if(tile.kind==='mud') {
            layer.strokeStyle='#c6b695a6';layer.lineWidth=1.6;
            for(let row=-1;row<=1;row++){
              layer.beginPath();layer.moveTo(-13,row*6);
              layer.bezierCurveTo(-7,row*6-4,5,row*6+4,13,row*6);layer.stroke();
            }
          }
          layer.restore();
        }
      }
      ctx.drawImage(terrainLayer,0,0);
    }

    function drawTile(cell) {
      const unit = state.units.find(u => u.id === selected && u.hp > 0 && same(u, cell));
      const hover = same(hovered, cell);
      path(polygon(cell));
      ctx.fillStyle = unit ? '#c2a36654' : hover ? '#ede1a346' : (cell.x + cell.y) % 3 ? '#aeb18d0e' : '#322c151e';
      ctx.fill();
      ctx.strokeStyle = unit ? '#f2d393' : hover ? '#d9cfaa' : enhancedTerrain ? '#d8d5ad1d' : '#d8d5ad33';
      ctx.lineWidth = unit || hover ? 2 : 1;
      ctx.stroke();
      if ((state.danger || []).some(danger => same(danger, cell))) {
        const p = project(cell);
        ctx.save(); path(polygon(cell)); ctx.clip();
        ctx.fillStyle = '#a8573f37'; ctx.fill();
        ctx.strokeStyle = '#eda67f66'; ctx.lineWidth = 1;
        for (let i = -58; i <= 58; i += 11) {
          ctx.beginPath(); ctx.moveTo(p.x + i - 24, p.y + 30); ctx.lineTo(p.x + i + 24, p.y - 30); ctx.stroke();
        }
        path([{x:p.x,y:p.y-11},{x:p.x+10,y:p.y+7},{x:p.x-10,y:p.y+7}]);
        ctx.fillStyle = '#6d3930'; ctx.fill(); ctx.strokeStyle = '#f5b591'; ctx.stroke();
        ctx.fillStyle = '#fff0d6'; ctx.textAlign = 'center'; ctx.font = 'bold 11px sans-serif';
        ctx.fillText('!', p.x, p.y + 5);
        ctx.restore();
      }
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
      if (large) {
        if(enhancedTerrain){
          ctx.strokeStyle='#e5c692';ctx.lineWidth=1.7;
          ctx.beginPath();ctx.moveTo(p.x-10,p.y-45);ctx.lineTo(p.x-3,p.y-34);
          ctx.lineTo(p.x-8,p.y-27);ctx.lineTo(p.x+4,p.y-19);ctx.stroke();
        }
        tag(p.x + 17, p.y - 49, enhancedTerrain ? 'Zaklon '+cover.hp+' HP' : String(cover.hp), '#e8d1a8');
      }
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
      const profile = (enhancedFigures && SILHOUETTES[unit.sprite]) || SIZES[unit.sprite] || SIZES.figure_guard;
      const img = images[unit.sprite];
      const height = profile.height;
      const width = img?.naturalHeight ? height * img.naturalWidth / img.naturalHeight : height * .75;
      return { x: p.x + offset, y: p.y, width, height, foot: profile.foot, facing, tilt };
    }

    function movingPose(unit, t) {
      const event = active?.event;
      const who = event?.type === 'push' ? event.target : event?.type === 'move' ? event.actor : null;
      if (who !== unit.id || !event.path?.length) return null;
      const points = [event.from || unit, ...event.path];
      const position = t * event.path.length;
      const segment = Math.min(event.path.length - 1, Math.floor(position));
      const phase = position - segment;
      const a = project(points[segment]), b = project(points[segment + 1]);
      const easing = event.path.length === 1 ? ease(phase) :
        segment === 0 ? phase * phase * (2 - phase) :
        segment === event.path.length - 1 ? 1 - (1 - phase) ** 2 * (1 + phase) : phase;
      const pushed = event.type === 'push';
      const p = mix(a, b, pushed ? 1 - (1 - phase) ** 3 : easing);
      const envelope = Math.min(1, position * 5, (event.path.length - position) * 5);
      return { p, gait: pushed ? 0 : Math.sin(position * TAU) * envelope,
        facing: Math.sign(b.x - a.x) || facings.get(unit.id) || 1 };
    }

    function drawGear(sprite) {
      ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
      if(sprite==='figure_guard'){
        path([{x:14,y:-50},{x:30,y:-54},{x:44,y:-65},{x:37,y:-54},{x:28,y:-48},{x:15,y:-47}]);
        ctx.fillStyle='#c4c8b1';ctx.fill();ctx.strokeStyle='#3b4335';ctx.lineWidth=1.5;ctx.stroke();
        ctx.strokeStyle='#947a55';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(24,-55);ctx.lineTo(26,-47);ctx.stroke();
      }
      if(sprite==='figure_archer'){
        ctx.strokeStyle='#251b13';ctx.lineWidth=4;
        ctx.beginPath();ctx.moveTo(40,-82);ctx.quadraticCurveTo(56,-59,33,-31);ctx.stroke();
        ctx.strokeStyle='#bd9b64';ctx.lineWidth=2;ctx.stroke();
        ctx.strokeStyle='#ded8bb';ctx.lineWidth=.9;
        ctx.beginPath();ctx.moveTo(40,-82);ctx.lineTo(33,-31);ctx.stroke();
      }
      if(sprite==='figure_caster'){
        ctx.strokeStyle='#2b211a';ctx.lineWidth=4.8;
        ctx.beginPath();ctx.moveTo(25,-3);ctx.quadraticCurveTo(31,-49,22,-89);ctx.stroke();
        ctx.strokeStyle='#9f825a';ctx.lineWidth=2.4;ctx.stroke();
        ellipse(22,-89,3.8,5,'#a0bbab','#475e54');
      }
      ctx.restore();
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
      if(enhancedFigures && unit.hp>0) drawGear(unit.sprite);
      ctx.restore();
    }

    function drawUnit(unit, pose) {
      const { x, y } = pose;
      shadow({ x, y }, unit.sprite === 'figure_wolf' ? 41 : 29, 11);
      if(enhancedFigures && unit.hp>0 && unit.team!=='enemy'){
        ellipse(x-4,y+1,11,3.1,'#111a1290');
      }
      if (state.active === unit.id && unit.hp > 0) ellipse(x, y, 29, 10, null, '#b4dec3');
      if (selected === unit.id && unit.hp > 0) ellipse(x, y, 25, 8, '#dcc18c2c', '#efd199');
      drawSprite(unit, pose);
    }

    function drawUnitStatus(unit, pose) {
      const { x, y, height } = pose;
      const hp = unit.hp / unit.hpMax;
      ctx.fillStyle = '#131914'; ctx.fillRect(x - 20, y - height - 11, 40, 5);
      ctx.fillStyle = unit.team === 'enemy' ? '#e29276' : '#b4c38a';
      ctx.fillRect(x - 20, y - height - 11, 40 * hp, 5);
      if (selected === unit.id || state.active === unit.id) {
        tag(x, y - height - 17, unit.name + '  ' + unit.hp + '/' + unit.hpMax,
          selected === unit.id ? '#f4daa5' : '#c5ead4');
      }
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
      ctx.save();
      if (cameraEffects && !reducedMotion && active?.event.impact === 'heavy') {
        const kick = (t - contactAt(active.event)) / .19;
        if (kick >= 0 && kick < 1) ctx.translate(Math.sin(kick * Math.PI * 3) * (1 - kick) * 4, (1 - kick) * 1.4);
      }
      drawMaterials();
      cells().forEach(drawTile);
      (state.trails || []).forEach(trail => drawRune(project(trail), '#8ee3da'));
      const entries = sceneEntries(t);
      const chosen = entries.find(e => !e.cover && e.item.id === selected);
      const statuses = [];
      for (const entry of entries) {
        if (entry.cover) {
          drawCover(entry.item, entry.p, chosen?.p);
        } else {
          const pose = unitPose(entry.item, entry.p, t);
          if (entry.motion) pose.facing = entry.motion.facing;
          pose.gait = reducedMotion ? 0 : entry.motion?.gait || 0;
          drawUnit(entry.item, pose);
          if (entry.item.mark && entry.item.hp > 0) drawMark(pose);
          if (entry.item.hp > 0) statuses.push([entry.item, pose]);
        }
      }
      if (active && attackTypes.has(active.event.type)) drawAttack(active.event, t);
      if (active) { drawMagic(active.event, t); drawRoleEvent(active.event, t); }
      statuses.forEach(([unit, pose]) => drawUnitStatus(unit, pose));
      ctx.restore();
    }

    function drawAttack(event, t) {
      const points = eventPoints(event);
      if (!points) return;
      const { from, to } = points;
      const contact = contactAt(event);
      if (event.type === 'ranged' && t >= .30 && t < contact) {
        const f = (t - .30) / (contact - .30);
        const arrow = mix({ x: from.x, y: from.y - 55 }, { x: to.x, y: to.y - 24 }, f);
        const arc = Math.sin(f * Math.PI) * 20;
        const angle = Math.atan2(to.y + 31 - from.y - Math.cos(f * Math.PI) * 20, to.x - from.x);
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

    function drawRune(p, color, size = 1) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(size, size * .49);
      ctx.lineWidth = 2;
      ellipse(0, 0, 21, 21, '#41948838', color);
      ellipse(0, 0, 15, 15, null, color);
      ctx.strokeStyle = color;
      path([{x:0,y:-19}, {x:11,y:7}, {x:-11,y:7}]); ctx.stroke();
      ctx.restore();
    }

    function drawMark(pose) {
      const x = pose.x - 22, y = pose.y - Math.min(33, pose.height * .35);
      path([{ x, y: y - 10 }, { x: x + 7, y }, { x, y: y + 10 }, { x: x - 7, y }]);
      ctx.fillStyle = '#57395a'; ctx.fill();
      ctx.strokeStyle = '#ffd6f6'; ctx.lineWidth = 1.8; ctx.stroke();
      ellipse(x, y, 2.5, 2.5, '#fff0f9');
    }

    function drawMagic(event, t) {
      const target = state.units.find(u => u.id === event.target);
      const location = event.at || target || event.from;
      if (!location) return;
      const p = project(location);
      if (event.type === 'trailPlace' || event.type === 'trailHit') {
        ctx.save(); ctx.globalAlpha = (1 - t) * .86;
        drawRune(p, event.type === 'trailHit' ? '#e1fff2' : '#9ce4ce', 1 + t * 1.75);
        if (event.type === 'trailHit') {
          ctx.strokeStyle = '#bdffe5'; ctx.lineWidth = 2;
          for (let i = -2; i <= 2; i++) {
            ctx.beginPath(); ctx.moveTo(p.x + i * 7, p.y);
            ctx.lineTo(p.x + i * 11, p.y - (1 - t) * (38 - 4 * Math.abs(i))); ctx.stroke();
          }
          const delta = event.result?.hp?.find(h => h.id === event.target)?.delta;
          if (delta < 0 && t >= contactAt(event)) tag(p.x + 33, p.y - 28 - t * 25, String(delta), '#d0f9e7');
        }
        ctx.restore();
      }
      if (event.type === 'mark' || event.type === 'markEnd') {
        ctx.save(); ctx.globalAlpha = 1 - t;
        const center = { x: p.x - 22, y: p.y - 28 }, r = 10 + 16 * t;
        path([{x:center.x,y:center.y-r}, {x:center.x+r*.7,y:center.y},
          {x:center.x,y:center.y+r}, {x:center.x-r*.7,y:center.y}]);
        ctx.strokeStyle = '#ffd5f3'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      }
      if (event.type === 'push' || event.type === 'cover') {
        const impact = event.type === 'cover' ? (t - contactAt(event)) / (1 - contactAt(event)) : t;
        if (impact < 0) return;
        ctx.save(); ctx.globalAlpha = 1 - impact;
        for (let i = 0; i < 8; i++) {
          const angle = i * TAU / 8, radius = impact * (event.type === 'cover' ? 36 : 24);
          const x = p.x + Math.cos(angle) * radius, y = p.y + Math.sin(angle) * radius * .31;
          ellipse(x, y - 8 - Math.sin(Math.PI * impact) * (i + 3), 2 + i % 4, 2,
            event.type === 'cover' ? '#baaa87' : '#a89a79');
        }
        ctx.restore();
      }
    }

    function drawRoleEvent(event,t) {
      if(event.type!=='guard' && event.type!=='observe')return;
      const unit=state.units.find(u=>u.id===(event.type==='guard'?event.actor:event.target));
      if(!unit)return;
      const p=project(unit);
      ctx.save();ctx.translate(p.x,p.y-36);ctx.globalAlpha=Math.sin(t*Math.PI);
      ctx.lineWidth=2;ctx.strokeStyle='#cde5cd';
      if(event.type==='guard'){
        path([{x:-14,y:-14},{x:14,y:-14},{x:12,y:3},{x:0,y:13},{x:-12,y:3}]);
        ctx.fillStyle='#41655685';ctx.fill();ctx.stroke();
      } else {
        ellipse(0,0,16,16,null,'#e8d6a1');
        for(let i=0;i<4;i++){
          ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(0,-20);ctx.stroke();
        }
      }
      ctx.restore();
    }

    function applyContact(event) {
      if (active.contacted) return;
      active.contacted = true;
      for (const update of event.result?.hp || []) {
        const unit = state.units.find(u => u.id === update.id);
        if (unit) unit.hp = update.hp;
      }
      for (const update of event.result?.marks || []) {
        const unit = state.units.find(u => u.id === update.id);
        if (unit) unit.mark = update.mark;
      }
      for (const update of event.result?.covers || []) {
        const cover = state.covers.find(c => update.id ? c.id === update.id : same(c, update.at));
        if (cover) cover.hp = update.hp;
      }
      if (event.result?.trails) state.trails = event.result.trails;
      if (event.result?.danger) state.danger = event.result.danger;
      if (event.result) onChange(copy(state));
    }

    function stop(status = 'cancelled') {
      cancelAnimationFrame(frame);
      if (active) active.resolve(status);
      active = null;
    }

    function renderSnapshot(snapshot) {
      stop();
      state = copy(snapshot);
      terrainLayer = null;
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
      if ((event.type === 'move' || event.type === 'push') && event.path?.length) {
        const unit = state.units.find(u => u.id === (event.type === 'push' ? event.target : event.actor));
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
      const fullDuration = safe.duration || (safe.type === 'move' ? 230 * (safe.path?.length || 1) : ({ranged: 660, push: 310, mark: 490, markEnd: 380, trailPlace: 490, trailHit: 620, cover: 650})[safe.type] || 590);
      const duration = reducedMotion ? Math.max(1, fullDuration * .33) : fullDuration;
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
      setMode(next) { mode = next; terrainLayer=null; draw(); },
      describeCell,
      setFigureStyle(enhanced) { enhancedFigures=!!enhanced; draw(); },
      setTerrainStyle(enhanced) { enhancedTerrain=!!enhanced; draw(); },
      setSpeed(next) { if (Number.isFinite(next) && next > 0) speed = next; },
      setActive(id) { if (state) { state.active = id; draw(); onChange(copy(state)); } },
      setCameraEffects(enabled) { cameraEffects = !!enabled; draw(); },
      setReducedMotion(enabled) { reducedMotion = !!enabled; },
      getPlayback() { return { event: active?.event.id || null, seen: seen.size, cameraEffects, reducedMotion }; },
      getDrawOrder() { return sceneEntries().map(e => e.item.id || 'rock:' + e.item.x + ',' + e.item.y); },
      getSnapshot() { return copy(state); }
    };
  }
  root.RavanGraphics = { createRenderer };
})(globalThis);
