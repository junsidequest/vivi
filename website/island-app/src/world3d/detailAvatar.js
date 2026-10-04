import * as T from 'three'
import { softenMouth } from './softenMouth.js'

// 配件用實際模型高度定位，再附著到骨架；走路、轉頭時跟著角色移動。
export function detailAvatar(model) {
  model.updateMatrixWorld(true)
  const bounds = new T.Box3().setFromObject(model), center = bounds.getCenter(new T.Vector3())
  const h = bounds.max.y - bounds.min.y
  const materials = {
    brass: new T.MeshStandardMaterial({ color: '#caa35d', metalness: .55, roughness: .3 }),
    ribbon: new T.MeshStandardMaterial({ color: '#e4c28c', roughness: .68 }),
    thread: new T.MeshStandardMaterial({ color: '#f2e1b4', roughness: .9 }),
  }
  const world = ([x,y,z]) => new T.Vector3(center.x+x*h,bounds.min.y+y*h,center.z+z*h)
  function add(geometry, material, at, boneName, rotation=0) {
    const mesh = new T.Mesh(geometry, materials[material])
    mesh.name = `Vivi_detail_${material}`
    mesh.position.copy(world(at)); mesh.rotation.z=rotation
    model.add(mesh); mesh.updateMatrixWorld(true)
    const bone=model.getObjectByName(boneName)
    if(bone)bone.attach(mesh)
    mesh.castShadow=true; mesh.receiveShadow=true
    return mesh
  }
  // 衣襟鈕扣有外框與中央凹面，維持原本服裝配色。
  for(const y of [.354,.396,.438]) {
    const rim=add(new T.TorusGeometry(h*.0075,h*.0022,8,20),'brass',[0,y,.108],'Spine02')
    add(new T.SphereGeometry(h*.005,16,10),'thread',[0,y,.108],'Spine02')
  }
  // 保留原本貼圖與骨架，改善材質細節的清晰度。
  model.traverse(mesh=>{
    if(!mesh.isMesh || mesh.name.startsWith('Vivi_detail'))return
    // 保留原模型法線：嘴唇、牙齒與眼瞼共點但屬於不同表面，不能跨面平均。
    softenMouth(mesh.geometry)
    const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material]
    for(const material of mats){material.roughness=.72; material.metalness=0}
  })
  return model
}
