(async()=>{
 if(window.__finishStarted||!window.RavanBattleAudio)return;
 window.__finishStarted=true;
 const checks=[], wait=ms=>new Promise(r=>setTimeout(r,ms));
 const check=(name,ok)=>{checks.push({name,ok:!!ok});if(!ok)throw Error(name);};
 const $=s=>document.querySelector(s);
 const click=s=>{const e=$(s);if(!e)throw Error('Nema '+s);e.click();};
 const select=id=>click('[data-act=v4-skill-select][data-id='+id+']');
 const ids=()=>[...document.querySelectorAll('.rv20-node')].map(x=>x.dataset.id);
 const c=RavanCore,w=RavanOverworld;
 const s=c.newNarrativeGame('Putnik QA','hero','strength');
 s.narrative.node='camp';s.completed.push('opening');
 s.overworld=w.create('grafika-42');s.screen='skills';
 try{
  RavanDebug.setState(s);await wait(100);
  check('Tri osnove bez magije',ids().length===3&&!ids().includes('bolt'));
  select('marksmanship');const points=RavanDebug.state.skillPoints;
  click('[data-rv20-plan]');
  check('Plan ne trosi poene',RavanDebug.state.skillPoints===points&&!!$('.rv20-plan p'));
  click('[data-act=v4-learn]');
  check('Kupovina se vidi u engine-u i skida plan',RavanDebug.state.skills.includes('marksmanship')&&!$('.rv20-plan p'));
  const t=RavanDebug.state;
  t.narrative.magicUnlocked=true;RavanDebug.render();
  check('Magija se pojavljuje nakon obuke',ids().includes('bolt')&&$('.rv20-reveal'));
  RavanDebug.render();
  check('Ponovni render ne ponavlja otkrivanje',!$('.rv20-reveal'));
  t.tier=2;t.roster[0].level=3;RavanDebug.render();
  check('Prva specijalizacija bez mastery',ids().includes('charge')&&!ids().includes('precision'));
  t.roster[0].level=4;RavanDebug.render();
  check('Razvijeno stablo i citljiv prikaz',ids().includes('precision')&&document.documentElement.scrollWidth<=innerWidth);
  c.worldSnapshot(t);
  RavanDebug.render();
  const reset=c.skillResetPreview(t);
  if(reset.ok){
   click('[data-act=v4-respec]');click('[data-act=v4-respec-confirm]');
   check('Respec koristi potvrdu i uklanja kupljenu vestinu',!RavanDebug.state.skills.includes('marksmanship'));
  }
  t.screen='map';w.populate(t.overworld);
  const group=t.overworld.groups.find(g=>g.id==='0-raiders');group.index=t.overworld.index;group.contact=1;
  t.overworld.encounter={id:group.id+':1',group:group.id,index:t.overworld.index,region:0};
  RavanDebug.setState(t);
  await wait(110);
  check('Kontakt vidljiv u pinovanom UI-19',!!$('.rv19-stage')&&!!$('[data-act=ow-fight]'));
  click('[data-act=ow-fight]');await wait(220);
  if(!RavanCombat.renderer)click('[data-act=live-gfx-toggle]');
  for(let i=0;i<20&&!RavanCombat.renderer;i++)await wait(70);
  const battle=RavanDebug.state.battle, renderer=RavanCombat.renderer;
  await renderer.ready;
  const view=renderer.getSnapshot();
  check('Generisana tabla koristi isti biome i prepreke',view.biome===battle.generated.biome&&view.covers.length===battle.obstacles.length);
  check('Arhetipovi stizu do renderera',view.units.filter(u=>u.team==='enemy').every(u=>u.kind&&battle.units.some(a=>a.id===u.id&&a.kind===u.kind)));
  check('Mute je podrazumevan, kvalitet dostupan',!RavanBattleAudio.enabled&&!!$('[data-gfx-audio] input'));
  let roundTrip=true;
  for(let y=0;y<view.height;y++)for(let x=0;x<view.width;x++){
   const p=renderer.project({x,y}), client=renderer.boardToClient(p), q=renderer.clientToBoard(client.x,client.y), cell=renderer.hitTest(q.x,q.y);
   if(cell?.x!==x||cell?.y!==y)roundTrip=false;
  }
  check('Sva polja imaju isti 2.5D hit-test',roundTrip);
  window.__ui19Result=JSON.stringify({checks,generated:battle.generated});
 }catch(e){window.__ui19Result=JSON.stringify({checks,error:String(e.stack||e)});}
})()
