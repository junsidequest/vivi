import { isMobilePresentation } from '../mobile.js'
import { createMobileShadows } from './mobileShadows.js'
import { sitePath } from '../routes.js'
import * as T from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { approachSpeed, turnTowards, arrivalSpeed } from './locomotion.js'
import { readSeats, approachingSeat, createSeatedPose, fitSeatBacks, swingTransform } from './seating.js'
import { createNavigation } from './navigation.js'
import { prepareWalk } from './walkAnimation.js'
import { measureAvatar, createFootPlacement } from './avatarCollision.js'

export const PLACES = {
  dock: { range: 0, title: '橋尾', point: [0, .16, 7.3], stand: {x:0,z:7.05} },
  services: { range: .6, title: '課程小屋', point: [0, 2.2, -1], stand: { x: 0, z: .4 } },
  about: { range: 1.15, title: '認識 Vivi', point: [-2.88, 1.9, -.6], stand: { x: -2.75, z: .5 } },
  contact: { range: 1.15, title: '寄一封信', point: [1.85, 1.6, 3.18], stand: { x: .75, z: 3.25 } },
  duck: { title: '池塘小鴨', point: [4, .8, -.4], stand: { x: 2.15, z: 1.4 } },
}
const FOOT_CLEARANCE = .008

function disposeTree(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set()
  root.traverse(o => {
    if (o.geometry) geometries.add(o.geometry)
    for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) {
      materials.add(m)
      for (const v of Object.values(m)) if (v?.isTexture) textures.add(v)
    }
  })
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose())
}

