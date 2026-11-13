// Terrain, river and landmark IDs are inherited from Demo A.
// Anchor the ford marker over the centre of the existing channel.
export const bounds={x:156*144/112,z:140*126/100};
const clamp=(value,a,b)=>Math.min(b,Math.max(a,value));
const smooth=t=>t*t*(3-2*t);
export const river = z => 4*Math.sin(z*.07)+3.5*Math.sin(z*.025+1.8)+
  smooth(clamp((Math.abs(z)-63)/60,0,1))*(20*Math.sin(z*.032)+10*Math.sin(z*.067));
export const channelGLSL='4.*sin(z*.07)+3.5*sin(z*.025+1.8)+smoothstep(63.,123.,abs(z))*(20.*sin(z*.032)+10.*sin(z*.067))';
function riverAtFord() { return river(4); }
export const places = [
  {id:'camp', title:'Stari logor', kind:'Zaklon', x:-26, z:-12, info:'Ognjiste pod stenama i zaklon za putnike.'},
  {id:'ford', title:'Recni prelaz', kind:'Gaz', x:riverAtFord(), z:4, info:'Plitak prelaz spaja dve obale. Staza ga prati iz logora.'},
  {id:'grove', title:'Sumsko svetiliste', kind:'Suma', x:30, z:-19, info:'Staza kroz borove vodi do mirne cistine iznad reke.'},
  {id:'ridge', title:'Kameni prevoj', kind:'Visija', x:-29, z:29, info:'Prolaz izmedju stena otvara pogled niz dolinu.'},
  {id:'quarry', title:'Zaboravljena pecina', kind:'Orijentir', x:35, z:30, info:'U senci kamenog zida zavrsava se staza s istocne obale.'},
  {id:'watch',title:'Severna straza',kind:'Vidikovac',x:-99,z:91,info:'Sa kamenog grebena vidi se put kroz severni kraj doline.'},
  {id:'marsh',title:'Mokre livade',kind:'Obala',x:33,z:-111,info:'Trska i niska obala prate veliki zavoj reke.'},
  {id:'east',title:'Istocni zaseok',kind:'Naselje',x:104,z:75,info:'Nekoliko kuca sklonjeno je iza sumovitog brda.'},
  {id:'wood',title:'Stara suma',kind:'Suma',x:-107,z:-82,info:'Zapadna staza se gubi izmedju starih borova.'},
  {id:'spring',title:'Hladni izvor',kind:'Izvor',x:48,z:136,info:'Pod stenom izbija hladna voda iz visokog dela doline.'},
  {id:'pasture',title:'Juzni pasnjak',kind:'Cistina',x:-56,z:-140,info:'Otvorena livada na zapadnoj obali.'}
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
export const width = z => 3.35+.75*Math.sin(z*.088+1)+.42*Math.sin(z*.24)+2.7*smooth(clamp((Math.abs(z)-65)/70,0,1));
const mounds=[
    [-123,98,55,37,27],[-151,123,42,29,21],[-113,123,27,45,20],
    [124,107,58,43,23],[150,137,32,41,24],[87,139,30,37,14],
    [-141,-56,37,55,21],[-142,-95,32,38,15],
    [125,-77,46,37,16],[147,-102,34,42,14],
    [-128,20,32,35,14],[113,20,39,42,13]
  ];
export function heightProfile(x,z){
  const noiseFloor=(noise(x*.065,z*.065)-.5)*2.15+(noise(x*.13+17,z*.13+25)-.5)*.8;
  const oldRidge=clamp((z-16)/48,0,1)**1.35*15.5+clamp((-x-39)/28,0,1)**1.65*10;
  const edge=smooth(clamp(Math.max((Math.abs(x)-72)/36,(Math.abs(z)-63)/37),0,1));
  const farBank=Math.abs(x-river(z));
  if(edge===0)return noiseFloor+oldRidge-2.6*Math.exp(-((farBank/6.7)**2))-1.2;
  let ridges=0;
  for(const [cx,cz,rx,rz,rise] of mounds){
    const nx=(x-cx+(z-cz)*.26)/rx,nz=(z-cz)/rz;
    const profile=Math.max(0,1-Math.hypot(nx,nz)*.65);
    ridges+=rise*profile**2.3;
  }
  const patch=noise(x*.047+18,z*.039)*.63+noise(x*.092,z*.091+11)*.37;
  const foothills=(noise(x*.021+3,z*.022+9)-.42)*5;
  const riverBench=smooth(clamp((farBank-12)/43,0,1));
  const heights=edge*(ridges*(.78+patch*.42)+foothills*2)*riverBench;
  const old=oldRidge*(1-edge*.96);
  const cut=(2.6+edge*3.7)*Math.exp(-((farBank/(6.7+edge*4))**2));
  return noiseFloor+old+heights-cut-1.2;
}
const fordZ=places[1].z;
const point=(x,z)=>[x,z];
const cross=offset=>point(river(fordZ)+offset,fordZ);

export const tracks = [
  ['camp','ford',[point(-26,-12),point(-23,-8),point(-17,-6),point(-12,-1),cross(-5),cross(-2),cross(0)]],
  ['ford','grove',[cross(0),cross(4),point(14,3),point(20,-1),point(23,-10),point(30,-19)]],
  ['camp','ridge',[point(-26,-12),point(-30,-5),point(-34,1),point(-32,11),point(-35,18),point(-33,24),point(-29,29)]],
  ['ford','quarry',[cross(0),cross(4),point(13,7),point(18,13),point(21,22),point(28,25),point(35,30)]],
  ['grove','quarry',[point(30,-19),point(35,-10),point(34,2),point(30,10),point(30,21),point(35,30)]],
  ['ridge','watch',[point(-29,29),point(-35,42),point(-45,48),point(-59,51),point(-66,64),point(-66,76),point(-78,84),point(-90,85),point(-99,91)]],
  ['camp','wood',[point(-26,-12),point(-36,-16),point(-50,-26),point(-63,-34),point(-72,-46),point(-86,-57),point(-94,-68),point(-107,-82)]],
  ['wood','pasture',[point(-107,-82),point(-105,-95),point(-95,-106),point(-84,-121),point(-70,-131),point(-56,-140)]],
  ['grove','marsh',[point(30,-19),point(40,-30),point(49,-45),point(43,-59),point(38,-72),point(38,-84),point(40,-99),point(33,-111)]],
  ['quarry','east',[point(35,30),point(43,42),point(54,48),point(66,51),point(78,59),point(89,70),point(104,75)]],
  ['east','spring',[point(104,75),point(97,90),point(87,101),point(79,112),point(66,120),point(55,129),point(48,136)]]
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

export const riverSide=(x,z)=>Math.sign(x-river(z));
export const inChannel=(x,z)=>Math.abs(x-river(z))<width(z)*1.025;
export const inFord=z=>Math.abs(z-4)<=2.6;
export const terrainPassable=(x,z)=>!inChannel(x,z)||inFord(z);

// Fractions of a game day. The direct route through the gaz to the wetlands is about two days.
export function travelDays(from,to){
  const [x,z]=from,[xx,zz]=to;
  const middleZ=(z+zz)/2,middleX=(x+xx)/2;
  const slope=Math.abs(heightProfile(xx,zz)-heightProfile(x,z));
  const riverFactor=inChannel(middleX,middleZ)?1.45:1;
  const wetFactor=middleZ< -76&&Math.abs(middleX-river(middleZ))<33?1.20:1;
  return (Math.hypot(xx-x,zz-z)*riverFactor*wetFactor+slope*1.8)/110;
}
