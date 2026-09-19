import * as T from 'three'
import { beforeAll, describe, it, expect } from 'vitest'
import { buildCC0Island } from '../../scripts/cc0-island.mjs'
import { createNavigation } from './navigation.js'

let island, navigation
beforeAll(async () => { island = await buildCC0Island(); navigation = createNavigation(island) })

describe('整個角色的碰撞與可踩踏表面', () => {
  it('窗戶玻璃位於牆面前方，候課及池邊設施有實際碰撞', () => {
    const ray = new T.Raycaster(new T.Vector3(1.40, 1.38, 2), new T.Vector3(0, 0, -1))
    expect(ray.intersectObject(island.getObjectByName('Cottage'), true)[0].object.material.name).toBe('glass')
    for (const [x, z] of [[-4.8, 3.45], [4.65, 2.90], [-1.8, 4.0]]) expect(navigation.canWalk(x, z)).toBe(false)
  })
  it('新支線可抵達鞦韆與長椅前方，移除的信箱圍欄不再阻擋', () => {
    expect(navigation.canWalk(1.5, 4.08)).toBe(true)
    for (const target of [{x:-2.8,z:2.45},{x:3.718,z:2.80}]) {
      expect(navigation.surfaceHeight(target.x,target.z,.02)).toBeCloseTo(.105)
      expect(navigation.findRoute({x:0,z:1.25},target)?.length).toBeGreaterThan(0)
    }
    const leg=new T.Vector3(-.93,.12,-.57).applyMatrix4(island.getObjectByName('Swing').matrixWorld)
    expect(navigation.canWalk(leg.x,leg.z)).toBe(false)
  })
  it('信箱環狀木棧道可連續走回中央',()=>{
    const corners=[{x:0,z:1.7},{x:3.718,z:1.7},{x:3.718,z:4.202},{x:0,z:4.202},{x:0,z:1.7}]
    for(let i=1;i<corners.length;i++){
      expect(navigation.clearSegment(corners[i-1],corners[i])).toBe(true)
      for(let step=0;step<=16;step++){
        const t=step/16,x=corners[i-1].x+(corners[i].x-corners[i-1].x)*t,z=corners[i-1].z+(corners[i].z-corners[i-1].z)*t
        expect(navigation.surfaceHeight(x,z,.025)).toBeCloseTo(.105)
      }
    }
  })
  it('移除石路，池岸石塊在整圈皆相連', () => {
    expect(island.getObjectByName('Stone_path')).toBeUndefined()
    const rocks = []
    island.getObjectByName('Pond').traverse(mesh => { if (mesh.isMesh && mesh.material.name === 'rock') rocks.push(mesh) })
    const ray = new T.Raycaster(new T.Vector3(4, .20, -.4))
    for (let i = 0; i < 360; i++) {
      const angle = i * Math.PI / 180
      ray.ray.direction.set(Math.cos(angle), 0, Math.sin(angle))
      expect(ray.intersectObjects(rocks, false).length, `池岸角度 ${i}`).toBeGreaterThan(0)
    }
  })
  it('阻擋池塘石圈、屋子、樹與兩盞燈', () => {
    for (const [x, z] of [[0, -2.5], [4, -.4], [2.4, -.4], [-4.25, -2.7], [3.7, -3.2], [-5.65, -.35], [5.75, 1.5], [1.85, 3.18]]) {
      expect(navigation.canWalk(x, z), `${x},${z}`).toBe(false)
    }
  })
  it('中心點尚未碰到燈柱時，身體已經不能繼續靠近', () => {
    expect(navigation.canWalk(5.35, 1.5)).toBe(false)
    expect(navigation.canWalk(5.85, 1.5)).toBe(false)
  })
  it('草地、木板步道與碼頭依各自網格頂面提供高度', () => {
    expect(navigation.surfaceHeight(-2, .8)).toBeCloseTo(.065)
    expect(navigation.surfaceHeight(0, 1.25, .2)).toBeGreaterThan(.09)
    expect(navigation.surfaceHeight(0, 1.25, .2)).toBeLessThan(.12)
    expect(navigation.surfaceHeight(0, 6.5)).toBeCloseTo(.10)
    expect(navigation.surfaceHeight(0, 6.29, .03)).toBeCloseTo(.10)
  })
  it('全身留在島內及碼頭內，避免身體懸在邊緣外', () => {
    expect(navigation.canWalk(0, 6.5)).toBe(true)
    expect(navigation.canWalk(.4, 6.5)).toBe(false)
    expect(navigation.canWalk(0, 7.4)).toBe(true) // 橋樑已延伸至畫面底端
    expect(navigation.canWalk(0, 40)).toBe(false)
    expect(navigation.canWalk(6.2, 0)).toBe(false)
  })
  it('大步跑步仍不能跨過細燈柱或池塘', () => {
    expect(navigation.clearSegment({ x: 4.5, z: 1.5 }, { x: 5.9, z: 1.5 })).toBe(false)
    const next = navigation.move({ x: 1.5, z: 1.2 }, 4.5, 0)
    expect(next.x).toBeLessThan(3)
    expect(navigation.canWalk(next.x + .05, next.z)).toBe(false)
    expect(navigation.canWalk(next.x, next.z)).toBe(true)
  })
  it('自動尋路每一段都保留身體寬度，不會切過轉角', () => {
    for (const target of [{ x: -2.75, z: .5 }, { x: .75, z: 3.25 }]) {
      const start = { x: .07, z: 6.43 }
      const path = navigation.findRoute(start, target)
      expect(path?.length).toBeGreaterThan(0)
      expect(path.at(-1)).toEqual(target)
      let previous = start
      for (const point of path) { expect(navigation.clearSegment(previous, point)).toBe(true); previous = point }
    }
  }, 20000)
  it('木板步道模型高度變更時，踩踏高度自動跟著變更', async () => {
    const changed = await buildCC0Island()
    changed.getObjectByName('Path_base').position.y = .2
    const nav = createNavigation(changed)
    expect(nav.surfaceHeight(0, 1.25, .2)-navigation.surfaceHeight(0,1.25,.2)).toBeCloseTo(.2)
  }, 15000)
  it('任意地面點可尋路，直線無障礙時不產生格狀折返', () => {
    const start={x:0,z:1.5},target={x:-2.123,z:1.78}
    expect(navigation.findRoute(start,target)).toEqual([target])
    const path=navigation.findRoute({x:0,z:3},{x:3.1,z:1.7})
    expect(path?.length).toBeGreaterThan(0)
    let previous={x:0,z:3}
    for(const point of path){expect(navigation.clearSegment(previous,point)).toBe(true);previous=point}
  })
  it('不可達目的地不產生穿牆路徑', () => {
    expect(navigation.findRoute({ x: 0, z: 1 }, { x: 0, z: -2 })).toBeNull()
  })
})

