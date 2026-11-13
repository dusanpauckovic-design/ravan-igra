import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {places, tracks, river, width, noise, random, distanceToPath, mix} from './world.js';

const root = new T.Box3();
const vector = new T.Vector3();
const loader = new GLTFLoader();
const surface = new T.Raycaster(new T.Vector3(),new T.Vector3(0,-1,0),0,100);
const foliage = [];
const riverHeights = new Map();
const ambientAssets = {};
const instances = {};
let shadowRevision = true;
let ground;
export const meshStats = {};
export const scene = new T.Scene();
export const camera = new T.OrthographicCamera();
export const waterUniforms = {time:{value:0},dusk:{value:0}};
const canvas = document.querySelector('#scene');
export const renderer = new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.06;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate=false;

const sun=new T.DirectionalLight('#fff0d2',2.15);
const ambient=new T.HemisphereLight('#a4b6c0','#594731',1.76);
sun.position.set(-57,72,-36);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-72,right:72,top:67,bottom:-68,near:1,far:185});
sun.shadow.camera.updateProjectionMatrix();
sun.shadow.bias=-.00038;
sun.shadow.normalBias=.105;
sun.shadow.radius=2;
scene.add(sun,ambient);
scene.fog=new T.FogExp2('#889a97',.0045);
scene.background=scene.fog.color.clone();

const shaderPreamble = `
float hash21(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float cells(vec2 p) {
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.-2.*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),
             mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
}
float channel(float z) { return 4.*sin(z*.07)+3.5*sin(z*.025+1.8); }
float bankWidth(float z) { return 3.35+.75*sin(z*.088+1.)+.42*sin(z*.24); }
`;

function getAsset(file) {
  const bundled=globalThis.RAVAN_ASSETS?.[file];
  if (bundled) return Promise.resolve(bundled);
  return fetch(file).then(async response=>{
    if (!response.ok) throw Error(`${file} · HTTP ${response.status}`);
    return URL.createObjectURL(await response.blob());
  });
}
async function model(file) {
  const url=await getAsset(file);
  try {
    const result=await loader.loadAsync(url);
    result.scene.updateMatrixWorld(true);
    let triangles=0;
    result.scene.traverse(object=>{
      if (!object.isMesh) return;
      triangles+=(object.geometry.index?.count??object.geometry.attributes.position.count)/3;
    });
    meshStats[file]={
      triangles, size:root.setFromObject(result.scene).getSize(vector).toArray().map(x=>Number(x.toFixed(2)))
    };
    return result.scene;
  } finally {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  }
}

async function texture(file,color=true) {
  const url=await getAsset('assets/'+file+'.webp');
  try {
    const value=await new T.TextureLoader().loadAsync(url);
    value.wrapS=value.wrapT=T.RepeatWrapping;
    value.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    if(color) value.colorSpace=T.SRGBColorSpace;
    return value;
  } finally {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  }
}

export function height(x,z) {
  surface.ray.origin.set(x,32,z);
  return surface.intersectObject(ground,false)[0]?.point.y??-1;
}

