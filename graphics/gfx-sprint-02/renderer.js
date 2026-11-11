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
    figure_hero: { height: 104, foot: .51 },
    figure_scout: { height: 101, foot: .48 },
    figure_guard: { height: 101, foot: .48 },
    figure_archer: { height: 94, foot: .53 },
    figure_caster: { height: 99, foot: .49 },
    figure_wolf: { height: 57, foot: .52 }
  };
  const contactAt = event => ({ ranged: .64, prepare:.34, release:.49, interrupt:.31, guard:.32, mark: .30, trailPlace: .35, trailHit: .25, cover: .43 })[event.type] || .46;
  const biomeTints={dolina:'#496b5340',suma:'#17493772',prevoj:'#7b6a5c68'};
  const actorScale={raider:1,shield:1.04,bow:.96,scout:.85,wolf:1,hound:.79,seer:1.05,giant:1.36};
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
    let targeting = null;
    // The renderer keeps its logical plane. The viewport owns the CSS-to-board transform.
    let viewport = null;
    const fit = () => {
      if(!viewport) return {scale:1,x:0,y:0};
      const {width,height,top,bottom}=viewport;
      const available=Math.max(1,height-top-bottom);
      const scale=Math.min(width/W,available/H);
      return {scale,x:(width-W*scale)/2,y:top+(available-H*scale)/2};
    };
    function resize(width,height,{top=0,bottom=0,dpr=1}={}){
      if(width<=0||height<=0)return;
      dpr=Math.max(1,Math.min(3,dpr));
      if(viewport&&width===viewport.width&&height===viewport.height&&top===viewport.top&&bottom===viewport.bottom&&dpr===viewport.dpr)return;
      viewport={width,height,top,bottom,dpr};
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      draw();
    }
    function clientToBoard(clientX,clientY){
      const rect=canvas.getBoundingClientRect(), p=fit();
      if(!viewport)return {x:(clientX-rect.left)*W/rect.width,y:(clientY-rect.top)*H/rect.height};
      return {x:(clientX-rect.left-p.x)/p.scale,y:(clientY-rect.top-p.y)/p.scale};
    }
    function boardToClient(point){
      const rect=canvas.getBoundingClientRect(), p=fit();
      if(!viewport)return {x:rect.left+point.x*rect.width/W,y:rect.top+point.y*rect.height/H};
      return {x:rect.left+p.x+point.x*p.scale,y:rect.top+p.y+point.y*p.scale};
    }
    let active = null, frame = 0, cameraEffects = true, reducedMotion = false;
    let landscape = null, landscapeBiome, terrainLayer = null, enhancedTerrain = true, enhancedFigures = true;
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
      if (!landscape || landscapeBiome!==state.biome) {
        landscapeBiome=state.biome;
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
        if(biomeTints[state.biome]){base.fillStyle=biomeTints[state.biome];base.fillRect(0,0,W,H);}
        if(state.approach){
          const daylight=base.createLinearGradient(0,0,0,H);
          daylight.addColorStop(0,'#e9c99724');
          daylight.addColorStop(.55,'#667c3910');
          daylight.addColorStop(1,'#224d4132');
          base.fillStyle=daylight;base.fillRect(0,0,W,H);
        }
        root.RavanE6Contact?.paint(base,state.context,W,H);
        const shade = base.createRadialGradient(490, 287, 200, 490, 287, 565);
        shade.addColorStop(0, 'rgba(26,27,15,.04)'); shade.addColorStop(1, 'rgba(8,16,13,.82)');
        base.fillStyle = shade; base.fillRect(0, 0, W, H);
      }
      if(!viewport){ctx.drawImage(landscape,0,0);return;}
      const {width,height}=viewport;
      const scale=Math.max(width/W,height/H), w=W*scale,h=H*scale;
      ctx.drawImage(landscape,(width-w)/2,(height-h)/2,w,h);
    }

    function terrainAt(cell) {
      return state.terrain?.find(t => same(t, cell))?.kind || 'earth';
    }

    function describeCell(cell) {
      const cover = state.covers.find(c=>same(c,cell) && c.hp!==0);
      return { kind:terrainAt(cell), cover:cover ? { breakable:cover.hpMax>0, hp:cover.hp } : null };
    }

    // These marks describe existing tile types. They never add cover or change passability.
    const materials = {
      grass: { center:'#68795183', edge:'#576c3f00', shade:'#35452bc4', light:'#b7b67780' },
      mud: { center:'#43392fdc', edge:'#59473800', shade:'#251e1894', light:'#bdab8a72' },
      stone: { center:'#8b8a7a8a', edge:'#7c827500', shade:'#343a36b3', light:'#d1c8aa9e' }
    };

    function paintMaterial(layer, tile) {
      const material=materials[tile.kind];
      if(!material)return;
      const p=project(tile), corners=polygon(tile);
      const span=Math.max(...corners.map(c=>Math.abs(c.x-p.x)));
      const depth=Math.max(...corners.map(c=>Math.abs(c.y-p.y)));
      let seed=(Math.imul(tile.x+5,73856093)^Math.imul(tile.y+7,19349663))>>>0;
      const random=()=>{
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        return seed/4294967296;
      };
      layer.save();
      layer.translate(p.x,p.y);
      layer.scale(span/48,depth/48);
      layer.rotate((random()-.5)*.54);
      const patch=layer.createRadialGradient(0,0,2,0,0,49);
      patch.addColorStop(0,material.center);
      patch.addColorStop(1,material.edge);
      layer.fillStyle=patch;layer.fillRect(-50,-50,100,100);
      for(let index=0;index<15;index++){
        const angle=random()*TAU, radius=Math.sqrt(random())*33;
        const x=Math.cos(angle)*radius,y=Math.sin(angle)*radius;
        const size=2+random()*6;
        layer.fillStyle=material.shade;layer.strokeStyle=material.light;layer.lineWidth=1.25;
        layer.beginPath();
        if(tile.kind==='grass'){
          const bend=(random()-.4)*8;
          layer.moveTo(x-3,y+2);layer.quadraticCurveTo(x-2,y-size/2,x+bend,y-size);
          layer.quadraticCurveTo(x+2,y-size/2,x+1,y+2);layer.fill();
          layer.moveTo(x,y+1);layer.quadraticCurveTo(x,y-size*.6,x+bend,y-size);layer.stroke();
        }else if(tile.kind==='stone'){
          layer.moveTo(x-size,y+1);layer.lineTo(x-size*.4,y-size*.65);
          layer.lineTo(x+size*.55,y-size*.5);layer.lineTo(x+size,y);
          layer.lineTo(x+size*.5,y+size*.28);layer.closePath();layer.fill();
          layer.beginPath();layer.moveTo(x-size*.8,y);
          layer.lineTo(x-size*.4,y-size*.65);layer.lineTo(x+size*.55,y-size*.5);layer.stroke();
        }else{
          layer.ellipse(x,y,size,size*.32,.13,0,TAU);layer.fill();
          layer.beginPath();layer.ellipse(x,y,size,size*.32,.13,Math.PI*1.05,Math.PI*1.75);layer.stroke();
        }
      }
      layer.restore();
    }

    function drawMaterials() {
      if(!enhancedTerrain || !state.terrain?.length) return;
      if(!terrainLayer) {
        terrainLayer=document.createElement('canvas');
        terrainLayer.width=W;terrainLayer.height=H;
        const layer=terrainLayer.getContext('2d');
        for(const tile of state.terrain)paintMaterial(layer,tile);
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
      const height = profile.height*(unit.team==='enemy'?(actorScale[unit.kind]||1):1);
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
      const art = root.RavanAppearance?.texture(img, unit.identity) || img;
      const mirror = (unit.sprite === 'figure_wolf' ? -1 : 1) !== facing;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(pose.tilt || 0);
      if (unit.hp === 0) ctx.globalAlpha = .55;
      ctx.scale(mirror ? -1 : 1, 1);
      const left = -width * foot;
      if (Math.abs(gait) < .05) {
        ctx.drawImage(art, left, -height, width, height);
      } else {
        const bob = Math.abs(gait) * 2.3;
        const cut = Math.floor(img.naturalHeight * .76);
        const top = height * cut / img.naturalHeight;
        ctx.transform(1, 0, -Math.abs(gait) * .035, 1, 0, 0);
        ctx.drawImage(art, 0, 0, img.naturalWidth, cut, left, -height - bob, width, top + 1);
        const half = Math.floor(img.naturalWidth / 2);
        for (const [sx, sw, stride] of [[0, half, gait], [half, img.naturalWidth - half, -gait]]) {
          const part = img.naturalHeight - cut;
          const dx = left + width * sx / img.naturalWidth;
          ctx.drawImage(art, sx, cut, sw, part, dx + stride * 2.2, -height + top - bob,
            width * sw / img.naturalWidth + .4, height - top + bob - Math.max(0, stride) * 3);
        }
      }
      if(enhancedFigures && unit.hp>0){
        if(unit.team==='enemy')drawEnemyGear(unit, height);
        else drawGear(unit.sprite);
      }
      ctx.restore();
    }

    function drawEnemyGear(unit,height){
      const anchor=-height*.52;
      ctx.lineWidth=2.8;
      ctx.strokeStyle='#d8c8a0';
      if(unit.kind==='shield'){
        path([{x:9,y:anchor-14},{x:28,y:anchor-17},{x:33,y:anchor+12},{x:22,y:anchor+23},{x:10,y:anchor+12}]);
        ctx.fillStyle='#503c31';ctx.fill();ctx.stroke();
        ellipse(21,anchor+2,4,4,'#d2b685');
      }else if(unit.kind==='raider'||unit.elite){
        ctx.beginPath();ctx.moveTo(8,anchor+13);ctx.lineTo(30,anchor-19);ctx.stroke();
        ctx.fillStyle=unit.elite?'#d8ad72':'#9d9885';
        ctx.fillRect(25,anchor-24,unit.elite?15:10,unit.elite?12:7);
        if(state.approach&&unit.elite){
          path([{x:5,y:anchor-24},{x:17,y:anchor-31},{x:27,y:anchor-22},{x:23,y:anchor-11},{x:10,y:anchor-14}]);
          ctx.fillStyle='#756454';ctx.fill();ctx.strokeStyle='#d1b992';ctx.lineWidth=1.4;ctx.stroke();
        }
      }else if(unit.kind==='seer'){
        ctx.beginPath();ctx.moveTo(21,0);ctx.lineTo(21,-height*.81);ctx.stroke();
        ellipse(21,-height*.83,5,5,'#d8b9ee');
      }else if(unit.kind==='bow'||unit.kind==='scout'){
        ctx.beginPath();ctx.moveTo(12,anchor-17);
        ctx.quadraticCurveTo(unit.kind==='bow'?36:28,anchor,12,anchor+17);
        ctx.lineTo(12,anchor-17);ctx.stroke();
        if(state.approach){
          ctx.lineWidth=1.35;ctx.strokeStyle='#f1dbc0';
          ctx.beginPath();ctx.moveTo(11,anchor-17);ctx.lineTo(11,anchor+17);ctx.stroke();
        }
      }else if(unit.kind==='hound'){
        ctx.strokeStyle='#c5ad72';ctx.beginPath();ctx.moveTo(7,anchor-6);ctx.lineTo(13,anchor+4);ctx.stroke();
      }
    }

    function drawUnit(unit, pose) {
      const { x, y } = pose;
      if(enhancedFigures){
        const groundWidth=pose.width*(unit.sprite==='figure_wolf'?.48:.39);
        const contact=unit.hp>0?.52:.34;
        shadow({ x:x+groundWidth*.28, y },groundWidth*1.45,groundWidth*.43,contact*.72);
        shadow({ x:x-7, y:y-3 },groundWidth*.8,groundWidth*.23,contact);
      }else{
        shadow({ x, y },unit.sprite==='figure_wolf'?41:29,11);
      }
      if (state.active === unit.id && unit.hp > 0) ellipse(x, y, 29, 10, null, '#b4dec3');
      if(unit.elite && unit.hp>0)ellipse(x,y,34,12,null,'#e2a65d');
      if(unit.guarding&&state.approach&&unit.hp>0)ellipse(x,y,23,8,'#548e8536','#92cdbb');
      if (selected === unit.id && unit.hp > 0) ellipse(x, y, 25, 8, '#dcc18c2c', '#efd199');
      drawSprite(unit, pose);
    }

    function drawUnitStatus(unit, pose) {
      const { x, y, height } = pose;
      const hp = unit.hp / unit.hpMax;
      ctx.fillStyle = '#131914'; ctx.fillRect(x - 20, y - height - 11, 40, 5);
      ctx.fillStyle = unit.team === 'enemy' ? '#e29276' : '#b4c38a';
      ctx.fillRect(x - 20, y - height - 11, 40 * hp, 5);
      if(unit.elite && unit.hp>0)ellipse(x,y,34,12,null,'#e2a65d');
      if (unit.tactical) {
        const prepared=unit.tactical==='prepare';
        tag(x,y-height-37,prepared?'Priprema':'Prekinut',prepared?'#ffd09f':'#bce8da');
      }
      if (selected === unit.id || state.active === unit.id) {
        const name=unit.name.length>22 ? unit.name.slice(0,20)+'…' : unit.name;
        tag(x, y - height - 17, name + '  ' + unit.hp + '/' + unit.hpMax,
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

    function drawTargeting() {
      if(!targeting) return;
      const {candidates,target,path:steps,blocked}=targeting;
      ctx.save();
      for(const cell of candidates) {
        const p=project(cell);
        ellipse(p.x,p.y,5,3,'#d0edd8','#18271e');
      }
      if(steps.length) {
        const actor=state.units.find(u=>u.id===state.active);
        if(actor) {
          const [start,...rest]=[actor,...steps].map(project);
          ctx.beginPath();ctx.moveTo(start.x,start.y);
          for(const p of rest)ctx.lineTo(p.x,p.y);
          ctx.setLineDash([6,4]);ctx.strokeStyle='#aee8c5';ctx.lineWidth=2.5;ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      if(target) {
        path(polygon(target));
        ctx.fillStyle=blocked?'#dc795737':'#b1e5bc35';ctx.fill();
        ctx.strokeStyle=blocked?'#ffc0a6':'#d9ffde';ctx.lineWidth=2.8;
        if(blocked)ctx.setLineDash([5,4]);
        ctx.stroke();
        if(blocked) {
          ctx.setLineDash([]);
          const p=project(target);
          ctx.beginPath();
          ctx.moveTo(p.x-5,p.y-5);ctx.lineTo(p.x+5,p.y+5);
          ctx.moveTo(p.x+5,p.y-5);ctx.lineTo(p.x-5,p.y+5);ctx.stroke();
        }
      }
      ctx.restore();
    }

    function draw() {
      if (!state) return;
      const t = active ? Math.min(1, active.elapsed / active.duration) : 0;
      const dpr=viewport?.dpr || 1;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      background();
      ctx.save();
      const placement=fit();
      ctx.translate(placement.x,placement.y);
      ctx.scale(placement.scale,placement.scale);
      if (cameraEffects && !reducedMotion && active?.event.impact === 'heavy') {
        const kick = (t - contactAt(active.event)) / .19;
        if (kick >= 0 && kick < 1) ctx.translate(Math.sin(kick * Math.PI * 3) * (1 - kick) * 4, (1 - kick) * 1.4);
      }
      drawMaterials();
      cells().forEach(drawTile);
      drawTargeting();
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
      if (active) { drawMagic(active.event, t); drawRoleEvent(active.event, t); drawTacticalEvent(active.event,t); }
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
      const missed=event.outcome==='miss';
      ctx.strokeStyle = missed?'#b7c7bc':event.guarded?'#a8c9d9':'#ffe0a0';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const angle = i * TAU / 6 + .2, radius = 6 + 70 * impact;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
        ctx.lineTo(x + Math.cos(angle) * (radius + 6), y + Math.sin(angle) * (radius + 6));
        ctx.stroke();
      }
      const delta = event.result?.hp?.find(h => h.id === event.target)?.delta;
      if(missed)tag(x+20,y-20,'Promasaj','#cfdfd3');
      else if(event.guarded&&delta<0)tag(x-25,y-18,'Gard','#b0d4e0');
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

    function drawTacticalEvent(event,t) {
      if(!['prepare','release','interrupt'].includes(event.type))return;
      const contact=contactAt(event);
      const unit=state.units.find(u=>u.id===(event.type==='interrupt'?event.target:event.actor));
      if(!unit)return;
      const at=project(unit);
      if(event.type==='prepare'||event.type==='interrupt'){
        const prepared=event.type==='prepare';
        ctx.save();ctx.globalAlpha=Math.sin(Math.PI*t);
        ellipse(at.x,at.y,37,14,null,prepared?'#efac78':'#bde3cf');
        tag(at.x,at.y-102,prepared?'Priprema':'Prekinuto',prepared?'#ffd0a1':'#bde3cf');
        ctx.restore();
      }else if(t>=contact){
        const progress=(t-contact)/(1-contact);
        ctx.save();ctx.globalAlpha=1-progress;
        for(const cell of event.cells||[]){
          const p=project(cell);
          ellipse(p.x,p.y,16+progress*32,7+progress*10,null,'#ebaa77');
        }
        for(const update of event.result?.hp||[]){
          const hit=state.units.find(u=>u.id===update.id);
          if(hit){const p=project(hit);tag(p.x,p.y-64-progress*22,String(update.delta),'#ffd098');}
        }
        ctx.restore();
      }
    }

    function drawRoleEvent(event,t) {
      if(!['guard','observe','heal'].includes(event.type))return;
      const unit=state.units.find(u=>u.id===(event.type==='guard'?event.actor:event.target));
      if(!unit)return;
      const p=project(unit);
      ctx.save();ctx.translate(p.x,p.y-36);ctx.globalAlpha=Math.sin(t*Math.PI);
      ctx.lineWidth=2;ctx.strokeStyle='#cde5cd';
      if(event.type==='guard'){
        path([{x:-14,y:-14},{x:14,y:-14},{x:12,y:3},{x:0,y:13},{x:-12,y:3}]);
        ctx.fillStyle='#41655685';ctx.fill();ctx.stroke();
      } else if(event.type==='heal'){
        const delta=event.result?.hp?.find(change=>change.id===unit.id)?.delta;
        if(delta>0)tag(0,-16,'+'+delta,'#b9e9ae');
        ellipse(0,0,14,10,null,'#b9e9ae');
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
      root.RavanBattleAudio?.contact(event);
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
      for(const update of event.result?.tactical||[]){
        const unit=state.units.find(u=>u.id===update.id);
        if(unit)unit.tactical=update.status;
      }
      if (event.result?.active) state.active = event.result.active;
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
      targeting = null;
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
      const fullDuration = safe.duration || (safe.type === 'move' ? 230 * (safe.path?.length || 1) : ({ranged: 660, push: 310, prepare:340, release:630, interrupt:410, guard:380, mark: 490, markEnd: 380, trailPlace: 490, trailHit: 620, cover: 650})[safe.type] || 590);
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
      ready, project, hitTest, renderSnapshot, reset, playEvent, resize, clientToBoard, boardToClient,
      setTargeting(guide) { targeting=guide ? copy(guide) : null; draw(); },
      getTargeting() { return copy(targeting); },
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
