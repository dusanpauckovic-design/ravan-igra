window.RavanFeedback=function mountFeedback(ui){
  const {text,button,$}=ui;
  const toast=text('p','','rpg-toast');toast.setAttribute('role','status');toast.hidden=true;
  $('app').append(toast);
  let timeout=0;
  function announce(message,kind='ok'){
    clearTimeout(timeout);
    toast.textContent=message;toast.dataset.kind=kind;toast.hidden=false;
    timeout=setTimeout(()=>{toast.hidden=true;},3200);
  }
  function confirm(message){
    return new Promise(resolve=>{
      const dialog=text('dialog','','rpg-dialog');
      const copy=text('p',message,'screen-desc');copy.id='confirm-consequence';
      dialog.setAttribute('aria-labelledby',copy.id);
      let settled=false;
      function finish(accepted){
        if(settled)return;
        settled=true;
        if(dialog.open)dialog.close();
        dialog.remove();
        resolve(accepted);
      }
      const controls=text('div','','action-controls');
      controls.append(button('Potvrdi',()=>finish(true),{id:'item-confirm',className:'primary'}),
        button('Odustani',()=>finish(false),{id:'item-cancel'}));
      dialog.append(copy,controls);
      dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false);});
      dialog.addEventListener('close',()=>finish(false),{once:true});
      $('app').append(dialog);dialog.showModal();
      dialog.querySelector('#item-cancel').focus();
    });
  }
  async function submit(root,command){
    root.setAttribute('aria-busy','true');
    try{
      const result=await command();
      announce(result.ok?'Radnja prihvacena u probi.':result.reason,result.ok?'ok':'error');
      return result;
    }catch{
      const reason='Radnja trenutno nije dostupna.';
      announce(reason,'error');return {ok:false,reason};
    }finally{root.removeAttribute('aria-busy');}
  }
  return {announce,confirm,submit,tooltip(el,hint){if(hint)el.title=hint;return el;}};
};
