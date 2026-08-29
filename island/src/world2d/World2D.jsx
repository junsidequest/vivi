import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/store.js'
import { isTouch } from '../ui/Joystick.jsx'
import { SpeechBubble } from '../ui/SpeechBubble.jsx'
import { playerPos, joyVec } from '../game/refs.js'
import { INTERACTABLES, nearestInRange, interactNearby } from '../game/interactions.js'
import { sound } from '../game/sound.js'
import { sayTemporarily } from '../game/say.js'
import { closeIris, openIris, fadeToInk, fadeFromInk, sleep } from '../ui/iris.js'

export const MAP = 948        // 地圖寬（map.png 原寬）
const MAP_H = 891             // 地圖高：原圖從橋板底緣（y=891）裁掉下面的橋腳與水面
const BASE = '2d/'   // 相對小島頁 URL，站台掛在子路徑（如 Pages 的 /vivi/）也載得到

// 棋盤式移動：一次一格，格間平滑補間
// 格距 25px（讓停點貼近牆線）；速度與 50px 時代相同（時間減半）
const TILE = 25
const STEP_DUR = 0.16, RUN_STEP_DUR = 0.095  // 秒/格
const CAMERA_SCALE = 1.6                      // 固定鏡頭倍率（不開放縮放）
const IDLE_DELAY = 30
const GREET_LINE = 'Hi 我是陳盈臻 Vivi，陪你和你的團隊把 AI 真的用起來'   // 進場先講這句
const IDLE_LINES = [
  '要不要去郵筒那邊看看？',
  'AI 不會取代你，會用 AI 的人才會。',
  '走累了嗎？按 Shift 可以用跑的喔。',
  '佈告欄有我的新消息～',
]

// —— 阻擋區（地圖像素，依 map.png 實際內容標定；?debug=1 可視化） ——
const ELLIPSE = { cx: 480, cy: 425, rx: 380, ry: 315 }         // 草地島身
const DOCK = { x1: 430, x2: 520, y1: 420, y2: 875 }            // 棧道＋碼頭走廊（允許走出島緣；y2=875 是
                                                               // 地圖裁到橋底緣 891 後的最後可站列）——
                                                               // 板寬 419-530 再內縮一點（25px 格距下走 450/475/500 三列）
const RECTS = [
  { x1: 330, x2: 625, y1: 135, y2: 380 },   // 小屋（整條沿 y 下移一格）
  { x1: 248, x2: 395, y1: 330, y2: 435 },   // 告示牌
  // 告示牌向左延伸到島緣。下緣停在 435（與告示牌本體齊）：再往下壓會蓋住佈告欄正前方的
  // y=450/475 兩列，角色站到站位後就沒辦法往左走
  { x1: 0, x2: 280, y1: 330, y2: 435 },
  // y=350 橫貫全島：原本東側池塘與島緣之間留了 x=825 一格的縫，角色能從那裡溜到島北側。
  // 這條封死之後，小屋以北（水井、樹叢那片）整個不可達
  { x1: 0, x2: MAP, y1: 340, y2: 360 },
  { x1: 0, x2: 305, y1: 520, y2: 585 },     // 西南灌木上方牆：右緣往左退一格（330→305）
  { x1: 0, x2: 305, y1: 570, y2: 705 },     // 西南角：封到 x=300、y 從 575 到 700
  // 郵筒＋下方牆向右延伸到島緣，下緣壓到 705：原本 y=675/700 可以從郵筒下方繞到島東南角（x=700）。
  // 左緣 545 保留信箱站位 (525,650)
  { x1: 545, x2: 880, y1: 585, y2: 705 },
  // 郵筒上牆向右下連到池塘左側牆，並往左上補到池塘下緣：
  // 池塘圓在 (625,450)(650,475)(650,500) 這幾格外面，原本留了一條斜縫可以繞進去
  { x1: 595, x2: 675, y1: 445, y2: 620 },   // 整條沿 x 往左移一格
]
const CIRCLES = [
  { x: 722, y: 396, r: 106 },   // 池塘（含石圈）
  { x: 215, y: 250, r: 55 },    // 西北樹
  { x: 315, y: 260, r: 20 },    // 縮小：原本 r40 會把 (300,275) 一起吃掉
  { x: 700, y: 195, r: 55 },    // 東北樹
  { x: 655, y: 268, r: 35 },
  { x: 205, y: 540, r: 40 },    // 西南灌木
  { x: 285, y: 540, r: 30 },    // 縮小＋微移：放行 (325,550)(300,575)，保留灌木本體阻擋
  { x: 254, y: 602, r: 36 },    // 左移 8
  { x: 795, y: 522, r: 40 },    // 東側路燈旁灌木
  { x: 163, y: 405, r: 15 },    // 燈柱
  { x: 718, y: 558, r: 16 },
]