function groundMaterial([grass,normal,roughness,forest,rock]) {
  const material = new T.MeshStandardMaterial({color:0xffffff,map:grass,normalMap:normal,roughnessMap:roughness,roughness:1,normalScale:new T.Vector2(.50,.50)});
  material.onBeforeCompile=s=>{
    s.uniforms.forestMap={value:forest};
    s.uniforms.rockMap={value:rock};
    s.vertexShader='varying vec3 vLand; varying vec3 vSlope;\n'+s.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvLand=(modelMatrix*vec4(position,1.)).xyz; vSlope=normal;');
    s.fragmentShader='varying vec3 vLand; varying vec3 vSlope; uniform sampler2D forestMap; uniform sampler2D rockMap;\n'+shaderPreamble+s.fragmentShader.replace('#include <map_fragment>',`
      vec2 p=vLand.xz;
      float fields=cells(p*.11), fine=cells(p*.53);
      vec3 meadow=texture2D(map,p*.29).rgb*.64+texture2D(map,p.yx*.13+.34).rgb*.36;
      vec3 forest=texture2D(forestMap,p*.33+.37).rgb;
      vec3 rock=texture2D(rockMap,p*.21).rgb;
      float beach=1.-smoothstep(bankWidth(p.y)-.5,bankWidth(p.y)+2.15,abs(p.x-channel(p.y))+fine*.7);
      float slope=1.-abs(normalize(vSlope).y);
      float cliffs=smoothstep(.025,.29,slope+fields*.12+max(vLand.y-3.,0.)*.017);
      float clearing=smoothstep(.31,.72,fields+.10*sin(p.x*.18));
      vec3 greens=mix(meadow*vec3(.69,.79,.50),forest*vec3(.50,.61,.49),clearing*.80);
      greens*=.64+fields*.59+fine*.14;
      vec3 stone=mix(rock*vec3(.65,.68,.59),rock*vec3(.75,.79,.75),fields);
      diffuseColor.rgb*=mix(mix(greens,stone,cliffs*.92),mix(stone,forest*.57,.35),beach*.82);
    `);
  };
  return material;
}

function strip(samples,halfWidth,heightAt,material) {
  const vertices=[],uvs=[],indices=[];
  for(let i=0;i<samples.length;i++){
    const [x,z]=samples[i], a=samples[Math.max(0,i-1)],b=samples[Math.min(i+1,samples.length-1)];
    const tangent=new T.Vector2(b[0]-a[0],b[1]-a[1]).normalize();
    const w=halfWidth(z,i);
    for(const side of [-1,1]){
      const xx=x+tangent.y*w*side,zz=z-tangent.x*w*side;
      vertices.push(xx,heightAt(xx,zz,i),zz);
      uvs.push((side+1)/2,i/(samples.length-1));
    }
    if(i){const n=i*2;indices.push(n-2,n,n-1,n-1,n,n+1);}
  }
  const geometry=new T.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
  geometry.computeVertexNormals();
  const mesh=new T.Mesh(geometry,material);
  mesh.receiveShadow=true;
  scene.add(mesh);
  return mesh;
}

export function waterLevel(z) {
  const sample=Math.round(z*2)/2;
  if(!riverHeights.has(sample)) {
    const x=river(sample), edge=width(sample);
    const water=Math.min(height(x-edge,sample),height(x+edge,sample))-.08;
    if(Math.abs(sample-4)<2) {
      riverHeights.set(sample,water-.12*(1-Math.abs(sample-4)/2));
      return riverHeights.get(sample);
    }
    riverHeights.set(sample,water);
  }
  return riverHeights.get(sample);
}

function addWater() {
  const mat=new T.MeshStandardMaterial({color:'#75958f',roughness:.45,metalness:.1,side:T.DoubleSide});
  mat.onBeforeCompile=s=>{
    Object.assign(s.uniforms,waterUniforms);
    s.vertexShader='varying vec3 vWater;\n'+s.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvWater=position;');
    s.fragmentShader='varying vec3 vWater; uniform float time; uniform float dusk;\n'+shaderPreamble+s.fragmentShader
      .replace('#include <color_fragment>',`#include <color_fragment>
        vec2 p=vWater.xz;
        float edge=abs(p.x-channel(p.y))/bankWidth(p.y);
        float r=cells(vec2(p.x*3.4,p.y*1.2-time*.9));
        float q=cells(vec2(p.x*1.6,p.y*3.+time*.6));
        float waves=.5+.5*sin(p.y*6.2+sin(p.x*2.1+r*4.)*1.9+q*2.7-time*1.8);
        vec3 deep=vec3(.056,.12,.122), shallow=vec3(.15,.235,.197);
        float glint=pow(waves,8.)*(.17+.83*r)*.075;
        float seam=pow(waves,4.)*smoothstep(.67,.98,edge)*.075;
        diffuseColor.rgb=mix(deep,shallow,smoothstep(.36,.97,edge))+
          vec3(.74,.86,.81)*(glint+seam);
        diffuseColor.rgb*=1.-dusk*.19;`);
  };
  const samples=Array.from({length:251},(_,i)=>{const z=-62.85+i*125.7/250;return [river(z),z]});
  strip(samples,z=>width(z)*1.045,(x,z,i)=>waterLevel(samples[i][1]),mat);
}

