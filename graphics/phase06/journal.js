(function(root){
 'use strict';
 const status={heard:['Cuo','?'],observed:['Opazio','◇'],verified:['Proverio','✓']};
 const app=document.getElementById('app');
 const journalState=new Map();
 function markers(s,region){
  const seen=new Set(s.discovered[s.region]);
  const visible=(s.knowledge||[]).filter(k=>k.region===s.region&&status[k.status]&&
   k.status!=='heard'&&seen.has(k.index)&&region.cells[k.index]);
  const tracks=visible.filter(k=>k.kind==='track'&&!k.stale).sort((a,b)=>a.age-b.age);
  return [...visible.filter(k=>k.kind==='place'),...tracks.slice(0,1)].map(k=>({
   id:k.id,index:k.index,name:k.name+' · '+status[k.status][0],sign:k.kind==='track'?'⋮':status[k.status][1],
   certainty:k.status,evidence:true
  }));
 }
 function add(tag,text,cls){
  const el=document.createElement(tag);el.textContent=text;
  if(cls)el.className=cls;
  return el;
 }
 function open(stage,id){
  const journal=stage.closest('.rv19-map')?.querySelector('.rv-e6-journal');
  const record=Array.from(journal?.querySelectorAll('[data-record]')||[]).find(el=>el.dataset.record===id);
  if(!record)return;
  journal.open=true;record.open=true;record.querySelector('summary').focus();
 }
 function attach(){
  const map=app.querySelector('.rv19-map'), stage=map?.querySelector('.rv19-stage');
  const journal=Array.from(map?.querySelectorAll('details')||[]).find(el=>el.firstElementChild?.textContent==='Dnevnik tragova');
  if(!stage||!journal||journal.classList.contains('rv-e6-journal'))return;
  const s=root.RavanWorldPort.snapshot();
  journal.classList.add('rv-e6-journal');
  const ui=journalState.get(s.seed)||{open:false,selected:null};
  journalState.set(s.seed,ui);journal.open=ui.open;
  const resize=()=>map.classList.toggle('rv-e6-journal-open',journal.open);
  journal.addEventListener('toggle',()=>{ui.open=journal.open;resize();});resize();
  const entries=s.knowledge||[], original=Array.from(journal.querySelectorAll(':scope > p'));
  entries.forEach((entry,i)=>{
   const row=add('details','','rv-e6-record');row.dataset.record=entry.id;
   const [label,sign]=status[entry.status];
   const heading=add('summary',sign+' '+entry.name+' · '+label);
   heading.dataset.certainty=entry.status;
   const age=entry.kind==='track'?' · '+entry.age+' koraka'+(entry.stale?' · zastareo':''):'';
   row.append(heading,add('small',(entry.kind==='track'?'Trag grupe':entry.status==='heard'?'Razgovor u kampu':'Oznaka na terenu')+age),add('p',entry.clue));
   const verify=original[i]?.querySelector('[data-act=ow-verify-knowledge]');
   if(verify)row.append(verify);
   if(entry.region===s.region&&entry.status!=='heard'&&s.discovered[s.region]?.includes(entry.index)){
    const locate=add('button',entry.kind==='track'?'Pokazi mesto otiska':'Pokazi na mapi');
    locate.type='button';
    locate.addEventListener('click',()=>stage.dispatchEvent(new CustomEvent('ravan-e6-locate',{detail:entry.index})));
    row.append(locate);
   }
   row.open=ui.selected===entry.id;
   row.addEventListener('toggle',()=>{
    if(row.open){
     ui.selected=entry.id;
     for(const other of journal.querySelectorAll('.rv-e6-record[open]'))if(other!==row)other.open=false;
    }else if(ui.selected===entry.id)ui.selected=null;
   });
   original[i]?.remove();journal.append(row);
  });
  stage.after(journal);
 }
 root.RavanE6Journal={markers,open};
 new MutationObserver(attach).observe(app,{childList:true,subtree:true});attach();
})(globalThis);