function blocked(x, y) {
  const ex = (x - ELLIPSE.cx) / ELLIPSE.rx
  const ey = (y - ELLIPSE.cy) / ELLIPSE.ry
  const inIsland = ex * ex + ey * ey <= 1
  const inDock = x >= DOCK.x1 && x <= DOCK.x2 && y >= DOCK.y1 && y <= DOCK.y2
  if (!inIsland && !inDock) return true
  for (const r of RECTS) if (x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2) return true
  for (const c of CIRCLES) {
    const dx = x - c.x, dy = y - c.y
    if (dx * dx + dy * dy < c.r * c.r) return true
  }
  return false
}

// —— 鴨子 ——
const DUCK_CENTER = [718, 388], DUCK_R = 40, DUCK_SPEED = 0.4
const DUCK_LINES = [
  '這隻鴨子只出一張嘴',
  '牠說牠也想學 AI',
  '呱的意思是：先搞清楚問題再選工具',
  '牠是本島唯一不用打卡的員工',
]

// 這兩個目標的提示掛在主角頭上（鴨子會游動、小屋門口沒有適合的錨點）
const PLAYER_HINTS = { duck: '聽鴨子在說什麼', services: '看服務和課程' }

const KEY_DIR = {
  KeyW: 'back', ArrowUp: 'back',
  KeyS: 'front', ArrowDown: 'front',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
}
const DIR_DELTA = { back: [0, -1], front: [0, 1], left: [-1, 0], right: [1, 0] }

const debug = typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug')
// debug 網格的座標標籤：每 100px 一個交點，捲到哪都讀得到座標
const GRID_LABELS = []
if (debug) {
  for (let y = 0; y <= 800; y += 100) for (let x = 0; x <= 900; x += 100) GRID_LABELS.push([x, y])
}

