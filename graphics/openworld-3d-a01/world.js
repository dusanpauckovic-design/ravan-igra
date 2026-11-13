// Terrain, river and landmark IDs are inherited from Demo A.
// Anchor the ford marker over the centre of the existing channel.
export const river = z => 4*Math.sin(z*.07)+3.5*Math.sin(z*.025+1.8);
function riverAtFord() { return river(4); }
export const places = [
  {id:'camp', title:'Stari logor', kind:'Zaklon', x:-26, z:-12, info:'Ognjiste pod stenama i zaklon za putnike.'},
  {id:'ford', title:'Recni prelaz', kind:'Gaz', x:riverAtFord(), z:4, info:'Plitak prelaz spaja dve obale. Staza ga prati iz logora.'},
  {id:'grove', title:'Sumsko svetiliste', kind:'Suma', x:30, z:-19, info:'Staza kroz borove vodi do mirne cistine iznad reke.'},
  {id:'ridge', title:'Kameni prevoj', kind:'Visija', x:-29, z:29, info:'Prolaz izmedju stena otvara pogled niz dolinu.'},
  {id:'quarry', title:'Zaboravljena pecina', kind:'Orijentir', x:35, z:30, info:'U senci kamenog zida zavrsava se staza s istocne obale.'}
];

export const mix = (a,b,t) => a+(b-a)*t;
const fract = v => v-Math.floor(v);
export const random = (x,z) => fract(Math.sin(x*127.1+z*311.7)*43758.5453123);
export function noise(x,z) {
  const a=Math.floor(x), b=Math.floor(z);
  const smooth=t=>t*t*(3-2*t);
  const u=smooth(x-a),v=smooth(z-b);
  return mix(mix(random(a,b),random(a+1,b),u),mix(random(a,b+1),random(a+1,b+1),u),v);
}
export const width = z => 3.35 + .75*Math.sin(z*.088+1) + .42*Math.sin(z*.24);
const fordZ=places[1].z;
const point=(x,z)=>[x,z];
const cross=offset=>point(river(fordZ)+offset,fordZ);

export const tracks = [
  ['camp','ford',[point(-26,-12),point(-23,-8),point(-17,-6),point(-12,-1),cross(-5),cross(-2),cross(0)]],
  ['ford','grove',[cross(0),cross(4),point(14,3),point(20,-1),point(23,-10),point(30,-19)]],
  ['camp','ridge',[point(-26,-12),point(-30,-5),point(-34,1),point(-32,11),point(-35,18),point(-33,24),point(-29,29)]],
  ['ford','quarry',[cross(0),cross(4),point(13,7),point(18,13),point(21,22),point(28,25),point(35,30)]],
  ['grove','quarry',[point(30,-19),point(35,-10),point(34,2),point(30,10),point(30,21),point(35,30)]]
];

export function distanceToPath(x,z) {
  let nearest=Infinity;
  for (const [, , path] of tracks) {
    for (let i=1;i<path.length;i++) {
      const [ax,az]=path[i-1], [bx,bz]=path[i];
      const dx=bx-ax,dz=bz-az;
      const t=Math.min(1,Math.max(0,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));
      nearest=Math.min(nearest,Math.hypot(x-ax-dx*t,z-az-dz*t));
    }
  }
  return nearest;
}

export function routeBetween(from,to) {
  const queue=[[from,[]]];
  const seen=new Set([from]);
  while (queue.length) {
    const [at,route]=queue.shift();
    if (at===to) return route;
    for (const [a,b,points] of tracks) {
      if (at!==a && at!==b) continue;
      const next=at===a?b:a;
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push([next,[...route,{next,points:at===a?points:[...points].reverse()}]]);
    }
  }
  return [];
}
