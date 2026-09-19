import { sitePath } from './routes.js'
import { useEffect, useRef } from 'react'
import content from './content/professional.html?raw'

// 保持原始內容的引用穩定，避免載入狀態更新時重建時間軸 DOM。
const pageMarkup = {__html:content.replaceAll('src="img/', `src="${sitePath('img/')}`)}

export default function Professional(){
  const page = useRef(null)
  useEffect(()=>{
    // 頁面為延後載入；掛載後再定位跨頁導覽的區塊。
    const section=window.location.hash.slice(1)
    if(section) page.current.querySelectorAll('[id]').forEach(node=>{
      if(node.id===section)node.scrollIntoView({behavior:'instant',block:'start'})
    })
  },[])
  useEffect(()=>{
    const root=page.current, track=root.querySelector('.career-track')
    const stops=[...track.querySelectorAll('.career-stop')]
    const motion=matchMedia('(prefers-reduced-motion: reduce)')
    let frame=0
    const update=()=>{
      frame=0
      const first=stops[0].getBoundingClientRect().top+9
      const last=stops.at(-1).getBoundingClientRect().top+9
      const line=root.getBoundingClientRect().top+root.clientHeight*.64
      const distance=Math.max(1,last-first)
      const progress=motion.matches?1:Math.max(0,Math.min(1,(line-first)/distance))
      track.style.setProperty('--trail-height',`${distance}px`)
      track.style.setProperty('--trail-progress',progress)
      stops.forEach(stop=>stop.classList.toggle('is-reached',motion.matches||stop.getBoundingClientRect().top+9<=line))
    }
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)}
    root.addEventListener('scroll',schedule,{passive:true})
    motion.addEventListener('change',schedule)
    const observer=new ResizeObserver(schedule)
    observer.observe(root);observer.observe(track)
    update()
    return ()=>{root.removeEventListener('scroll',schedule);motion.removeEventListener('change',schedule);observer.disconnect();cancelAnimationFrame(frame)}
  },[])
  return <div className="professional" ref={page}>
    <a className="pro-skip" href="#about">跳至主要內容</a>
    <header className="pro-header"><a className="pro-brand" href={sitePath('')}>Vivi Chen<span>陳盈臻</span></a><nav aria-label="主要導覽"><a href="#about">關於我</a><a href="#process">服務流程</a><a href="#offers">課程與服務</a><a href="#partners">合作夥伴</a></nav><div className="pro-header-actions"><a className="pro-contact pro-island" href={sitePath('island/')}>逛逛 Vivi 的小島</a><a className="pro-contact" href="#connect">服務諮詢</a></div></header>
    <main>
      <section className="pro-hero" aria-labelledby="pro-title"><div className="pro-hero-copy"><span className="pro-kicker">AI 陪跑教練 × 企業內訓</span><h1 id="pro-title">把 AI，<br/>真的用起來<span>。</span></h1><p>我幫文科與非技術背景的團隊，<br/>把 AI 真的用起來。</p><a className="pro-cta" href="#offers">看看我們能一起做的事</a><div className="pro-signature">陳盈臻 <span>Vivi Chen</span></div></div><div className="pro-hero-photo"><img src={sitePath('img/vivichen.png')} alt="AI 陪跑教練陳盈臻 Vivi" fetchPriority="high"/></div></section>
      <div className="pro-content" dangerouslySetInnerHTML={pageMarkup}/>
    </main>
  </div>
}
