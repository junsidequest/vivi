import * as T from 'three'

const CELL = 0.75
const SKIN = 0.008
// 允許跨下小屋整組低階梯（含門墊約 0.30），仍要求雙腳周圍有落地表面。
const MAX_FOOT_HEIGHT_DIFFERENCE = 0.38
const FLOORS = new Set(['Island_ground', 'Stone_path', 'Dock', 'Steps', 'Path_base'])

function distanceToEdgeSquared(x, z, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z
  const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)))
  return (x - a.x - t * dx) ** 2 + (z - a.z - t * dz) ** 2
}

function overlapsCircle(triangle, x, z, radius) {
  const [a, b, c] = triangle.points
  const side = (p, q) => (q.x - p.x) * (z - p.z) - (q.z - p.z) * (x - p.x)
  const area = (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)
  const signs = [side(a, b), side(b, c), side(c, a)]
  if (Math.abs(area) > 1e-10 && (signs.every(s => s >= -1e-9) || signs.every(s => s <= 1e-9))) return true
  return Math.min(distanceToEdgeSquared(x, z, a, b), distanceToEdgeSquared(x, z, b, c), distanceToEdgeSquared(x, z, c, a)) <= radius * radius
}

function spatialIndex(triangles) {
  const cells = new Map()
  for (const t of triangles) {
    const xs = t.points.map(p => p.x), zs = t.points.map(p => p.z)
    for (let x = Math.floor(Math.min(...xs) / CELL); x <= Math.floor(Math.max(...xs) / CELL); x++) {
      for (let z = Math.floor(Math.min(...zs) / CELL); z <= Math.floor(Math.max(...zs) / CELL); z++) {
        const key = `${x},${z}`
        if (!cells.has(key)) cells.set(key, [])
        cells.get(key).push(t)
      }
    }
  }
  return (x, z, radius) => {
    const nearby = new Set()
    for (let ix = Math.floor((x - radius) / CELL); ix <= Math.floor((x + radius) / CELL); ix++) {
      for (let iz = Math.floor((z - radius) / CELL); iz <= Math.floor((z + radius) / CELL); iz++) {
        for (const triangle of cells.get(`${ix},${iz}`) || []) nearby.add(triangle)
      }
    }
    return nearby
  }
}

