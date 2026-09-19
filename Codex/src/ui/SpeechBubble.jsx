import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/store.js'
import { sliceByTime } from './typewriter.js'

export function SpeechBubble() {
  const say = useGame((s) => s.say)
  const [shown, setShown] = useState('')
  const raf = useRef()
  useEffect(() => {
    if (!say) { setShown(''); return }
    const start = performance.now()
    const tick = (now) => {
      const s = sliceByTime(say, now - start)
      setShown(s)
      if (s.length < say.length) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [say])
  if (!say) return null
  return <div className="player-speech">{shown}</div>
}