function modelFixture(){
  const root=new T.Group();root.name='Vivi_Island';root.userData.land={width:.1,depth:.1,radius:.01}
  const ground=new T.Group();ground.name='Island_ground';root.add(ground)
  const material=new T.MeshStandardMaterial();material.name='grass'
  const floor=new T.Mesh(new T.BoxGeometry(4,.1,4),material);ground.add(floor)
  return {root,ground,floor}
}
describe('通行只依據現有模型',()=>{
  it('移動地面後，舊座標不可站立，新模型位置可站立',()=>{
    const {root,ground}=modelFixture();ground.position.x=10
    const nav=createNavigation(root,{radius:.2})
    expect(nav.canWalk(0,0)).toBe(false)
    expect(nav.canWalk(10,0)).toBe(true)
    ground.clear()
    expect(createNavigation(root).canWalk(10,0)).toBe(false)
  })
  it('繞障輔助能繞過小障礙，每一步保持連續且不穿越模型',()=>{
    const {root}=modelFixture()
    const post=new T.Mesh(new T.BoxGeometry(.16,1,.30),new T.MeshStandardMaterial())
    post.position.set(.55,.5,0);root.add(post)
    const nav=createNavigation(root,{radius:.12,footRadius:.10})
    let point={x:0,z:0}
    for(let i=0;i<55;i++){
      const next=nav.move(point,.03,0,{assist:true})
      expect(nav.clearSegment(point,next)).toBe(true)
      expect(Math.hypot(next.x-point.x,next.z-point.z)).toBeLessThanOrEqual(.03001)
      point=next
    }
    expect(point.x).toBeGreaterThan(1)
    expect(Math.abs(point.z)).toBeGreaterThan(.2)
  })
  it('新加入的模型會阻擋，移除後沒有殘留的隱形牆',()=>{
    const {root}=modelFixture()
    const wall=new T.Mesh(new T.BoxGeometry(.2,1,.2),new T.MeshStandardMaterial());wall.position.y=.55;root.add(wall)
    expect(createNavigation(root,{radius:.2}).canWalk(0,0)).toBe(false)
    root.remove(wall)
    expect(createNavigation(root,{radius:.2}).canWalk(0,0)).toBe(true)
  })
  it('房屋模型的開放通道不再被外接矩形封死',()=>{
    const {root}=modelFixture(),house=new T.Group();house.name='Cottage';root.add(house)
    for(const x of [-.8,.8]){const wall=new T.Mesh(new T.BoxGeometry(.15,1.6,1.5),new T.MeshStandardMaterial());wall.position.set(x,.85,0);house.add(wall)}
    const nav=createNavigation(root,{radius:.2})
    expect(nav.clearSegment({x:0,z:-1},{x:0,z:1})).toBe(true)
    expect(nav.canWalk(.8,0)).toBe(false)
  })
  it('低處物件依腿部輪廓判斷，不套用頭部的寬度',()=>{
    const {root}=modelFixture(),post=new T.Mesh(new T.BoxGeometry(.04,.2,.1),new T.MeshStandardMaterial());post.position.set(.28,.2,0);root.add(post)
    const body={radius:.36,height:1.4,footRadius:.15,profile:[{low:0,high:.8,radius:.18},{low:.8,high:1.4,radius:.36}]}
    expect(createNavigation(root,body).canWalk(0,0)).toBe(true)
    post.position.y=1.1
    expect(createNavigation(root,body).canWalk(0,0)).toBe(false)
  })
})
