/* RV-36 integration for the portable review build. Existing command handlers own all gameplay. */
(function(){
 const port=window.RavanWorldPort;
 if(port?.version!==1)return;
 const app=document.getElementById('app');
 let host=null,view=null,tickObserver=null;
 const camera={};
 function attach(){
  const time=app.querySelector('#ow-time');
  const panel=time?.closest('section');
  if(panel===host)return;
  tickObserver?.disconnect();view?.destroy();host=panel;
  if(!panel)return;
  const original=panel.querySelector('svg[aria-label="Mapa regije"]');
  if(!original)return;
  const destinations=original.nextElementSibling;
  const holder=document.createElement('div');
  panel.classList.add('rv19-map');
  original.replaceWith(holder);
  if(destinations?.matches('div')){
   const list=document.createElement('details'), title=document.createElement('summary');
   title.textContent='Odredista i prelazi';
   destinations.before(list);list.append(title,destinations);
  }
  const snapshot=port.snapshot();
  const location=snapshot?.campaign.locations.find(item=>item.id===snapshot.selection);
  if(location?.discovered){
   const risk=document.createElement('p');
   risk.className='rv19-risk';risk.textContent='Poznati rizik: '+location.danger;
   panel.querySelector('[data-act="ow-go"]')?.before(risk);
  }
  view=window.RavanWorldView.mount(holder,port,camera);
  tickObserver=new MutationObserver(()=>view.draw());
  tickObserver.observe(time,{childList:true,subtree:true,characterData:true});
 }
 new MutationObserver(attach).observe(app,{childList:true,subtree:true});
 attach();
})();
