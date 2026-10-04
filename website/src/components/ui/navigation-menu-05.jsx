import { useEffect, useRef, useState } from 'react'
import './navigation-menu-05.css'

const items = [
  { title: '關於 Vivi', href: '#about' },
  { title: '課程與服務', href: '#offers' },
  { title: '口碑推薦', href: '#voices' },
  { title: '合作流程', href: '#process' },
  { title: '企業內訓', href: '#partners' },
]

export default function NavigationMenu() {
  const nav = useRef(null)
  const toggle = useRef(null)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const close = event => {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus() }
    }
    const outside = event => {
      if (!event.target.closest('.pro-header')) setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', close)
      document.addEventListener('pointerdown', outside)
    }
    return () => {
      document.removeEventListener('keydown', close)
      document.removeEventListener('pointerdown', outside)
    }
  }, [open])
  const [active, setActive] = useState(() => window.location.hash)
  useEffect(() => {
    const root = nav.current.closest('.professional')
    const header = root.querySelector('.pro-header')
    let frame = 0
    const update = () => {
      frame = 0
      const sections = [...root.querySelectorAll('main section[id]')].filter(section =>
        items.some(item => item.href === `#${section.id}`))
      if (!sections.length) return
      const bounds = root.getBoundingClientRect()
      const headerBottom = header.getBoundingClientRect().bottom
      const line = headerBottom + (bounds.bottom - headerBottom) * .28
      let current = ''
      for (const section of sections) {
        if (section.getBoundingClientRect().top > line) break
        current = section.id
      }
      // 頁尾不一定能把最後一區捲到門檻；可見時仍標示最後一項。
      const last = sections.at(-1)
      if (root.scrollHeight - root.clientHeight - root.scrollTop <= Math.max(2, root.clientHeight * .1) &&
          last.getBoundingClientRect().top < bounds.bottom) current = last.id
      setActive(items.some(item => item.href === `#${current}`) ? `#${current}` : '')
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    root.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('hashchange', schedule)
    window.addEventListener('popstate', schedule)
    const observer = new ResizeObserver(schedule)
    observer.observe(root)
    observer.observe(header)
    observer.observe(root.querySelector('main'))
    schedule()
    return () => {
      root.removeEventListener('scroll', schedule)
      window.removeEventListener('hashchange', schedule)
      window.removeEventListener('popstate', schedule)
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  return <>
    <button ref={toggle} type="button" className="nav-menu-toggle" aria-label={open ? '關閉導覽選單' : '開啟導覽選單'} aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(value => !value)}><span/><span/></button>
    <nav ref={nav} id="main-navigation" className={`pro-navigation${open ? ' is-open' : ''}`} aria-label="主要導覽" onClick={event => { if (event.target.closest('a')) setOpen(false) }}>
    {items.map(item => <a key={item.href} href={item.href} aria-current={active === item.href ? 'location' : undefined}>{item.title}</a>)}
  </nav>
  </>
}
