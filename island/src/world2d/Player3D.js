// 3D 角色渲染器：在 2D 地圖上以小塊透明 WebGL canvas 呈現 Vivi 的 3D 模型。
// 只負責「一個會轉身、會走路的角色」——場景仍是 2D 底圖，不引入 R3F。
// 步態由呼叫端以 setGait(0..1) 直接驅動（棋盤式移動：一格恰好半個週期＝一步）。
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const MODEL_URL = '3d/vivi.glb?v=2'   // 相對小島頁 URL，站台掛在子路徑（如 Pages 的 /vivi/）也載得到   // ?v= 換資產時遞增，避免瀏覽器沿用舊快取
const TURN_SPEED = 14          // 轉身平滑係數

// facing → 模型 Y 轉角。以 ?rot= 實測標定（rot=0 正面、rot=90 面向右）：
// 模型 rest pose 面向 +Z（鏡頭側），front=0、back=π、right=+π/2、left=-π/2
const FACING_ANGLE = { front: 0, back: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 }

// 校準用：?rot=度數 鎖定轉角、?gait=0..1 凍結步態相位，標定完即可不用
const QS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null
const ROT_OVERRIDE = QS ? parseFloat(QS.get('rot')) : NaN
const GAIT_OVERRIDE = QS ? parseFloat(QS.get('gait')) : NaN

// Meshy 貼圖是碎片化 UV atlas：mipmap 縮小取樣會把圖塊縫隙的雜色滲進表面（裂紋主因），直接關掉
// （舊模型另有壓黑髮色的像素修補；新黏土版髮色是暖棕，該修補反而會壓壞髮色，已移除）
function cleanTexture(tex) {
  tex.generateMipmaps = false
  tex.minFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}

