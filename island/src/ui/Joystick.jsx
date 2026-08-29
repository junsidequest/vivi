import { useEffect, useRef } from 'react'
import { joyVec } from '../game/refs.js'
import { interactNearby } from '../game/interactions.js'

export const isTouch = matchMedia('(pointer: coarse)').matches

const MAX = 40 // px

export function TouchControls() {
  const knob = useRef()
  const origin = useRef(null)

  const move = (e) => {
    if (!origin.current) return
    let dx = e.clientX - origin.current.x
    let dy = e.clientY - origin.current.y
    const len = Math.hypot(dx, dy)
    if (len > MAX) { dx = (dx / len) * MAX; dy = (dy / len) * MAX }
    knob.current.style.transform = `translate(${dx}px, ${dy}px)`
    joyVec.x = dx / MAX
    joyVec.z = dy / MAX
    joyVec.run = len >= MAX * 0.95
  }
  const end = () => {
    origin.current = null
    joyVec.x = 0; joyVec.z = 0; joyVec.run = false
    knob.current.style.transform = 'translate(0,0)'
  }

  // 拖曳中若元件被 unmount（例如 popup 開啟移除 TouchControls），
  // pointerup/cancel 不會觸發，joyVec 會殘留非零值造成角色自走
  useEffect(() => () => { joyVec.x = 0; joyVec.z = 0; joyVec.run = false }, [])

  return (
    <>
      <div className="joy"
        onPointerDown={(e) => { origin.current = { x: e.clientX, y: e.clientY }; e.target.setPointerCapture(e.pointerId) }}
        onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
        <div className="joy-knob" ref={knob} />
      </div>
      <button className="btn-a" onPointerDown={interactNearby}>A</button>
    </>
  )
}