function addRoads(dirt) {
  const road=new T.MeshStandardMaterial({color:'#ab9678',map:dirt,side:T.DoubleSide,roughness:1,polygonOffset:true,polygonOffsetFactor:-1,transparent:true,alphaTest:.06});
  road.onBeforeCompile=s=>{
    s.vertexShader='varying vec3 vRoad; varying vec2 vTrack;\n'+s.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvRoad=position; vTrack=uv;');
    s.fragmentShader='varying vec3 vRoad; varying vec2 vTrack;\n'+shaderPreamble+s.fragmentShader
      .replace('#include <map_fragment>',`diffuseColor.rgb *= texture2D(map,vRoad.xz*.48).rgb*1.52;`)
      .replace('#include <alphatest_fragment>',`
        float wet=abs(vRoad.x-channel(vRoad.z));
        float fray=cells(vRoad.xz*1.8);
        diffuseColor.a*=(.83*(1.-smoothstep(.17,.50,abs(vTrack.x-.5)+fray*.16)))*smoothstep(bankWidth(vRoad.z)*.66,bankWidth(vRoad.z)*1.09,wet);
        #include <alphatest_fragment>`);
  };
  for(const [a,b,points] of tracks){
    const samples=[];
    for(let i=1;i<points.length;i++){
      const p=points[i-1],q=points[i],steps=Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])*3);
      for(let j=0;j<steps;j++) samples.push([mix(p[0],q[0],j/steps),mix(p[1],q[1],j/steps)]);
    }
    samples.push(points.at(-1));
    strip(samples,(z,i)=>.69+noise(i*.09,z*.1)*.48,(x,z)=>height(x,z)+.041,road);
  }
}

function addModel(key,x,z,scale,yaw,lift=0,squash=1) {
  const source=ambientAssets[key];
  const object=source.clone(true);
  const minY=root.setFromObject(source).min.y;
  object.name=key;
  object.position.set(x,height(x,z)-minY*scale*squash+lift,z);
  if(key==='rock'){
    const center=root.getCenter(vector).multiplyScalar(scale).applyAxisAngle(new T.Vector3(0,1,0),yaw);
    object.position.x-=center.x;
    object.position.z-=center.z;
    object.position.y-=scale*.47;
  }
  object.scale.set(scale,scale*squash,scale);
  object.rotation.y=yaw;
  object.traverse(piece=>{
    if(!piece.isMesh) return;
    piece.castShadow=true;
    piece.receiveShadow=true;
    if(key==='rock') piece.material.side=T.DoubleSide;
  });
  scene.add(object);
  instances[key]=(instances[key]??0)+1;
  return object;
}

function buildCamp() {
  addModel('hut',-27.7,-15.4,1.55,.38,-.22);
  addModel('house',-23.5,-12.2,1.65,1.35,-.17);
  addModel('granary',-26.0,-7.9,1.17,.45,-.12);
  addModel('hearth',-28.1,-11.4,1.28,-.37,-.06);
  for(let i=0;i<3;i++)addModel('palisade',-31.4+i*.28,-15.8+i*2.9,1.28,Math.PI/2-.08,-.20);
  addModel('hut',17.1,11.4,1.17,-.85,-.12);
  addModel('granary',19.4,10.6,.88,.45,-.16);
  addModel('hearth',18.6,8.9,.78,.77,-.10);
  const fire = new T.PointLight('#ffae55',22,8,2);
  fire.position.set(-28.1,height(-28.1,-11.4)+1.12,-11.4);
  scene.add(fire);
}
function scatter(key,placements,base=ambientAssets[key]) {
  const minY=root.setFromObject(base).min.y;
  base.updateMatrixWorld(true);
  base.traverse(source=>{
    if(!source.isMesh) return;
    const inst=new T.InstancedMesh(source.geometry,source.material,placements.length);
    inst.name=key;
    inst.castShadow=true;
    inst.receiveShadow=true;
    for(let i=0;i<placements.length;i++){
      const [x,z,scale,yaw,tint]=placements[i];
      const dummy=new T.Object3D();
      dummy.position.set(x,height(x,z)-minY*scale-.16,z);
      dummy.rotation.y=yaw;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      inst.setMatrixAt(i,dummy.matrix.multiply(source.matrixWorld));
      inst.setColorAt(i,new T.Color().setRGB(tint,tint*1.025,tint*.94));
    }
    inst.computeBoundingSphere();
    foliage.push({inst,total:placements.length});
    scene.add(inst);
  });
  instances[key]=(instances[key]??0)+placements.length;
}

