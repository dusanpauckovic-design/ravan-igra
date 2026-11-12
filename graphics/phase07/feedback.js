(function(root){
 'use strict';
 const cues={
  move:[75,.055],guard:[215,.11],interrupt:[285,.10],eliteMode:[86,.12],
  release:[94,.16],trailPlace:[310,.12],trailHit:[252,.17]
 };
 const history=new Set();
 function cue(event){
  if(event.id&&history.has(event.id))return null;
  if(event.id){
   history.add(event.id);
   if(history.size>256)history.delete(history.values().next().value);
  }
  if(event.effectId?.startsWith('energy.trace.'))return event.type==='trailHit'?[252,.17]:[310,.12];
  if(event.type==='move'&&event.surface==='mud')return [58,.075];
  if(event.type==='cover')return [72,.13];
  if(event.guarded)return [196,.10];
  return cues[event.type];
 }
 root.RavanE7Feedback={cue};
})(globalThis);
