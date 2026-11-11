window.RavanHints=function mountHints(ui) {
  const {$,button,text}=ui;
  const bar=text('div','','hint');
  bar.id='hint';
  const words=text('span','');
  words.setAttribute('aria-live','polite');
  const toggle=button('Preskoci pomoc',()=>{enabled=false;option.checked=false;render();},{id:'skip-hints'});
  bar.append(words,toggle);
  $('action-panel').before(bar);
  const option=document.createElement('input');option.type='checkbox';option.id='hint-toggle';option.checked=true;
  const mute=document.createElement('input');mute.type='checkbox';mute.id='mute';mute.checked=true;
  const label=text('label','','preference');label.append(option,' Saveti');
  const audioLabel=text('label','','preference');audioLabel.append(mute,' Bez zvuka');
  $('detail-actions').append(label,audioLabel);
  let enabled=true, current='choose', audio=null, comboSeen=false;
  const prompts={
    choose:'Izaberi akciju. Meta se bira na tabli.',
    target:'Izaberi metu ili polje na tabli.',
    preview:'Proveri ishod. Potvrdi ili pritisni Escape.',
    blocked:'Promeni metu prema razlogu ispod.',
    combo:'Oznacena meta moze da se odgurne na pripremljen trag.'
  };
  function render(){
    bar.hidden=!enabled||!current;
    words.textContent=enabled&&current?prompts[current]:'';
  }
  function set(next){current=next;render();}
  function beep(){
    if(mute.checked||!audio||audio.state!=='running')return;
    const tone=audio.createOscillator(), gain=audio.createGain(), t=audio.currentTime;
    tone.frequency.setValueAtTime(430,t);tone.frequency.exponentialRampToValueAtTime(570,t+.07);
    gain.gain.setValueAtTime(.035,t);gain.gain.exponentialRampToValueAtTime(.001,t+.09);
    tone.connect(gain);gain.connect(audio.destination);tone.start(t);tone.stop(t+.1);
    tone.onended=()=>{tone.disconnect();gain.disconnect();};
  }
  option.onchange=()=>{enabled=option.checked;if(enabled&&!current)current='choose';render();};
  mute.onchange=()=>{
    if(mute.checked)return;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    try{audio=audio||new Audio();audio.resume().catch(()=>{});}catch{audio=null;}
  };
  ui.onActionStage=stage=>{
    if(stage==='complete') {set(null);beep();}
    else set(stage);
  };
  ui.onReplayEvent=event=>{
    if(event.type==='trailPlace'&&!comboSeen){comboSeen=true;set('combo');}
    else if(event.type!=='trailPlace'&&current==='combo')set(null);
  };
  render();
  return {set,enabled:()=>enabled,muted:()=>mute.checked};
};