export function createPlayer3D(container, { width = 115, height = 125, onFail } = {}) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true })
  } catch {
    return null   // 無 WebGL → 呼叫端維持 2D sprite
  }
  renderer.setPixelRatio(Math.min(2, devicePixelRatio))
  renderer.setSize(width, height)
  renderer.setClearColor(0x000000, 0)
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  // 黏土質感靠光：高環境光＋柔和暖主光，不出高光銳影
  scene.add(new THREE.AmbientLight(0xfff6ea, 1.5))
  const sun = new THREE.DirectionalLight(0xffe9c8, 1.1)
  sun.position.set(2, 4, 3)
  scene.add(sun)

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100)
  const pivot = new THREE.Group()
  scene.add(pivot)

  // 接地陰影錨點：綁定姿勢雙腳中點（pivot 座標系），每幀依轉角旋轉後投影成 canvas 像素
  const feetLocal = new THREE.Vector3()
  const feetTmp = new THREE.Vector3()
  const UP = new THREE.Vector3(0, 1, 0)

  const state = {
    ready: false,
    mixer: null,
    action: null,
    clipDur: 0,
    targetAngle: FACING_ANGLE.front,
    gait: null,          // null = idle（淡出動畫回綁定站姿）；0..1 = 步態相位
    weight: 0,           // 動畫權重（平滑淡入淡出）
    feetPx: null,        // {x, y}：雙腳中點目前的 canvas CSS 座標（給接地陰影跟位）
    dispose() {
      renderer.dispose()
      renderer.domElement.remove()
    },
    setFacing(facing) {
      state.targetAngle = Number.isFinite(ROT_OVERRIDE)
        ? (ROT_OVERRIDE * Math.PI) / 180
        : (FACING_ANGLE[facing] ?? FACING_ANGLE.front)
    },
    setGait(phase01) {
      state.gait = phase01
    },
    update(dt) {
      if (!state.ready) return
      // 平滑轉身（走最短角差）
      let d = state.targetAngle - pivot.rotation.y
      while (d > Math.PI) d -= Math.PI * 2
      while (d < -Math.PI) d += Math.PI * 2
      pivot.rotation.y += d * Math.min(1, dt * TURN_SPEED)

      if (state.action) {
        const runtimeOv = typeof window.__gait === 'number' ? window.__gait : null
        const phase = runtimeOv ?? (Number.isFinite(GAIT_OVERRIDE) ? GAIT_OVERRIDE : state.gait)
        // 走路＝動畫權重 1；停下（null / 負相位）＝權重淡出 0 → 綁定站姿（雙腳併攏、手垂放）
        // 淡入要快（起步那一步才紮實）、淡出稍緩（收腳自然）
        const targetW = (phase == null || phase < 0) ? 0 : 1
        state.weight += (targetW - state.weight) * Math.min(1, dt * (targetW ? 40 : 14))
        if (state.weight < 0.01) state.weight = targetW === 0 ? 0 : state.weight
        state.action.setEffectiveWeight(state.weight)
        if (phase != null && phase >= 0) state.action.time = (phase % 1) * state.clipDur
        state.mixer.update(0)
      }
      // 雙腳中點：依當前轉角旋轉綁定姿勢錨點，再投影成 canvas CSS 座標
      feetTmp.copy(feetLocal).applyAxisAngle(UP, pivot.rotation.y).project(camera)
      state.feetPx = {
        x: (feetTmp.x * 0.5 + 0.5) * width,
        y: (-feetTmp.y * 0.5 + 0.5) * height,
      }
      renderer.render(scene, camera)
    },
  }

  new GLTFLoader().load(MODEL_URL, (gltf) => {
    const model = gltf.scene
    pivot.add(model)

    // 黏土質感：全霧面、無金屬感
    model.traverse((o) => {
      if (o.isMesh && o.material) {
        const m = o.material
        m.roughness = 1
        m.metalness = 0
        if (m.map) {
          const cleaned = cleanTexture(m.map)
          m.map = cleaned
          // Meshy 匯出把同一張圖以 emissiveFactor 1.0 全強度自發光，等於無光照的平面貼圖；
          // 換成清理後的貼圖並壓低強度，讓柔光陰影出得來（黏土感）
          if (m.emissiveMap) {
            m.emissiveMap = cleaned
            m.emissive.setScalar(0.35)
          }
        }
        m.needsUpdate = true
      }
    })

    // 以模型 bbox 置中並取景：腳貼 pivot 原點，鏡頭從前上方 35° 俯看
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    model.position.sub(center)
    model.position.y += size.y / 2   // 腳踩原點

    const pad = 1.22                 // 留邊給走路擺臂
    const halfH = (size.y * pad) / 2
    const aspect = width / height
    camera.left = -Math.max((size.x * pad) / 2, halfH * aspect)
    camera.right = -camera.left
    camera.top = halfH * 2 * 0.56    // 上下取景偏移：腳在畫面下緣附近
    camera.bottom = -halfH * 2 * 0.5
    const dist = size.y * 3
    const elev = THREE.MathUtils.degToRad(35)
    camera.position.set(0, size.y / 2 + Math.sin(elev) * dist, Math.cos(elev) * dist)
    camera.lookAt(0, size.y / 2, 0)
    camera.updateProjectionMatrix()

    pivot.rotation.y = FACING_ANGLE.front   // 初始面向鏡頭

    // 綁定姿勢的雙腳中點（此刻 pivot 轉角為 front=0，世界座標即 pivot 座標）
    pivot.updateWorldMatrix(true, true)
    const feet = []
    model.traverse((o) => { if (o.isBone && /^(Left|Right)Foot$/.test(o.name)) feet.push(o) })
    if (feet.length) {
      const a = new THREE.Vector3(), b = new THREE.Vector3()
      feet[0].getWorldPosition(a)
      if (feet[1]) feet[1].getWorldPosition(b); else b.copy(a)
      feetLocal.addVectors(a, b).multiplyScalar(0.5)
      feetLocal.y = 0   // 錨在地面
    }

    // 走路動畫是為標準身材設計、retarget 到 Q 版短手臂會把整支手擺進寬裙裡（雙手消失）。
    // 把手臂骨骼的旋轉軌道朝綁定 A-pose 混合、只保留部分擺幅，讓手始終露在裙外。
    const ARM_DAMP = 0.3   // 保留的擺幅比例（0=完全定格 A-pose、1=原始動畫）
    const ARM_BONES = /^(Left|Right)(Shoulder|Arm|ForeArm|Hand)$/
    if (gltf.animations.length) {
      const bind = {}
      model.traverse((o) => {
        if (o.isBone && ARM_BONES.test(o.name)) bind[o.name] = o.quaternion.clone()
      })
      const qAnim = new THREE.Quaternion(), qOut = new THREE.Quaternion()
      for (const track of gltf.animations[0].tracks) {
        const bone = track.name.slice(0, track.name.lastIndexOf('.'))
        if (track.name.endsWith('.quaternion') && bind[bone]) {
          for (let i = 0; i < track.values.length; i += 4) {
            qAnim.fromArray(track.values, i)
            qOut.copy(bind[bone]).slerp(qAnim, ARM_DAMP)
            qOut.toArray(track.values, i)
          }
        }
      }
      state.mixer = new THREE.AnimationMixer(model)
      state.action = state.mixer.clipAction(gltf.animations[0])
      state.clipDur = gltf.animations[0].duration
      state.action.play()
      state.action.paused = true
      state.action.setEffectiveWeight(0)   // 初始＝綁定站姿
      state.mixer.update(0)
    }
    renderer.render(scene, camera)
    state.ready = true
  }, undefined, (err) => {
    console.warn('[island] 3D 角色載入失敗，退回 2D sprite：', err)
    onFail?.()
  })

  return state
}
