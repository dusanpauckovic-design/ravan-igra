/* Project the P1 Identity v1 onto the creator, sheet and flat battlefield. */
(function(){
 'use strict';
 const appearance=window.RavanAppearance, app=document.getElementById('app');
 function make(tag,cls,copy){
  const el=document.createElement(tag);el.className=cls;
  if(copy)el.textContent=copy;
  return el;
 }
 const lookLabel=look=>appearance.faces[look.face].name+' · '+appearance.outfits[look.outfit].name;

 function attachCreator(look){
  const host=app.querySelector('.creator-panel[data-step="0"] .creator-identity');
  for(const button of app.querySelectorAll('.creator-panel [data-palette]')){
   const controls=button.parentElement;
   controls.classList.add('rv-e5-superseded');
   controls.previousElementSibling?.classList.add('rv-e5-superseded');
  }
  if(!host)return;
  let figure=host.querySelector('.rv-e5-figure');
  if(!figure){
   figure=make('div','rv-e5-figure');
   const portrait=make('img','rv-e5-portrait');portrait.alt='';
   const canvas=make('canvas','rv-e5-full');canvas.setAttribute('role','img');
   const view=make('div','rv-e5-view');view.append(portrait,canvas);
   const choices=make('div','rv-e5-outfits');
   choices.setAttribute('role','group');choices.setAttribute('aria-label','Odeca');
   const note=make('p','rv-e5-note','Izgled bez bonusa.');note.setAttribute('aria-live','polite');
   for(const [id,entry] of Object.entries(appearance.outfits)){
    const button=make('button','v3-text-button',entry.name);
    button.type='button';button.dataset.outfit=id;button.style.setProperty('--cloth',entry.color);
    button.addEventListener('click',()=>{
     const port=window.RavanRPG, current=appearance.normalize(port.snapshot().draft?.identity);
     if(!current||current.outfit===id)return;
     const focused=document.activeElement===button;
     const result=appearance.choose(port,current.face,id);
     if(!result?.ok){note.textContent=result?.error||'Izgled nije promenjen.';return;}
     sync();
     if(focused)app.querySelector('.rv-e5-outfits [data-outfit="'+id+'"]')?.focus();
    });
    choices.append(button);
   }
   figure.append(view,make('p','rv-e5-caption'),choices,note);
   host.prepend(figure);
   host.classList.add('rv-e5-identity');
  }
  const canvas=figure.querySelector('canvas'), key=look.face+'/'+look.outfit;
  if(canvas.dataset.appearance===key)return;
  const portrait=figure.querySelector('img');
  const src=ART[appearance.faces[look.face].portrait];
  if(portrait.getAttribute('src')!==src)portrait.src=src;
  const label=lookLabel(look);
  canvas.setAttribute('aria-label',label);
  figure.querySelector('.rv-e5-caption').textContent=label;
  figure.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.outfit===look.outfit)));
  for(const option of host.querySelectorAll('[data-option]')){
   const img=option.querySelector('img'), entry=appearance.faces[option.dataset.option];
   if(img&&entry&&img.getAttribute('src')!==ART[entry.portrait])img.src=ART[entry.portrait];
  }
  appearance.draw(canvas,look,ART);
 }

 function attachSheet(identity){
  const look=appearance.normalize(identity);
  const sheet=app.querySelector('.sheet-layout');
  if(!look||!sheet?.querySelector('[data-sheet="main"][aria-pressed="true"]'))return;
  const profile=sheet.querySelector('.sheet-profile');
  if(!profile||profile.querySelector('.rv-e5-sheet-figure'))return;
  const portrait=profile.querySelector('img');
  if(!portrait)return;
  portrait.src=ART[appearance.faces[look.face].portrait];
  const canvas=make('canvas','rv-e5-sheet-figure');
  canvas.setAttribute('aria-hidden','true');
  portrait.after(canvas);
  profile.querySelector('h2')?.after(make('p','rv-e5-sheet-label',appearance.outfits[look.outfit].name));
  appearance.draw(canvas,look,ART);
 }

 const flatKeys=new WeakMap();
 function attachBattle(identity){
  const look=appearance.normalize(identity);
  const figure=app.querySelector('#combat-svg g[data-act="unit"][data-id="a_main"] image');
  if(!look||!figure)return;
  const key=look.face+'/'+look.outfit;
  if(flatKeys.get(figure)===key)return;
  flatKeys.set(figure,key);
  appearance.url(identity,ART).then(src=>{
   if(src&&figure.isConnected&&flatKeys.get(figure)===key){
    figure.setAttribute('href',src);
    figure.dataset.appearance=key;
   }
  });
 }

 function sync(){
  if(!app.querySelector('.creator-panel,.sheet-layout,#combat-svg'))return;
  const snapshot=window.RavanRPG?.snapshot();
  const draft=appearance.normalize(snapshot?.draft?.identity);
  if(draft&&snapshot.appearanceCatalog)attachCreator(draft);
  attachSheet(snapshot?.sheet?.identity);
  attachBattle(snapshot?.battle?.identity);
 }
 app.addEventListener('click',()=>Promise.resolve().then(sync));
 new MutationObserver(sync).observe(app,{childList:true,subtree:true});
 sync();
})();
