/* RV-42 preview bridge. The existing creator owns the face selection. */
(function(){
 const appearance=window.RavanAppearance, app=document.getElementById('app');
 let outfit='road';
 function make(tag,cls,copy){
  const el=document.createElement(tag);el.className=cls;
  if(copy)el.textContent=copy;
  return el;
 }
 function attach(){
  const identity=app.querySelector('.creator-panel[data-step="0"] .creator-identity');
  if(!identity||identity.querySelector('.rv-e5-figure'))return;
  const picked=identity.querySelector('[data-option][aria-pressed="true"]');
  const face=picked?.dataset.option||'hero';
  if(!appearance.faces[face])return;
  const figure=make('div','rv-e5-figure'), caption=make('p','rv-e5-caption');
  const canvas=make('canvas','rv-e5-full');
  const portrait=make('img','rv-e5-portrait');
  portrait.src=ART[appearance.faces[face].portrait];portrait.alt='';
  const view=make('div','rv-e5-view');
  view.append(portrait,canvas);
  const choices=make('div','rv-e5-outfits');choices.setAttribute('role','group');choices.setAttribute('aria-label','Probni ogrtaci');
  const note=make('p','rv-e5-note','Ogrtaci su probni prikaz.');
  function update(){
   const label=appearance.faces[face].name+' · '+appearance.outfits[outfit].name;
   canvas.setAttribute('aria-label',label);canvas.setAttribute('role','img');
   caption.textContent=label;
   choices.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.outfit===outfit)));
   appearance.draw(canvas,{face,outfit},ART);
  }
  for(const [id,entry] of Object.entries(appearance.outfits)){
   const button=make('button','v3-text-button',entry.name);
   button.type='button';button.dataset.outfit=id;button.style.setProperty('--cloth',entry.color);
   button.addEventListener('click',()=>{outfit=id;update();});choices.append(button);
  }
  figure.append(view,caption,choices,note);
  identity.prepend(figure);
  identity.classList.add('rv-e5-identity');
  for(const option of identity.querySelectorAll('[data-option]')){
   const img=option.querySelector('img'), entry=appearance.faces[option.dataset.option];
   if(img&&entry)img.src=ART[entry.portrait];
  }
  update();
 }
 app.addEventListener('click',event=>{
  if(event.target.closest?.('[data-act="rpg-new"]'))outfit='road';
 },true);
 new MutationObserver(attach).observe(app,{childList:true,subtree:true});
 attach();
})();
