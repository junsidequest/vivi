import { useEffect, useRef, useState } from 'react'
import { sitePath } from '../../routes.js'
import './media-coverflow.css'

function ReportImages({ item, active }) {
  const images = item.images || [item.image]
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    setCurrent(0)
    if (!active || images.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => {
      if (!document.hidden) setCurrent(value => (value + 1) % images.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [active, images.length])
  return images.map((src,index) => <img key={src} className={index === current ? 'is-current' : ''} src={sitePath(src)} alt={`${item.source}報導圖片 ${index + 1}`} aria-hidden={index !== current} draggable="false"/>)
}

export default function MediaCoverflow({ items }) {
  const [position, setPosition] = useState(0)
  const [interaction, setInteraction] = useState(0)
  const restartAutoplay = () => setInteraction(value => value + 1)
  const frame = useRef(null)
  const drag = useRef(null)
  useEffect(() => {
    const node = frame.current
    let total = 0, timer, lastStep = 0
    const onWheel = event => {
      if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
      event.preventDefault()
      clearTimeout(timer)
      timer = setTimeout(() => { total = 0 }, 160)
      total += event.deltaX * (event.deltaMode === 1 ? 16 : 1)
      if (Math.abs(total) >= 45 && performance.now() - lastStep > 350) {
        setPosition(value => Math.round(value) + Math.sign(total))
        lastStep = performance.now()
        total = 0
      }
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => { node.removeEventListener('wheel', onWheel); clearTimeout(timer) }
  }, [])
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.hidden || drag.current || items.length < 2) return
      const bounds = frame.current.getBoundingClientRect()
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return
      setPosition(value => Math.round(value) + 1)
    }, 5000)
    return () => clearInterval(timer)
  }, [position, interaction, items.length])
  const suppressClick = useRef(false)
  const count = items.length
  const selected = ((Math.round(position) % count) + count) % count
  const offsetFor = index => ((index - position + count * 100 + count / 2) % count) - count / 2
  const choose = index => setPosition(position + offsetFor(index))
  const finish = event => {
    if (!drag.current) return
    const moved = event.clientX - drag.current.x
    const clickedIndex = drag.current.index
    const start = drag.current.start
    const step = drag.current.width * .75
    const touchSwipe = drag.current.pointerType === 'touch' && drag.current.horizontal && Math.abs(moved) >= Math.min(32, drag.current.width * .1)
    drag.current = null
    suppressClick.current = Math.abs(moved) > 8
    if (touchSwipe) setPosition(Math.round(start) - Math.sign(moved) * Math.max(1, Math.round(Math.abs(moved) / step)))
    else if (suppressClick.current) setPosition(Math.round(start - moved / step))
    else if (clickedIndex !== undefined) choose(Number(clickedIndex))
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const active = items[selected]
  return <div className="media-coverflow" onPointerDownCapture={restartAutoplay} onPointerUpCapture={restartAutoplay} onPointerCancelCapture={restartAutoplay} onKeyDownCapture={restartAutoplay} onWheelCapture={restartAutoplay} role="region" aria-roledescription="輪播" aria-label="媒體報導">
    <div className="horizontal-controls"><span>左右瀏覽更多媒體報導</span></div>
    <div ref={frame} className="media-coverflow-frame" tabIndex={0} aria-label="使用左右方向鍵切換報導"
      onKeyDown={event => { if (['ArrowLeft','ArrowRight'].includes(event.key)) { event.preventDefault(); setPosition(value => Math.round(value) + (event.key === 'ArrowRight' ? 1 : -1)) } }}
      onPointerDown={event => { if (event.button !== 0 || event.target.closest('a')) return; suppressClick.current = false; drag.current = { index:event.target.closest('[data-slide-index]')?.dataset.slideIndex, x:event.clientX, y:event.clientY, pointerType:event.pointerType, horizontal:false, start:position, width:event.currentTarget.querySelector('.media-flow-card').offsetWidth } }}
      onPointerMove={event => {
        if (!drag.current) return
        const dx = event.clientX - drag.current.x
        const dy = event.clientY - drag.current.y
        if (!drag.current.horizontal) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) <= 8) return
          if (Math.abs(dy) > Math.abs(dx)) { drag.current = null; suppressClick.current = true; return }
          drag.current.horizontal = true
          event.currentTarget.setPointerCapture(event.pointerId)
        }
        setPosition(drag.current.start - dx / (drag.current.width * .75))
      }}
      onPointerUp={finish} onPointerCancel={() => { drag.current = null; setPosition(value => Math.round(value)); suppressClick.current = true }}>
      <div className="media-coverflow-stage">
        {items.map((item,index) => {
          const offset = offsetFor(index), distance = Math.abs(offset), isActive = index === selected
          return <article data-slide-index={index} key={item.href} className={`media-flow-card${isActive ? ' is-active' : ''}${item.image ? ' has-image' : ''}`}
            aria-label={`第 ${index + 1} 則：${item.source}，${item.title}`}
            style={{'--offset':offset, '--depth':Math.pow(distance,.6), '--tilt':`${-Math.sign(offset)*Math.min(34*Math.pow(distance,.6),70)}deg`,zIndex:100-Math.round(distance),opacity:distance > 3.5 ? 0 : 1,transition:drag.current ? 'none' : undefined}}
            >
            <button type="button" className="media-flow-select" tabIndex={isActive ? 0 : -1} aria-label={`將${item.source}卡片移到中央`} onClick={() => { if (!suppressClick.current) choose(index) }}/>
            <div className="media-flow-art">
              <div className="media-flow-brand"><span>{item.kind}</span><strong>{item.source}</strong><small>{item.mark}</small></div>
              {item.image && <ReportImages item={item} active={isActive}/>}
            </div>
            <div className="media-flow-copy"><div className="media-flow-meta"><span>{item.date || item.kind}</span>{item.image && <span className="media-flow-source">{item.source}</span>}</div><strong>{item.title}</strong>{isActive && <a className="media-flow-external" href={item.href} target="_blank" rel="noopener noreferrer">{item.action}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></a>}</div>
          </article>
        })}
      </div>
    </div>
    <div className="media-flow-caption" aria-live="polite"><div className="media-flow-caption-top"><span className="media-flow-count">{String(selected+1).padStart(2,'0')} / {String(count).padStart(2,'0')}</span><span>{active.source}</span></div><span className="media-flow-caption-kind">{active.kind}</span></div>
    <div className="media-flow-pagination">
      <button type="button" className="media-flow-arrow" aria-label="上一張媒體報導" onClick={() => { restartAutoplay(); setPosition(value => Math.round(value) - 1) }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12H4m7-7-7 7 7 7"/></svg></button>
    <div className="media-flow-dots" aria-label="選擇報導">{items.map((item,index)=><button type="button" key={item.href} aria-label={`查看第 ${index+1} 則：${item.source}`} aria-current={index===selected ? 'true':undefined} onClick={()=>choose(index)}/>)}</div>
      <button type="button" className="media-flow-arrow" aria-label="下一張媒體報導" onClick={() => { restartAutoplay(); setPosition(value => Math.round(value) + 1) }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h16m-7-7 7 7-7 7"/></svg></button>
    </div>
  </div>
}
