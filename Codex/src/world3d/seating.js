import * as T from 'three'

export function readSeats(island) {
  island.updateMatrixWorld(true)
  const seats=[]
  island.traverse(object=>{
    if(!object.userData.seat)return
    const data=object.userData.seat
    const point=object.localToWorld(new T.Vector3(...data.point))
    const stand=object.localToWorld(new T.Vector3(...data.stand))
    const front=stand.clone().sub(point).setY(0).normalize()
    seats.push({object,label:data.label,point,stand:{x:stand.x,z:stand.z},heading:Math.atan2(front.x,front.z),motion:data.motion?object.getObjectByName(data.motion):null})
  })
  return seats
}

// 使用變形後的頂點對齊座面、前緣與椅背，包含衣服和鞋子。
export function fitSeatBacks(avatar,pose,seats) {
  const position=avatar.position.clone(),rotation=avatar.quaternion.clone()
  pose.restore();avatar.position.set(0,0,0);avatar.quaternion.identity();pose.apply(1)
  avatar.updateMatrixWorld(true);avatar.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update()})
  const bounds=new T.Box3().setFromObject(avatar,true)
  const vertices=[]
  avatar.traverse(mesh=>{
    if(!mesh.isMesh)return
    for(let i=0;i<mesh.geometry.attributes.position.count;i++){
      vertices.push(mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld))
    }
  })
  const knees=['LeftLeg','RightLeg'].map(name=>avatar.getObjectByName(name)?.getWorldPosition(new T.Vector3())).filter(Boolean)
  const kneeFront=knees.length?Math.min(...knees.map(p=>p.z)):Infinity
  pose.restore();avatar.position.copy(position);avatar.quaternion.copy(rotation);avatar.updateMatrixWorld(true)
  for(const seat of seats){
    const data=seat.object.userData.seat
    if(data.backLimit===undefined)continue
    const point=new T.Vector3(...data.point)
    point.z=Math.min(point.z,data.backLimit+bounds.min.z-.045)
    if(data.frontEdge!==undefined && knees.length){
      // 膝蓋前的轉折區留給小腿；後方臀部與大腿的最低表面貼合座面。
      const kneeHeight=Math.min(...knees.map(k=>k.y))
      const support=vertices.filter(p=>p.z<kneeFront-.05 && p.y>kneeHeight-.055)
      let supportY=support.reduce((min,p)=>Math.min(min,p.y),Infinity)
      for(let pass=0;pass<12;pass++){
        const belowSeat=vertices.filter(p=>p.y<supportY)
        if(belowSeat.length){
          const legBack=belowSeat.reduce((min,p)=>Math.min(min,p.z),Infinity)
          point.z=Math.min(point.z,data.frontEdge+legBack-.008)
        }
        const overSeat=vertices.filter(p=>Math.abs(p.x)<(data.halfWidth??.64) && point.z-p.z>data.frontEdge && point.z-p.z<data.backLimit)
        const contactY=overSeat.reduce((min,p)=>Math.min(min,p.y),Infinity)
        if(!Number.isFinite(contactY) || Math.abs(contactY-supportY)<.0001)break
        supportY=contactY
      }
      seat.rootLift=data.point[1]-supportY+.008
    }
    seat.point.copy(seat.object.localToWorld(point))
  }
}

export function swingTransform(seat,angle) {
  seat.motion.rotation.x=angle
  const pivot=seat.motion.parent.localToWorld(seat.motion.position.clone())
  const orientation=seat.object.getWorldQuaternion(new T.Quaternion())
  const rotation=orientation.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),angle)).multiply(orientation.invert())
  return {pivot,rotation}
}

export function approachingSeat(seats,position,dx,dz) {
  return seats.find(seat=>{
    const x=seat.point.x-position.x,z=seat.point.z-position.z,d=Math.hypot(x,z)
    const data=seat.object.userData.seat
    const ox=position.x-seat.stand.x,oz=position.z-seat.stand.z
    const lateral=Math.abs(ox*Math.cos(seat.heading)-oz*Math.sin(seat.heading))
    const depth=Math.abs(ox*Math.sin(seat.heading)+oz*Math.cos(seat.heading))
    return lateral<(data.entryWidth??.32) && depth<(data.entryDepth??.32) && d>.1 && (x*dx+z*dz)/d>.6
  })
}

// 依骨骼在世界空間的方向彎曲腿部，避免依賴各骨骼不一致的局部座標軸。
export function createSeatedPose(avatar) {
  const pairs=[]
  for(const side of ['Left','Right'])for(const [part,child,direction] of [
    ['UpLeg','Leg',[0,-.08,1]],['Leg','Foot',[0,-1,.06]],
    ['Foot','ToeBase',[0,-.24,1]],['Arm','ForeArm',[0,-1,.22]],['ForeArm','Hand',[0,-.35,.9]],
  ]){
    const bone=avatar.getObjectByName(side+part),end=avatar.getObjectByName(side+child)
    if(bone&&end)pairs.push({bone,end,direction:new T.Vector3(...direction).normalize(),saved:bone.quaternion.clone()})
  }
  const hips=avatar.getObjectByName('Hips'),a=new T.Vector3(),b=new T.Vector3(),world=new T.Quaternion(),parent=new T.Quaternion()
  let applied=false
  return {
    restore(){if(applied)for(const pair of pairs)pair.bone.quaternion.copy(pair.saved);applied=false},
    apply(weight){
      if(weight<=0)return
      for(const pair of pairs){
        const {bone,end}=pair;pair.saved.copy(bone.quaternion)
        avatar.updateMatrixWorld(true)
        bone.getWorldPosition(a);end.getWorldPosition(b)
        const from=b.sub(a).normalize(),to=pair.direction.clone().applyQuaternion(avatar.quaternion)
        bone.getWorldQuaternion(world);bone.parent.getWorldQuaternion(parent)
        const target=parent.invert().multiply(new T.Quaternion().setFromUnitVectors(from,to)).multiply(world)
        bone.quaternion.slerp(target,weight)
      }
      applied=true;avatar.updateMatrixWorld(true)
    },
    hipHeight(){avatar.updateMatrixWorld(true);return hips?hips.getWorldPosition(a).y-avatar.position.y:.55},
  }
}
