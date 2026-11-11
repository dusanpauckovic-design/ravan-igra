window.runPhaseQA=async function(stage,check){
  const ui=window.ravanSprint,$=ui.$;
  await ui.viewer.ready;
  const tap=s=>{const b=document.querySelector(s);if(!b)throw Error('Nedostaje '+s);b.click();};
  const choose=(id)=>tap('[data-option="'+id+'"]');
  const name=value=>{$('creator-name').value=value;$('creator-name').dispatchEvent(new Event('input'));};
  const fill=(mode)=>{
    tap('#opening-new');tap('#creator-next');
    check('prazan identitet objasnjen',document.querySelector('#screen [role=status]').textContent.includes('ime'));
    name('Sava Dugo Ime Putnika');choose('figure_archer');tap('#creator-next');
    choose('field');tap('#creator-back');check('nazad cuva ime i izgled',$('creator-name').value.includes('Sava')&&document.querySelector('[data-option=figure_archer]').getAttribute('aria-pressed')==='true');
    tap('#creator-next');tap('#creator-next');
    for(let i=0;i<3;i++)tap('.attribute:first-child button:last-child');
    for(let i=0;i<2;i++)tap('.attribute:nth-child(2) button:last-child');
    choose('eye');choose('rest');
    check('talenat, slabost i budzet su vidljivi',ui.characterPort.get().remaining===0 && document.querySelectorAll('[data-option]').length===10);
    tap('#creator-next');choose('marksmanship');choose('bow');tap('#creator-next');tap('[data-mode='+mode+']');tap('#creator-next');
    if(mode==='story'){check('dijalog se moze preskociti',!!$('skip-talk'));tap('#skip-talk');}
    check('znacajan izbor nije preskocen',!!$('route-river')&&!ui.characterPort.get().hero.route);
    tap('#route-river');check('potvrda cuva izabrani put',ui.characterPort.get().hero.route==='river');
  };
  check('nova igra, nastavak i arena su odvojeni',!!$('opening-new')&&$('opening-resume').disabled&&!!$('opening-enter'));
  fill('skip');
  tap('[data-screen=opening]');fill('story');
  check('desktop nema horizontalni overflow',document.documentElement.scrollWidth<=innerWidth);
  if(stage===1){tap('[data-screen=opening]');tap('#opening-new');name('Sava');choose('figure_archer');return;}
  tap('[data-screen=sheet]');
  check('list zadrzava dugo ime, nula poena i zakljucan tier',$('screen').textContent.includes('Sava Dugo Ime Putnika') && $('screen').textContent.includes('0 poena') && $('screen').textContent.includes('jos nije otkljucan'));
  check('oprema prikazuje probno poredjenje napada',$('screen').textContent.includes('15 → 17'));
  tap('.sheet-stat summary');
  check('otvoreni breakdown pokazuje poreklo bonusa',document.querySelector('.sheet-stat').open && $('screen').textContent.includes('Snaga +6'));
  tap('[data-sheet=a_radan]');
  check('saborac prikazuje trajan rang i aktivan status',$('screen').textContent.includes('Rang saborca je stalan') && $('screen').textContent.includes('Ranjen'));
  tap('[data-sheet=hero]');
};
