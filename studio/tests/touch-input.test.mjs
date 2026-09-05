import test from 'node:test';
import assert from 'node:assert/strict';
import { combineTouchInput } from '../lib/world/touch-input.ts';

test('two fingers keep acceleration when the steering finger is released',()=>{
 const held=new Map([[1,{throttle:1}],[2,{steer:-1}]]);
 assert.deepEqual(combineTouchInput(held.values()),{throttle:1,steer:-1,brake:false});
 held.delete(2);assert.deepEqual(combineTouchInput(held.values()),{throttle:1,steer:0,brake:false});
 held.delete(1);assert.deepEqual(combineTouchInput(held.values()),{throttle:0,steer:0,brake:false});
});
test('opposite directions cancel, releasing one restores the still-held input',()=>{
 const held=new Map([[1,{throttle:1}],[2,{throttle:-1}]]);
 assert.equal(combineTouchInput(held.values()).throttle,0);
 held.delete(2);assert.equal(combineTouchInput(held.values()).throttle,1);
});
test('two fingers on the same direction remain clamped and one may release',()=>{
 const held=new Map([[1,{steer:1}],[2,{steer:1}]]);
 assert.equal(combineTouchInput(held.values()).steer,1);held.delete(1);
 assert.equal(combineTouchInput(held.values()).steer,1);
});
test('brake overrides held acceleration until released; clear releases everything',()=>{
 const held=new Map([[1,{throttle:1}],[2,{brake:true}]]);
 assert.deepEqual(combineTouchInput(held.values()),{throttle:0,steer:0,brake:true});
 held.delete(2);assert.equal(combineTouchInput(held.values()).throttle,1);
 held.clear();assert.deepEqual(combineTouchInput(held.values()),{throttle:0,steer:0,brake:false});
});
