const assert=require('node:assert/strict');
const path=require('node:path');
const repo=path.resolve(__dirname,'../../..');
const baseSource=path.resolve(process.argv[2]||'phase4-reference/rv42');
const Core=require(path.resolve(baseSource,'src/core.js'));
const World=require(path.resolve(baseSource,'src/overworld.js'));
const Adapter=require(path.resolve(repo,'graphics/phase04/battle-adapter.js'));
let frame,time=0;
global.performance={now:()=>time};
global.requestAnimationFrame=cb=>{frame=cb;return 1};
global.cancelAnimationFrame=()=>{frame=null};
const grad={addColorStop(){}};
const ctx=new Proxy({measureText:()=>({width:40}),createRadialGradient:()=>grad,createLinearGradient:()=>grad},{get:(t,k)=>t[k]??(()=>{})});
function canvas(){return {width:960,height:570,getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:960,height:570})};}
global.document={createElement:canvas};
require(path.resolve(repo,'graphics/gfx-sprint-02/renderer.js'));
const seenKinds=new Set(), biomes=new Set();
for(let i=0;i<30;i++){
 const s=Core.newNarrativeGame('QA','hero','strength');
 s.narrative.node='camp';s.completed.push('opening');Core.meetRadan(s);
 const w=s.overworld=World.create('gfxqa-'+i);World.populate(w);
 w.region=i%3;w.index=w.regions[w.region].exit;
 const group=w.groups.find(g=>g.id===w.region+'-raiders');
 group.index=w.index;group.contact=1;
 w.encounter={id:group.id+':1',group:group.id,index:w.index,region:w.region};
 assert.ok(Core.startBattle(s,'roaming').ok);
 const snapshot=Adapter.snapshot(s.battle);
 biomes.add(snapshot.biome);
 assert.equal(snapshot.covers.length,s.battle.obstacles.length);
 assert.deepEqual(snapshot.terrain.map(({x,y})=>({x,y})),s.battle.terrain.mud);
 for(const unit of snapshot.units.filter(u=>u.team==='enemy'))seenKinds.add(unit.kind);
 const r=global.RavanGraphics.createRenderer(canvas(),{});
 r.reset(snapshot);
 for(const mode of ['flat','angled']){
  r.setMode(mode);
  for(let y=0;y<snapshot.height;y++)for(let x=0;x<snapshot.width;x++){
   const p=r.project({x,y});
   assert.deepEqual(r.hitTest(p.x,p.y),{x,y});
  }
 }
}
assert.equal(seenKinds.size,8);assert.equal(biomes.size,3);
const base={width:11,height:7,active:'a',covers:[],units:[
 {x:1,y:3,id:'a',name:'A',team:'ally',hp:20,hpMax:30,sprite:'figure_guard'},
 {x:4,y:3,id:'b',name:'B',team:'enemy',hp:30,hpMax:30,sprite:'figure_guard'}
]};
const events=[
 {id:'move',type:'move',actor:'a',path:[{x:2,y:3}],result:{}},
 {id:'melee',type:'melee',actor:'a',target:'b',result:{hp:[{id:'b',hp:22,delta:-8}]}},
 {id:'ranged',type:'ranged',actor:'b',target:'a',guarded:true,result:{hp:[{id:'a',hp:16,delta:-4}]}},
 {id:'guard',type:'guard',actor:'a',result:{}},
 {id:'heal',type:'heal',target:'a',result:{hp:[{id:'a',hp:24,delta:8}]}}
];
(async()=>{
 const snapshots=[];
 for(const [speed,reduced] of [[1,false],[3,false],[1,true]]){
  const r=global.RavanGraphics.createRenderer(canvas(),{});
  const contacts=[];
  global.RavanBattleAudio={contact:event=>contacts.push(event.id)};
  r.reset(base);r.setSpeed(speed);r.setReducedMotion(reduced);
  assert.equal(contacts.length,0);
  for(const e of events){
   const pending=r.playEvent(e);
   while(frame){const cb=frame;frame=null;time+=16;cb(time);}
   assert.equal(await pending,'complete');
   assert.equal(await r.playEvent(e),'ignored');
  }
  assert.deepEqual(contacts,events.map(e=>e.id));
  snapshots.push(r.getSnapshot());
 }
 assert.deepEqual(snapshots[1],snapshots[0]);assert.deepEqual(snapshots[2],snapshots[0]);
 console.log('30 generated boards, 8 archetypes, 3 biomes; all cell centers in 2D/2.5D; 5 events × 3 speeds, equal snapshots and one contact per event.');
})().catch(error=>{console.error(error);process.exitCode=1;});
