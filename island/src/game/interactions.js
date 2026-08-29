import { useGame } from './store.js'
import { sound } from './sound.js'

// pos 為地圖像素座標 [x, 0, y]（沿用 3D 時代的 [x,_,z] 形狀，z 即畫面 y）
// 範圍依 88px 棋盤格的可達格位重新標定（詳見 World2D 阻擋區）
export const INTERACTABLES = [
  // 小屋：range 收到 32，要站到門口那幾格才吃得到（原本 100 在半個院子外就會亮）
  { id: 'services', pos: [475, 0, 385], range: 32 },   // 小屋門口（島中央偏北）
  // 告示牌：用「貼著隱形牆」判定（rect＝告示牌的阻擋區，pad＝離牆多近算數）。
  // 圓形範圍的圓心只能擺一處，從側面貼牆時距離會被算得太遠；改量到牆面的距離，
  // 下方與右方貼牆都吃得到。range 保留給 ?debug=1 畫圈用。
  { id: 'about',    pos: [300, 0, 430], range: 40,
    rect: { x1: 248, x2: 395, y1: 330, y2: 435 }, pad: 30 },
  { id: 'contact',  pos: [586, 0, 615], range: 100 },  // 郵筒
  // 鴨子：互動點錨在池心，range 收到 135＝池塘半徑(106)外約一格，要走到池邊才吃得到
  { id: 'duck',     pos: [718, 0, 388], range: 135 },  // 池塘（鴨子視覺上繞游）
]

// 有 rect 的量「點到矩形外緣」的最短距離，其餘量到互動點
function distTo(p, it) {
  if (!it.rect) return Math.hypot(p.x - it.pos[0], p.z - it.pos[2])
  const dx = Math.max(it.rect.x1 - p.x, 0, p.x - it.rect.x2)
  const dy = Math.max(it.rect.y1 - p.z, 0, p.z - it.rect.y2)
  return Math.hypot(dx, dy)
}

export function nearestInRange(p, items = INTERACTABLES) {
  let best = null, bestD = Infinity
  for (const it of items) {
    const d = distTo(p, it)
    if (d <= (it.rect ? it.pad : it.range) && d < bestD) { best = it; bestD = d }
  }
  return best
}

export function interactNearby() {
  const { nearbyId, activePopup, movementLocked, openPopup } = useGame.getState()
  if (!nearbyId || activePopup || movementLocked) return
  sound.play('pop')
  if (nearbyId === 'duck') {
    window.dispatchEvent(new CustomEvent('duck-interact'))
  } else {
    openPopup(nearbyId)
  }
}
