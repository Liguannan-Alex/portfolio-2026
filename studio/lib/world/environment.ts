import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { locations,worldObstacles,type Obstacle } from './driving';
import { content } from './content';

export async function makeEnvironment(scene:THREE.Scene,anisotropy=1){
 const assets:THREE.Texture[]=[];const geometries:THREE.BufferGeometry[]=[];const materials:THREE.Material[]=[];
 const loader=new THREE.TextureLoader();
 const configureTexture=(texture:THREE.Texture)=>{texture.anisotropy=anisotropy;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;};
 const [gltf,leaf,avatar]=await Promise.all([new GLTFLoader().loadAsync('/world/vehicle.glb'),loader.loadAsync('/world/foliage.png'),loader.loadAsync('/world/avatar.png')]);
 assets.push(leaf,avatar);avatar.colorSpace=THREE.SRGBColorSpace;leaf.magFilter=THREE.LinearFilter;
 const cached=new Map<string,THREE.MeshStandardMaterial>();
 function mat(color:string){if(!cached.has(color)){const m=new THREE.MeshStandardMaterial({color,roughness:.95});cached.set(color,m);materials.push(m);}return cached.get(color)!;}
 const dark='#514c63',wood='#b78457',pale='#efdab6',teal='#779e9e';
 function mesh(g:THREE.BufferGeometry,m:THREE.Material,parent:THREE.Object3D=scene){geometries.push(g);const o=new THREE.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function box(x:number,y:number,z:number,w:number,h:number,d:number,color:string,parent:THREE.Object3D=scene,rounded=false){const g=rounded?new RoundedBoxGeometry(w,h,d,2,.12):new THREE.BoxGeometry(w,h,d);const o=mesh(g,mat(color),parent);o.position.set(x,y,z);return o;}
 function cyl(x:number,y:number,z:number,r:number,h:number,color:string,parent:THREE.Object3D=scene){const o=mesh(new THREE.CylinderGeometry(r,r,h,12),mat(color),parent);o.position.set(x,y,z);return o;}
 function text(text:string,w:number,h:number,bg='#725c50',fg='#fff0d2',size=.48){
  const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const ctx=c.getContext('2d')!;ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=fg;ctx.font=`700 ${c.height*size}px Arial,"PingFang SC",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,c.width/2,c.height*.52,c.width*.94);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;assets.push(t);const m=new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide});materials.push(m);return mesh(new THREE.PlaneGeometry(w,h),m,new THREE.Group());
 }
 function sign(str:string,x:number,y:number,z:number,w=6,h=1,bg=wood,fg='#fff0d2',parent:THREE.Object3D=scene){const o=text(str,w,h,bg,fg);o.position.set(x,y,z);parent.add(o);return o;}
 function plaque(str:string,x:number,z:number,w=5,bg=pale){const o=sign(str,x,.05,z,w,1,bg,'#65584c');o.rotation.x=-Math.PI/2;return o;}
 const outline=[[-36,-31],[-20,-38],[0,-36],[21,-37],[35,-23],[37,-1],[34,22],[20,36],[-3,37],[-28,32],[-37,13],[-39,-10]];
 const shape=new THREE.Shape();outline.forEach(([x,z],i)=>{if(i===0)shape.moveTo(x,-z);else shape.lineTo(x,-z);});shape.closePath();
 const topGeometry=new THREE.ShapeGeometry(shape);topGeometry.rotateX(-Math.PI/2);const ground=mesh(topGeometry,mat('#7f966d'));ground.castShadow=false;
 const edgeGeometry=new THREE.ExtrudeGeometry(shape,{depth:1.5,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.35,bevelThickness:.15});edgeGeometry.rotateX(-Math.PI/2);edgeGeometry.translate(0,-1.68,0);mesh(edgeGeometry,mat('#9d947b'));
 const indices=topGeometry.index?new Uint32Array(topGeometry.index.array):new Uint32Array(Array.from({length:topGeometry.getAttribute('position').count},(_,i)=>i));
 const groundPhysics={positions:new Float32Array(topGeometry.getAttribute('position').array),indices};
 const bridge=box(5,.15,16,3.5,.20,5.5,'#bfa17c');bridge.rotation.x=.085;bridge.rotation.y=-.55;bridge.updateMatrixWorld(true);const ramp=bridge.geometry.clone().applyMatrix4(bridge.matrixWorld);const rp=new Float32Array(ramp.getAttribute('position').array),ri=new Uint32Array(ramp.index!.array);const baseCount=groundPhysics.positions.length/3;groundPhysics.positions=new Float32Array([...groundPhysics.positions,...rp]);groundPhysics.indices=new Uint32Array([...groundPhysics.indices,...Array.from(ri,v=>v+baseCount)]);ramp.dispose();
 const waterUniforms={time:{value:0}};
 const waterMat=new THREE.MeshStandardMaterial({color:'#6c9fa4',roughness:.28,metalness:.15});materials.push(waterMat);
 waterMat.onBeforeCompile=(shader)=>{shader.uniforms.uTime=waterUniforms.time;shader.vertexShader='uniform float uTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.z += sin(position.x*.35+uTime)*.035+cos(position.y*.27+uTime*.8)*.04;');};
 const water=mesh(new THREE.PlaneGeometry(240,240,80,80),waterMat);water.rotation.x=-Math.PI/2;water.position.y=-.42;water.castShadow=false;
 // Authored paths connect content areas instead of a four-building grid.
 const paths=[[[0,10],[0,4],[-7,-3],[-17,-10]],[[-17,-10],[-8,-16],[5,-16],[16,-13]],[[0,7],[-13,8],[-25,7]],[[0,7],[-5,17],[-12,25]],[[0,7],[7,17],[14,25]],[[0,7],[15,9],[28,4]],[[16,-13],[26,-9],[28,4]],[[14,25],[27,19],[28,4]]];
 function distSegment(x:number,z:number,a:number[],b:number[]){const dx=b[0]-a[0],dz=b[1]-a[1],t=THREE.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
 const onPath=(x:number,z:number)=>paths.some(path=>path.some((a,i)=>i<path.length-1&&distSegment(x,z,a,path[i+1])<2.1));
 for(const path of paths){for(let j=0;j<path.length-1;j++){const a=path[j],b=path[j+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);const road=box((a[0]+b[0])/2,.018,(a[1]+b[1])/2,3.8,.03,length+.5,'#c7a575');road.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);road.castShadow=false;for(let s=0;s<length;s+=1.25){const t=s/length;const p=box(a[0]+(b[0]-a[0])*t,.045,a[1]+(b[1]-a[1])*t,1.5,.035,.57,'#c5ab83');p.rotation.y=road.rotation.y+.06*Math.sin(s);p.castShadow=false;}}}
 for(const p of locations){const disk=mesh(new THREE.CylinderGeometry(3.7,3.7,.06,36),mat('#c7a575'));disk.position.set(p.id==='about'?0:p.x,.04,p.id==='about'?7:p.z);disk.castShadow=false;}
 // Warm practical lights punctuate the paths.
 const lamps:THREE.Mesh[]=[];
 function lamp(x:number,z:number){box(x,.25,z,.7,.5,.7,'#817c7a');box(x,1.5,z,.17,2.3,.17,dark);box(x,2.8,z,.65,.8,.65,dark);const m=new THREE.MeshStandardMaterial({color:'#ffcd84',emissive:'#ffa84f',emissiveIntensity:1.2});materials.push(m);const glow=mesh(new THREE.BoxGeometry(.43,.53,.66),m);glow.position.set(x,2.8,z);lamps.push(glow);box(x,3.25,z,.8,.16,.8,dark);}
 [[-4,8],[5,5],[-13,-9],[-21,-13],[12,-12],[20,-12],[-22,10],[-15,23],[-9,26],[10,24],[17,26],[25,3],[29,8]].forEach(([x,z])=>lamp(x,z));
 // Welcome: a film gate, personal avatar and a small arrival court.
 for(const x of [-4.5,4.5]){box(x,2.7,-1,.6,5.4,.7,wood);box(x,2.7,-1,.75,.18,.85,pale);}
 box(0,5.1,-1,10,.7,.85,wood);sign('π · 冠南的片场',0,5.12,-.55,8.6,.62,wood,'#fff0d2');
 const avatarMat=new THREE.MeshBasicMaterial({map:avatar,transparent:true,side:THREE.DoubleSide});materials.push(avatarMat);const portrait=mesh(new THREE.PlaneGeometry(3.3,3.3),avatarMat);portrait.position.set(-4,2,3);portrait.castShadow=false;box(-4,2,2.85,3.55,3.55,.18,dark);box(-4,.25,2.85,4,.5,.7,wood);sign('数字冠南 / HELLO',-4,.65,3.04,3.1,.38,dark);
 sign('产品 × 影视 × AI',3.8,2.05,3,3.4,.68,dark);box(3.8,.9,3,.14,1.8,.2,wood);
 plaque('PI GUANNAN',0,11,12,'#efd8ae');plaque('从想法，到上架。',0,13,7,'#d8b986');
 // Central screening stage with real project screenshots.
 const screenGroups=new Map<string,{group:THREE.Group;screen:THREE.Mesh;title:THREE.Mesh;focus:THREE.Vector3;camera:THREE.Vector3}>();
 const loadedImages=new Map<string,THREE.Texture>();
 async function stage(id:string,x:number,z:number,label:string,image:string){
  const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);box(0,.2,-4,12,.4,6,'#a58d73',group);
  for(let i=0;i<8;i++)box(0,.43,-6.4+i*.65,11.8,.08,.54,'#c6976c',group);
  for(const sx of [-5.1,5.1])box(sx,3.5,-5,.35,6.6,.4,wood,group);
  box(0,6.35,-5,11,.55,.8,wood,group);const title=sign(label,0,6.34,-4.54,9.7,.48,wood,'#ffe7bc',group);
  box(0,3.65,-5,10.8,5,.45,dark,group);
  const texture=await loader.loadAsync(image);texture.colorSpace=THREE.SRGBColorSpace;assets.push(texture);loadedImages.set(image,texture);
  const m=new THREE.MeshBasicMaterial({map:texture});materials.push(m);const screen=mesh(new THREE.PlaneGeometry(8,5),m,group);screen.position.set(0,3.55,-4.74);
  for(const sx of [-6.3,6.3]){const board=sign(sx<0?'查看作品':'源代码 / 演示',sx,2.3,-3.2,2.5,.75,'#c7a575','#64584d',group);board.rotation.y=sx<0?.15:-.15;box(sx,1,-3.25,.12,2,.12,wood,group);}
  box(0,.55,-1.2,7,.5,1.2,'#be996f',group,true);const openBook=box(-1,.85,-1.2,1.5,.09,.9,pale,group);openBook.rotation.y=.2;
  screenGroups.set(id,{group,screen,title,focus:new THREE.Vector3(x,3.6,z-4),camera:new THREE.Vector3(x+1,6.2,z+15.5)});
 }
 await Promise.all([stage('works',-17,-10,'作品放映场','/previews/portal.png'),stage('learn',-12,25,'从会问 AI，到能对结果负责','/previews/ai-course.png')]);
 // Career: actual dates form a physical sequence rather than repeated buildings.
 const years=['2013','2018','2019','2020','2022','2025'];
 years.forEach((year,i)=>{const x=7+i*4.1,z=-19+Math.sin(i*.8)*1.8;box(x,.5,z,2.8,1,1.5,i%2?teal:wood);const p=sign(year,x,1.4,z+.8,2.5,.8,dark);p.rotation.x=-.12;});
 sign('走过的路，都在这里。',17,4,-23,10,1.25,wood);for(const x of [11,23])box(x,2,-23,.2,4,.3,wood);
 // GitHub arcade: cabinets and a popcorn cart tell the game-work story.
 const arcadeImages=['/previews/hengdian-game.png','/previews/portal.png'];
 for(let i=0;i<2;i++){const x=-28+i*3.2,z=1;box(x,1.6,z,2.6,3.2,2.4,i?teal:dark,scene,true);box(x,3.6,z,2.8,.7,2.2,i?wood:'#b87961');const tx=await loader.loadAsync(arcadeImages[i]);tx.colorSpace=THREE.SRGBColorSpace;assets.push(tx);const ma=new THREE.MeshBasicMaterial({map:tx});materials.push(ma);const sc=mesh(new THREE.PlaneGeometry(2.1,1.7),ma);sc.position.set(x,2.4,z+1.23);box(x,1.2,z+1.4,2.5,.18,.9,wood);cyl(x-.5,1.4,z+1.5,.1,.3,dark);cyl(x+.5,1.33,z+1.5,.1,.05,'#efb576');}
 sign('OPEN SOURCE / 开源实验',-26.2,4.5,1.8,7.6,.75,dark);const popcorn=box(-22.7,1.1,1.2,2,2.2,1.8,'#c78661',scene,true);box(-22.7,2.6,1.2,2.2,.35,2,pale);for(let i=0;i<12;i++){const pop=mesh(new THREE.IcosahedronGeometry(.24,1),mat('#fff0c1'));pop.position.set(-23.25+(i%3)*.5,2.93+Math.floor(i/6)*.33,.75+Math.floor((i%6)/3)*.65);}
 // Coffee kiosk is a small everyday tool station, with a real product preview.
 box(14,1.65,18.8,7,3.3,3.3,pale,scene,true);box(14,3.6,18.8,7.8,.45,4.3,teal);box(14,2.1,20.5,5.7,1.5,.1,dark);box(14,1.35,21,6.5,.2,1,wood);sign('暖豆咖啡 · 生活里的产品',14,3.5,21.01,6.8,.48,teal);
 for(let i=0;i<8;i++)box(10.6+i*.95,3.38,21.3,.9,.3,1.8,i%2?teal:pale);
 for(const x of [11.7,15.8]){cyl(x,1.65,21,.26,.5,'#e9d3b0');cyl(x,1.91,21,.22,.02,'#6b4c36');}
 sign('排班 · 协作 · 一杯咖啡',14,.09,24,7,.85,pale,'#64584d').rotation.x=-Math.PI/2;
 // Evidence radar station.
 box(29,.22,-2,7,.44,5,'#b2aea0');cyl(29,1.8,-2,.45,3.2,dark);const dish=new THREE.Group();dish.position.set(29,3.5,-2);scene.add(dish);const bowl=mesh(new THREE.SphereGeometry(2.2,20,10,0,Math.PI*2,0,Math.PI*.52),mat('#dcd5be'),dish);bowl.rotation.x=-.8;cyl(0,1.1,0,.07,2.5,wood,dish);sign('线索 · 依据 · 核验',29,1.7,1,6,.9,teal);box(29,.7,1,.18,1.4,.3,dark);
 const radarTexture=await loader.loadAsync('/previews/radar.png');radarTexture.colorSpace=THREE.SRGBColorSpace;assets.push(radarTexture);const radarMaterial=new THREE.MeshBasicMaterial({map:radarTexture});materials.push(radarMaterial);const radarScreen=mesh(new THREE.PlaneGeometry(6,3.75),radarMaterial);radarScreen.position.set(28,3.5,-5);
 // Three-scale planting: trunks, clustered foliage, then a shared animated grass layer.
 let seed=8291;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const treePoints:[number,number,number][]=[[-7,1,1],[7,5,0],[-8,-7,1],[-27,-18,2],[-6,-26,0],[2,-25,1],[29,-24,0],[30,12,1],[23,24,0],[4,26,2],[-23,26,0],[-32,18,1],[-33,-3,0],[-21,-28,1],[28,27,2]];
 const colliderTrees:Obstacle[]=[];
 const foliageMat=new THREE.MeshLambertMaterial({color:'#ffffff',alphaMap:leaf,alphaTest:.46,alphaToCoverage:true,side:THREE.DoubleSide});materials.push(foliageMat);
 const leafGeo=new THREE.PlaneGeometry(1.25,1.25);geometries.push(leafGeo);const leaves=new THREE.InstancedMesh(leafGeo,foliageMat,treePoints.length*46);leaves.castShadow=true;leaves.receiveShadow=true;const dummy=new THREE.Object3D();let n=0;
 for(const [x,z,kind]of treePoints){const trunk=mesh(new THREE.CylinderGeometry(.2,.48,4.5,7),mat('#bda78e'));trunk.position.set(x,2.25,z);colliderTrees.push({x,z,w:.7,d:.7});const color=new THREE.Color(['#b1c786','#dfa9aa','#d8c28c'][kind]);for(let i=0;i<46;i++){const theta=random()*Math.PI*2,r=Math.sqrt(random())*2.4,y=3.1+random()*3;dummy.position.set(x+Math.cos(theta)*r,y,z+Math.sin(theta)*r);dummy.rotation.set((random()-.5)*.8,Math.PI/4+(random()-.5),random()*Math.PI*2);dummy.scale.setScalar(.75+random()*.85);dummy.updateMatrix();leaves.setMatrixAt(n,dummy.matrix);leaves.setColorAt(n,color.clone().multiplyScalar(.85+random()*.3));n++;}}scene.add(leaves);
 const grassGeo=new THREE.BufferGeometry();grassGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.13,0,0,.13,0,0,.015,.8,0],3));grassGeo.computeVertexNormals();geometries.push(grassGeo);
 const grassUniforms={time:{value:0},car:{value:new THREE.Vector3()}};
 const grassMat=new THREE.MeshLambertMaterial({color:'#ffffff',side:THREE.DoubleSide});materials.push(grassMat);
 grassMat.onBeforeCompile=shader=>{shader.uniforms.uTime=grassUniforms.time;shader.uniforms.uCar=grassUniforms.car;shader.vertexShader='uniform float uTime;uniform vec3 uCar;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n float wind=sin(uTime*1.2+instanceMatrix[3].x*.8+instanceMatrix[3].z*.6); transformed.x+=wind*position.y*.22; float cd=distance(instanceMatrix[3].xz,uCar.xz); transformed.y*=mix(.25,1.,smoothstep(.5,1.8,cd));');};
 const grass=new THREE.InstancedMesh(grassGeo,grassMat,48000);grass.receiveShadow=true;let count=0;
 while(count<48000){const x=(random()-.5)*65,z=(random()-.5)*64;if(onPath(x,z)||locations.some(p=>Math.hypot(p.x-x,p.z-z)<4.1)||worldObstacles.some(p=>Math.abs(p.x-x)<p.w/2+1.5&&Math.abs(p.z-z)<p.d/2+1.5))continue;dummy.position.set(x,.03,z);dummy.rotation.set(0,random()*Math.PI*2,0);dummy.scale.set(.7+random(),.35+random()*.7,.7);dummy.updateMatrix();grass.setMatrixAt(count,dummy.matrix);grass.setColorAt(count,new THREE.Color().setHSL(.20+random()*.06,.27,.43+random()*.20));count++;}scene.add(grass);
 // Detailed MIT-licensed vehicle, recoloured for the blue-scarf personal identity.
 const bodyVisual=gltf.scene.children.find(o=>/^chassis/i.test(o.name))!;const wheelTemplate=gltf.scene.children.find(o=>/^wheelContainer/i.test(o.name))!;
 bodyVisual.removeFromParent();bodyVisual.position.set(0,0,0);bodyVisual.rotation.y=Math.PI/2;
 bodyVisual.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;const m=(o.material as THREE.MeshStandardMaterial).clone();if(o.name.startsWith('bodyPainted')){m.color.set('#9ec2c5');m.emissive.set('#162e39');m.emissiveIntensity=.1;}if(m.emissiveIntensity>1)m.emissiveIntensity=1.2;m.roughness=.85;materials.push(m);o.material=m;}});
 const car=new THREE.Group();car.add(bodyVisual);scene.add(car);
 const wheels=Array.from({length:4},(_,i)=>{const pivot=new THREE.Group();car.add(pivot);const model=wheelTemplate.clone(true);model.position.set(0,0,0);model.rotation.y=Math.PI/2+(i%2?Math.PI:0);pivot.add(model);model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;if(o.name.startsWith('wheelPainted')){const m=(o.material as THREE.MeshStandardMaterial).clone();m.color.set('#d7bd86');o.material=m;materials.push(m);}}});const rolling=model.children.find(o=>/^wheelCylinder/i.test(o.name));return{pivot,rolling,model};});
 const plate=sign('π',0,.34,-1.35,.48,.3,'#254c59','#fff0d2',car);plate.rotation.x=-.05;
 assets.forEach(configureTexture);
 const trackGeo=new THREE.PlaneGeometry(.19,.5);geometries.push(trackGeo);const trackMat=new THREE.MeshBasicMaterial({color:'#665948',transparent:true,opacity:.22,depthWrite:false});materials.push(trackMat);const tracks=new THREE.InstancedMesh(trackGeo,trackMat,900);tracks.frustumCulled=false;let trackIndex=0;dummy.scale.set(0,0,0);dummy.updateMatrix();for(let i=0;i<900;i++)tracks.setMatrixAt(i,dummy.matrix);scene.add(tracks);let trackDistance=0;
 return{car,wheels,groundPhysics,obstacles:[...worldObstacles,...colliderTrees],screenGroups,
  update:(t:number,position:THREE.Vector3,speed:number,night:boolean)=>{waterUniforms.time.value=t;grassUniforms.time.value=t;grassUniforms.car.value.copy(position);dish.rotation.y=t*.12;lamps.forEach(l=>{(l.material as THREE.MeshStandardMaterial).emissiveIntensity=night?2:.6;});trackDistance+=Math.abs(speed)/60;if(trackDistance>.5&&Math.abs(speed)>1){trackDistance=0;for(const wheel of wheels){const p=wheel.pivot.getWorldPosition(new THREE.Vector3());dummy.position.set(p.x,.058,p.z);dummy.rotation.set(-Math.PI/2,0,car.rotation.y);dummy.scale.set(1,1,1);dummy.updateMatrix();tracks.setMatrixAt(trackIndex%900,dummy.matrix);trackIndex++;}tracks.instanceMatrix.needsUpdate=true;}},
  setPreview:async(id:string,projectId:string)=>{const target=screenGroups.get(id);const item=content.projects.find(p=>p.id===projectId);if(!target||!item)return;target.screen.userData.project=projectId;let texture:THREE.Texture|undefined;const key=item.image||item.id;texture=loadedImages.get(key);if(!texture){const card=document.createElement('canvas');card.width=1280;card.height=800;const c=card.getContext('2d')!;c.fillStyle='#192e38';c.fillRect(0,0,1280,800);if(item.image){const original=await loader.loadAsync(item.image);assets.push(original);const im=original.image;const scale=Math.min(1280/im.width,800/im.height);c.drawImage(im,(1280-im.width*scale)/2,(800-im.height*scale)/2,im.width*scale,im.height*scale);}else{c.fillStyle='#ecd6b2';c.font='700 57px Arial, "PingFang SC",sans-serif';let line='',y=240;for(const char of item.title){if(c.measureText(line+char).width>1080){c.fillText(line,90,y);line=char;y+=85;}else line+=char;}c.fillText(line,90,y);c.fillStyle='#96bcb9';c.font='30px Arial, "PingFang SC",sans-serif';c.fillText(item.status,90,y+95);c.fillStyle='#d4dac7';c.font='30px Arial, "PingFang SC",sans-serif';line='';y+=175;for(const char of item.description){if(c.measureText(line+char).width>1080){c.fillText(line,90,y);line=char;y+=52;}else line+=char;}c.fillText(line,90,y);c.fillStyle='#769998';c.font='24px monospace';c.fillText('PROJECT NOTES / PI GUANNAN',90,720);}texture=new THREE.CanvasTexture(card);texture.colorSpace=THREE.SRGBColorSpace;assets.push(texture);loadedImages.set(key,texture);}if(target.screen.userData.project!==projectId)return;configureTexture(texture);(target.screen.material as THREE.MeshBasicMaterial).map=texture;(target.screen.material as THREE.MeshBasicMaterial).needsUpdate=true;},
  dispose:()=>{geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());assets.forEach(t=>t.dispose());gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});}
 };
}