function fordStones() {
  const variants=ambientAssets.stones.children;
  for(let i=0;i<variants.length;i++){
    const variant=variants[i].clone(true);
    variant.position.set(0,0,0);
    const box=new T.Box3().setFromObject(variant);
    const dims=box.getSize(new T.Vector3());
    const scale=(.64+random(i,7)*.24)/Math.max(dims.x,dims.z);
    const z=4+random(i,9)*1.3-.65;
    const x=river(z)-width(z)+i*width(z)*2/(variants.length-1);
    variant.position.set(x,Math.max(height(x,z),waterLevel(z))-.035-box.min.y*scale*.55,z);
    variant.scale.set(scale,scale*.55,scale);
    variant.rotation.y=random(i,2)*6.28;
    variant.receiveShadow=true;
    scene.add(variant);
  }
  instances.stones=variants.length;
}

function buildNature() {
  for(const [x,z,scale,rot,lift,flatten] of [
    [-42,24,3.1,.6,-1.15,1.45],[-43,31,3.3,1.3,-1.7,1.55],[-35,37,3.5,2.1,-1.8,1.5],
    [-22,42,2.0,-.1,-2,1.1],[-28,32,.87,1.2,-.52,1.05],[-39,24,.78,1.7,-.4,1],
    [41,31,3.4,2.45,-1.25,1.28],[35,36,2.5,2.24,-1.85,1.18],[48,31,2.33,1.78,-1.75,1],
    [54,38,3.5,1.23,-2.35,1.4],[-43,16,2.5,.8,-1.25,1.35],[-45,18,2.6,.88,-1.6,1.5],
    [-41,-19,.91,.3,-.55,1],[26,-26,.72,1.9,-.65,1],[32,-21,.41,1.8,-.36,1],
    [8,13,.48,2.5,-.52,1],[2,-9,.48,.8,-.5,1],[-1,-23,.42,.2,-.34,1],[-7,7,.45,1.3,-.41,1],
    [18,36,1.31,.75,-1.8,1.36],[9,49,2.4,.15,-2.6,1.2],[-8,55,3.6,.34,-2.8,1.3]
  ])addModel('rock',x,z,scale,rot,lift,flatten);
  const pine=[],fern=[];
  const groups=[
    [-34,-26,13,11,56],[-17,-37,12,17,41],[-52,-6,10,20,36],
    [30,-23,13,14,65],[44,-12,13,25,43],[17,-39,10,15,39],
    [-13,24,10,12,39],[15,28,11,14,45],[49,21,14,15,32],
    [-45,47,20,13,22],[21,49,20,11,25],[37,-49,23,13,26]
  ];
  let seed=0;
  for(const [gx,gz,sx,sz,count] of groups){
    for(let i=0;i<Math.floor(count*.69);i++){
      seed++;
      const a=random(seed,1)*6.283, r=Math.sqrt(random(seed,2));
      const x=gx+Math.cos(a)*r*sx,z=gz+Math.sin(a)*r*sz;
      const riverDistance=Math.abs(x-river(z));
      const nearCamp=Math.hypot(x+26,z+12)<8.7 || Math.hypot(x-18,z-10)<5;
      const atPlace=places.some(p=>Math.hypot(x-p.x,z-p.z)<5.2);
      if(nearCamp||atPlace||riverDistance<width(z)+2.0||distanceToPath(x,z)<2.0) continue;
      const scale=2.75+random(seed,3)*4.5;
      pine.push([x,z,scale,a,.67+random(seed,4)*.31]);
    }
  }
  for(let i=0;i<95;i++){
    const z=-53+random(i,7)*105;
    const x=river(z)+(i%2?-1:1)*(width(z)+.65+random(i,8)*7.5);
    if(distanceToPath(x,z)<1.15)continue;
    fern.push([x,z,.45+random(i,12)*1.26,random(i,4)*6.28,.62+random(i,3)*.35]);
  }
  const variants=ambientAssets.pine.children;
  for (let i=0;i<variants.length;i++) {
    const trees=pine.filter((_,index)=>index%variants.length===i);
    const variant=new T.Group();
    variant.add(variants[i].clone(true));
    scatter('pine',trees,variant);
  }
  const fernVariant=new T.Group();
  const fernMesh=ambientAssets.fern.getObjectByName('Plane.006');
  if (fernMesh) {
    fernVariant.add(fernMesh.clone(true));
    scatter('fern',fern,fernVariant);
  } else {
    scatter('fern',fern,ambientAssets.fern);
  }
}

