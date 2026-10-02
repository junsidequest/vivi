import { useRef } from 'react'
import './origin-button.css'

// 保留連結語意，讓頁內導覽、鍵盤 Enter 與開啟新分頁維持原生行為。
export function setButtonOrigin(node, event, center = false) {
    const rect = node.getBoundingClientRect()
    const width = node.clientWidth, height = node.clientHeight
    const x = center ? width / 2 : event.clientX - rect.left - node.clientLeft
    const y = center ? height / 2 : event.clientY - rect.top - node.clientTop
    const radius = Math.ceil(Math.max(
      Math.hypot(x, y), Math.hypot(width - x, y),
      Math.hypot(x, height - y), Math.hypot(width - x, height - y),
    ))
    node.style.setProperty('--origin-x', `${x}px`)
    node.style.setProperty('--origin-y', `${y}px`)
    node.style.setProperty('--origin-radius', `${radius}px`)
}

export default function OriginButton({ href, className = '', children }) {
  const link = useRef(null)
  const setOrigin = (event, center = false) => setButtonOrigin(link.current, event, center)


  const external = /^https?:/.test(href)
  return <a ref={link} href={href} className={`${className} origin-button`} target={external ? '_blank' : undefined} rel={external ? 'noopener' : undefined}
    onPointerEnter={event => { if (event.pointerType !== 'touch') setOrigin(event) }}
    onPointerDown={event => setOrigin(event)}
    onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setOrigin(event, true) }}>
    <span className="origin-button-label">{children}</span>
    <span className="origin-button-fill" aria-hidden="true">{children}</span>
  </a>
}