export function World2D() {
  const nearbyId = useGame((s) => s.nearbyId)   // 走近時對話框換成具體動作文字
  const say = useGame((s) => s.say)             // 有台詞時，角色頭上的提示讓位
  const [hintPeek, setHintPeek] = useState(null)   // 依節奏輪流露臉的目標 id（一次只有一個）
  const [approachId, setApproachId] = useState(null)   // 已經走到附近的目標：icon 常駐顯示
  const [suppressId, setSuppressId] = useState(null)   // 由選單帶過去的目標：提示先不顯示
  const viewportRef = useRef()
  const worldRef = useRef()
  const playerRef = useRef()
  const playerImgRef = useRef()
  const player3dRef = useRef()
  const shadowRef = useRef()
  const duckRef = useRef()
  const duckImgRef = useRef()
  const hudRef = useRef()      // debug：角色即時座標（直接寫 textContent，不觸發 re-render）
  const maskRef = useRef()     // debug：blocked() 的逐像素真值遮罩
  const mapRef = useRef()      // debug：讀地圖顏色，分辨牆是擋在草地還是建築上

  // 把 blocked() 逐像素畫出來：紅框只是各條宣告值的外框，這層才是判定的實際結果。
  // 再比對地圖顏色分成兩色——擋在草地上的（看得見卻走不進去）要跟擋在建築/水面上的分開，
  // 前者才是需要重新標定的牆
  useEffect(() => {
    if (!debug || !maskRef.current || !mapRef.current) return
    const paint = () => {
      const off = document.createElement('canvas')
      off.width = MAP; off.height = MAP_H
      const octx = off.getContext('2d')
      octx.drawImage(mapRef.current, 0, 0, MAP, MAP_H)
      const map = octx.getImageData(0, 0, MAP, MAP_H).data
      const ctx = maskRef.current.getContext('2d')
      const out = ctx.createImageData(MAP, MAP_H)
      // 先把 blocked() 算成一張表，輪廓偵測才不用重複呼叫（每點要問 5 次鄰居）
      const grid = new Uint8Array(MAP * MAP_H)
      for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP; x++) if (blocked(x, y)) grid[y * MAP + x] = 1
      }
      // 地圖外一律視為擋住，邊緣才不會描出一圈框
      const at = (x, y) => (x < 0 || y < 0 || x >= MAP || y >= MAP_H ? 1 : grid[y * MAP + x])
      for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP; x++) {
          const g0 = y * MAP + x
          if (!grid[g0]) continue
          const i = g0 * 4
          // 自己被擋、四鄰有一個沒被擋 ⇒ 這裡是聯集的邊界
          if (!at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1)) {
            out.data[i] = 230; out.data[i + 1] = 20; out.data[i + 2] = 40; out.data[i + 3] = 255
            continue
          }
          const r = map[i], g = map[i + 1], b = map[i + 2]
          const grass = g > 90 && g > r * 1.12 && g > b * 1.25
          if (grass) {   // 橘：擋在空草地上，通常是為了封缺口硬加的牆
            out.data[i] = 255; out.data[i + 1] = 140; out.data[i + 2] = 0; out.data[i + 3] = 120
          } else {       // 紫：擋在建築、池塘、水面上，貼合地形
            out.data[i] = 150; out.data[i + 1] = 60; out.data[i + 2] = 230; out.data[i + 3] = 70
          }
        }
      }
      ctx.putImageData(out, 0, 0)
    }
    if (mapRef.current.complete) paint()
    else mapRef.current.addEventListener('load', paint, { once: true })
  }, [])

  useEffect(() => {
    // 鍵盤：按一次＝走一格；按著不放＝連續走（dirStack 記目前按住的方向，
    // pendingDir 接住「按下到放開都在同一幀內」的快速輕點，避免漏掉那一格）
    const dirStack = []
    let pendingDir = null
    let runHeld = false
    const onKeyDown = (e) => {
      const dir = KEY_DIR[e.code]
      if (dir && !e.repeat) {
        if (!dirStack.includes(dir)) dirStack.push(dir)
        pendingDir = dir
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') runHeld = true
      if (e.code === 'KeyE') interactNearby()
    }
    const onKeyUp = (e) => {
      const dir = KEY_DIR[e.code]
      if (dir) {
        const i = dirStack.indexOf(dir)
        if (i >= 0) dirStack.splice(i, 1)
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') runHeld = false
    }
    const onBlur = () => { dirStack.length = 0; pendingDir = null; runHeld = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)

    // 相機：固定倍率（cover 下限保證不露地圖外），不開放使用者縮放
    const view = { w: innerWidth, h: innerHeight }
    const coverScale = () => Math.max(view.w / MAP, view.h / MAP_H)
    let targetScale = Math.max(CAMERA_SCALE, coverScale())
    let scale = Math.max(1.05, coverScale())     // 開場稍拉遠，載入後緩緩推近
    const onResize = () => {
      view.w = innerWidth; view.h = innerHeight
      targetScale = Math.max(CAMERA_SCALE, coverScale())
    }
    window.addEventListener('resize', onResize)

    // debug：點地圖印座標，方便標定
    const onClick = (e) => {
      if (!debug) return
      const m = worldRef.current.style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/)
      if (!m) return
      console.log('[map]', Math.round((e.clientX - +m[1]) / scale), Math.round((e.clientY - +m[2]) / scale))
    }
    viewportRef.current.addEventListener('click', onClick)

    // 3D 角色：載入期間不顯示角色（開頁就要是 3D 模型，不先出平面圖）；
    // 只有 3D 失敗（無 WebGL / 模型載不動）才亮出 2D sprite 備援
    let p3d = null
    let use3d = false
    let disposed = false
    const reveal = () => viewportRef.current?.classList.add('is-ready')
    const revealTimer = setTimeout(reveal, 5000)   // 保險絲：模型太慢也要見到島
    const fallbackTo2D = () => {
      if (!use3d) playerImgRef.current.style.display = 'block'
      reveal()
    }
    import('./Player3D.js')
      .then((m) => {
        if (disposed) return
        p3d = m.createPlayer3D(player3dRef.current, { onFail: fallbackTo2D })
        if (!p3d) fallbackTo2D()
      })
      .catch((err) => {
        console.warn('[island] 3D 模組載入失敗，退回 2D sprite：', err)
        fallbackTo2D()
      })

    let facing = 'front'
    let step = null                  // { fx, fz, tx, tz, t, dur }

    // —— 棧道底轉場（圓形收縮進「關於我」空間） ——
    // cine：null=正常操作｜'exit'=走出畫面中｜'hold'=在關於我頁面待命｜'enter'=走回橋上中
    let cine = null
    const DOCK_EXIT_Z = 875          // 棧道最下方可站列（＝DOCK.y2，貼著畫面底緣）
    const AUTO_WALK_Z = 825          // 踩到引導箭頭（map y≈828）就接手：鎖輸入、自動往下走
    const RETURN_Z = 725             // 回程一路走到石板路上才停（棧道上的 775 還在橋面），
                                     // 也留在引導箭頭上方，不會一往下走就又被抓走
    const CINE_STEP = 0.3            // 轉場走路刻意放慢（秒/格）
    const playerScreenPos = () => {
      const m = worldRef.current.style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px[^)]*\) scale\(([\d.]+)\)/)
      if (!m) return [innerWidth / 2, innerHeight / 2]
      return [playerPos.x * +m[3] + +m[1], (playerPos.z - 45) * +m[3] + +m[2]]   // 圓心約在角色身體
    }
    // —— 選單點島上物件時：先自動走到它面前，再開彈窗 ——
    // 站位取「物件正面的可站格」：告示牌走到正下方、郵筒走到正左邊。
    const PATH_X = 475            // 石板步道的縱向中線
    const PATH_Z = [400, 750]     // 步道的上下範圍（取 TILE 的整數倍，否則 BFS 永遠命中不了）
    // via：先繞到石板步道上再走過去，路徑才像正常在走路，而不是斜穿草地
    const STAND_AT = {
      about: { x: 300, z: 450, face: 'back', via: { x: 475, z: 450 } },     // 告示牌正面（牆的下方）
      contact: { x: 525, z: 650, face: 'right', via: { x: 475, z: 650 } },  // 郵筒左側、比正左再下一格
      dock: { x: 475, z: AUTO_WALK_Z, face: 'front', via: { x: 475, z: 750 } },   // 橋上的引導箭頭那格
    }
    const snap = (v) => Math.round(v / TILE) * TILE
    // 廣度優先找路（棋盤格 + 既有 blocked 判定），回傳不含起點的格子序列
    const findPath = (from, to) => {
      const start = { x: snap(from.x), z: snap(from.z) }
      if (start.x === to.x && start.z === to.z) return []
      const key = (x, z) => `${x},${z}`
      const prev = new Map([[key(start.x, start.z), null]])
      const queue = [start]
      while (queue.length) {
        const cur = queue.shift()
        for (const [dx, dz] of [[0, -TILE], [0, TILE], [-TILE, 0], [TILE, 0]]) {
          const nx = cur.x + dx, nz = cur.z + dz
          const k = key(nx, nz)
          if (prev.has(k) || blocked(nx, nz)) continue
          prev.set(k, cur)
          if (nx === to.x && nz === to.z) {          // 找到了：回溯成路徑
            const path = []
            for (let n = { x: nx, z: nz }; n; n = prev.get(key(n.x, n.z))) path.unshift(n)
            path.shift()                              // 去掉起點
            return path
          }
          queue.push({ x: nx, z: nz })
        }
      }
      return null                                     // 走不到（理論上不會發生）
    }
    let walkPath = null
    let walkThen = null
    let walkFace = null
    const onWalkTo = (e) => {
      const id = e?.detail?.id
      const dest = STAND_AT[id]
      if (!dest || cine) return
      // 選單帶過去的：抵達後不要冒出「按 E …」提示（那是給自己走過去的人看的），
      // 一路壓到玩家自己走出該物件範圍為止
      suppressNow = id
      setSuppressId(id)
      // 走法：就近上石板步道 → 沿步道走到目標那一段 → 橫向切進目標。
      // 任一段接不起來就退回直接尋路，不讓它卡住
      let path = null
      if (dest.via) {
        const onPath = { x: PATH_X, z: Math.min(Math.max(snap(playerPos.z), PATH_Z[0]), PATH_Z[1]) }
        const legs = [
          findPath(playerPos, onPath),      // 先橫過去踏上步道
          findPath(onPath, dest.via),       // 沿步道走到與目標同高
          findPath(dest.via, dest),         // 再切進物件面前
        ]
        if (legs.every(Boolean)) path = legs.flat()
      }
      if (!path) path = findPath(playerPos, dest)
      walkFace = dest.face
      if (!path) {                                    // 找不到路就直接執行，不要卡住
        facing = dest.face
        if (id === 'dock') beginExit()
        else useGame.getState().openPopup(id)
        return
      }
      walkPath = path
      walkThen = id === 'dock'
        ? () => beginExit()                           // 走到橋上箭頭 → 接著自動走下橋轉場
        : () => useGame.getState().openPopup(id)
      cine = 'walk'                                   // 鎖住輸入，交給 startStep 逐格走
    }
    window.addEventListener('walk-to', onWalkTo)

    const beginExit = async () => {
      cine = 'exit'                              // startStep 接手：自動往下走出畫面
      await closeIris(...playerScreenPos(), 950)  // 比原本長：讓「自動走下去」這幾步看得見
      useGame.getState().setAboutSection(null)   // 走棧道下去＝從頁面最上方開始看
      useGame.getState().setRoom('about')
      await sleep(350)                           // 黑屏一拍（遊戲換場景的節奏）
      playerPos.set(475, 0, DOCK_EXIT_Z + 50)    // 島這邊先把角色放回橋底待命
      facing = 'back'
      cine = 'hold'
      await fadeFromInk(700)                     // 進到關於我：整幕變亮就好，不用圓圈
    }
    // 從右下角選單進場：不走路，收黑→切頁→變亮；角色一樣放到棧道底待命，
    // 這樣不論從哪個入口進來，回程都是從島的最下方往上走
    const onEnterAbout = async (e) => {
      if (cine) return
      cine = 'hold'                              // 鎖住輸入（不走路）
      await closeIris(...playerScreenPos(), 700)
      useGame.getState().setAboutSection(e?.detail?.section ?? null)
      useGame.getState().setRoom('about')
      await sleep(350)
      playerPos.set(475, 0, DOCK_EXIT_Z + 50)
      facing = 'back'
      await fadeFromInk(700)
    }
    const onLeaveAbout = async () => {
      if (cine !== 'hold') return
      await fadeToInk(550)                       // 回程收黑：整幕變暗就好，不用圓圈
      useGame.getState().setRoom('island')
      await sleep(350)
      cine = 'enter'                             // startStep 接手：從棧道底一路走回石板路
      openIris(...playerScreenPos(), 700)
    }
    window.addEventListener('enter-about', onEnterAbout)
    window.addEventListener('leave-about', onLeaveAbout)
    // 走路片段（Casual_Walk 4.23s）實測含 6 步：以左右腳世界座標取樣 60 幀，
    // 雙腳交會（＝一步的分界）出現在相位 0.1417 起、每 1/6 一次。
    // 一格 = 推進一步，格與格自然左右交替；停下由 Player3D 淡出回綁定站姿。
    const PHASE_START = 0.1417
    const STEP_PHASE = 1 / 12    // 每 25px 格推 1/12 週期（＝50px 推 1/6，與原標定同步）
    let tilesWalked = 0
    let idleT = 0, idleIdx = 0, duckT = Math.random() * Math.PI * 2
    // 頭上有「按 E …」提示時不要冒閒置語錄（會蓋掉提示）；離開後再靜候 HINT_COOLDOWN 秒
    const HINT_COOLDOWN = 2
    let hintCooldown = 0, idleSaying = false
    // 開場招呼：等島與角色淡入後再講，句子長所以停久一點
    const greetTimer = setTimeout(() => sayTemporarily(GREET_LINE, 6500), 1300)

    // —— 遠處驚嘆號提示的出現節奏 ——
    // 玩家有在走動才啟動：露臉 SHOW 秒 → 收起 HIDE 秒，循環；
    // 停止走動 SLEEP 秒後休眠（完全不出現），再次走動才重新開始
    const HINT_SHOW = 3.5, HINT_HIDE = 9, HINT_SLEEP = 2.5
    let hintT = 0, hintOn = false, hintAwake = false, walkIdleT = Infinity

    // 一次只提示一個目標：優先「玩家正在走近的」，否則挑「最久沒去過的」
    const HINT_POINTS = { about: [300, 430], contact: [586, 615] }   // 告示牌、郵筒
    const visitedAt = { about: 0, contact: 0 }
    let prevDist = { about: Infinity, contact: Infinity }
    let worldT = 0, sampleT = 0
    const APPROACH_R = 145        // 走到這個距離內：icon 常駐顯示，不再跟著節奏消失
    let approachNow = null
    let suppressNow = null        // 選單帶過去的目標：提示壓住，等玩家自己走出範圍才解除
    const distTo = (id) => Math.hypot(playerPos.x - HINT_POINTS[id][0], playerPos.z - HINT_POINTS[id][1])
    const pickHintTarget = () => {
      const ids = Object.keys(HINT_POINTS)
      const approaching = ids.filter((id) => distTo(id) < prevDist[id] - 10)
      const pool = approaching.length ? approaching : ids
      // 同組內選最久沒造訪的；都一樣久就選比較近的
      return pool.sort((a, b) => (visitedAt[a] - visitedAt[b]) || (distTo(a) - distTo(b)))[0]
    }

    // sayOwner：這句台詞是誰觸發的。玩家一走出該物件範圍就立刻收掉，不等計時結束
    let sayOwner = null
    const onDuckInteract = () => {
      sound.play('quack')
      sayTemporarily(DUCK_LINES[Math.floor(Math.random() * DUCK_LINES.length)], 3500)
      sayOwner = 'duck'
    }
    window.addEventListener('duck-interact', onDuckInteract)

    // 觸控搖桿：推著走（手機無法連點）；鍵盤走 pendingDir 單發指令
    const joyDir = () => {
      if (Math.hypot(joyVec.x, joyVec.z) > 0.4) {
        return Math.abs(joyVec.x) > Math.abs(joyVec.z)
          ? (joyVec.x > 0 ? 'right' : 'left')
          : (joyVec.z > 0 ? 'front' : 'back')
      }
      return null
    }
    // 純格位移動：被擋就原地停住，不做任何視覺前靠偏移
    //（曾試過「靠牆貼近 22px」，會在轉向時產生斜移/瞬移感，已移除）
    const tryStep = (d) => {
      const [dx, dz] = DIR_DELTA[d]
      const tx = playerPos.x + dx * TILE
      const tz = playerPos.z + dz * TILE
      if (!blocked(tx, tz)) {
        step = { fx: playerPos.x, fz: playerPos.z, tx, tz, t: 0, dur: (runHeld || joyVec.run) ? RUN_STEP_DUR : STEP_DUR }
      }
    }

    let raf, last = performance.now()
    let lockedNow = false
    // 方向來源：按住的鍵優先（連續走）→ 搖桿 → 一次性輕點（按下與放開落在同一幀）
    const wantDir = () => {
      const d = lockedNow ? null : ((dirStack.length ? dirStack[dirStack.length - 1] : joyDir()) ?? pendingDir)
      pendingDir = null
      return d
    }
    // 起步：轉向與位移同時發生（見 Player3D 的平滑轉身）
    const startStep = () => {
      // 轉場運鏡：exit 自動往下走出畫面、enter 自動走回橋上（無視輸入與碰撞）
      if (cine === 'exit') {
        if (playerPos.z < DOCK_EXIT_Z + 50) {
          facing = 'front'
          step = { fx: playerPos.x, fz: playerPos.z, tx: playerPos.x, tz: playerPos.z + TILE, t: 0, dur: CINE_STEP }
        }
        return
      }
      // 選單指定的自動走位：照 walkPath 一格一格走，走完執行 walkThen（開彈窗）
      if (cine === 'walk') {
        const next = walkPath?.shift()
        if (next) {
          const dx = next.x - playerPos.x, dz = next.z - playerPos.z
          facing = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'right' : 'left') : (dz > 0 ? 'front' : 'back')
          step = { fx: playerPos.x, fz: playerPos.z, tx: next.x, tz: next.z, t: 0, dur: RUN_STEP_DUR }
        } else {
          walkPath = null
          if (walkFace) { facing = walkFace; walkFace = null }   // 站定後轉身面向物件
          cine = null                                // 先交還操作權，再開彈窗
          const then = walkThen; walkThen = null
          then?.()
        }
        return
      }
      if (cine === 'enter') {
        if (playerPos.z > RETURN_Z) {
          facing = 'back'
          step = { fx: playerPos.x, fz: playerPos.z, tx: playerPos.x, tz: playerPos.z - TILE, t: 0, dur: CINE_STEP }
        } else {
          cine = null   // 回到橋上，交還操作權
        }
        return
      }
      if (cine) return   // hold：鎖住輸入
      const d = wantDir()
      if (d) { facing = d; tryStep(d) }
    }

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      lockedNow = useGame.getState().movementLocked

      if (!step) startStep()

      // 走格中：位置補間。走完若方向仍按著，同一幀直接接下一格——
      // 步態相位因此連續，連走時不會每格閃一下站姿
      let moving = false
      if (step) {
        moving = true
        step.t += dt
        const p = Math.min(1, step.t / step.dur)
        playerPos.x = step.fx + (step.tx - step.fx) * p
        playerPos.z = step.fz + (step.tz - step.fz) * p
        if (p >= 1) {
          const movedDown = step.tz > step.fz
          step = null
          tilesWalked += 1
          if (tilesWalked % 2 === 0) sound.play('step')   // 25px 格距下每兩格＝原本一步的節奏
          // 踩到棧道上的引導箭頭（向下抵達）→ 接手操作，自動往下走並轉場進「關於我」
          if (!cine && movedDown && playerPos.z >= AUTO_WALK_Z) beginExit()
          startStep()
        }
      }
      // 走路中＝對應相位；停下＝null（Player3D 淡出回站姿）。p 在 step 歸零後不再使用
      const gaitPhase = step
        ? (PHASE_START + (tilesWalked + Math.min(1, step.t / step.dur)) * STEP_PHASE) % 1
        : null

      // 玩家：3D 就緒後用 3D 模型，否則 2D sprite
      if (!use3d && p3d?.ready) {
        use3d = true
        playerImgRef.current.style.display = 'none'
        player3dRef.current.style.display = 'block'
        shadowRef.current.style.display = 'block'
        reveal()   // 島與角色一起亮相
      }
      if (use3d) {
        p3d.setFacing(facing)
        p3d.setGait(gaitPhase)
        p3d.update(dt)
        // 接地陰影跟著雙腳中點：canvas 原點在 player div 內為 (-7.5, -21)
        //（.p3d：寬 115 置中 → left 50-57.5；bottom -4 → top 104-125）。
        // 右緣對齊腳位最右側（約腳中點 +18px），垂直中心略高於接地點
        const f = p3d.feetPx
        if (f) {
          shadowRef.current.style.transform =
            `translate(${-7.5 + f.x + 18 - 82}px, ${-21 + f.y - 6 - 16}px)`
        }
        playerRef.current.style.transform =
          `translate3d(${playerPos.x - 50}px, ${playerPos.z - 100}px, 0)`
      } else {
        const img = playerImgRef.current
        const srcName = facing === 'left' || facing === 'right' ? 'side' : facing === 'back' ? 'back' : 'front'
        const want = `${BASE}vivi-${srcName}.png`
        if (!img.src.endsWith(want)) img.src = want
        const flip = facing === 'left' ? ' scaleX(-1)' : ''
        playerRef.current.style.transform =
          `translate3d(${playerPos.x - 50}px, ${playerPos.z - 100}px, 0)${flip}`
        playerRef.current.classList.toggle('moving', moving)
      }

      // 鴨子繞池塘游（純視覺；互動點固定錨在池心，避免提示隨游動閃爍）
      duckT += dt * DUCK_SPEED
      const dx = DUCK_CENTER[0] + Math.cos(duckT) * DUCK_R
      const dy = DUCK_CENTER[1] + Math.sin(duckT) * DUCK_R
      // 翻轉只套在鴨子圖上，不套整個 sprite——否則掛在 sprite 內的「呱呱~」泡泡會跟著鏡射
      duckRef.current.style.transform = `translate3d(${dx - 28}px, ${dy - 46}px, 0)`
      duckImgRef.current.style.transform = -Math.sin(duckT) > 0 ? 'scaleX(-1)' : ''

      // 互動偵測
      const hit = nearestInRange(playerPos)
      const cur = useGame.getState().nearbyId
      if ((hit?.id ?? null) !== cur) useGame.getState().setNearbyId(hit?.id ?? null)
      // 互動觸發的台詞：走出該物件範圍就立刻收掉（開場招呼與閒置語錄沒有 owner，不受影響）
      if (sayOwner) {
        if (!useGame.getState().say) sayOwner = null
        else if (hit?.id !== sayOwner) { sayOwner = null; useGame.getState().setSay(null) }
      }
      // 玩家自己走出該物件範圍後，提示才恢復（下次是他自己走過去的）。
      // 走位途中（cine）不判定：那時角色還沒抵達，範圍當然不符，會把抑制提早清掉
      if (!cine && suppressNow && hit?.id !== suppressNow) { suppressNow = null; setSuppressId(null) }

      // 閒置語錄（轉場與關於我空間中不觸發）
      const { phase, activePopup, say } = useGame.getState()

      // 遠處驚嘆號提示：走動中才醒著，醒著時 SHOW/HIDE 交替（狀態變了才 setState）
      worldT += dt
      if (hit?.id in visitedAt) visitedAt[hit.id] = worldT   // 走到過就算造訪
      sampleT += dt
      if (sampleT >= 2) {   // 每 2 秒取一次距離快照，用來判斷「正在走近誰」
        sampleT = 0
        prevDist = { about: distTo('about'), contact: distTo('contact') }
      }
      // 走到附近就讓 icon 常駐（還沒近到能按 E 的距離時也看得見）
      const ids = Object.keys(HINT_POINTS)
      const appr = ids.filter((id) => distTo(id) < APPROACH_R)
        .sort((a, b) => distTo(a) - distTo(b))[0] ?? null
      if (appr !== approachNow) { approachNow = appr; setApproachId(appr) }
      walkIdleT = moving ? 0 : walkIdleT + dt
      const awake = walkIdleT < HINT_SLEEP && !cine && !activePopup
      if (awake !== hintAwake) {
        hintAwake = awake
        hintT = 0
        hintOn = awake                 // 一開始走動就先露臉一次
        setHintPeek(hintOn ? pickHintTarget() : null)
      } else if (awake) {
        hintT += dt
        if (hintT >= (hintOn ? HINT_SHOW : HINT_HIDE)) {
          hintT = 0
          hintOn = !hintOn
          setHintPeek(hintOn ? pickHintTarget() : null)
        }
      }
      // 站在有「按 E …」提示的物件旁：閒置語錄先讓位，離開後再等 HINT_COOLDOWN 秒才恢復計時
      const hasHint = !!PLAYER_HINTS[hit?.id]
      if (hasHint) {
        hintCooldown = HINT_COOLDOWN
        if (idleSaying) { useGame.getState().setSay(null); idleSaying = false }
      } else if (hintCooldown > 0) {
        hintCooldown = Math.max(0, hintCooldown - dt)
      }
      if (idleSaying && !say) idleSaying = false

      if (moving || say || activePopup || cine || hasHint || hintCooldown > 0) {
        idleT = 0
      } else {
        idleT += dt
        if (idleT > IDLE_DELAY && phase === 'playing') {
          sayTemporarily(IDLE_LINES[idleIdx % IDLE_LINES.length], 4000)
          idleSaying = true
          idleIdx += 1
          idleT = 0
        }
      }

      // 相機：平滑逼近固定倍率＋跟隨（夾在地圖範圍內）
      scale += (targetScale - scale) * Math.min(1, dt * 5)
      const clamp = (v, lo, hi) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)))
      const tx = clamp(view.w / 2 - playerPos.x * scale, view.w - MAP * scale, 0)
      const ty = clamp(view.h / 2 - playerPos.z * scale, view.h - MAP_H * scale, 0)
      worldRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`

      if (hudRef.current) {
        const gx = Math.round(playerPos.x / TILE), gz = Math.round(playerPos.z / TILE)
        hudRef.current.textContent =
          `x ${Math.round(playerPos.x)}　z ${Math.round(playerPos.z)}　（格 ${gx}, ${gz}）`
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(revealTimer)
      clearTimeout(greetTimer)
      disposed = true
      p3d?.dispose()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('duck-interact', onDuckInteract)
      window.removeEventListener('walk-to', onWalkTo)
      window.removeEventListener('enter-about', onEnterAbout)
      window.removeEventListener('leave-about', onLeaveAbout)
    }
  }, [])

  return (
    <div className="viewport" ref={viewportRef}>
      <div className="world" ref={worldRef} style={{ width: MAP, height: MAP_H }}>
        <img className="map" ref={mapRef} src={`${BASE}map.png?v=4`} alt="" draggable={false} />
        <div className="sprite duck" ref={duckRef}>
          <img ref={duckImgRef} src={`${BASE}duck.png`} alt="鴨子" draggable={false} />
          {/* 走近鴨子：牠自己冒一句「呱呱~」（用角色台詞泡泡的樣式，尾巴指向牠） */}
          {nearbyId === 'duck' && <div className="duck-say">呱呱~</div>}
        </div>
        <div className="sprite player" ref={playerRef}>
          <div className="player-shadow" ref={shadowRef} />
          <img ref={playerImgRef} src={`${BASE}vivi-front.png`} alt="Vivi" draggable={false} style={{ display: 'none' }} />
          <div className="p3d" ref={player3dRef} />
          <SpeechBubble />   {/* 台詞泡泡掛在角色身上，跟著他走到哪說到哪 */}
          {/* 鴨子／小屋門口的互動提示也掛在角色頭上；正在講話時讓位給台詞泡泡 */}
          {PLAYER_HINTS[nearbyId] && !say && (
            <div className="player-hint">
              按<span className="key">E</span>{PLAYER_HINTS[nearbyId]}
            </div>
          )}
        </div>
        {/* 棧道向下引導箭頭：暗示可以沿橋往下走（進「關於我」空間），不用文字 */}
        <div
          className="dock-arrow"
          style={{ left: 475, top: 828 }}
          onClick={() => window.dispatchEvent(new CustomEvent('walk-to', { detail: { id: 'dock' } }))}
        />
        {/* 互動邀請對話框：遠處只露一個驚嘆號，走近才換成具體動作 */}
        <div
          className={`world-hint${suppressId === 'about' ? '' : nearbyId === 'about' ? ' is-near' : (hintPeek === 'about' || approachId === 'about') ? ' is-peek' : ''}`}
          style={{ left: 303, top: 324 }}
        >
          <span className="hint-mark hint-mark--pin" />
          <span className="hint-full">按<span className="key">{isTouch ? 'A' : 'E'}</span>看佈告欄</span>
        </div>
        <div
          className={`world-hint${suppressId === 'contact' ? '' : nearbyId === 'contact' ? ' is-near' : (hintPeek === 'contact' || approachId === 'contact') ? ' is-peek' : ''}`}
          style={{ left: 590, top: 583 }}
        >
          <span className="hint-mark hint-mark--mail" />
          <span className="hint-full">按<span className="key">{isTouch ? 'A' : 'E'}</span>開信箱</span>
        </div>
        {debug && (
          <>
            {/* 阻擋區：逐像素問過 blocked()，填色＋描出聯集後的單一輪廓。
                各條 RECTS/CIRCLES 的個別外框已移除——重疊處的內部線只會干擾判讀 */}
            <canvas className="debug-mask" ref={maskRef} width={MAP} height={MAP_H} />
            {/* 座標網格：淡點＝25px 走路格、細線＝100px；交點標 x,y */}
            <div className="debug-grid" />
            {GRID_LABELS.map(([x, y]) => (
              <span key={`g${x}-${y}`} className="debug-tick" style={{ left: x + 3, top: y + 2 }}>
                {x},{y}
              </span>
            ))}
            {/* 互動範圍不是牆，另一套顏色，保留各自的圓 */}
            {INTERACTABLES.map((it) => (
              <div key={it.id} className="debug-zone debug-zone--interact" style={{ left: it.pos[0] - it.range, top: it.pos[2] - it.range, width: it.range * 2, height: it.range * 2 }} />
            ))}
          </>
        )}
      </div>
      {/* 角色即時座標：掛在 viewport（不進 world，才不會被相機縮放） */}
      {debug && <div className="debug-hud" ref={hudRef} />}
      <div className="vignette" />
    </div>
  )
}
