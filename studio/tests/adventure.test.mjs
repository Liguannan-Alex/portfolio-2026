import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleJourney } from '../lib/adventure.ts';
const marks = [0, 1500, 3000, 4500];
test('overscroll clamps to start and end without an empty scene', () => {
  assert.equal(sampleJourney(-200, marks, 1000, 6000).progress, 0);
  assert.equal(sampleJourney(9000, marks, 1000, 6000).progress, 1);
  assert.equal(sampleJourney(9000, marks, 1000, 6000).active, 3);
});
test('deep links resolve immediately to the correct scene', () => {
  assert.equal(sampleJourney(3000, marks, 1000, 6000).active, 2);
  assert.equal(sampleJourney(4500, marks, 1000, 6000).active, 3);
});
test('crossfades cover the viewport, with no missing or negative opacity', () => {
  for(let y=0;y<=6000;y+=17){
    const state=sampleJourney(y,marks,1000,6000);
    assert.ok(Math.abs(state.weights.reduce((a,b)=>a+b,0)-1)<1e-9);
    assert.ok(state.weights.every(w=>w>=0&&w<=1));
  }
});
test('reverse scrolling reproduces exactly the same scene and lighting', () => {
  const outbound = [0,1400,2900,4600].map(y=>sampleJourney(y,marks,1000,6000));
  const inbound = [4600,2900,1400,0].map(y=>sampleJourney(y,marks,1000,6000)).reverse();
  assert.deepEqual(outbound,inbound);
});
test('one short viewport remains finite and stable', () => {
  const s=sampleJourney(0,[0,0,0,0],0,0);
  assert.ok(Number.isFinite(s.progress));
  assert.ok(s.weights.every(Number.isFinite));
});
