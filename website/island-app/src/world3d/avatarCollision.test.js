import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { measureAvatar, createFootPlacement } from './avatarCollision.js'
import { buildCC0Island } from '../../scripts/cc0-island.mjs'
import { createNavigation } from './navigation.js'
import { readSeats, approachingSeat, createSeatedPose, fitSeatBacks, swingTransform } from './seating.js'
import { prepareWalk } from './walkAnimation.js'

let avatar, mixer, action, body, navigation, island
beforeAll(async () => {
  vi.stubGlobal('ProgressEvent', class { constructor(type, values) { this.type = type; Object.assign(this, values) } })
  // 真實角色骨架、頂點與動畫；測試不需要載入貼圖。
  const data = readFileSync(new URL('../../public/3d/vivi-detailed.glb', import.meta.url))
  const length = data.readUInt32LE(12)
  const json = JSON.parse(data.subarray(20, 20 + length))
  delete json.images; delete json.textures
  json.materials = json.materials?.map(() => ({}))
  json.buffers[0].uri = `data:application/octet-stream;base64,${data.subarray(28 + length).toString('base64')}`
  const gltf = await new GLTFLoader().parseAsync(JSON.stringify(json), '')
  const model = gltf.scene, bounds = new T.Box3().setFromObject(model), center = bounds.getCenter(new T.Vector3())
  avatar = new T.Group()
  const wrapper = new T.Group(); wrapper.add(model)
  model.position.sub(new T.Vector3(center.x, bounds.min.y, center.z))
  wrapper.scale.setScalar(1.25 / (bounds.max.y - bounds.min.y)); avatar.add(wrapper)
  const walk = prepareWalk(model, gltf.animations[0])
  mixer = new T.AnimationMixer(model); action = mixer.clipAction(walk); action.play(); action.setEffectiveWeight(0)
  // 以網站實際步態取樣碰撞與腳底高度。
  body = measureAvatar(avatar, mixer, action)
  island=await buildCC0Island()
  navigation = createNavigation(island, body)
}, 60000)

