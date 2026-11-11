window.RavanScreens = function mountScreens(ui) {
  const {$,button}=ui, views=new Map();
  let current='battle';
  const history=[], scroll=new Map();
  const stable=new Set(['opening','party','skills','sheet','inventory','map','camp']);
  const back=button('Nazad',()=>open(history.pop(),true),{id:'screen-back'});
  back.hidden=true;$('nav').before(back);
  const container=$('screen');
  function open(id, returning=false) {
    if(id!=='battle'&&!views.has(id)) return;
    if(id!=='battle' && (ui.actionPanel.isPending()||ui.isReplayRunning?.())) return;
    if(id!=='battle') {ui.actionPanel.cancel();ui.battleShell?.close();}
    if(current!==id){
      scroll.set(current,window.scrollY);
      if(!returning&&stable.has(current)&&history[history.length-1]!==current)history.push(current);
    }
    back.hidden=!history.length||id==='battle'||id==='creator'||id==='intro'||id==='outcome';
    current=id;
    $('app').dataset.view=id;
    $('battle').hidden=id!=='battle';
    container.hidden=id==='battle';
    for(const link of $('nav').children) {
      const selected=link.dataset.screen===id;
      link.setAttribute('aria-pressed',String(selected));
      if(selected) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    }
    if(id!=='battle') {
      container.textContent='';
      views.get(id)(container);
      container.querySelector('h1')?.focus({preventScroll:true});
    }
    if(id==='battle')ui.battleShell?.resize();
    window.scrollTo(0,returning?(scroll.get(id)||0):0);
  }
  function register(id,label,draw,{hidden=false}={}) {
    views.set(id,draw);
    if(hidden)return;
    const link=button(label,()=>open(id));
    link.dataset.screen=id;
    link.setAttribute('aria-pressed',String(id===current));
    if(id==='opening') $('nav').prepend(link);
    else $('nav').append(link);
  }
  register('battle','Borba',null);
  return {open,register,get:()=>current};
};
