import * as T from 'three';
import {camera, height, loadScene, renderer, render, setLight, setQuality, waterLevel, moveTraveler} from './scene.js';
import {places, river, width, routeBetween, bounds, travelDays, terrainPassable, inFord, inChannel, riverSide} from './world.js';

import {discover, explorationAudit, isKnown, sight, setSightTime} from './exploration.js';

const element=id=>document.getElementById(id);
const canvas=element('scene'), status=element('status');
const pins=new Map();
const pinHeights=new Map();
const viewport=new T.Vector3();
const position=new T.Vector3();
const ray=new T.Raycaster();
const pointer=new T.Vector2();
const contact=new T.Vector3();
const right=new T.Vector3(),forward=new T.Vector3();
const lookAt=new T.Vector3();
const pan=new T.Vector2();
const party=new T.Vector2(-19,-8);
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
let origin='camp', selected='camp', journey=[], target=null, heading=Math.PI*.95, follow=false;
let offRoad=[new T.Vector2(places[0].x,places[0].z)];
let ready=false, lastFrame=0, low=false, mist=true, frameSamples=[];
const daySeconds=23;
let clock=8/24, journeyDays=0, remainingDays=0, crossing=null, bank=riverSide(party.x,party.y);
let crossingCount=0;
const coords=point=>point.toArray();

function timeLabel(days){
  const hours=Math.round(days*24);
  const whole=Math.floor(hours/24), remainder=hours%24;
  return [whole?whole+' '+(whole===1?'dan':'dana'):'',remainder?remainder+' h':''].filter(Boolean).join(' ')||'< 1 h';
}
function updateClock(){
  const hour=Math.floor(clock*24)%24;
  element('clock').textContent='Dan '+(Math.floor(clock)+1)+' · '+String(hour).padStart(2,'0')+':00';
  if(target||crossing)element('eta').textContent='Preostalo · '+timeLabel(remainingDays);
}
function plan(id){
  const steps=routeBetween(origin,id).flatMap(({next,points})=>points.map(([x,z],i)=>({
    point:new T.Vector2(x,z),arrival:i===points.length-1?next:null
  })));
  steps.unshift(...offRoad.map(point=>({point,arrival:null})).reverse());
  return steps;
}
function estimate(steps){
  let start=party;
  let days=0;
  for(const step of steps){
    days+=travelDays(coords(start),coords(step.point));
    start=step.point;
  }
  return days;
}
function begin(steps){
  journey=steps;
  journeyDays=remainingDays=estimate(steps);
  follow=true;
  nextTarget();
  showSelection();
}

let span=92, drag=null, needsResize=true, invalidate=true;

function home() {
  follow=false;
  const portrait=canvas.clientWidth/canvas.clientHeight<.86;
  pan.set(0,5);
  span=portrait?Math.min(178,80/(canvas.clientWidth/canvas.clientHeight)):64;
  invalidate=true;
}
function overview(){
  follow=false;
  pan.set(0,8);
  const aspect=canvas.clientWidth/Math.max(1,canvas.clientHeight);
  span=Math.max(280,405/aspect);
  invalidate=true;
}
function updateCamera() {
  const ratio=canvas.clientWidth/Math.max(1,canvas.clientHeight);
  camera.left=-span*ratio/2;camera.right=span*ratio/2;
  camera.top=span/2;camera.bottom=-span/2;
  camera.near=1;camera.far=1000;
  const distance=Math.max(1,span/116);
  camera.position.set(pan.x-37*distance,62*distance,pan.y-110*distance);
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
  const moving=!!target||journey.length>0||!!crossing;
  const days=moving?remainingDays:estimate(plan(selected));
  element('eta').textContent=days>.025?(moving?'Preostalo · ':'Peske · ')+timeLabel(days):'';
  travel.disabled=!ready||moving||(mist&&!isKnown(selected))||(origin===selected&&Math.hypot(party.x-place.x,party.y-place.z)<.4);
  travel.textContent=moving?'Na putu':travel.disabled&&origin===selected?'Ovde si':'Kreni';
  for(const [id,pin] of pins)pin.setAttribute('aria-pressed',String(id===selected));
}
function select(id) { if(mist&&!isKnown(id))return;selected=id;showSelection(); }
function updatePins() {
  for(const place of places) {
    const pin=pins.get(place.id), p=screen(place.x,pinHeights.get(place.id),place.z);
    const option=[...element('place-list').options].find(x=>x.value===place.id);
    option.hidden=mist&&!isKnown(place.id);
    pin.hidden=!p.visible||option.hidden;
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
    if(party.distanceTo(waypoint.point)>.005){
      target=waypoint;
      target.start=party.clone();
      target.cost=travelDays(coords(party),coords(target.point));
      target.progress=0;
      return;
    }
    if(waypoint.arrival)origin=waypoint.arrival;
  }
  target=null;
  remainingDays=0;
  status.textContent='Putnik je stigao';
  showSelection();
}
function travel(){
  if(target||crossing||!ready||(mist&&!isKnown(selected)))return;
  const steps=plan(selected);
  offRoad=[];
  if(steps.length){
    begin(steps);
    status.textContent='Putnik je na putu';
  }
}

