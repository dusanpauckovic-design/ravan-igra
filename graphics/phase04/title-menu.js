/* Cover-inspired opening screen. The campaign owns all commands and saves. */
(function(){
 const previousWelcome=welcome;
 function action(command,label,kind){
  return '<button type="button" class="rv-title-action '+kind+'" data-act="'+command+'">'+label+'</button>';
 }
 welcome=function(){
  if(creatorOpen)return previousWelcome();
  let oldSave=false;
  try{oldSave=!stored&&!!localStorage.getItem('ravan-v06-save');}catch{}
  return `<section class="rv-title" aria-labelledby="rv-title-heading"
   style="--rv-cover:url('${ART.vista}');--rv-cover-narrow:url('${ART.story_arrival}')">
   <div class="rv-title-frame" aria-hidden="true"></div>
   <div class="rv-title-cover">
    <span class="rv-title-seal" aria-hidden="true"><i></i></span>
    <h1 id="rv-title-heading">Ravan</h1>
    <p class="rv-title-subtitle">Secanja prve doline</p>
    <nav class="rv-title-choices" aria-label="Glavni meni">
     ${stored?action('continue','Nastavi igru','rv-title-primary'):''}
     ${action('rpg-new','Nova igra',stored?'':'rv-title-primary')}
     ${action('import','Ucitaj sacuvanu igru','')}
     ${stored?`<span class="rv-title-save">${esc(stored.name)}</span>`:''}
    </nav>
    ${oldSave?'<p class="rv-title-notice" role="status">Za Etapu 4 pokreni novu igru. Raniji save je sacuvan odvojeno.</p>':''}
   </div>
   <div class="rv-title-tools" aria-label="Opcije igre">
    ${action('arena-enter','Borbena arena','')}
    ${fsButton()}
    ${action('settings','Podesavanja','')}
   </div>
  </section>`;
 };
 RavanDebug.render();
})();
