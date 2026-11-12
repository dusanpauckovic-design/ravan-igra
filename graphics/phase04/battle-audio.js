/* Original synthesized cues. Starts only after an explicit user click. */
(function(root){
 let context=null, master=null, ambient=null, enabled=false, volume=.3;
 const profiles={melee:[116,.09],ranged:[246,.07],guard:[175,.14],heal:[493,.16],cover:[78,.14],trailHit:[340,.15]};
 function setEnabled(value){
  enabled=!!value;
  if(!enabled){if(master)master.gain.value=0;ambient?.stop();ambient=null;return;}
  const Audio=root.AudioContext||root.webkitAudioContext;
  if(!Audio){enabled=false;return;}
  try{
   if(!context){
    context=new Audio();master=context.createGain();
    master.gain.value=volume;master.connect(context.destination);
   }
   master.gain.value=volume;
   context.resume().catch(()=>{setEnabled(false);});
  }catch{enabled=false;}
 }
 function syncAmbient(active){
  if((!active||!enabled)&&ambient){ambient.stop();ambient=null;}
  if(!active||!enabled||ambient||!context)return;
  ambient=context.createOscillator();const gain=context.createGain();
  ambient.type='sine';ambient.frequency.value=58;gain.gain.value=.024;
  ambient.connect(gain);gain.connect(master);ambient.start();
 }
 function setVolume(value){
  volume=Math.max(0,Math.min(1,Number(value)||0));
  if(master&&enabled)master.gain.value=volume;
 }
 function contact(event){
  if(!enabled||!context||context.state!=='running')return;
  const custom=root.RavanE7Feedback?.cue(event);
  if(custom===null)return;
  const cue=custom||profiles[event.type];if(!cue)return;
  const [frequency,duration]=cue, time=context.currentTime;
  const oscillator=context.createOscillator(), envelope=context.createGain();
  oscillator.type=event.type==='heal'?'sine':'triangle';
  oscillator.frequency.setValueAtTime(event.guarded?frequency*1.4:frequency,time);
  oscillator.frequency.exponentialRampToValueAtTime(frequency*.59,time+duration);
  envelope.gain.setValueAtTime(.18,time);
  envelope.gain.exponentialRampToValueAtTime(.001,time+duration);
  oscillator.connect(envelope);envelope.connect(master);
  oscillator.start(time);oscillator.stop(time+duration);
 }
 root.RavanBattleAudio={setEnabled,setVolume,contact,syncAmbient,get enabled(){return enabled;},get volume(){return volume;}};
})(globalThis);
