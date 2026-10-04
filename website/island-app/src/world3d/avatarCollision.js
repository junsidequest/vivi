import * as T from 'three'

function updateSkeletons(root) {
  // SkinnedMesh.updateMatrixWorld 也會刷新 bindMatrixInverse；一般的
  // updateWorldMatrix 不會，會讓位移被套用兩次，導致腳底高度逐幀漂移。
  root.updateMatrixWorld(true)
  root.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update() })
}

// 取樣完整步行週期和站姿，圓柱包住頭、裙襬、手腳在各方向的活動範圍。
export function measureAvatar(root, mixer, action) {
  const bounds = new T.Box3(), point = new T.Vector3(), slices = new Map()
  let footRadius=0
  const sample=()=>{
    updateSkeletons(root)
    root.traverse(mesh=>{
      if(!mesh.isMesh)return
      for(let i=0;i<mesh.geometry.attributes.position.count;i++){
        mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);bounds.expandByPoint(point)
        const key=Math.floor(point.y/.1),r=Math.hypot(point.x,point.z)
        slices.set(key,Math.max(slices.get(key)||0,r))
        if(point.y<.22)footRadius=Math.max(footRadius,r)
      }
    })
  }
  sample()
  if (action) {
    action.setEffectiveWeight(1)
    const duration = action.getClip().duration
    for (let i = 0; i <= Math.ceil(duration * 30); i++) {
      mixer.setTime(duration * i / Math.ceil(duration * 30))
      sample()
    }
    action.setEffectiveWeight(0)
    mixer.setTime(0)
    updateSkeletons(root)
  }
  const profile=[...slices].map(([key,radius])=>({low:key*.1-.015,high:(key+1)*.1+.015,radius:radius+.012})).sort((a,b)=>a.low-b.low)
  const radius=Math.max(...profile.map(p=>p.radius))
  return {radius,height:bounds.max.y-bounds.min.y+.04,profile,footRadius:footRadius+.008}
}

// 保存腳部頂點索引；每幀在骨架更新後取得兩隻腳實際的包圍盒。
// 分開處理雙腳，讓抬起的腳保持步態，著地腳抬到石板頂面。
export function createFootPlacement(root) {
  updateSkeletons(root)
  const bounds = new T.Box3().setFromObject(root, true)
  const midX = (bounds.min.x + bounds.max.x) / 2
  const point = new T.Vector3(), feet = [[], []]
  root.traverse(mesh => {
    if (!mesh.isMesh) return
    for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
      mesh.getVertexPosition(i, point).applyMatrix4(mesh.matrixWorld)
      if (point.y <= bounds.min.y + 0.22) feet[point.x < midX ? 0 : 1].push({ mesh, index: i })
    }
  })
  const footBoxes = [new T.Box3(), new T.Box3()]
  return navigation => {
    updateSkeletons(root)
    let lift = -Infinity
    for (let side = 0; side < 2; side++) {
      const box = footBoxes[side].makeEmpty()
      for (const { mesh, index } of feet[side]) box.expandByPoint(mesh.getVertexPosition(index, point).applyMatrix4(mesh.matrixWorld))
      if (box.isEmpty()) continue
      const x = (box.min.x + box.max.x) / 2, z = (box.min.z + box.max.z) / 2
      const radius = Math.hypot(box.max.x - box.min.x, box.max.z - box.min.z) / 2
      lift = Math.max(lift, navigation.surfaceHeight(x, z, radius) - box.min.y)
    }
    return Number.isFinite(lift) ? lift + 0.008 : 0
  }
}