function move(dt){
  let budget=dt/daySeconds;
  while(target && budget>0 && !crossing){
    position.set(target.point.x-party.x,0,target.point.y-party.y);
    const distance=position.length();
    if(distance>.01)heading=Math.atan2(position.x,position.z);
    const spent=Math.min(budget,target.cost-target.progress);
    const progress=target.progress+spent;
    const fraction=target.cost>0?Math.min(1,progress/target.cost):1;
    const x=T.MathUtils.lerp(target.start.x,target.point.x,fraction),z=T.MathUtils.lerp(target.start.y,target.point.y,fraction);
    const side=riverSide(x,z);
    if(!terrainPassable(x,z)){
      target=null;journey=[];showSelection();
      status.textContent='Duboka voda. Potrazi kameni gaz.';
      return;
    }
    if(side!==bank && inFord(z) && target.crossingApproved!==true){
      crossing={side,kind:crossingCount%2?'water':'tracks'};
      element('crossing').hidden=false;
      element('crossing-text').textContent=crossing.kind==='tracks'
        ?'Na drugoj strani se vide svezi tragovi u mulju. Prelaz je plitak.'
        :'Voda je porasla preko kamenja. Polako preko gaza, uz obalu.';
      status.textContent='Putnik zastaje na gazu';
      return;
    }
    if(side!==bank)bank=side;
    target.progress=progress;
    clock+=spent;
    remainingDays=Math.max(0,remainingDays-spent);
    budget-=spent;
    if(Math.hypot(x-party.x,z-party.y)>4){
      const steps=Math.ceil(Math.hypot(x-party.x,z-party.y)/3.5);
      for(let i=1;i<steps;i++)discover(T.MathUtils.lerp(party.x,x,i/steps),T.MathUtils.lerp(party.y,z,i/steps),true);
    }
    party.set(x,z);
    if(fraction<1)break;
    if(target.arrival)origin=target.arrival;
    nextTarget();
  }
}
function zoom(factor) { span=T.MathUtils.clamp(span*factor,16,980);invalidate=true; }
function draw(now) {
  const elapsed=lastFrame?Math.max(0,now-lastFrame):16;
  
  lastFrame=now;
  if(target || invalidate || !reduceMotion.matches) {
    if(lastFrame&&frameSamples.length<60)frameSamples.push(elapsed);
    const dt=Math.min(elapsed/1000,.32);
    move(Math.min(elapsed/1000,.9));
    setSightTime(clock);
    updateClock();
    moveTraveler(party.x,party.y,heading,!!target,dt);
    if(follow)pan.set(party.x,party.y);
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
  element('center').onclick=()=>{
    follow=true;
    span=canvas.clientWidth/canvas.clientHeight<.86?79:48;
    invalidate=true;
  };
  element('light').onclick=()=>{
    mist=!mist;setLight(mist);invalidate=true;
    if(mist&&!isKnown(selected))selected=origin;
    if(!target)status.textContent=mist?'Klikni na teren blizu Putnika da istrazis':'Pregled doline';
    showSelection();
    element('light').setAttribute('aria-pressed',String(mist));
  };
  element('quality').onclick=()=>{
    low=!low;setQuality(low);needsResize=true;invalidate=true;
    element('quality').setAttribute('aria-pressed',String(low));
    element('quality').textContent=low?'Detalji: niski':'Detalji: puni';
    frameSamples=[];
  };
  element('travel').onclick=travel;
  element('crossing-go').onclick=()=>{
    if(!crossing)return;
    target.crossingApproved=true;
    crossing=null;crossingCount++;
    element('crossing').hidden=true;
    status.textContent='Putnik prelazi gaz';
  };
  element('crossing-back').onclick=()=>{
    if(!crossing)return;
    crossing=null;target=null;journey=[];remainingDays=0;
    offRoad.push(new T.Vector2(river(4)+bank*(width(4)+.7),4));
    element('crossing').hidden=true;
    status.textContent='Putnik je zastao na prelazu';
    showSelection();
  };
  canvas.addEventListener('wheel',event=>{event.preventDefault();zoom(Math.exp(Math.sign(event.deltaY)*.16));},{passive:false});
  canvas.addEventListener('pointerdown',event=>{
    if(drag||event.button!==0)return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(drag?.id!==event.pointerId)return;
    if(!drag.moved&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<5)return;
    drag.moved=true;follow=false;
    const units=span/canvas.clientHeight;
    right.setFromMatrixColumn(camera.matrixWorld,0);
    forward.setFromMatrixColumn(camera.matrixWorld,2).setY(0).normalize();
    const dx=(event.clientX-drag.x)*units,dy=(event.clientY-drag.y)*units*1.35;
    pan.x=T.MathUtils.clamp(pan.x-right.x*dx-forward.x*dy,-bounds.x,bounds.x);
    pan.y=T.MathUtils.clamp(pan.y-right.z*dx-forward.z*dy,-bounds.z,bounds.z);
    drag.x=event.clientX;drag.y=event.clientY;invalidate=true;
  });
  canvas.addEventListener('pointerup',event=>{
    if(drag?.id===event.pointerId&&!drag.moved&&!target&&!crossing)exploreAt(event.offsetX,event.offsetY);
  });
  canvas.addEventListener('lostpointercapture',()=>{drag=null;});
  window.addEventListener('resize',()=>{needsResize=true;invalidate=true;});
}

function exploreAt(px,py){
  pointer.set(px/canvas.clientWidth*2-1,1-py/canvas.clientHeight*2);
  ray.setFromCamera(pointer,camera);
  for(let t=0;t<620;t+=.55){
    ray.ray.at(t,contact);
    if(contact.y>height(contact.x,contact.z))continue;
    if(Math.abs(contact.x)>bounds.x||Math.abs(contact.z)>bounds.z)return;
    const destination=new T.Vector2(contact.x,contact.z);
    const length=party.distanceTo(destination);
    if(length<1||length>(mist?sight*.95:48)){status.textContent='Izaberi blizi korak.';return;}
    const sample=new T.Vector2();
    for(let offset=1;offset<=Math.ceil(length);offset++){
      sample.copy(party).lerp(destination,Math.min(1,offset/length));
      if(!terrainPassable(sample.x,sample.y)){status.textContent='Duboka voda. Potrazi kameni gaz.';return;}
    }
    offRoad.push(party.clone());
    begin([{point:destination,arrival:null}]);
    status.textContent='Putnik istrazuje okolinu';
    showSelection();
    return;
  }
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
  home();
  setLight(true);
  element('light').setAttribute('aria-pressed','true');
  ready=true;
  initControls();
  showSelection();
  status.textContent='Klikni na teren blizu Putnika da istrazis';
  globalThis.ravanAudit=()=>({
    ...audit,origin,selected,party:party.toArray(),mist,low,span,pan:pan.toArray(),
    fog:explorationAudit(),bounds,heading,clock,journeyDays,remainingDays,crossing,
    points:Object.fromEntries(places.map(p=>[p.id,screen(p.x,height(p.x,p.z),p.z)])),
    nearby:screen(party.x+12,height(party.x+12,party.y+2),party.y+2),
    deep:screen(river(-31),height(river(-31),-31),-31),
    renderer:renderer.getContext().getParameter(renderer.getContext().RENDERER),
    webgl2:renderer.capabilities.isWebGL2,
    render:{...renderer.info.render},
    frameSamples:[...frameSamples]
  });
  draw(performance.now());
  document.documentElement.dataset.ready='true';
}
init().catch(reportError);
