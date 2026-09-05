import RAPIER from '@dimforge/rapier3d-compat';
import type { Point, Input, CarState, Obstacle } from './driving';

export const WHEEL_ANCHORS=[{x:-.78,y:0,z:-.91},{x:.78,y:0,z:-.91},{x:-.78,y:0,z:.91},{x:.78,y:0,z:.91}];
export async function createVehiclePhysics(obstacles:Obstacle[],spawn:Point={x:0,z:7},ground?:{positions:Float32Array;indices:Uint32Array}){
 await RAPIER.init();
 const world=new RAPIER.World({x:0,y:-9.81,z:0});world.timestep=1/60;
 if(ground)world.createCollider(RAPIER.ColliderDesc.trimesh(ground.positions,ground.indices).setFriction(.8));
 else world.createCollider(RAPIER.ColliderDesc.cuboid(80,.4,80).setTranslation(0,-.4,0).setFriction(.8));
 for(const o of obstacles)world.createCollider(RAPIER.ColliderDesc.cuboid(o.w/2,2,o.d/2).setTranslation(o.x,2,o.z).setFriction(.8));
 const body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(spawn.x,1.15,spawn.z).setCanSleep(false).setCcdEnabled(true).setLinearDamping(.1).setAngularDamping(2.8));
 world.createCollider(RAPIER.ColliderDesc.cuboid(.72,.25,1.3).setMass(8).setTranslation(0,-.2,0).setFriction(.55).setRestitution(.04),body);
 world.createCollider(RAPIER.ColliderDesc.cuboid(.62,.26,.62).setTranslation(0,.38,.1).setMass(1).setFriction(.5),body);
 const vehicle=world.createVehicleController(body);vehicle.indexUpAxis=1;vehicle.setIndexForwardAxis=2;
 for(let i=0;i<4;i++){
  vehicle.addWheel(WHEEL_ANCHORS[i],{x:0,y:-1,z:0},{x:1,y:0,z:0},.42,.39);
  vehicle.setWheelSuspensionStiffness(i,35);vehicle.setWheelSuspensionCompression(i,4.4);vehicle.setWheelSuspensionRelaxation(i,5.5);vehicle.setWheelMaxSuspensionTravel(i,.25);vehicle.setWheelMaxSuspensionForce(i,180);vehicle.setWheelFrictionSlip(i,2.2);vehicle.setWheelSideFrictionStiffness(i,2.2);
 }
 const read=()=>{
  const p=body.translation(),q=body.rotation(),v=body.linvel();
  // Quaternion rotating local forward (0,0,-1).
  const fx=-2*(q.x*q.z+q.w*q.y),fy=-2*(q.y*q.z-q.w*q.x),fz=-(1-2*(q.x*q.x+q.y*q.y));
  return{x:p.x,z:p.z,heading:Math.atan2(-fx,-fz),speed:(v.x*fx+v.z*fz)/Math.max(.001,Math.hypot(fx,fz)),verticalSpeed:v.y,y:p.y,rotation:q,wheels:WHEEL_ANCHORS.map((_,i)=>({length:vehicle.wheelSuspensionLength(i)??.42,contact:vehicle.wheelIsInContact(i)??false,steering:vehicle.wheelSteering(i)??0}))};
 };
 const step=(input:Input,dt=1/60,jump=false)=>{
  const car=read();const reverseBrake=input.throttle&&Math.sign(input.throttle)!==Math.sign(car.speed)&&Math.abs(car.speed)>.6;
  const brake=input.brake||!!reverseBrake;
  const steering=-input.steer*(.48-Math.min(Math.abs(car.speed)/25,.16));vehicle.setWheelSteering(0,steering);vehicle.setWheelSteering(1,steering);
  for(let i=0;i<4;i++){
   const force=input.throttle*24/(1+Math.max(0,Math.abs(car.speed)-10));
   vehicle.setWheelEngineForce(i,brake?0:force);vehicle.setWheelBrake(i,brake?.45:input.throttle?0:.055);
   vehicle.setWheelSuspensionRestLength(i,jump?.7:.42);
  }
  vehicle.updateVehicle(dt,RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,undefined,c=>c.parent()?.handle!==body.handle);world.timestep=dt;world.step();
 };
 const stop=()=>{body.setLinvel({x:0,y:0,z:0},true);body.setAngvel({x:0,y:0,z:0},true);};
 const reset=(point:Point=spawn,heading=0)=>{body.setTranslation({x:point.x,y:1.15,z:point.z},true);body.setRotation({x:0,y:Math.sin(heading/2),z:0,w:Math.cos(heading/2)},true);stop();};
 return{world,body,vehicle,step,read,stop,reset,free:()=>{world.removeVehicleController(vehicle);world.free();}};
}
