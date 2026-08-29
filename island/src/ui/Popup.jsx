import { useEffect } from 'react'
import { useGame } from '../game/store.js'
import { POPUPS } from './content.jsx'
import { sound } from '../game/sound.js'

export function Popup() {
  const id = useGame((s) => s.activePopup)
  const closePopup = useGame((s) => s.closePopup)
  const close = () => { sound.play('pop'); closePopup() }

  // 任何按鍵都能關掉彈窗（叉叉與點彈窗外也都可以）。
  // 忽略 repeat：按住開啟用的那顆 E 不會連帶把彈窗關掉。
  useEffect(() => {
    if (!id) return
    const onKey = (e) => { if (!e.repeat) close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [id])

  if (!id || !POPUPS[id]) return null
  const { title, body } = POPUPS[id]
  return (
    <div className="popup-mask" onClick={close}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={close}>×</button>
        <h2>{title}</h2>
        {body}
      </div>
    </div>
  )
}
