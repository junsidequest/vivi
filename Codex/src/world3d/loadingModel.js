import { clone } from 'three/addons/utils/SkeletonUtils.js'

// 載入專用模型：獨立蒙皮網格，略收窄衣身、延長手臂，給屈肘擺動留出空間。
export function createLoadingModel(source){
  const model=clone(source),geometries=[]
  model.traverse(mesh=>{
    if(!mesh.isSkinnedMesh||mesh.material.name==='Vivi_Hair_Uniform_Brown')return
    const geometry=mesh.geometry.clone(),positions=geometry.attributes.position
    const indices=geometry.attributes.skinIndex,weights=geometry.attributes.skinWeight
    if(!indices||!weights){geometry.dispose();return}
    mesh.geometry=geometry;geometries.push(geometry)
    geometry.computeBoundingBox()
    const centerX=(geometry.boundingBox.min.x+geometry.boundingBox.max.x)/2
    for(let vertex=0;vertex<positions.count;vertex++){
      let bodyWeight=0
      for(let slot=0;slot<4;slot++){
        const bone=mesh.skeleton.bones[indices.getComponent(vertex,slot)]
        if(/^(Hips|Spine\d*)$/.test(bone.name))bodyWeight+=weights.getComponent(vertex,slot)
      }
      positions.setX(vertex,centerX+(positions.getX(vertex)-centerX)*(1-.12*bodyWeight))
    }
    positions.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere()
  })
  model.getObjectByName('Head')?.scale.multiplyScalar(.96)
  for(const side of ['Left','Right']){
    model.getObjectByName(`${side}Arm`)?.scale.set(1,1.08,1)
    model.getObjectByName(`${side}ForeArm`)?.scale.set(1,1.06,1)
  }
  return {model,dispose:()=>geometries.forEach(geometry=>geometry.dispose())}
}
