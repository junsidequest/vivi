import { useEffect } from 'react'

export function useProcessNumbers(page) {
  useEffect(() => {
    const root = page.current
    const track = root.querySelector('#process .steps')
    const numbers = [...track.querySelectorAll('.step-no')]
    const header = root.querySelector('.pro-header')
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const clamp = value => Math.max(0, Math.min(1, value))
    let frame = 0
    const update = () => {
      frame = 0
      const top = header.getBoundingClientRect().bottom
      const height = Math.max(1, root.getBoundingClientRect().bottom - top)
      const first = numbers[0].getBoundingClientRect().top
      const last = numbers.at(-1).getBoundingClientRect().top
      // 單排或換行共用同一段進度，確保 01 → 05 依序顯色。
      const progress = clamp((top + height * .85 - first) / (last - first + height * .5))
      numbers.forEach((number, index) => {
        const fill = motion.matches ? 1 : clamp(progress * numbers.length - index)
        number.style.setProperty('--ink-start', `${clamp(fill * 1.2 - .2) * 100}%`)
        number.style.setProperty('--ink-end', `${clamp(fill * 1.2) * 100}%`)
      })
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    root.addEventListener('scroll', schedule, { passive: true })
    motion.addEventListener('change', schedule)
    const observer = new ResizeObserver(schedule)
    observer.observe(root)
    observer.observe(header)
    observer.observe(root.querySelector('main'))
    observer.observe(track)
    update()
    return () => {
      root.removeEventListener('scroll', schedule)
      motion.removeEventListener('change', schedule)
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [page])
}