// 從 GLB 的實際網格建立碰撞與地面資料；改動模型後不必另畫一份阻擋座標。
// 角色依動畫網格分高度取樣輪廓；支撐範圍由腳部模型取得。
export function createNavigation(root, { radius = 0.5, height = 1.4, profile, footRadius = radius } = {}) {
  root.updateWorldMatrix(true, true)
  const solids = [], surfaces = []
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3()
  const edge = new T.Vector3(), normal = new T.Vector3()
  root.traverse(mesh => {
    if (!mesh.isMesh) return
    let visible=mesh
    while(visible){if(!visible.visible)return;visible=visible.parent}
    let group = mesh.parent
    while (group && !FLOORS.has(group.name)) group = group.parent
    // 鴨子與荷葉是池塘內的裝飾；池塘本身的水面與石圈一起阻擋。
    const isFloor = Boolean(group) && (group.name !== 'Island_ground' || mesh.material.name === 'grass')
    const geometry = mesh.geometry, index = geometry.index, positions = geometry.attributes.position
    const count = index ? index.count : positions.count
    for (let i = 0; i < count; i += 3) {
      a.fromBufferAttribute(positions, index ? index.getX(i) : i).applyMatrix4(mesh.matrixWorld)
      b.fromBufferAttribute(positions, index ? index.getX(i + 1) : i + 1).applyMatrix4(mesh.matrixWorld)
      c.fromBufferAttribute(positions, index ? index.getX(i + 2) : i + 2).applyMatrix4(mesh.matrixWorld)
      const low = Math.min(a.y, b.y, c.y), high = Math.max(a.y, b.y, c.y)
      if (isFloor) {
        normal.subVectors(b, a).cross(edge.subVectors(c, a)).normalize()
        if (normal.y < 0.5) continue
      }
      const triangle = { points: [a.clone(), b.clone(), c.clone()], low, high, meshId: mesh.id }
      ;(isFloor ? surfaces : solids).push(triangle)
    }
  })
  const nearSolid=spatialIndex(solids),nearSurface=spatialIndex(surfaces)
  const bodyRadius=radius+SKIN
  const bands=profile?.length?profile:[{low:0,high:height,radius}]
  function surfaceHeight(x,z,footprint=0){
    let y=-Infinity
    for(const t of nearSurface(x,z,footprint))if(overlapsCircle(t,x,z,footprint))y=Math.max(y,t.high)
    return y
  }
  // 從實際封閉網格判斷內外，不再以房屋矩形或固定座標封鎖空地。
  function insideSolid(x,y,z){
    const hits=new Map()
    for(const t of nearSolid(x,z,0)){
      if(t.high<y || !overlapsCircle(t,x,z,0))continue
      const [a,b,c]=t.points,den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z)
      if(Math.abs(den)<1e-10)continue
      const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/den
      const v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/den
      const iy=u*a.y+v*b.y+(1-u-v)*c.y
      if(iy<y)continue
      const list=hits.get(t.meshId)||[]
      if(!list.some(h=>Math.abs(h-iy)<1e-5))list.push(iy)
      hits.set(t.meshId,list)
    }
    return [...hits.values()].some(list=>list.length%2===1)
  }
  function canWalk(x,z){
    // 鞋底能跨過木板的細縫，但必須確實有模型表面支撐。
    const floor=surfaceHeight(x,z,.025)
    if(!Number.isFinite(floor))return false
    for(let i=0;i<12;i++){
      const angle=i*Math.PI/6
      const y=surfaceHeight(x+Math.cos(angle)*footRadius,z+Math.sin(angle)*footRadius,.025)
      if(!Number.isFinite(y) || Math.abs(y-floor)>MAX_FOOT_HEIGHT_DIFFERENCE)return false
    }
    if(insideSolid(x,floor+.035,z))return false
    const lift=surfaceHeight(x,z,footRadius)
    for(const t of nearSolid(x,z,bodyRadius)){
      for(const band of bands){
        if(t.high<floor+band.low-SKIN || t.low>lift+band.high+SKIN)continue
        if(overlapsCircle(t,x,z,band.radius+SKIN))return false
      }
    }
    return true
  }

  function clearSegment(start, end) {
    const distance = Math.hypot(end.x - start.x, end.z - start.z)
    const steps = Math.max(1, Math.ceil(distance / 0.04))
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      if (!canWalk(start.x + (end.x - start.x) * t, start.z + (end.z - start.z) * t)) return false
    }
    return true
  }

  // 鍵盤、搖桿、跑步和自動尋路共用掃掠檢查，不會因步幅大而跳過薄燈柱。
  function move(start, dx, dz, { assist = false } = {}) {
    const next = { ...start }
    const count = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.04))
    for (let i = 0; i < count; i++) {
      const before={...next},sx=dx/count,sz=dz/count,step=Math.hypot(sx,sz)
      if (canWalk(next.x + sx, next.z)) next.x += sx
      if (canWalk(next.x, next.z + sz)) next.z += sz
      if(assist && step>0 && Math.hypot(next.x-before.x,next.z-before.z)<step*.65){
        // 僅在卡住時嘗試小角度偏移；每條候選路徑仍檢查實際模型。
        for(const degrees of [30,45,60,75,90]){
          let found=false
          for(const side of [1,-1]){
            const angle=degrees*Math.PI/180*side,c=Math.cos(angle),s=Math.sin(angle)
            const vx=(sx*c-sz*s)/step,vz=(sx*s+sz*c)/step
            const look=Math.max(step,.10),probe={x:before.x+vx*look,z:before.z+vz*look}
            if(!clearSegment(before,probe))continue
            next.x=before.x+vx*step;next.z=before.z+vz*step;found=true;break
          }
          if(found)break
        }
      }
    }
    return next
  }

  function findRoute(start, target) {
    if (!canWalk(start.x,start.z) || !canWalk(target.x,target.z)) return null
    if (clearSegment(start,target)) return [{...target}]
    const step=.25,key=(x,z)=>`${x},${z}`, nodes=new Map(),open=[]
    const heuristic=(x,z)=>Math.hypot(x*step-target.x,z*step-target.z)
    for(let x=Math.floor(start.x/step);x<=Math.ceil(start.x/step);x++)for(let z=Math.floor(start.z/step);z<=Math.ceil(start.z/step);z++){
      if(!clearSegment(start,{x:x*step,z:z*step}))continue
      const g=Math.hypot(x*step-start.x,z*step-start.z),node={x,z,g,f:g+heuristic(x,z),parent:null}
      nodes.set(key(x,z),node);open.push(node)
    }
    while(open.length){
      let best=0;for(let i=1;i<open.length;i++)if(open[i].f<open[best].f)best=i
      const node=open.splice(best,1)[0];if(node.closed)continue;node.closed=true
      const point={x:node.x*step,z:node.z*step}
      if(heuristic(node.x,node.z)<.4 && clearSegment(point,target)){
        const path=[{...target}];let p=node
        while(p){path.unshift({x:p.x*step,z:p.z*step});p=p.parent}
        // 只刪除經完整身體碰撞檢查的冗餘轉折；不以曲線切過障礙物。
        const smooth=[];let previous=start,index=0
        while(index<path.length){let furthest=index;for(let j=path.length-1;j>index;j--)if(clearSegment(previous,path[j])){furthest=j;break}
          smooth.push(path[furthest]);previous=path[furthest];index=furthest+1}
        return smooth
      }
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
        const x=node.x+dx,z=node.z+dz,k=key(x,z),old=nodes.get(k),g=node.g+Math.hypot(dx,dz)*step
        if(old && (old.closed || old.g<=g))continue
        if(!clearSegment(point,{x:x*step,z:z*step}))continue
        const next={x,z,g,f:g+heuristic(x,z),parent:node};nodes.set(k,next);if(old)old.closed=true;open.push(next)
      }
    }
    return null
  }
  return { canWalk, move, findRoute, clearSegment, surfaceHeight, radius: bodyRadius, height, footRadius }
}
