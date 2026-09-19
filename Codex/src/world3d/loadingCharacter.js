import { sitePath } from '../routes.js'
import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { createLoadingModel } from './loadingModel.js'
import { prepareLoadingRun, createLoadingLegPose, runFlightHeight } from './loadingRun.js'
import { createFootPlacement } from './avatarCollision.js'
import { createLoadingArmPose, styleLoadingAvatar } from './loadingAvatarStyle.js'

let character
const getCharacter=()=>character??=(new GLTFLoader()).loadAsync(sitePath('3d/vivi-detailed.glb')).catch(error=>{character=null;throw error})

// 共用小島模型，套用載入專用跑步動作，透明畫布的地面對齊進度條。
export function createLoadingCharacter(host,{onReady,onError}){
  let disposed=false,frame=0,mixer,model,disposeStyle,disposeModel
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true})
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0)
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95
  host.appendChild(renderer.domElement)
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-.6,.6,1.5,0,.1,30)
  camera.position.set(0,0,6);camera.lookAt(0,0,0)
  scene.add(new T.HemisphereLight('#fff1d9','#8f9971',2.15))
  const light=new T.DirectionalLight('#ffebcd',1.75);light.position.set(-3,5,5);scene.add(light)
  const avatar=new T.Group();avatar.rotation.y=Math.PI/2;scene.add(avatar)
  const reduced=matchMedia('(prefers-reduced-motion: reduce)')
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;const half=1.5*w/h/2;camera.left=-half;camera.right=half;camera.updateProjectionMatrix();renderer.setSize(w,h)}
  const observer=new ResizeObserver(resize);observer.observe(host);resize()
  getCharacter().then(gltf=>{
    if(disposed)return
    const variant=createLoadingModel(gltf.scene)
    model=variant.model;disposeModel=variant.dispose
    disposeStyle=styleLoadingAvatar(model)
    const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3())
    const wrapper=new T.Group();wrapper.scale.setScalar(1.25/(bounds.max.y-bounds.min.y));wrapper.rotation.x=.09;wrapper.add(model)
    model.position.sub(new T.Vector3(center.x,bounds.min.y,center.z));avatar.add(wrapper)
    const clip=gltf.animations[0]
    if(clip){mixer=new T.AnimationMixer(model);mixer.timeScale=clip.duration/.64;mixer.clipAction(prepareLoadingRun(model,clip)).play()}
    // 依動畫實際姿勢校準尺寸；骨架起始姿勢與建模姿勢的高度不同。
    mixer?.update(0);avatar.updateMatrixWorld(true)
    const posed=new T.Box3().setFromObject(avatar,true)
    wrapper.scale.multiplyScalar(1.25/(posed.max.y-posed.min.y))
    avatar.updateMatrixWorld(true)
    const poseLegs=createLoadingLegPose(model),poseArms=createLoadingArmPose(model)
    const feet=createFootPlacement(avatar),floor={surfaceHeight:()=>0}
    let previous=performance.now()
    const tick=now=>{
      if(disposed)return
      const dt=Math.min((now-previous)/1000,.04);previous=now
      if(!reduced.matches)mixer?.update(dt)
      const phase=(mixer?.time||0)*Math.PI*2/(clip?.duration||1)
      poseLegs(phase)
      poseArms()
      avatar.position.y=0;avatar.position.y=feet(floor)-.008+(reduced.matches?0:runFlightHeight(phase))
      renderer.render(scene,camera)
      frame=requestAnimationFrame(tick)
    }
    tick(previous);onReady?.()
  }).catch(error=>{if(!disposed)onError?.(error)})
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();disposeStyle?.();disposeModel?.();mixer?.stopAllAction();if(model){mixer?.uncacheRoot(model);model.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose()})}renderer.dispose();renderer.domElement.remove()}
}
