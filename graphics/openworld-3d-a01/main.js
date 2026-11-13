import * as T from 'three';
import {camera, height, loadScene, renderer, render, setLight, setQuality, waterLevel} from './scene.js';
import {places, river, width, routeBetween} from './world.js';

const element=id=>document.getElementById(id);
const canvas=element('scene'), status=element('status');
const pins=new Map();
const pinHeights=new Map();
const viewport=new T.Vector3();
const position=new T.Vector3();
const right=new T.Vector3(),forward=new T.Vector3();
const lookAt=new T.Vector3();
const pan=new T.Vector2();
const party=new T.Vector2(places[0].x,places[0].z);
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
let origin='camp', selected='camp', journey=[], target=null;
let ready=false, lastFrame=0, low=false, mist=false, frameSamples=[];
let span=92, drag=null, needsResize=true, invalidate=true;

function overview() {
  const portrait=canvas.clientWidth/canvas.clientHeight<.86;
  pan.set(0,5);
  span=portrait?Math.min(178,80/(canvas.clientWidth/canvas.clientHeight)):64;
  invalidate=true;
}
function updateCamera() {
  const ratio=canvas.clientWidth/Math.max(1,canvas.clientHeight);
  camera.left=-span*ratio/2;camera.right=span*ratio/2;
  camera.top=span/2;camera.bottom=-span/2;
  camera.near=1;camera.far=275;
  camera.position.set(pan.x-37,62,pan.y-110);
  lookAt.set(pan.x,2,pan.y);
  camera.lookAt(lookAt);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  if(needsResize){renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);needsResize=false;}
}
function screen(x,y,z) {
  viewport.set(x,y,z).project(camera);
  return {x:(viewport.x+1)*canvas.clientWidth*.5,y:(1-viewport.y)*canvas.clientHeight*.5,visible:Math.abs(viewport.x)<.97&&Math.abs(viewport.y)<.93};
}
function showSelection() {
  const place=places.find(p=>p.id===selected);
  element('place-list').value=selected;
  element('mobile-place-name').textContent=place.title;
  element('kind').textContent=place.kind;
  element('place-name').textContent=place.title;
  element('description').textContent=place.info;
  const travel=element('travel');
  const moving=!!target||journey.length>0;
  travel.disabled=!ready||moving||origin===selected;
  travel.textContent=moving?'Na putu':origin===selected?'Ovde si':'Kreni';
  for(const [id,pin] of pins)pin.setAttribute('aria-pressed',String(id===selected));
}
function select(id) { selected=id;showSelection(); }
function updatePins() {
  for(const place of places) {
    const pin=pins.get(place.id), p=screen(place.x,pinHeights.get(place.id),place.z);
    pin.hidden=!p.visible;
    if(!p.visible)continue;
    pin.style.left=T.MathUtils.clamp(p.x,55,canvas.clientWidth-55)+'px';
    pin.style.top=p.y+'px';
  }
  const wet=Math.abs(party.x-river(party.y))<width(party.y);
  const y=Math.max(height(party.x,party.y),wet?waterLevel(party.y):-50);
  const p=screen(party.x,y+.28,party.y);
  const marker=element('party');
  marker.hidden=!p.visible;
  marker.style.left=p.x+'px';
  marker.style.top=p.y+'px';
}
function nextTarget() {
  while(journey.length){
    const waypoint=journey.shift();
    if(party.distanceTo(waypoint.point)>.005){target=waypoint;return;}
    if(waypoint.arrival)origin=waypoint.arrival;
  }
  target=null;
  status.textContent='Druzina je stigla · '+places.find(p=>p.id===origin).title;
  showSelection();
}
function travel() {
  if(origin===selected||target||!ready)return;
  journey=routeBetween(origin,selected).flatMap(({next,points})=>points.map(([x,z],i)=>({
    point:new T.Vector2(x,z),arrival:i===points.length-1?next:null
  })));
  if(reduceMotion.matches){
    const place=places.find(p=>p.id===selected);
    party.set(place.x,place.z);invalidate=true;
    origin=selected;journey=[];nextTarget();
  }else if(journey.length){
    nextTarget();showSelection();
    status.textContent='Na putu ka · '+places.find(p=>p.id===selected).title;
  }
}
function move(dt) {
  let remaining=dt*14;
  while(target && remaining>0){
    position.set(target.point.x-party.x,0,target.point.y-party.y);
    const distance=position.length();
    if(distance>remaining){
      party.x+=position.x*remaining/distance;
      party.y+=position.z*remaining/distance;
      break;
    }
    party.copy(target.point);
    remaining-=distance;
    if(target.arrival)origin=target.arrival;
    nextTarget();
  }
}
function zoom(factor) { span=T.MathUtils.clamp(span*factor,25,178);invalidate=true; }
function draw(now) {
  const elapsed=lastFrame?Math.max(0,now-lastFrame):16;
  
  lastFrame=now;
  if(target || invalidate || !reduceMotion.matches) {
    if(lastFrame&&frameSamples.length<60)frameSamples.push(elapsed);
    move(Math.min(elapsed/1000,2));
    updateCamera();
    updatePins();
    render(reduceMotion.matches?0:now/1000);
    invalidate=false;
  }
  requestAnimationFrame(draw);
}
function initControls(){
  const placeList=element('place-list');
  for (const place of places) placeList.add(new Option(place.title,place.id));
  placeList.onchange=()=>select(placeList.value);
  for(const place of places){
    const button=document.createElement('button');
    button.className='pin';
    button.type='button';
    button.dataset.place=place.id;
    const text=document.createElement('span');
    text.textContent=place.title;
    button.append(text,document.createElement('i'));
    button.onclick=()=>select(place.id);
    element('pins').append(button);
    pins.set(place.id,button);
    pinHeights.set(place.id,height(place.x,place.z)+3.6);
  }
  element('zoom-in').onclick=()=>zoom(.8);
  element('zoom-out').onclick=()=>zoom(1.25);
  element('overview').onclick=overview;
  element('light').onclick=()=>{
    mist=!mist;setLight(mist);invalidate=true;
    element('light').setAttribute('aria-pressed',String(mist));
  };
  element('quality').onclick=()=>{
    low=!low;setQuality(low);needsResize=true;invalidate=true;
    element('quality').setAttribute('aria-pressed',String(low));
    element('quality').textContent=low?'Detalji: niski':'Detalji: puni';
    frameSamples=[];
  };
  element('travel').onclick=travel;
  canvas.addEventListener('wheel',event=>{event.preventDefault();zoom(Math.exp(Math.sign(event.deltaY)*.16));},{passive:false});
  canvas.addEventListener('pointerdown',event=>{
    if(drag||event.button!==0)return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(drag?.id!==event.pointerId)return;
    const units=span/canvas.clientHeight;
    right.setFromMatrixColumn(camera.matrixWorld,0);
    forward.setFromMatrixColumn(camera.matrixWorld,2).setY(0).normalize();
    const dx=(event.clientX-drag.x)*units,dy=(event.clientY-drag.y)*units*1.35;
    pan.x=T.MathUtils.clamp(pan.x-right.x*dx-forward.x*dy,-49,49);
    pan.y=T.MathUtils.clamp(pan.y-right.z*dx-forward.z*dy,-46,46);
    drag.x=event.clientX;drag.y=event.clientY;invalidate=true;
  });
  canvas.addEventListener('lostpointercapture',()=>{drag=null;});
  window.addEventListener('resize',()=>{needsResize=true;invalidate=true;});
}

function reportError(error){
  console.error(error);
  element('error').textContent='Dolina nije ucitana. Potreban je WebGL 2. '+error.message;
  element('error').hidden=false;
  status.textContent='Render nije dostupan';
  document.documentElement.dataset.ready='error';
}

async function init() {
  const audit=await loadScene();
  setQuality(false);
  overview();
  ready=true;
  initControls();
  showSelection();
  status.textContent='Izaberi oznaku na mapi';
  globalThis.ravanAudit=()=>({
    ...audit,origin,selected,party:party.toArray(),mist,low,span,pan:pan.toArray(),
    renderer:renderer.getContext().getParameter(renderer.getContext().RENDERER),
    webgl2:renderer.capabilities.isWebGL2,
    render:{...renderer.info.render},
    frameSamples:[...frameSamples]
  });
  draw(performance.now());
  document.documentElement.dataset.ready='true';
}
init().catch(reportError);
