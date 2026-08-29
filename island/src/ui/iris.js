// 圓形收縮轉場（iris wipe）：全螢幕暗色遮罩上開一個圓洞，動畫縮放圓半徑。
// closeIris(cx, cy) 收黑（圓心通常在角色身上）、openIris(cx, cy) 展開，皆回傳 Promise。
const INK = '#241c14'   // 遮罩色：偏暖的深黏土色，比純黑柔和
const FEATHER = 150     // 圓洞邊緣羽化半寬（px）：透明→遮罩色的漸層帶，不做銳利切邊

let el = null
function ensure() {
  if (!el) {
    el = document.createElement('div')
    el.style.cssText = 'position:fixed;inset:0;z-index:40;pointer-events:none;display:none'
    document.body.appendChild(el)
  }
  return el
}

// 圓要多大才能蓋滿整個畫面（從圓心到最遠角落）
function fullR(cx, cy) {
  return Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy))
}

function animate(cx, cy, r0, r1, ms) {
  const node = ensure()
  node.style.opacity = '1'   // fadeToInk 用過 opacity，圓形動畫前重置
  node.style.display = 'block'
  return new Promise((resolve) => {
    const t0 = performance.now()
    const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2)
    const frame = (now) => {
      const p = Math.min(1, (now - t0) / ms)
      const r = r0 + (r1 - r0) * ease(p)
      const f = Math.min(FEATHER, r)   // r 收小時羽化跟著收斂，收黑的終點才會是實心黑
      node.style.background =
        `radial-gradient(circle at ${cx}px ${cy}px, transparent ${Math.max(0, r - f)}px, ${INK} ${r + f}px)`
      if (p < 1) requestAnimationFrame(frame)
      else {
        if (r1 > 0) node.style.display = 'none'   // 完全展開後移除遮罩
        resolve()
      }
    }
    requestAnimationFrame(frame)
  })
}

export function closeIris(cx, cy, ms = 600) { return animate(cx, cy, fullR(cx, cy), 0, ms) }
export function openIris(cx, cy, ms = 700) { return animate(cx, cy, 0, fullR(cx, cy), ms) }

// 整幕淡入/淡出（無圓圈）：黑屏與「關於我」頁之間的暗亮都用整幕漸變——
// 進場：島上圓形收黑 → 關於我整幕變亮（fadeFromInk）
// 回程：關於我整幕變暗（fadeToInk）→ 島上圓形展開
function fadeInk(from, to, ms) {
  const node = ensure()
  node.style.background = INK
  node.style.opacity = String(from)
  node.style.display = 'block'
  return new Promise((resolve) => {
    const t0 = performance.now()
    const frame = (now) => {
      const p = Math.min(1, (now - t0) / ms)
      node.style.opacity = String(from + (to - from) * p)
      if (p < 1) requestAnimationFrame(frame)
      else {
        if (to === 0) node.style.display = 'none'   // 完全變亮後移除遮罩
        resolve()
      }
    }
    requestAnimationFrame(frame)
  })
}
export function fadeToInk(ms = 500) { return fadeInk(0, 1, ms) }
export function fadeFromInk(ms = 500) { return fadeInk(1, 0, ms) }
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