describe('實際 Vivi 模型', () => {
  it('寬木板橋尾可步行抵達並保留原本橋面寬度',()=>{
    const target={x:0,z:7.05}
    expect(navigation.canWalk(target.x,target.z)).toBe(true)
    expect(navigation.findRoute({x:0,z:1.5},target)?.length).toBeGreaterThan(0)
    const dock=island.getObjectByName('Dock')
    const box=new T.Box3().setFromObject(dock)
    expect(box.max.x-box.min.x).toBeCloseTo(1.5,2)
    expect(box.max.z).toBeGreaterThan(30)
    for(let z=5.1;z<=30;z+=.4)expect(navigation.canWalk(0,z)).toBe(true)
  },30000)

  it('動畫全身包圍範圍仍可從出生點走到佈告欄與信箱', () => {
    expect(body.radius).toBeGreaterThan(.2)
    expect(body.radius).toBeLessThan(.72)
    expect(navigation.canWalk(0, 1.25)).toBe(true)
    for (const target of [{ x: -2.75, z: .5 }, { x: .75, z: 3.25 }, { x: 0, z: .4 }, { x: 2.15, z: 1.4 }]) {
      expect(navigation.findRoute({ x: 0, z: 1.25 }, target)?.length).toBeGreaterThan(0)
    }
  })
  it('可從門口上層階梯直接向左右走下，不必繞經下層', () => {
    const start={x:0,z:-.2}
    expect(navigation.surfaceHeight(start.x,start.z)).toBeGreaterThan(.3)
    for(const side of [-1,1]){
      const target={x:side*1.35,z:-.2}
      expect(navigation.clearSegment(start,target)).toBe(true)
      expect(navigation.findRoute(start,target)).toEqual([target])
      const next=navigation.move(start,side*1.35,0)
      expect(next.x).toBeCloseTo(target.x)
      expect(next.z).toBeCloseTo(target.z)
    }
  })
  it('長椅與鞦韆的入口可達，只在朝向座位時觸發',()=>{
    const seats=readSeats(island)
    expect(seats).toHaveLength(2)
    const pose=createSeatedPose(avatar);fitSeatBacks(avatar,pose,seats)
    for(const seat of seats){
      expect(navigation.canWalk(seat.stand.x,seat.stand.z)).toBe(true)
      expect(navigation.findRoute({x:0,z:1.5},seat.stand)?.length).toBeGreaterThan(0)
      const d=new T.Vector3(seat.point.x-seat.stand.x,0,seat.point.z-seat.stand.z).normalize()
      expect(approachingSeat(seats,seat.stand,d.x,d.z)).toBe(seat)
      expect(approachingSeat(seats,seat.stand,-d.x,-d.z)).toBeUndefined()
    }
  },30000)
  it('坐姿的大腿向前、小腿向下，起身可還原骨架',()=>{
    avatar.position.set(0,0,0);avatar.rotation.set(0,0,0)
    action.setEffectiveWeight(0);mixer.update(0)
    const pose=createSeatedPose(avatar),saved=avatar.getObjectByName('LeftUpLeg').quaternion.clone()
    pose.apply(1)
    for(const side of ['Left','Right']){
      const hip=avatar.getObjectByName(side+'UpLeg').getWorldPosition(new T.Vector3())
      const knee=avatar.getObjectByName(side+'Leg').getWorldPosition(new T.Vector3())
      const ankle=avatar.getObjectByName(side+'Foot').getWorldPosition(new T.Vector3())
      expect(knee.z-hip.z).toBeGreaterThan(.15)
      expect(Math.abs(knee.y-hip.y)).toBeLessThan(.06)
      expect(knee.y-ankle.y).toBeGreaterThan(.12)
    }
    pose.restore()
    expect(avatar.getObjectByName('LeftUpLeg').quaternion.angleTo(saved)).toBeLessThan(.000001)
  })
  it('擺盪時身體不穿過座面或椅背，小腿貼近座椅前緣',()=>{
    avatar.position.set(0,0,0);avatar.quaternion.identity();action.setEffectiveWeight(0);mixer.update(0)
    const pose=createSeatedPose(avatar),seats=readSeats(island)
    fitSeatBacks(avatar,pose,seats)
    const seat=seats.find(s=>s.motion)
    expect(seat).toBeDefined()
    for(const angle of [-.10,0,.10]){
      pose.restore();avatar.position.set(seat.point.x,0,seat.point.z);avatar.rotation.set(0,seat.heading,0);pose.apply(1)
      avatar.position.y=seat.rootLift
      const {pivot,rotation}=swingTransform(seat,angle)
      avatar.position.sub(pivot).applyQuaternion(rotation).add(pivot);avatar.quaternion.premultiply(rotation)
      island.updateMatrixWorld(true);avatar.updateMatrixWorld(true);avatar.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update()})
      const inverse=seat.motion.matrixWorld.clone().invert(),point=new T.Vector3()
      let back=-Infinity,legGap=Infinity,supportGap=Infinity
      avatar.traverse(mesh=>{if(!mesh.isMesh)return;for(let j=0;j<mesh.geometry.attributes.position.count;j++){
        mesh.getVertexPosition(j,point).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);back=Math.max(back,point.z)
        const height=point.y+seat.motion.position.y
        if(height<.585){
          expect(point.z).toBeLessThan(-.415)
          legGap=Math.min(legGap,-.415-point.z)
        }
        if(Math.abs(point.x)<.64 && point.z>-.415 && point.z<.215){
          expect(height).toBeGreaterThanOrEqual(.585)
          supportGap=Math.min(supportGap,height-.585)
        }
      }})
      expect(back).toBeLessThan(seat.object.userData.seat.backLimit)
      expect(legGap).toBeLessThan(.025)
      expect(supportGap).toBeLessThan(.025)
    }
    pose.restore();seat.motion.rotation.x=0;avatar.position.set(0,0,0);avatar.quaternion.identity()
  })
  it('步行每個取樣姿勢，腳底都放在木板表面之上', () => {
    avatar.position.set(0, 0, 0); avatar.rotation.y = 0
    action.setEffectiveWeight(0); mixer.setTime(0)
    const placeFeet = createFootPlacement(avatar)
    action.setEffectiveWeight(1)
    for (const [x, z] of [[0, 1.25], [.42, .65], [.7, 2.4], [0, .4]]) for (let i = 0; i <= 16; i++) {
      mixer.setTime(action.getClip().duration * i / 16)
      avatar.position.set(x, 0, z)
      avatar.rotation.y = i * Math.PI / 8
      avatar.position.y = placeFeet(navigation)
      avatar.updateMatrixWorld(true)
      avatar.traverse(mesh => { if (mesh.isSkinnedMesh) mesh.skeleton.update() })
      const bounds = new T.Box3().setFromObject(avatar, true)
      expect(bounds.min.y).toBeGreaterThanOrEqual(.065)
      expect(bounds.max.y).toBeLessThan(2.1)
      expect(Math.abs((bounds.min.z + bounds.max.z) / 2 - z)).toBeLessThan(body.radius)
      const vertex = new T.Vector3()
      avatar.traverse(mesh => {
        if (!mesh.isMesh) return
        for (let j = 0; j < mesh.geometry.attributes.position.count; j++) {
          mesh.getVertexPosition(j, vertex).applyMatrix4(mesh.matrixWorld)
          if (vertex.y < .8) expect(vertex.y + 1e-5).toBeGreaterThanOrEqual(navigation.surfaceHeight(vertex.x, vertex.z))
        }
      })
    }
  }, 120000)
})
