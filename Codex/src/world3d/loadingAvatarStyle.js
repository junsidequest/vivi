import * as T from 'three'

// 載入專用跑步姿勢：上臂、前臂沿身體兩側擺動，避免原動作穿過寬裙襬。
export function createLoadingArmPose(model){
  const sides=[['Left',1],['Right',-1]].map(([name,side])=>({
    side,thigh:model.getObjectByName(`${name}UpLeg`),knee:model.getObjectByName(`${name}Leg`),upper:model.getObjectByName(`${name}Arm`),lower:model.getObjectByName(`${name}ForeArm`),hand:model.getObjectByName(`${name}Hand`),
  }))
  // 固定手臂的基準扭轉角，不再混入原走路動畫每一格的手腕與上臂扭轉。
  for(const arm of sides){
    arm.restUpper=arm.upper?.quaternion.clone()
    arm.restLower=arm.lower?.quaternion.clone()
    arm.restHand=arm.hand?.quaternion.clone()
  }
  const a=new T.Vector3(),b=new T.Vector3(),target=new T.Vector3(),parentQ=new T.Quaternion(),worldQ=new T.Quaternion(),turn=new T.Quaternion(),facing=new T.Quaternion()
  function aim(bone,child,direction){
    bone.getWorldPosition(a);child.getWorldPosition(b);b.sub(a).normalize()
    turn.setFromUnitVectors(b,direction.normalize())
    bone.getWorldQuaternion(worldQ);bone.parent.getWorldQuaternion(parentQ)
    bone.quaternion.copy(parentQ.invert().multiply(turn.multiply(worldQ)))
    bone.updateWorldMatrix(false,true)
  }
  return ()=>{
    model.updateMatrixWorld(true)
    // 方向先從角色座標轉到世界座標，仍可從正面或側面預覽。
    model.getWorldQuaternion(facing)
    for(const {side,thigh,knee,upper,lower,hand,restUpper,restLower,restHand} of sides){
      if(!upper||!lower||!hand||!thigh||!knee)continue
      upper.quaternion.copy(restUpper)
      lower.quaternion.copy(restLower)
      hand.quaternion.copy(restHand)
      upper.updateWorldMatrix(true,true)
      // 以同側大腿的實際前後角度驅動反向擺臂，避免與腿部錯拍。
      thigh.getWorldPosition(a);knee.getWorldPosition(b)
      const stride=b.sub(a).applyQuaternion(turn.copy(facing).invert())
      const swing=T.MathUtils.clamp(-Math.atan2(stride.z,-stride.y)*1.4,-1,1)
      // 肩膀前後擺動，前臂隨上臂轉動，肘部維持約直角。
      // 手臂向前時手掌抬到胸前，向後時手掌降到腰側。
      const shoulder=swing*.58-.06
      const forearm=shoulder+1.5+.3*Math.max(0,swing)
      aim(upper,lower,target.set(side*.54,-Math.cos(shoulder),Math.sin(shoulder)).applyQuaternion(facing))
      aim(lower,hand,target.set(side*.43,-Math.cos(forearm),Math.sin(forearm)).applyQuaternion(facing))
    }
    model.updateMatrixWorld(true)
  }
}

export function styleLoadingAvatar(model){
  const resources=[]
  // 材質獨立，改動只套用載入角色，不影響小島裡的版本。
  model.traverse(mesh=>{
    if(!mesh.isMesh)return
    const style=original=>{
      const material=original.clone();resources.push(material)
      material.roughness=original.name==='Vivi_Hair_Uniform_Brown'?.52:.76
      material.metalness=0
      if(original.name==='Vivi_Hair_Uniform_Brown')material.color.set('#70462f')
      return material
    }
    mesh.material=Array.isArray(mesh.material)?mesh.material.map(style):style(mesh.material)
  })
  model.updateMatrixWorld(true)
  const hand=model.getObjectByName('LeftHand')
  if(hand){
    const watch=new T.Group();watch.name='Loading_reference_pink_watch'
    const wrist=hand.getWorldPosition(new T.Vector3());watch.position.copy(wrist)
    const pink=new T.MeshStandardMaterial({color:'#d58d99',roughness:.6}),face=new T.MeshStandardMaterial({color:'#293a4c',roughness:.35})
    resources.push(pink,face)
    const bandGeometry=new T.TorusGeometry(.027,.006,10,32),dialGeometry=new T.CylinderGeometry(.022,.022,.009,32)
    resources.push(bandGeometry,dialGeometry)
    const band=new T.Mesh(bandGeometry,pink);band.rotation.x=Math.PI/2;watch.add(band)
    const dial=new T.Mesh(dialGeometry,face);dial.rotation.x=Math.PI/2;dial.position.z=.027;watch.add(dial)
    model.add(watch);watch.updateMatrixWorld(true);hand.attach(watch)
  }
  return ()=>resources.forEach(resource=>resource.dispose())
}
