import test from 'node:test';
import assert from 'node:assert/strict';
import {createVehiclePhysics} from '../lib/world/physics.ts';
const idle={throttle:0,steer:0,brake:false};
test('four physical wheels settle on ground and drive in local -Z',async()=>{
 const p=await createVehiclePhysics([]);try{for(let i=0;i<120;i++)p.step(idle);let s=p.read();assert.equal(s.wheels.filter(w=>w.contact).length,4);assert.ok(s.y>.4&&s.y<1.2);for(let i=0;i<150;i++)p.step({...idle,throttle:1});s=p.read();assert.ok(s.z<4,JSON.stringify(s));assert.ok(s.speed>1);p.stop();assert.ok(Math.abs(p.read().speed)<.01);}finally{p.free();}
});
test('reset clears real linear and angular velocity and position',async()=>{const p=await createVehiclePhysics([]);try{for(let i=0;i<160;i++)p.step({throttle:1,steer:.5,brake:false});p.reset();const s=p.read();assert.equal(s.x,0);assert.equal(s.z,7);assert.ok(Math.abs(s.heading)<.001);assert.ok(Math.abs(s.speed)<.01);}finally{p.free();}});
test('rigid body cannot cross an obstacle',async()=>{const p=await createVehiclePhysics([{x:0,z:0,w:9,d:2}]);try{for(let i=0;i<600;i++)p.step({...idle,throttle:1});assert.ok(p.read().z>1);}finally{p.free();}});

test('braking settles the sprung body instead of sustaining motion',async()=>{const p=await createVehiclePhysics([]);try{for(let i=0;i<90;i++)p.step(idle);for(let i=0;i<60;i++)p.step({...idle,throttle:1});const moving=p.read().speed;for(let i=0;i<120;i++)p.step({...idle,brake:true});assert.ok(moving>3);assert.ok(Math.abs(p.read().speed)<.1);assert.equal(p.read().wheels.filter(w=>w.contact).length,4);}finally{p.free();}});