export function createWorld(host, { onReady, onError, onNear, onOpen, onPosition, onRoute, onProgress = () => {} }) {
  const mobile=isMobilePresentation()
  let updateMobileShadows
  let renderer
  try { renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }) }
  catch (error) { onError(error); return { dispose() {}, travel() {}, setJoystick() {}, setPaused() {} } }
  renderer.shadowMap.enabled = !mobile; renderer.shadowMap.type = T.PCFSoftShadowMap
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = .95
  renderer.domElement.tabIndex = 0
  renderer.domElement.setAttribute('aria-label', 'Vivi 的立體庭院，使用方向鍵或 WASD 散步')
  host.appendChild(renderer.domElement)
  const scene = new T.Scene(); scene.background = new T.Color('#649493')
  const camera = new T.OrthographicCamera(-8, 8, 4.5, -4.5, .1, 100)
  const cameraOffset = new T.Vector3(0, 14, 14)
  const target = new T.Vector3(0, .65, .8)
  const avatar = new T.Group(); scene.add(avatar)
  const ambient = new T.HemisphereLight('#fff1d9', '#8f9971', 2.15); scene.add(ambient)
  const sun = new T.DirectionalLight('#ffebcd', 1.75)
  sun.position.set(-6, 12, 7); sun.castShadow = !mobile
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: .5, far: 35 })
  sun.shadow.bias = -.00015; sun.shadow.normalBias = .015; sun.shadow.radius = 3
  scene.add(sun)
  const sea = new T.Mesh(new T.PlaneGeometry(150, 150), new T.MeshStandardMaterial({ color: '#659fa1', roughness: .4 }))
  sea.rotation.x = -Math.PI / 2; sea.position.y = -.94; sea.receiveShadow = true; scene.add(sea)
  const destination = new T.Mesh(new T.RingGeometry(.13,.17,40),new T.MeshBasicMaterial({color:'#fff1bd',transparent:true,opacity:.9,depthWrite:false}))
  destination.rotation.x=-Math.PI/2;destination.visible=false;scene.add(destination)
  let markerUntil=0,arrivalTarget=null,hoverComposer=null,outlinePass=null
  const ripples = new T.Group(); scene.add(ripples)
  for (let i = 0; i < 5; i++) {
    const ring = new T.Mesh(new T.RingGeometry(6.5 + i * .37, 6.525 + i * .37, 128), new T.MeshBasicMaterial({ color: '#b8dfcf', transparent: true, opacity: .15, side: T.DoubleSide }))
    ring.rotation.x = -Math.PI / 2; ring.scale.y = .84; ring.position.y = -.92; ripples.add(ring)
  }
  let disposed = false, ready = false, paused = false, frame = 0, last = 0
  let navigation, placeFeet, mixer, action, island, route = null, routeId = null, nearby = null
  let heading = 0, travelled = 0, speed = 0, lastLift = 0, idleTime = 0
  let idleHead, idleChest, idleHeadPose, idleChestPose
  let seats=[], seatedPose, sitting=null, routeSeat=null, seatCooldown=0
  const position = { x: 0, z: 1.5 }, joystick = { x: 0, z: 0, run: false }, keys = new Set()
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const loader = new GLTFLoader()
  const assetProgress = new Map([['vivi-island.glb',0],['vivi-detailed.glb',0]])
  const reportAsset=(file,value)=>{
    if(disposed)return
    assetProgress.set(file,Math.max(assetProgress.get(file),value))
    onProgress([...assetProgress.values()].reduce((sum,p)=>sum+p,0)/assetProgress.size*.85)
  }
  const load = file => loader.loadAsync(sitePath(`3d/${file}`),event=>{
    if(event.lengthComputable&&event.total>0)reportAsset(file,event.loaded/event.total)
  }).then(gltf=>{reportAsset(file,1);return gltf})
  const loadIsland = load('vivi-island.glb').then(gltf => {
    if (disposed) { disposeTree(gltf.scene); return }
    island = gltf.scene; island.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } }); scene.add(island)
    return island
  })
  const loadAvatar = load('vivi-detailed.glb').then(gltf => {
    if (disposed) { disposeTree(gltf.scene); return }
    const model = gltf.scene, box = new T.Box3().setFromObject(model), center = box.getCenter(new T.Vector3())
    const wrapper = new T.Group(); wrapper.add(model); wrapper.scale.setScalar(1.25 / (box.max.y - box.min.y))
    model.position.sub(new T.Vector3(center.x, box.min.y, center.z)); avatar.add(wrapper)
    model.traverse(o => {
      if (!o.isMesh) return
      o.castShadow = true; o.receiveShadow = true
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!o.name.startsWith('Vivi_detail')) { m.roughness = .72; m.metalness = 0; m.emissive?.setScalar(.035) }
        if (m.map) {
          m.map.anisotropy = renderer.capabilities.getMaxAnisotropy()
          m.map.minFilter = T.LinearMipmapLinearFilter
          m.map.magFilter = T.LinearFilter
          m.map.needsUpdate = true
        }
      }
    })
    if (gltf.animations.length) {
      const walk = prepareWalk(model, gltf.animations[0])
      mixer = new T.AnimationMixer(model); action = mixer.clipAction(walk); action.play(); action.setEffectiveWeight(0)
    }
    idleHead=model.getObjectByName('Head');idleChest=model.getObjectByName('Spine02')
    avatar.position.set(0, 0, 0); avatar.rotation.set(0, 0, 0)
    const body = measureAvatar(avatar, mixer, action); placeFeet = createFootPlacement(avatar); seatedPose=createSeatedPose(avatar)
    return body
  })
  Promise.all([loadIsland, loadAvatar]).then(([map, body]) => {
    if (disposed) return
    onProgress(.9)
    navigation = createNavigation(map, body)
    if(mobile)updateMobileShadows=createMobileShadows(scene,map)
    seats=readSeats(map);fitSeatBacks(avatar,seatedPose,seats)
    ready = true; onReady()
  }).catch(error => { if (!disposed) onError(error) })

  function sitDown(seat) {
    if(sitting)return
    sitting={seat,mode:'enter',time:0,weight:0,from:{...position},exit:{...seat.stand},groundLift:lastLift,released:false,swingClock:0,angle:0}
    route=null;routeId=null;routeSeat=null;speed=0;destination.visible=false
    heading=seat.heading;onNear(null);nearby=null
    onRoute(`坐在${seat.label}上休息；放開方向鍵後，再移動即可起身。`)
  }
  function standUp() {
    if(!sitting||sitting.mode==='leave'||sitting.mode==='settle')return
    if(sitting.seat.motion&&Math.abs(sitting.angle)>.001){
      sitting.mode='settle';sitting.time=0;sitting.stopAngle=sitting.angle;onRoute('鞦韆停穩後起身…');return
    }
    startLeaving()
  }
  function startLeaving() {
    if(sitting.seat.motion)sitting.seat.motion.rotation.x=0
    sitting.mode='leave';sitting.time=0;sitting.from={...position};sitting.startWeight=sitting.weight
    sitting.groundLift=navigation.surfaceHeight(sitting.exit.x,sitting.exit.z,.15)+.008
    seatCooldown=1;speed=0;onRoute('')
  }
  function routeOrigin(){return sitting?sitting.exit:position}

  function resize() {
    const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight)
    // Retina 使用原生精度；一般螢幕稍微超採樣，總像素限制避免大螢幕耗用過多 GPU。
    renderer.setPixelRatio(mobile ? Math.min(window.devicePixelRatio || 1, 1.5) : Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2.5, Math.sqrt(8000000 / (width * height))))
    const aspect = width / height
    const half = aspect < .8 ? 5.2 : 4.6
    camera.left = -half * aspect; camera.right = half * aspect; camera.top = half; camera.bottom = -half
    camera.updateProjectionMatrix(); renderer.setSize(width, height);hoverComposer?.setSize(width,height)
  }
  const observer = new ResizeObserver(resize); observer.observe(host); resize()
  const isMovingKey = code => /^(Arrow(Up|Down|Left|Right)|Key[WASD]|Shift(Left|Right))$/.test(code)
  function keydown(event) {
    if (/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(event.target.tagName)) return
    if (isMovingKey(event.code)) { event.preventDefault(); keys.add(event.code) }
    if (event.code === 'KeyE' && !event.repeat && nearby && !paused) onOpen(nearby)
  }
  const keyup = event => keys.delete(event.code)
  const blur = () => { keys.clear(); joystick.x = 0; joystick.z = 0 }
  window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup); window.addEventListener('blur', blur)
  const pointer = new T.Vector2(), ray = new T.Raycaster()
  let pointerStart = null,hovered=null,lastHover=0
  function setHover(object){
    if(hovered===object)return
    hovered=object;renderer.domElement.style.cursor=object?'pointer':''
    if(object&&!hoverComposer){
      // 先將整個物件渲染成同一張遮罩，再描外緣，避免各零件個別描邊。
      hoverComposer=new EffectComposer(renderer)
      hoverComposer.addPass(new RenderPass(scene,camera))
      outlinePass=new OutlinePass(new T.Vector2(host.clientWidth,host.clientHeight),scene,camera)
      outlinePass.visibleEdgeColor.set('#fff3b5');outlinePass.hiddenEdgeColor.set('#000000')
      outlinePass.edgeStrength=4;outlinePass.edgeThickness=2;outlinePass.edgeGlow=0
      hoverComposer.addPass(outlinePass);hoverComposer.addPass(new OutputPass())
      hoverComposer.setSize(host.clientWidth,host.clientHeight)
    }
    if(outlinePass)outlinePass.selectedObjects=object?[object]:[]
  }
  const pointerleave=()=>setHover(null)
  const pointermove=event=>{
    if(!ready||paused){setHover(null);return}
    const now=performance.now();if(now-lastHover<45)return;lastHover=now
    const rect=host.getBoundingClientRect()
    pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1)
    ray.setFromCamera(pointer,camera)
    let object=ray.intersectObject(island,true)[0]?.object
    while(object&&!['Notice_board','Mailbox','Duck'].includes(object.name))object=object.parent
    setHover(object||null)
  }
  const pointerdown = event => { if(event.button!==0)return; pointerStart = { x: event.clientX, y: event.clientY }; renderer.domElement.focus() }
  const pointerup = event => {
    const start=pointerStart;pointerStart=null
    if (!ready || paused || event.button!==0 || !start || Math.hypot(event.clientX-start.x,event.clientY-start.y)>8) return
    const rect=host.getBoundingClientRect()
    pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1)
    ray.setFromCamera(pointer,camera)
    const hit=ray.intersectObject(island,true)[0]
    if(!hit)return
    let seatObject=hit.object
    while(seatObject&&!seatObject.userData.seat)seatObject=seatObject.parent
    if(seatObject){
      const seat=seats.find(s=>s.object===seatObject)
      if(sitting?.seat===seat)return
      standUp()
      const path=seat&&navigation.findRoute(routeOrigin(),seat.stand)
      if(path){route=path;routeSeat=seat;routeId=null;onRoute(`正在走向${seat.label}…`)}
      else onRoute('這個座位前方暫時走不通。')
      return
    }
    let group=hit.object
    while(group && !group.userData.interaction)group=group.parent
    if(PLACES[group?.userData.interaction]){travel(group.userData.interaction);return}
    let floor=hit.object
    while(floor && !['Island_ground','Path_base','Stone_path','Steps','Dock'].includes(floor.name))floor=floor.parent
    const targetPoint={x:hit.point.x,z:hit.point.z}
    standUp()
    const path=floor?navigation.findRoute(routeOrigin(),targetPoint):null
    arrivalTarget=null;route=null;routeId=null;routeSeat=null;speed=0
    destination.position.set(targetPoint.x,navigation.surfaceHeight(targetPoint.x,targetPoint.z,.17)+.025,targetPoint.z)
    destination.material.color.set(path?'#fff1bd':'#b87558');destination.visible=true;markerUntil=performance.now()+1800
    if(!path){onRoute('這裡無法站立，請點選空地或步道。');return}
    route=path;onRoute('');renderer.domElement.focus()
  }
  renderer.domElement.addEventListener('pointermove',pointermove);renderer.domElement.addEventListener('pointerleave',pointerleave);
  renderer.domElement.addEventListener('pointerdown', pointerdown); renderer.domElement.addEventListener('pointerup', pointerup)
  function travel(id) {
    if (!ready || paused || !PLACES[id]) return
    arrivalTarget=null;setHover(null);standUp();routeSeat=null
    const path = navigation.findRoute(routeOrigin(), PLACES[id].stand)
    if (!path) { onRoute('這個方向暫時走不通，換個位置試試。'); return }
    route = path; routeId = id; destination.visible=false; onRoute(id==='dock'?'了解更多 Vivi 的課程與服務':`正在前往${PLACES[id].title}…`)
    renderer.domElement.focus()
  }
  const projected = new T.Vector3()
  function project(point) {
    projected.set(...point).project(camera)
    return { x: (projected.x * .5 + .5) * host.clientWidth, y: (-projected.y * .5 + .5) * host.clientHeight }
  }
  function tick(now) {
    if (disposed) return
    const dt = Math.min((now - last) / 1000 || 0, .04); last = now
    let distance = 0
    if(ready&&!paused){
      seatCooldown=Math.max(0,seatCooldown-dt)
      if(sitting){
        const input=Math.hypot((keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joystick.x,(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+joystick.z)
        if(input<.12)sitting.released=true
        if(sitting.mode==='idle'&&sitting.released&&input>.12)standUp()
        sitting.time+=dt
        if(sitting.mode==='idle')sitting.swingClock+=dt
        const t=Math.min(1,sitting.time/.55),smooth=t*t*(3-2*t)
        if(sitting.mode==='enter'){
          sitting.weight=smooth
          position.x=T.MathUtils.lerp(sitting.from.x,sitting.seat.point.x,smooth)
          position.z=T.MathUtils.lerp(sitting.from.z,sitting.seat.point.z,smooth)
          if(t===1)sitting.mode='idle'
        }else if(sitting.mode==='settle'){
          sitting.angle=sitting.stopAngle*(1-smooth)
          if(t===1){sitting.angle=0;startLeaving()}
        }else if(sitting.mode==='leave'){
          sitting.weight=sitting.startWeight*(1-smooth)
          position.x=T.MathUtils.lerp(sitting.from.x,sitting.exit.x,smooth)
          position.z=T.MathUtils.lerp(sitting.from.z,sitting.exit.z,smooth)
          if(t===1){sitting=null;seatCooldown=.8}
        }
      }
    }
    if (ready && !paused && !sitting) {
      let dx = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) + joystick.x
      let dz = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) + joystick.z
      const length=Math.hypot(dx,dz)
      let desiredSpeed=0, remaining=Infinity, dirX=0,dirZ=0
      if(length>.12){
        arrivalTarget=null;
        if(route)onRoute('');route=null;routeId=null;routeSeat=null;destination.visible=false
        desiredSpeed=keys.has('ShiftLeft')||keys.has('ShiftRight')||joystick.run?2.15:1.25
        dirX=dx/length;dirZ=dz/length
      }else if(route?.length){
        const next=route[0],x=next.x-position.x,z=next.z-position.z;remaining=Math.hypot(x,z)
        if(remaining<.012){
          route.shift()
          if(!route.length){const id=routeId,seat=routeSeat;route=null;routeId=null;routeSeat=null;speed=0;destination.visible=false;onRoute('');if(seat)sitDown(seat);else if(id){if(id==='about'||id==='contact'){heading=Math.atan2(PLACES[id].point[0]-position.x,PLACES[id].point[2]-position.z);arrivalTarget=id}else onOpen(id)}}
        }else{dirX=x/remaining;dirZ=z/remaining;desiredSpeed=route.length===1?arrivalSpeed(remaining):1.25}
      }
      if(desiredSpeed>0&&!route&&seatCooldown<=0){
        const seat=approachingSeat(seats,position,dirX,dirZ)
        if(seat&&navigation.canWalk(seat.stand.x,seat.stand.z)){sitDown(seat);desiredSpeed=0}
      }
      if(desiredSpeed>0){
        heading=Math.atan2(dirX,dirZ)
        const turn=Math.abs(Math.atan2(Math.sin(heading-avatar.rotation.y),Math.cos(heading-avatar.rotation.y)))
        desiredSpeed*=Math.max(.18,Math.cos(turn*.5))
      }
      speed=approachSpeed(speed,desiredSpeed,dt)
      if(desiredSpeed===0 && !route){dirX=Math.sin(heading);dirZ=Math.cos(heading)}
      const step=Math.min(speed*dt,remaining)
      if(step>.00001 && Math.hypot(dirX,dirZ)>.1){
        const next=navigation.move(position,dirX*step,dirZ*step,{assist:!route})
        distance=Math.hypot(next.x-position.x,next.z-position.z)
        // 面向由輸入方向決定；沿障礙邊緣的輔助位移不覆蓋玩家的轉向。
        position.x=next.x;position.z=next.z
        if(distance<step*.05){speed=0;if(route){route=null;routeId=null;destination.visible=false;onRoute('這裡有障礙物，請重新選擇落點。')}}
      }
      let nextNear = null, nearest = sitting?0:1.35
      for (const [id, place] of Object.entries(PLACES)) {
        const d = Math.hypot(position.x - place.stand.x, position.z - place.stand.z)
        if (d < nearest && d < (place.range ?? 1.35)) { nearest = d; nextNear = id }
      }
      if (nextNear !== nearby) { nearby = nextNear; onNear(nearby) }
    }
    travelled += distance
    if (ready) {
      seatedPose.restore()
      avatar.position.set(position.x, 0, position.z)
      avatar.rotation.set(0,turnTowards(avatar.rotation.y, heading, dt),0)
      if(arrivalTarget&&!paused&&Math.abs(Math.atan2(Math.sin(heading-avatar.rotation.y),Math.cos(heading-avatar.rotation.y)))<.025){
        const id=arrivalTarget;arrivalTarget=null;onOpen(id)
      }
      if(idleHeadPose)idleHead.quaternion.copy(idleHeadPose)
      if(idleChestPose)idleChest.quaternion.copy(idleChestPose)
      if (action) {
        const weight = T.MathUtils.lerp(action.getEffectiveWeight(), Math.min(1, distance / Math.max(dt, .001) / .65), 1 - Math.exp(-dt * 10))
        action.setEffectiveWeight(sitting?0:weight)
        // 步行相位由實際位移推進，撞牆時不會原地滑步。
        action.time = (travelled / 2.25 * action.getClip().duration) % action.getClip().duration
        mixer.update(0)
      }
      if(idleHead)idleHeadPose=idleHead.quaternion.clone()
      if(idleChest)idleChestPose=idleChest.quaternion.clone()
      if(!paused)idleTime+=dt
      const idle=1-(action?.getEffectiveWeight()||0)
      if(!reduced){idleHead?.rotateY(Math.sin(idleTime*.7)*.014*idle);idleChest?.rotateX(Math.sin(idleTime*1.6)*.006*idle)}
      const requiredLift=placeFeet(navigation)
      if(sitting){
        seatedPose.apply(sitting.weight)
        const seatedLift=sitting.seat.rootLift ?? (sitting.seat.point.y+.085-seatedPose.hipHeight())
        lastLift=T.MathUtils.lerp(sitting.groundLift,seatedLift,sitting.weight)
      }else{
        // 上階即時保護腳底，下階緩降；停住時沿用同一骨架姿勢。
        lastLift=Math.max(requiredLift,lastLift-(paused?0:dt*1.8))
      }
      avatar.position.y=lastLift
      if(sitting?.seat.motion){
        if(sitting.mode==='idle')sitting.angle=reduced?0:Math.sin(sitting.swingClock*1.9)*.10*Math.min(1,sitting.swingClock/1.5)
        else if(sitting.mode!=='settle')sitting.angle=0
        const {pivot,rotation}=swingTransform(sitting.seat,sitting.angle)
        avatar.position.sub(pivot).applyQuaternion(rotation).add(pivot)
        avatar.quaternion.premultiply(rotation)
      }
      const desired = new T.Vector3(position.x * .8, .6, position.z * .7 - .3)
      target.lerp(desired, reduced ? 1 : 1 - Math.exp(-dt * 4))
    }
    if(ready)updateMobileShadows?.(avatar,navigation,sitting)
    camera.position.copy(target).add(cameraOffset); camera.lookAt(target)
    if (island && !reduced) {
      const duck = island.getObjectByName('Duck')
      duck.position.set(3.8 + Math.sin(now * .00035) * .12, Math.sin(now * .0013) * .008, -.3 + Math.cos(now * .00035) * .1)
      duck.rotation.y = Math.sin(now * .00035) * .22
      ripples.children.forEach((r, i) => { r.material.opacity = .11 + Math.sin(now * .0006 + i) * .03 })
    }
    if(destination.visible && now>markerUntil && !route){destination.visible=false;onRoute('')}
    if(destination.visible)destination.scale.setScalar(1+Math.sin(now*.006)*.08)
    if(hovered&&hoverComposer)hoverComposer.render(dt)
    else renderer.render(scene, camera)
    if (ready) onPosition({ avatar: project([position.x, avatar.position.y + 1.4, position.z]), places: Object.fromEntries(Object.entries(PLACES).map(([id, p]) => [id, project(p.point)])), x: position.x, z: position.z, y: avatar.position.y, clearance: FOOT_CLEARANCE, dt, moving: distance>.00001, autoWalking: Boolean(route) })
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
  const lost = e => { e.preventDefault(); onError(new Error('WebGL context lost')) }
  renderer.domElement.addEventListener('webglcontextlost', lost)
  return {
    travel,
    setJoystick(x, z, run = false) { Object.assign(joystick, { x, z, run }) },
    setPaused(value) { paused = value; if (value) {blur();speed=0;setHover(null)} },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect()
      window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', blur)
      renderer.domElement.removeEventListener('pointermove',pointermove);renderer.domElement.removeEventListener('pointerleave',pointerleave);
      renderer.domElement.removeEventListener('pointerdown', pointerdown); renderer.domElement.removeEventListener('pointerup', pointerup); renderer.domElement.removeEventListener('webglcontextlost', lost)
      hoverComposer?.passes.forEach(pass=>pass.dispose());hoverComposer?.dispose()
      mixer?.stopAllAction(); disposeTree(scene); renderer.dispose(); renderer.domElement.remove()
    },
  }
}
