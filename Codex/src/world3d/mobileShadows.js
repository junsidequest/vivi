import * as T from 'three'

// 不使用陰影深度貼圖；柔和接地陰影直接固定在世界座標，不受鏡頭或低幀率影響。
export function createMobileShadows(scene, island) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64
  const ctx=canvas.getContext('2d'), gradient=ctx.createRadialGradient(32,32,4,32,32,32)
  gradient.addColorStop(0,'rgba(24,35,26,.28)');gradient.addColorStop(.5,'rgba(24,35,26,.15)');gradient.addColorStop(1,'rgba(24,35,26,0)')
  ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64)
  const texture=new T.CanvasTexture(canvas),geometry=new T.PlaneGeometry(1,1)
  const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1})
  const group=new T.Group();group.name='Mobile_contact_shadows';scene.add(group)
  function add(x,y,z,width,depth){
    const mesh=new T.Mesh(geometry,material);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.scale.set(width,depth,1)
    mesh.raycast=()=>{};group.add(mesh);return mesh
  }
  island.updateMatrixWorld(true)
  const objects=['Cottage','Notice_board','Mailbox'].map(name=>island.getObjectByName(name))
  objects.push(...(island.getObjectByName('Trees_and_shrubs')?.children||[]))
  for(const object of objects.filter(Boolean)){
    const box=new T.Box3().setFromObject(object),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3())
    add(center.x,.073,center.z,Math.min(size.x*1.1,3.3),Math.min(size.z*1.1,3.3))
  }
  const foot=add(0,.08,0,.62,.42);foot.visible=false
  return (avatar,navigation,sitting)=>{
    foot.visible=!sitting
    if(!foot.visible)return
    const {x,z}=avatar.position
    foot.position.set(x,navigation.surfaceHeight(x,z,.03)+.012,z)
  }
}