export async function loadScene() {
  const inputs={
    terrain:'Ravan_Originalni_Teren_Dolina.glb',hut:'assets/23199.glb',house:'assets/23200.glb',
    granary:'assets/23202.glb',hearth:'assets/23206.glb',palisade:'assets/23197.glb',
    rock:'assets/rock_face_02.glb',stones:'assets/rock_moss_set_01.glb',pine:'assets/pine.glb',fern:'assets/fern_02.glb'
  };
  const [,maps]=await Promise.all([
    Promise.all(Object.entries(inputs).map(async ([key,url])=>{ambientAssets[key]=await model(url);})),
    Promise.all([texture('ground-color'),texture('ground-normal',false),texture('ground-rough',false),texture('forest-floor'),texture('rock-ground')])
  ]);
  ground=ambientAssets.terrain.getObjectByName('Ravan_Dolina_Original_Terrain');
  if(!ground?.isMesh) throw Error('Originalni teren nije pronadjen u GLB-u.');
  ground.geometry.computeVertexNormals();
  const pos=ground.geometry.attributes.position,uv=[];
  for(let i=0;i<pos.count;i++)uv.push(pos.getX(i)*.32,pos.getZ(i)*.32);
  ground.geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  ground.material=groundMaterial(maps);
  ground.receiveShadow=true;
  const originalRiver=ambientAssets.terrain.getObjectByName('Ravan_Reka_Original');
  originalRiver.visible=false;
  scene.add(ambientAssets.terrain);
  addWater();
  addRoads(maps[3]);
  buildNature();
  fordStones();
  buildCamp();
  return {meshes:meshStats,instances};
}

export function setLight(mist) {
  sun.intensity=mist?1.13:2.15;
  sun.color.set(mist?'#c1d4dc':'#fff0d2');
  ambient.intensity=mist?1.89:1.76;
  ambient.color.set(mist?'#9cb1ba':'#a4b6c0');
  scene.fog.color.set(mist?'#788d91':'#889a97');
  scene.fog.density=mist?.0105:.0045;
  scene.background.copy(scene.fog.color);
  renderer.toneMappingExposure=mist?.89:1.06;
  waterUniforms.dusk.value=mist?1:0;
}
export function setQuality(low) {
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,low?1:1.5));
  for(const {inst,total} of foliage)inst.count=Math.floor(total*(low?.56:1));
  renderer.shadowMap.enabled=!low;
  shadowRevision=true;
}
export function render(time) {
  if(shadowRevision){renderer.shadowMap.needsUpdate=true;shadowRevision=false;}
  waterUniforms.time.value=time;
  renderer.render(scene,camera);
}
