// island/src/game/say.js
// 共享的「暫時語句」helper：單一全域 token，保證只有最後一次呼叫的 timer 能清 say，
// 防止 Idle 語錄與 Duck 語錄互相 stomping（各自 token 只防自己重觸發，防不了互相搶）。
import { useGame } from './store.js'

let token = 0

export function sayTemporarily(line, ms = 4000) {
  const t = ++token
  useGame.getState().setSay(line)
  setTimeout(() => {
    if (token === t) useGame.getState().setSay(null)
  }, ms)
}
