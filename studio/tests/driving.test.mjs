import test from 'node:test';
import assert from 'node:assert/strict';
import { freshCar, stepCar, findPath, followPath, worldObstacles, locations } from '../lib/world/driving.ts';
const empty={throttle:0,steer:0,brake:false};
test('acceleration moves forward and release slows the car',()=>{
 let car=freshCar();for(let i=0;i<90;i++)car=stepCar(car,{...empty,throttle:1},1/60,[]);
 assert.ok(car.z<4);const fast=car.speed;for(let i=0;i<120;i++)car=stepCar(car,empty,1/60,[]);assert.ok(car.speed<fast/3);
});
test('steering depends on motion and behaves inversely when reversing',()=>{
 const parked=stepCar(freshCar(),{...empty,steer:1},.016,[]);assert.equal(parked.heading,0);
 const forward=stepCar({...freshCar(),speed:5},{...empty,steer:1},.016,[]);
 const reverse=stepCar({...freshCar(),speed:-5},{...empty,steer:1},.016,[]);
 assert.ok(forward.heading*reverse.heading<0);
});
test('collision prevents tunneling and reset returns to a safe resting point',()=>{
 let car={...freshCar(),x:0,z:4,speed:12};const obstacles=[{x:0,z:0,w:8,d:2}];
 for(let i=0;i<200;i++)car=stepCar(car,{...empty,throttle:1},1/60,obstacles);
 assert.ok(car.z>=1.8);assert.deepEqual(freshCar(),{x:0,z:7,heading:0,speed:0});
});
test('simulation is nearly frame-rate independent',()=>{
 let a=freshCar(),b=freshCar();for(let i=0;i<120;i++)a=stepCar(a,{...empty,throttle:1},1/60,[]);for(let i=0;i<60;i++)b=stepCar(b,{...empty,throttle:1},1/30,[]);
 assert.ok(Math.abs(a.z-b.z)<.25);
});
test('all named locations have reachable paths that avoid buildings',()=>{
 for(const place of locations){const path=findPath({x:0,z:7},place,worldObstacles);assert.ok(path.length>0,place.id);assert.ok(Math.hypot(path.at(-1).x-place.x,path.at(-1).z-place.z)<2.9);}
});
test('blocked and out-of-world click targets do not create invalid paths',()=>{
 assert.equal(findPath({x:0,z:7},{x:100,z:100},worldObstacles).length,0);
 assert.equal(findPath({x:0,z:7},{x:-19,z:-18},worldObstacles).length,0);
});

test('automatic driving reaches each destination without circling forever',()=>{
 let car=freshCar();
 for(const target of [...locations,locations[0]]){const route=findPath(car,target,worldObstacles);for(let i=0;i<3600&&route.length;i++)car=stepCar(car,followPath(car,route),1/60);assert.equal(route.length,0,target.id);assert.ok(Math.hypot(car.x-target.x,car.z-target.z)<4.5,target.id);}
});

test('automatic departure works after stopping in front of a building',()=>{
 let car={x:-21.4,z:22,heading:Math.PI/2,speed:0};const target=locations.find(p=>p.id==='radar');const route=findPath(car,target,worldObstacles);for(let i=0;i<3000&&route.length;i++)car=stepCar(car,followPath(car,route),1/60);assert.equal(route.length,0);assert.ok(Math.hypot(car.x-target.x,car.z-target.z)<4.5);
});
