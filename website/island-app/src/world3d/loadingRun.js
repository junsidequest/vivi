import { Quaternion, Vector3 } from 'three'
import { prepareWalk } from './walkAnimation.js'

// 載入畫面獨立使用：加大抬腿、收腿幅度，保留循環首尾的銜接。
export function prepareLoadingRun(model, original) {
  const clip=prepareWalk(model,original)
  const q=new Quaternion()
  for(const track of clip.tracks){
    if(!/^(Left|Right)(UpLeg|Leg)\.quaternion$/.test(track.name))continue
    const mean=new Quaternion(0,0,0,0),first=new Quaternion().fromArray(track.values)
    for(let i=0;i<track.values.length;i+=4){
      q.fromArray(track.values,i)
      const sign=first.dot(q)<0?-1:1
      mean.x+=q.x*sign;mean.y+=q.y*sign;mean.z+=q.z*sign;mean.w+=q.w*sign
    }
    mean.normalize()
    const amplitude=track.name.includes('UpLeg')?1.15:1.2
    for(let i=0;i<track.values.length;i+=4){
      q.fromArray(track.values,i).slerp(mean,1-amplitude).normalize().toArray(track.values,i)
    }
  }
  return clip
}


// 一圈依序：落地承重 → 向後蹬地 → 屈膝回收 → 抬膝前送 → 伸腿落地。
// 每格為 [週期位置, 大腿前後角, 膝彎曲角, 腳踝俯仰]。
const RUN_KEYS=[
  [0,.52,.55,-.08], [.14,.02,.48,0], [.34,-.62,.38,.40],
  [.49,-.55,1.85,.65], [.69,.65,1.65,.18], [.84,.90,.78,-.12],
  [1,.52,.55,-.08],
]
export function sampleRunStride(cycle){
  const t=((cycle%1)+1)%1
  const i=RUN_KEYS.findIndex((key,index)=>index<RUN_KEYS.length-1&&t>=key[0]&&t<RUN_KEYS[index+1][0])
  const a=RUN_KEYS[i],b=RUN_KEYS[i+1],u=(t-a[0])/(b[0]-a[0])
  const previous=i===0?[RUN_KEYS[5][0]-1,...RUN_KEYS[5].slice(1)]:RUN_KEYS[i-1]
  const next=i===5?[RUN_KEYS[1][0]+1,...RUN_KEYS[1].slice(1)]:RUN_KEYS[i+2]
  const span=b[0]-a[0]
  const interpolate=axis=>{
    const m0=(b[axis]-previous[axis])/(b[0]-previous[0])*span
    const m1=(next[axis]-a[axis])/(next[0]-a[0])*span
    return (2*u**3-3*u*u+1)*a[axis]+(u**3-2*u*u+u)*m0+(-2*u**3+3*u*u)*b[axis]+(u**3-u*u)*m1
  }
  return {stride:interpolate(1),bend:interpolate(2),pitch:interpolate(3)}
}
export function runFlightHeight(phase){
  const step=((phase/(Math.PI*2))%.5+.5)%.5
  return step>.34?.032*Math.sin(Math.PI*(step-.34)/.16):0
}

// 參考圖的跨步與後勾腿，左右半週交替；保留模型原本的骨骼扭轉方向。
export function createLoadingLegPose(model){
  const legs=['Left','Right'].map(name=>{
    const thigh=model.getObjectByName(`${name}UpLeg`),shin=model.getObjectByName(`${name}Leg`),foot=model.getObjectByName(`${name}Foot`)
    return {thigh,shin,foot,toe:model.getObjectByName(`${name}ToeBase`),upper:thigh.quaternion.clone(),lower:shin.quaternion.clone(),sole:foot.getWorldQuaternion(new Quaternion())}
  })
  const start=new Vector3(),end=new Vector3(),direction=new Vector3(),facing=new Quaternion(),parent=new Quaternion(),world=new Quaternion(),turn=new Quaternion(),axis=new Vector3(1,0,0)
  const aim=(bone,child,angle)=>{
    bone.getWorldPosition(start);child.getWorldPosition(end)
    direction.set(0,-Math.cos(angle),Math.sin(angle)).applyQuaternion(facing)
    turn.setFromUnitVectors(end.sub(start).normalize(),direction)
    bone.getWorldQuaternion(world);bone.parent.getWorldQuaternion(parent)
    bone.quaternion.copy(parent.invert().multiply(turn.multiply(world))).normalize()
    bone.updateWorldMatrix(false,true)
  }
  // sole 以角色座標儲存，外層朝向不影響腳掌。
  model.getWorldQuaternion(facing)
  for(const leg of legs){
    const inverseFacing=facing.clone().invert()
    leg.sole.premultiply(inverseFacing)
    // 原始站姿的雙腳略呈外八；以腳踝到腳尖的方向校正，跑步只保留俯仰。
    if(leg.toe){
      leg.foot.getWorldPosition(start);leg.toe.getWorldPosition(end)
      direction.copy(end).sub(start).applyQuaternion(inverseFacing)
      const yaw=Math.atan2(direction.x,direction.z)
      leg.sole.premultiply(new Quaternion().setFromAxisAngle(new Vector3(0,1,0),-yaw))
    }
  }
  return phase=>{
    model.updateMatrixWorld(true);model.getWorldQuaternion(facing)
    legs.forEach(({thigh,shin,foot,upper,lower,sole},index)=>{
      const {stride,bend,pitch}=sampleRunStride(phase/(Math.PI*2)+index*.5)
      thigh.quaternion.copy(upper);shin.quaternion.copy(lower);thigh.updateWorldMatrix(true,true)
      aim(thigh,shin,stride);aim(shin,foot,stride-bend)
      foot.parent.getWorldQuaternion(parent)
      turn.setFromAxisAngle(axis,pitch)
      foot.quaternion.copy(parent.invert().multiply(world.copy(facing).multiply(turn).multiply(sole))).normalize()
      foot.updateWorldMatrix(false,true)
    })
  }
}
