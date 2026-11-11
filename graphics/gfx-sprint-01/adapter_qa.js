'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const Adapter = require('./rv03-adapter.js');
const Core = require(path.resolve(process.argv[2]));

function commit(battle, plan) {
  assert.ok(plan.ok, plan.error);
  const {ok, error, receipt, before} = Core.commitPlan(battle, plan, 'gfx-qa-' + battle.revision);
  assert.ok(ok, error);
  return {before, receipt};
}

const combo = Core.startArena({}, 'kombinacija');
for (let i = 0; i < 3; i++) commit(combo, Core.planAction(combo, 'wait'));
const marked = commit(combo, Core.planEnemy(combo));
let mapped = Adapter.mapReceipt('combo', marked.before, combo, marked.receipt);
assert.equal(mapped.events.find(e => e.type === 'mark').result.marks[0].id, 'a_radan');
const placed = commit(combo, Core.planEnemy(combo));
mapped = Adapter.mapReceipt('combo', placed.before, combo, placed.receipt);
assert.ok(mapped.events.some(e => e.type === 'trailPlace' && e.result.trails.length === 1));
const pushed = commit(combo, Core.planEnemy(combo));
const originals = JSON.stringify([pushed.before, combo, pushed.receipt]);
mapped = Adapter.mapReceipt('combo', pushed.before, combo, pushed.receipt);
assert.deepEqual(mapped.events.map(e => e.type), ['melee', 'markEnd', 'push', 'trailHit']);
assert.equal(mapped.events[2].path.length, 1);
assert.deepEqual(mapped.events[3].result.trails, []);
assert.equal(mapped.events[3].result.hp[0].delta, -19);
assert.equal(mapped.events.flatMap(e => e.result.hp || []).length, 1);
assert.equal(JSON.stringify([pushed.before, combo, pushed.receipt]), originals);

const breach = Core.startArena({}, 'proboj');
const hit = commit(breach, Core.planAction(breach, 'attack', 'cover:zaklon'));
assert.equal(Adapter.mapReceipt('breach', hit.before, breach, hit.receipt).events
  .flatMap(e => e.result.covers || [])[0].hp, 3);
const destroyed = commit(breach, Core.planAction(breach, 'attack', 'cover:zaklon'));
const result = Adapter.mapReceipt('breach', destroyed.before, breach, destroyed.receipt);
assert.equal(result.events.find(e => e.type === 'cover').result.covers[0].hp, 0);
assert.ok(!result.after.covers.some(c => c.id === 'zaklon'));

const w = Core.startArena({}, 'proboj');
w.units[3].intent = [{x:4,y:3}, {x:4,y:4}];
assert.deepEqual(Adapter.snapshot(w).danger, w.units[3].intent);

(async () => {
  let state, finish;
  const applied = [];
  const renderer = {
    reset(s) { state = s; },
    renderSnapshot(s) { state = s; },
    setActive() {},
    async playEvent(e) { applied.push(e.id); return 'complete'; },
    cancel() { if (finish) finish('cancelled'); }
  };
  const playback = Adapter.createPlayback(renderer);
  playback.reset('breach', Adapter.snapshot(destroyed.before));
  assert.equal(await playback.play('breach', destroyed.before, breach, destroyed.receipt), 'complete');
  assert.deepEqual(state, result.after);
  assert.equal(await playback.play('breach', destroyed.before, breach, destroyed.receipt), 'ignored');
  assert.equal(await playback.play('old-battle', destroyed.before, breach, destroyed.receipt), 'ignored');
  assert.equal(new Set(applied).size, applied.length);
  playback.reset('breach', result.before);
  renderer.playEvent = () => new Promise(resolve => { finish = resolve; });
  const pending = playback.play('breach', destroyed.before, breach, destroyed.receipt);
  playback.cancel();
  assert.equal(await pending, 'cancelled');
  renderer.playEvent = async () => 'complete';
  assert.equal(await playback.play('breach', destroyed.before, breach, destroyed.receipt), 'complete');
  console.log('PASS: RV-03 adapter — real marks, trail, push, aggregate HP, cover, danger, dedupe and cancel');
})().catch(error => { console.error(error); process.exitCode = 1; });
