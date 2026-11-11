window.RavanOpening = function mountOpening(ui) {
  const {screens,button,text}=ui;
  screens.register('opening','Pocetak',draw);
  function draw(root) {
    const encounter=ui.getEncounter();
    const started=ui.hasEnteredEncounter();
    const hero=text('section','','opening-hero');
    hero.style.backgroundImage='linear-gradient(90deg, #131914 2%, #131914f2 24%, #13191466 63%, #151c190c), linear-gradient(0deg, #161d19c9, transparent 60%), url("'+ART.battle_vista+'")';
    const intro=text('div','','opening-intro');
    const title=text('h1',encounter.title); title.tabIndex=-1;
    intro.append(title,text('p',encounter.objective,'opening-objective'));
    const controls=text('div','','opening-actions');
    const model=ui.characterPort.get();
    const resume=button('Nastavi',()=>model.scene&&model.scene!=='ready' ? screens.open('intro') : model.hero&&ui.enterWorld ? ui.enterWorld() : ui.enterEncounter(),{id:'opening-resume',disabled:!started&&!model.hero});
    controls.append(button('Nova igra',()=>ui.creator.newGame(),{id:'opening-new',className:'primary'}),resume,
      button('Brza arena',()=>ui.startQuickArena(),{id:'opening-enter'}),
      button('Pripremi druzinu',()=>screens.open('party'),{id:'opening-party'}));
    if(model.hero || started)intro.append(text('p',model.hero?'Probni nastavak · '+model.hero.name:'Probni nastavak · '+encounter.title,'screen-desc'));
    intro.append(controls);
    hero.append(intro);
    const party=text('section','','opening-party');
    party.append(text('h2','Druzina'));
    const cards=text('div','','opening-roster');
    for(const member of ui.partyPort.get()) {
      const item=button('',()=>ui.partyView.openMember(member.id),{className:'opening-member'});
      const img=document.createElement('img');img.src=ART[member.sprite];img.alt='';
      const info=text('span','','opening-member-label');
      info.append(text('strong',member.name),text('small',member.role));
      item.append(img,info);
      cards.append(item);
    }
    party.append(cards);
    root.append(hero,party);
  }
};
