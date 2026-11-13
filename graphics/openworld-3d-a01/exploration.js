import * as T from 'three';
import {bounds, places} from './world.js';

export const sight=34;
const size=256;
const cells=new Uint8Array(size*size);
const known=new Set(['camp']);
const map=new T.DataTexture(cells,size,size,T.RedFormat);
map.minFilter=map.magFilter=T.LinearFilter;
map.needsUpdate=true;
const point=new T.Vector2();
const enabled={value:0};

export function discover(x,z){
  point.set(x,z);
  const px=(x+bounds.x)/(bounds.x*2)*size-.5;
  const pz=(z+bounds.z)/(bounds.z*2)*size-.5;
  const rx=sight*size/(bounds.x*2), rz=sight*size/(bounds.z*2);
  let changed=false;
  for(let row=Math.max(0,Math.floor(pz-rz));row<Math.min(size,pz+rz);row++){
    for(let col=Math.max(0,Math.floor(px-rx));col<Math.min(size,px+rx);col++){
      const index=row*size+col;
      const distance=Math.hypot((col-px)/rx,(row-pz)/rz);
      const value=Math.max(0,Math.min(255,(1-distance)*1275));
      if(value<=cells[index])continue;
      cells[index]=value;
      changed=true;
    }
  }
  if(changed)map.needsUpdate=true;
  for(const place of places)if(Math.hypot(x-place.x,z-place.z)<sight*.91)known.add(place.id);
}
export const isKnown=id=>known.has(id);
export const setExploration=value=>{enabled.value=Number(value);};
export const explorationAudit=()=>({enabled:!!enabled.value,center:point.toArray(),known:[...known],radius:sight});

export function veil(material){
  const compile=material.onBeforeCompile;
  const cacheKey=material.customProgramCacheKey();
  material.customProgramCacheKey=()=>cacheKey+'-exploration';
  material.onBeforeCompile=function(shader,renderer){
    compile.call(this,shader,renderer);
    shader.uniforms.exploredMap={value:map};
    shader.uniforms.travelerCenter={value:point};
    shader.uniforms.explorationOn=enabled;
    shader.vertexShader='varying vec2 vExplore;\n'+shader.vertexShader.replace('#include <project_vertex>',`
      vec4 explorationVertex=vec4(transformed,1.);
      #ifdef USE_INSTANCING
        explorationVertex=instanceMatrix*explorationVertex;
      #endif
      vExplore=(modelMatrix*explorationVertex).xz;
      #include <project_vertex>`);
    shader.fragmentShader=`varying vec2 vExplore;
      uniform sampler2D exploredMap;
      uniform vec2 travelerCenter;
      uniform float explorationOn;
    `+shader.fragmentShader.replace('#include <fog_fragment>',`#include <fog_fragment>
      if(explorationOn>.5){
        vec2 uv=vExplore/vec2(${(bounds.x*2).toFixed(3)},${(bounds.z*2).toFixed(3)})+.5;
        float explored=texture2D(exploredMap,uv).r;
        float drift=sin(vExplore.x*.17+sin(vExplore.y*.15)*1.2)*2.9+sin(vExplore.y*.38)*1.55;
        float visible=smoothstep(22.,36.,length(vExplore-travelerCenter)+drift);
        vec3 veilColor=mix(vec3(.116,.151,.156),vec3(.245,.285,.273),explored);
        float depth=mix(.98,.52,explored)*visible;
        gl_FragColor.rgb=mix(gl_FragColor.rgb,veilColor,depth);
      }`);
  };
}
