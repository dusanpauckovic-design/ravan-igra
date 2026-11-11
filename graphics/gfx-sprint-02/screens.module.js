window.RavanScreens = function mountScreens(ui) {
  const {$,button}=ui, views=new Map();
  let current='battle';
  const container=$('screen');
  function open(id) {
    if(id!=='battle'&&!views.has(id)) return;
    if(id!=='battle' && (ui.actionPanel.isPending()||ui.isReplayRunning?.())) return;
    if(id!=='battle') ui.actionPanel.cancel();
    current=id;
    $('battle').hidden=id!=='battle';
    container.hidden=id==='battle';
    for(const link of $('nav').children) link.setAttribute('aria-pressed',String(link.dataset.screen===id));
    if(id!=='battle') {
      container.textContent='';
      views.get(id)(container);
      container.querySelector('h1')?.focus({preventScroll:true});
    }
  }
  function register(id,label,draw,{hidden=false}={}) {
    views.set(id,draw);
    if(hidden)return;
    const link=button(label,()=>open(id));
    link.dataset.screen=id;
    link.setAttribute('aria-pressed',String(id===current));
    $('nav').append(link);
  }
  register('battle','Borba',null);
  return {open,register,get:()=>current};
};
