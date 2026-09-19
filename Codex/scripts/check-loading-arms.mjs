// 載入角色：抽樣完整步態，檢查手掌與裙身的表面間距。
import fs from 'node:fs/promises'
import * as T from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {prepareLoadingRun,createLoadingLegPose} from '../src/world3d/loadingRun.js'
globalThis.ProgressEvent=class{constructor(t,v){Object.assign(this,v)}}
const raw=await fs.readFile(new URL('../public/3d/vivi-detailed.glb',import.meta.url)),n=raw.readUInt32LE(12),j=JSON.parse(raw.subarray(20,20+n));delete j.images;delete j.textures;j.materials=j.materials.map(m=>({name:m.name}));j.buffers[0].uri=`data:application/octet-stream;base64,${raw.subarray(28+n).toString('base64')}`
const g=await new GLTFLoader().parseAsync(JSON.stringify(j),'');const {createLoadingModel}=await import('../src/world3d/loadingModel.js');const variant=createLoadingModel(g.scene);const m=variant.model;
const mix=new T.AnimationMixer(m),clip=prepareLoadingRun(m,g.animations[0]);mix.clipAction(clip).play();mix.update(0);m.updateMatrixWorld(true)
const {createLoadingArmPose}=await import('../src/world3d/loadingAvatarStyle.js');const poseLegs=createLoadingLegPose(m);const arms=createLoadingArmPose(m);const pose=(phase=0)=>{poseLegs(phase);arms()};let min=Infinity;
for(let f=0;f<96;f++){
 mix.setTime(clip.duration*f/96);pose(Math.PI*2*f/96);m.updateMatrixWorld(true);
 for(const side of ['Left','Right']){
 const hand=m.getObjectByName(side+'Hand').getWorldPosition(new T.Vector3());
 const hip=m.getObjectByName('Hips').getWorldPosition(new T.Vector3());
 min=Math.min(min,Math.abs(hand.x-hip.x));
 }
}
console.log('minimum lateral wrist clearance from hip center:',min);
// 實際穿透以下方蒙皮表面間距判斷，不以固定側向距離限制自然擺臂。
let skinClearance=Infinity;
for(let f=0;f<96;f++){
 mix.setTime(clip.duration*f/96);pose(Math.PI*2*f/96);m.updateMatrixWorld(true);
 m.traverse(mesh=>{
  if(!mesh.isSkinnedMesh||mesh.name!=='mesh_0')return;mesh.skeleton.update();
  const si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight;
  const hands=[],body=[];
  for(let i=0;i<si.count;i++){
   let strongest=0,joint='';for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>strongest){strongest=w;joint=mesh.skeleton.bones[si.getComponent(i,k)].name}}
   const p=mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld);
   if(/Hand/.test(joint))hands.push(p);
   else if(/Hips|Spine|UpLeg/.test(joint))body.push(p);
  }
  for(const hand of hands){
   const side=hand.x>0?1:-1;
   for(const v of body)if(Math.abs(v.y-hand.y)<.014&&Math.abs(v.z-hand.z)<.035)skinClearance=Math.min(skinClearance,side*(hand.x-v.x));
  }
 });
}
console.log('minimum hand / torso surface lateral clearance:',skinClearance);
if(skinClearance<0)throw Error('Hand overlaps clothing surface envelope');
// 同一姿勢重算不能累積手腕扭轉或抖動。
mix.setTime(clip.duration*.37);pose();
const joints=['LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand'].map(name=>m.getObjectByName(name));
const rotations=joints.map(joint=>joint.quaternion.clone().normalize());
for(let i=0;i<60;i++)pose();
if(joints.some((joint,i)=>joint.quaternion.clone().normalize().angleTo(rotations[i])>1e-5))throw Error('Arm pose accumulates twist');
console.log('Stable arm rotation: passed');
// 腳踝到腳尖全程沿角色前方，沒有左右外八。
for(let frame=0;frame<96;frame++){
 mix.setTime(clip.duration*frame/96);pose(Math.PI*2*frame/96);m.updateMatrixWorld(true);
 for(const side of ['Left','Right']){
  const foot=m.getObjectByName(side+'Foot').getWorldPosition(new T.Vector3());
  const toe=m.getObjectByName(side+'ToeBase').getWorldPosition(new T.Vector3());
  const forward=toe.sub(foot).normalize();
  if(Math.abs(forward.x)>1e-5)throw Error('Foot points sideways during run');
 }
}
console.log('Forward-facing feet throughout run: passed');
// 支撐期腳踝應相對骨盆向後移，回收後再向前送；不能只是原地屈伸。
const strideSamples=[0,.14,.34,.49,.69,.84].map(cycle=>{
 mix.setTime(clip.duration*cycle);pose(cycle*Math.PI*2);m.updateMatrixWorld(true);
 const hip=m.getObjectByName('LeftUpLeg').getWorldPosition(new T.Vector3());
 const foot=m.getObjectByName('LeftFoot').getWorldPosition(new T.Vector3());
 return foot.sub(hip);
});
if(!(strideSamples[0].z>strideSamples[1].z&&strideSamples[1].z>strideSamples[2].z&&strideSamples[5].z>strideSamples[2].z+.12))throw Error('Missing backward push / forward stride');
if(!(strideSamples[3].y>strideSamples[1].y+.05))throw Error('Recovery foot does not lift');
console.log('Backward push, lifted recovery and forward stride: passed');
