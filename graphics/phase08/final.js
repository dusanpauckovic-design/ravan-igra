(function(){
 'use strict';
 const app=document.getElementById('app');
 function attach(){
  const main=app.querySelector('.v3-main');
  if(main)main.classList.add('rv-e8-main');
  const modal=document.getElementById('modal');
  if(modal)modal.classList.add('rv-e8-modal');
 }
 new MutationObserver(attach).observe(app,{childList:true,subtree:true});attach();
})();
