(function(root){
 'use strict';
 const app=document.getElementById('app');
 function make(tag,cls,text){
  const el=document.createElement(tag);el.className=cls;el.textContent=text;return el;
 }
 function tools(stage,toolbar,camera){
  const button=make('button','rv-e6-light','Svetlo');
  button.type='button';button.setAttribute('aria-label','Toplije svetlo mape');
  const sync=()=>{
   stage.dataset.light=camera.warm?'warm':'natural';
   button.setAttribute('aria-pressed',String(!!camera.warm));
  };
  button.onclick=()=>{camera.warm=!camera.warm;sync();};sync();toolbar.append(button);
 }
 function overview(panel,s){
  for(const [index,card] of Array.from(panel.children).entries()){
   card.classList.toggle('rv-e6-secured',!!s.securedPassages?.[index]);
  }
 }
 function markers(points,s){
  for(const entry of points){
   if(!['previous','next'].includes(entry.id))continue;
   const secured=!!s.securedPassages?.[s.region];
   entry.button.classList.toggle('rv-e6-secured',secured);
   if(secured)entry.button.setAttribute('aria-label',entry.name+' · Osiguran prelaz');
  }
 }
 function attach(){
  const map=app.querySelector('.rv19-map');
  const camp=app.querySelector('#camp-map')?.closest('section');
  if((!map||map.dataset.e6Consequences)&&(!camp||camp.querySelector('.rv-e6-recipe')))return;
  const port=root.RavanRPG?.snapshot();
  if(map&&!map.dataset.e6Consequences){
   const stage=map.querySelector('.rv19-stage'), s=root.RavanWorldPort.snapshot();
   if(!stage||!s)return;
   map.dataset.e6Consequences='true';
   const secured=s.securedPassages?.[s.region];
   const recipe=port?.camp?.foundRecipe&&s.region===1;
   stage.classList.toggle('rv-e6-recipe-found',!!recipe);
   if(!secured&&!recipe)return;
   const panel=make('div','rv-e6-consequences','');
   if(secured)panel.append(make('p','rv-e6-secured','✓ Osiguran prelaz · krace putovanje iz ove regije'));
   if(recipe)panel.append(make('p','rv-e6-recipe','▤ Recept iz rusevine · besplatno proucavanje u kampu'));
   stage.before(panel);
  }
  if(camp&&port?.camp?.foundRecipe&&!camp.querySelector('.rv-e6-recipe')){
   const note=make('p','rv-e6-recipe','▤ Recept iz rusevine · besplatno proucavanje');
   camp.querySelector('#camp-map').before(note);
  }
 }
 root.RavanE6Consequences={tools,overview,markers};
 new MutationObserver(attach).observe(app,{subtree:true,childList:true});attach();
})(globalThis);
