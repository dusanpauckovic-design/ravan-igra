import * as T from 'three';
import {bounds, places, heightProfile, noise, riverSide, inChannel, inFord} from './world.js';

export const sight=19;
const size=256;
const stride=2;
const sectors=96;
const cells=new Uint8Array(size*size);
const visible=new Uint8Array(size*size);
const known=new Set(['camp']);
const map=new T.DataTexture(cells,size,size,T.RedFormat);
const live=new T.DataTexture(visible,size,size,T.RedFormat);
for(const tex of [map,live]){
  tex.minFilter=tex.magFilter=T.LinearFilter;
  tex.needsUpdate=true;
}
const point=new T.Vector2();
const last=new T.Vector2(Infinity,Infinity);
const enabled={value:1};
const fogRange={value:sight};
const rim=new Float32Array(sectors);
let bank=0;
let visibleCells=[];
let timeOfDay=0;

export function setSightTime(days){
  timeOfDay=days%1;
  fogRange.value=sight*(1-.33*Math.max(0,Math.cos(timeOfDay*Math.PI*2)));
}
function worldToCell(x,z){
  return [(x+bounds.x)/(bounds.x*2)*size-.5,(z+bounds.z)/(bounds.z*2)*size-.5];
}
function reveal(x,z,recordOnly=false){
  if(!bank||!inChannel(x,z))bank=riverSide(x,z);
  const side=bank;
  const maxSight=fogRange.value;
  const base=heightProfile(x,z)+2.55;
  for(let i=0;i<sectors;i++){
    const angle=i*2*Math.PI/sectors;
    const dx=Math.cos(angle),dz=Math.sin(angle);
    const reach=maxSight+3.2*noise(x*.07+dx*3,z*.07+dz*3);
    rim[i]=reach;
    for(let d=stride;d<reach;d+=stride){
      const xx=x+dx*d,zz=z+dz*d;
      // A bank can be surveyed up to the water. Beyond it is discovered from the far bank.
      if(riverSide(xx,zz)!==side && !(inFord(zz)&&inChannel(xx,zz))){
        rim[i]=d;break;
      }
      const delta=heightProfile(xx,zz)-base;
      if(d>4&&delta>.13*d){rim[i]=d+1;break;}
    }
  }
  if(!recordOnly){
    for(const index of visibleCells)visible[index]=0;
    visibleCells=[];
  }
  const [px,pz]=worldToCell(x,z);
  const rx=(sight+4)*size/(bounds.x*2),rz=(sight+4)*size/(bounds.z*2);
  for(let row=Math.max(0,Math.floor(pz-rz));row<Math.min(size,pz+rz);row++){
    const dz=(row-pz)*2*bounds.z/size;
    for(let col=Math.max(0,Math.floor(px-rx));col<Math.min(size,px+rx);col++){
      const dx=(col-px)*2*bounds.x/size;
      const angle=(Math.atan2(dz,dx)+2*Math.PI)%(2*Math.PI)*sectors/(2*Math.PI);
      const i=Math.floor(angle);
      const reach=T.MathUtils.lerp(rim[i],rim[(i+1)%sectors],angle-i);
      const distance=Math.hypot(dx,dz);
      const value=Math.round(T.MathUtils.clamp((reach-distance)/2.35,0,1)*255);
      if(value===0)continue;
      const index=row*size+col;
      cells[index]=Math.max(cells[index],value);
      if(!recordOnly){
        visible[index]=value;
        visibleCells.push(index);
      }
    }
  }
  map.needsUpdate=true;
  if(!recordOnly)live.needsUpdate=true;
  for(const place of places){
    const [a,b]=worldToCell(place.x,place.z);
    if(cells[Math.round(b)*size+Math.round(a)]>138)known.add(place.id);
  }
}

export function discover(x,z,recordOnly=false){
  if(recordOnly){reveal(x,z,true);return;}
  point.set(x,z);
  if(last.distanceToSquared(point)<1.44)return;
  last.copy(point);
  reveal(x,z);
}
export const isKnown=id=>known.has(id);
export const setExploration=value=>{enabled.value=Number(value);};
export const explorationAudit=()=>({enabled:!!enabled.value,center:point.toArray(),known:[...known],radius:sight,bank,visibleCells:visibleCells.length});

export function veil(material){
  const compile=material.onBeforeCompile;
  const cacheKey=material.customProgramCacheKey();
  material.customProgramCacheKey=()=>cacheKey+'-exploration';
  material.onBeforeCompile=function(shader,renderer){
    compile.call(this,shader,renderer);
    shader.uniforms.exploredMap={value:map};
    shader.uniforms.currentSight={value:live};
    shader.uniforms.explorationOn=enabled;
    shader.uniforms.fogOrigin={value:point};
    shader.uniforms.fogRange=fogRange;
    shader.vertexShader='varying vec2 vExplore;\n'+shader.vertexShader.replace('#include <project_vertex>',`
      vec4 explorationVertex=vec4(transformed,1.);
      #ifdef USE_INSTANCING
        explorationVertex=instanceMatrix*explorationVertex;
      #endif
      vExplore=(modelMatrix*explorationVertex).xz;
      #include <project_vertex>`);
    shader.fragmentShader=`varying vec2 vExplore;
      uniform sampler2D exploredMap;
      uniform sampler2D currentSight;
      uniform float explorationOn;
      uniform vec2 fogOrigin;
      uniform float fogRange;
    `+shader.fragmentShader.replace('#include <fog_fragment>',`#include <fog_fragment>
      if(explorationOn>.5){
        vec2 uv=vExplore/vec2(${(bounds.x*2).toFixed(3)},${(bounds.z*2).toFixed(3)})+.5;
        float memory=texture2D(exploredMap,uv).r;
        float sight=texture2D(currentSight,uv).r;
        float distanceFromTraveler=length(vExplore-fogOrigin);
        float airDistance=max(0.,distanceFromTraveler-fogRange*.35);
        float wisps=sin(vExplore.x*.10+sin(vExplore.y*.073)*1.8)*
                    cos(vExplore.y*.12+sin(vExplore.x*.062));
        float density=mix(.023,.017,memory)*mix(1.18,1.,fogRange/19.)*(1.+wisps*.12);
        float haze=1.-exp(-airDistance*density);
        float obstruction=(1.-sight)*smoothstep(3.,fogRange,distanceFromTraveler)*.10;
        vec3 mist=mix(vec3(.60,.66,.65),vec3(.63,.69,.68),wisps*.5+.5);
        gl_FragColor.rgb=mix(gl_FragColor.rgb,mist,min(.98,haze+obstruction*(1.-haze)));
      }`);
  };
}
