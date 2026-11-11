window.RavanInventoryFixture=function createInventoryFixture(character){
  const copy=x=>JSON.parse(JSON.stringify(x));
  const items=[
    {id:'iron-knife',name:'Gvozdeni noz',kind:'Oruzje',slot:'weapon',attack:4,quantity:1,price:6,description:'Oruzje za bliski napad.'},
    {id:'travel-bow',name:'Putnicki luk',kind:'Oruzje',slot:'weapon',attack:2,quantity:1,equipped:'weapon',price:5,description:'Luk za daljinski napad.'},
    {id:'heavy-axe',name:'Teska sekira',kind:'Oruzje',slot:'weapon',attack:7,requires:4,quantity:1,price:7,description:'Tesko oruzje sa zahtevom za Snagu.'},
    {id:'bandage',name:'Zavoj',kind:'Potrosno',quantity:2,price:2,description:'Trosi se pri zbrinjavanju povrede.'},
    {id:'herbs',name:'Biljke sa obale',kind:'Materijal',quantity:3,price:1,description:'Zaliha za pripremu u kampu.'}
  ];
  const shop=[
    {id:'light-coat',name:'Putnicki prsluk',kind:'Oklop',slot:'body',quantity:1,price:8,description:'Lagani oklop za pripremu.'},
    {id:'chain-coat',name:'Verizni oklop',kind:'Oklop',slot:'body',quantity:1,price:30,description:'Skuplji oklop trgovca.'}
  ];
  const loot=[{id:'resin',name:'Smola sa prevoja',kind:'Materijal',quantity:1,price:3,description:'Moze da se proda ili odnese u kamp.'}];
  let gold=14,used=0;
  const capacity=6;
  const blocked=(type,item)=>{
    if(!item)return 'Predmet nije dostupan.';
    if(type==='buy'&&gold<item.price)return 'Nedovoljno zlata.';
    if(['buy','loot'].includes(type)&&items.length>=capacity)return 'Torba je puna.';
    if(type==='equip'&&!item.slot)return 'Predmet se ne oprema.';
    if(type==='equip'&&item.requires>(character.get().hero?.attributes.Snaga||0))return 'Potrebna Snaga: '+item.requires+'.';
    if(type==='sell'&&item.equipped)return 'Prvo skini predmet sa slota.';
    if(type==='use'&&item.kind!=='Potrosno')return 'Predmet se ne trosi.';
    return '';
  };
  function command({type,id}){
    const source=type==='buy'?shop:type==='loot'?loot:items;
    const item=source.find(x=>x.id===id);
    const reason=blocked(type,item);
    if(reason)return {ok:false,reason};
    if(type==='favorite')item.favorite=!item.favorite;
    if(type==='equip'){for(const x of items)if(x.equipped===item.slot)delete x.equipped;item.equipped=item.slot;}
    if(type==='unequip')delete item.equipped;
    if(type==='use'){used++;if(--item.quantity===0)items.splice(items.indexOf(item),1);}
    if(type==='sell'){gold+=item.price;if(--item.quantity===0)items.splice(items.indexOf(item),1);}
    if(type==='buy'||type==='loot'){if(type==='buy')gold-=item.price;items.push(item);source.splice(source.indexOf(item),1);}
    return {ok:true};
  }
  return {get:()=>copy({items,shop,loot,gold,capacity,used}),blocked,command};
};
window.RavanInventory=function mountInventory(ui,port){
  const {text,button,screens}=ui;
  let tab='bag',category='',query='',sort='name',selected=null,notice='',pending=false,confirmation=null;
  const verbs={favorite:'Omiljeno',equip:'Opremi',unequip:'Skini',use:'Upotrebi',sell:'Prodaj',buy:'Kupi',loot:'Uzmi'};
  const tabs=[['bag','Torba'],['shop','Trgovac'],['loot','Plen']];
  function draw(root){
    root.textContent='';
    const state=port.get(), source=tab==='bag'?state.items:state[tab];
    const heading=text('div','','screen-head'),title=text('h1','Inventar');title.tabIndex=-1;
    heading.append(title,text('strong',state.items.length+'/'+state.capacity+' mesta','points'),text('strong',state.gold+' zlata','points'));
    root.append(heading);
    const nav=text('nav','','skill-tabs');
    for(const [id,label] of tabs){
      const el=button(label,()=>{tab=id;category='';query='';selected=null;notice='';confirmation=null;draw(root);},{id:'inventory-'+id});
      el.setAttribute('aria-pressed',String(tab===id));nav.append(el);
    }
    root.append(nav);
    const filters=text('div','','inventory-filters');
    const search=document.createElement('input');search.id='inventory-search';search.type='search';search.value=query;search.placeholder='Pronadji predmet';search.setAttribute('aria-label','Pretrazi inventar');
    const select=(id,label,options,value)=>{
      const el=document.createElement('select');el.id=id;el.setAttribute('aria-label',label);
      for(const [key,name] of options){const o=text('option',name);o.value=key;el.append(o);}el.value=value;return el;
    };
    const categories=select('inventory-category','Kategorija',[['','Sve kategorije'],...Array.from(new Set(source.map(x=>x.kind))).map(x=>[x,x])],category);
    const sorting=select('inventory-sort','Sortiranje',[['name','Po imenu'],['price','Po vrednosti'],['favorite','Omiljeni prvo']],sort);
    filters.append(search,categories,sorting);root.append(filters);
    const layout=text('div','','skills-layout'), list=text('div','','skill-list'), detail=text('section','','paper');
    layout.append(list,detail);root.append(layout);
    function refresh(){
      list.textContent='';detail.textContent='';
      const filtered=source.filter(i=>(!category||i.kind===category)&&i.name.toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>
        (sort==='price'?b.price-a.price:sort==='favorite'?Number(!!b.favorite)-Number(!!a.favorite):0)||a.name.localeCompare(b.name));
      const item=filtered.find(i=>i.id===selected)||filtered[0];selected=item?.id||null;
      if(!item){list.append(text('p','Nema predmeta za ovaj prikaz.','screen-desc'));return;}
      for(const i of filtered){
        const el=button('',()=>{selected=i.id;notice='';confirmation=null;refresh();list.querySelector('[data-item="'+i.id+'"]').focus();},{className:'node'});
        el.dataset.item=i.id;el.setAttribute('aria-pressed',String(i===item));
        el.append(text('strong',i.name),text('small',[i.equipped?'Opremljeno':'',i.favorite?'Omiljeno':'','×'+i.quantity].filter(Boolean).join(' · ')));
        list.append(el);
      }
      detail.append(text('h2',item.name),text('p',item.kind+' · '+(item.slot==='weapon'?'Slot oruzja':item.slot==='body'?'Slot oklopa':'×'+item.quantity),'skill-state'),text('p',item.description,'screen-desc'));
      if(item.attack){
        const equipped=state.items.find(x=>x.equipped===item.slot);
        detail.append(text('p','Bonus napada · '+(equipped?.attack||0)+' → '+item.attack));
      }
      const controls=text('div','','action-controls');
      const actions=tab==='shop'?['buy']:tab==='loot'?['loot']:['favorite',...(item.slot?[item.equipped?'unequip':'equip']:item.kind==='Potrosno'?['use']:[]),'sell'];
      for(const action of actions){
        const reason=port.blocked(action,item);
        const label=action==='favorite'&&item.favorite?'Ukloni omiljeno':verbs[action]+(['buy','sell'].includes(action)?' · '+item.price+' zlata':'');
        const el=button(label,()=>request(action,item),{id:'item-'+action,disabled:pending||!!reason});
        controls.append(el);
        if(reason)detail.append(text('p',label+' · '+reason,'inventory-block'));
      }
      detail.append(controls);
      if(confirmation){
        const warning=text('div','','inventory-confirm');
        warning.append(text('strong',confirmation.text),button('Potvrdi',()=>send(confirmation.action,confirmation.id),{id:'item-confirm',className:'primary',disabled:pending}),button('Odustani',()=>{confirmation=null;refresh();},{id:'item-cancel',disabled:pending}));detail.append(warning);
      }
      const feedback=text('p',notice,'screen-desc');feedback.setAttribute('role','status');detail.append(feedback);
    }
    search.oninput=()=>{query=search.value;confirmation=null;refresh();};
    categories.onchange=()=>{category=categories.value;confirmation=null;refresh();};
    sorting.onchange=()=>{sort=sorting.value;refresh();};
    function request(action,item){
      if(pending)return;
      if(['buy','sell','use'].includes(action)){
        confirmation={action,id:item.id,text:action==='buy'?'Potrosices '+item.price+' zlata.':action==='sell'?'Prodajes jedan primerak za '+item.price+' zlata.':'Potrosices jedan primerak.'};refresh();root.querySelector('#item-confirm').focus();
      }else send(action,item.id);
    }
    async function send(type,id){
      if(pending)return;
      pending=true;
      try{const result=await port.command({type,id});notice=result.ok?'Radnja prihvacena u probi.':result.reason;}
      catch{notice='Radnja trenutno nije dostupna.';}
      finally{pending=false;confirmation=null;if(screens.get()==='inventory')draw(root);}
    }
    refresh();
  }
  screens.register('inventory','Inventar',draw);
  return {open(next='bag'){tab=next;category='';query='';selected=null;confirmation=null;screens.open('inventory');}};
};
