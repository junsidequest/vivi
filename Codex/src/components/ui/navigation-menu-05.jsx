import { useEffect, useRef, useState } from 'react'
import './navigation-menu-05.css'
import CourseNotification from './course-notification.jsx'

const items = [
  { title: '關於我', href: '#about' },
  { title: '課程與服務', href: '#offers' },
  { title: '服務流程', href: '#process' },
  { title: '內訓洽詢', href: '#partners' },
]

export default function NavigationMenu() {
  const nav = useRef(null)
  const [active, setActive] = useState(() => window.location.hash)
  useEffect(() => {
    const root = nav.current.closest('.professional')
    const header = root.querySelector('.pro-header')
    const sections = [...root.querySelectorAll('.v2-sec[id]')].filter(section =>
      section.id === 'voices' || items.some(item => item.href === `#${section.id}`))
    let frame = 0
    const update = () => {
      frame = 0
      const bounds = root.getBoundingClientRect()
      const headerBottom = header.getBoundingClientRect().bottom
      const line = headerBottom + (bounds.bottom - headerBottom) * .28
      let current = ''
      for (const section of sections) {
        if (section.getBoundingClientRect().top > line) break
        current = section.id === 'voices' ? 'offers' : section.id
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

  return <nav ref={nav} className="pro-navigation" aria-label="主要導覽">
    {items.map(item => {
      const link = <a href={item.href} aria-current={active === item.href ? 'location' : undefined}>{item.title}</a>
      return item.href === '#partners'
        ? <span className="pro-nav-last" key={item.href}>{link}<CourseNotification/></span>
        : <a key={item.href} href={item.href} aria-current={active === item.href ? 'location' : undefined}>{item.title}</a>
    })}
  </nav>
}
