export type Point = {x:number;z:number};
export type CarState = Point & {heading:number;speed:number};
export type Input = {throttle:number;steer:number;brake:boolean};
export type Obstacle = Point & {w:number;d:number};
export const locations = [
 {id:'about',name:'冠南的片场',label:'WELCOME / PI GUANNAN',x:-3,z:3.5,color:'#de9560'},
 {id:'works',name:'作品放映场',label:'SELECTED WORK',x:-17,z:-10,color:'#bd7660'},
 {id:'career',name:'履历长廊',label:'MY JOURNEY',x:16,z:-13,color:'#7897a7'},
 {id:'lab',name:'开源游戏厅',label:'GITHUB LAB',x:-25,z:7,color:'#7c8c62'},
 {id:'learn',name:'开放课堂',label:'LEARN & TEACH',x:-12,z:25,color:'#63928c'},
 {id:'coffee',name:'生活咖啡站',label:'COFFEE & TOOLS',x:14,z:25,color:'#aa8769'},
 {id:'radar',name:'影视雷达台',label:'FILM RADAR',x:28,z:4,color:'#789d96'},
] as const;
export const worldObstacles:Obstacle[]=[
 {x:-17,z:-16,w:11,d:3},{x:17,z:-21,w:8,d:3},
 {x:-28,z:0,w:4,d:7},{x:-12,z:18,w:11,d:3},
 {x:14,z:19,w:8,d:4},{x:29,z:-2,w:6,d:4},
 {x:-8,z:2,w:1.1,d:1.1},{x:7,z:7,w:1.1,d:1.1},
];
export const freshCar=():CarState=>({x:0,z:7,heading:0,speed:0});
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export const isBlocked=(p:Point,obstacles:Obstacle[],radius=.9)=>
 Math.abs(p.x)>33-radius||Math.abs(p.z)>33-radius||obstacles.some(o=>Math.abs(p.x-o.x)<o.w/2+radius&&Math.abs(p.z-o.z)<o.d/2+radius);
export function stepCar(original:CarState,input:Input,dt:number,obstacles=worldObstacles):CarState{
 const car={...original};const count=Math.max(1,Math.ceil(Math.min(dt,.1)*120));const step=Math.min(dt,.1)/count;
 for(let i=0;i<count;i++){
  const drag=input.brake?10:input.throttle?0.7:2.1;
  car.speed=clamp((car.speed+input.throttle*13*step)*Math.exp(-drag*step),-5,11);
  if(Math.abs(car.speed)<.015)car.speed=0;
  car.heading-=input.steer*1.8*clamp(car.speed/3.8,-1,1)*step;
  const x=car.x-Math.sin(car.heading)*car.speed*step,z=car.z-Math.cos(car.heading)*car.speed*step;
  if(!isBlocked({x,z},obstacles)){car.x=x;car.z=z;}
  else {
   if(!isBlocked({x,z:car.z},obstacles))car.x=x;
   if(!isBlocked({x:car.x,z},obstacles))car.z=z;
   car.speed*=-.15;
  }
 }
 return car;
}
/** Small grid pathfinding keeps click-to-drive routes out of buildings. */
export function findPath(start:Point,target:Point,obstacles=worldObstacles):Point[]{
 if(isBlocked(target,obstacles,1.1))return[];
 const size=33,spacing=2,key=(x:number,z:number)=>`${x},${z}`;
 const snap=(n:number)=>clamp(Math.round(n/spacing),-16,16);
 const sx=snap(start.x),sz=snap(start.z),tx=snap(target.x),tz=snap(target.z);
 const queue:[[number,number]]|[number,number][]=[[sx,sz]];
 const prev=new Map<string,string|null>([[key(sx,sz),null]]);
 let end:string|undefined;
 for(let head=0;head<queue.length;head++){
  const [x,z]=queue[head];if(x===tx&&z===tz){end=key(x,z);break;}
  for(const [dx,dz]of [[0,-1],[1,0],[0,1],[-1,0]]){
   const nx=x+dx,nz=z+dz,k=key(nx,nz);
   if(Math.abs(nx)>size/2||Math.abs(nz)>size/2||prev.has(k)||isBlocked({x:nx*spacing,z:nz*spacing},obstacles,1.2))continue;
   prev.set(k,key(x,z));queue.push([nx,nz]);
  }
 }
 if(!end)return[];
 const path:Point[]=[];
 for(let k:string|null=end;k;k=prev.get(k)??null){const[x,z]=k.split(',').map(Number);path.unshift({x:x*spacing,z:z*spacing});}
 path.shift();path.push(target);return path;
}
export function followPath(car:CarState,path:Point[]):Input{
 while(path.length&&Math.hypot(path[0].x-car.x,path[0].z-car.z)<(path.length>1?2.8:2.2))path.shift();
 if(!path.length)return{throttle:0,steer:0,brake:true};
 const p=path[0],wanted=Math.atan2(-(p.x-car.x),-(p.z-car.z));
 const diff=Math.atan2(Math.sin(wanted-car.heading),Math.cos(wanted-car.heading));
 const reverse=Math.abs(diff)>1.9||(car.speed<-.2&&Math.abs(diff)>1.35);
 if(reverse){const reverseDiff=Math.atan2(Math.sin(diff+Math.PI),Math.cos(diff+Math.PI));return{throttle:-.85,steer:clamp(reverseDiff*2,-1,1),brake:car.speed>1};}
 return{throttle:Math.abs(diff)>1.6?.3:Math.abs(diff)>.6?.6:1,steer:clamp(-diff*2,-1,1),brake:Math.abs(diff)>.7&&car.speed>3.5};
}
