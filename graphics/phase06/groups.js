(function(root){
 'use strict';
 const classes={patrol:['Patrola','♜'],caravan:['Karavan','▰'],raiders:['Razbojnici','▲']};
 function marker(g){
  const [type,sign]=classes[g.kind]||['Grupa','●'];
  return {id:g.id,index:g.index,name:g.name||type,sign,kind:g.kind,group:true};
 }
 function sync(stage,s,camera){
  let pane=stage.querySelector('.rv-e6-group-card');
  const selected=camera.e6Group;
  if(!selected||selected.seed!==s.seed||selected.region!==s.region){pane?.remove();return;}
  const group=s.groups.find(g=>g.id===selected.id&&g.visible);
  if(group)Object.assign(selected,{name:group.name,objective:group.objective,lastSeen:s.tick});
  const status=group?'U vidokrugu':'Van vidokruga · poslednje opazanje: '+selected.lastSeen;
  const copy=[selected.name,status,group?.objective||'Trenutna lokacija nije poznata.'].join('\n');
  if(!pane){
   pane=document.createElement('aside');pane.className='rv-e6-group-card';
   const message=document.createElement('p');message.setAttribute('role','status');
   const close=document.createElement('button');close.type='button';close.textContent='Zatvori';
   close.onclick=()=>{camera.e6Group=null;pane.remove();stage.querySelector('[aria-label="Centriraj druzinu"]')?.focus();};
   pane.append(message,close);stage.append(pane);
  }
  pane.dataset.live=String(!!group);
  const message=pane.querySelector('p');if(message.textContent!==copy)message.textContent=copy;
 }
 function select(stage,s,id,camera){
  const group=s.groups.find(g=>g.id===id&&g.visible);
  if(!group)return;
  camera.e6Group={id,seed:s.seed,region:s.region,lastSeen:s.tick};
  sync(stage,s,camera);
 }
 root.RavanE6Groups={marker,sync,select};
})(globalThis);
