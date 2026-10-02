import { sitePath } from './routes.js'
import { useEffect, useRef } from 'react'
import content from './content/professional.html?raw'
import TestimonialMarquee from './components/ui/marquee-01.jsx'
import WorkSketch from './components/WorkSketch.jsx'
import Services from './components/Services.jsx'
import OriginButton from './components/ui/origin-button.jsx'
import NavigationMenu from './components/ui/navigation-menu-05.jsx'
import SiteFooter from './components/ui/site-footer.jsx'
import { useProcessNumbers } from './ui/useProcessNumbers.js'

// 保持原始內容的引用穩定，避免載入狀態更新時重建時間軸 DOM。
const pageMarkup = content.split('<!-- TESTIMONIAL_MARQUEE -->').map(part => ({__html:part.replaceAll('src="img/', `src="${sitePath('img/')}`)}))

export default function Professional(){
  const page = useRef(null)
  useProcessNumbers(page)
  useEffect(() => {
    const root = page.current
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-in-view'); observer.unobserve(entry.target) }
    }), {root, threshold: .08})
    root.querySelectorAll('.v2-head, .svc-option, .step, .credentials, .partner, .sketch-heading').forEach(node => {
      node.classList.add('reveal'); observer.observe(node)
    })
    return () => observer.disconnect()
  }, [])
  useEffect(()=>{
    // 頁面為延後載入；掛載後再定位跨頁導覽的區塊。
    const root=page.current
    // 外層固定頁框不應參與區塊導覽；否則整頁會被推離視窗並露出底層背景。
    if(root.parentElement)root.parentElement.scrollTop=0
    const section=window.location.hash.slice(1)
    const node=section&&root.querySelector(`[id="${CSS.escape(section)}"]`)
    if(node){
      const padding=parseFloat(getComputedStyle(root).scrollPaddingTop)||0
      const target=root.scrollTop+node.getBoundingClientRect().top-root.getBoundingClientRect().top-padding
      root.scrollTo({top:Math.max(0,target),behavior:'instant'})
    }
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
  return <div className="professional studio-edition" ref={page}>
    <a className="pro-skip" href="#main-content">跳至主要內容</a>
    <header className="pro-header">
      <a className="pro-brand" href={sitePath('')} aria-label="Vivi Chen 首頁">vivi<span className="brand-dot">.</span><span className="brand-caption">CHEN<br/>AI WORK & LIFE</span></a>
      <NavigationMenu/>
      <OriginButton className="pro-contact" href="#connect">一起聊聊</OriginButton>
    </header>
    <main id="main-content" tabIndex={-1}>
      <section className="pro-hero" aria-labelledby="pro-title">
        <div className="pro-hero-copy">
          <span className="pro-kicker"><span aria-hidden="true"/> VIVI CHEN <span className="kicker-divider"/> AI 陪跑教練</span>
          <h1 id="pro-title">把 <span className="hero-ai">AI</span> 用進<br/>每天的<span className="work-word">工作</span>中。</h1>
          <p className="hero-intro">不用先變成科技高手。<br/>從你熟悉的工作出發，一起讓 AI 真正派上用場。</p>
          <div className="hero-actions"><OriginButton className="pro-cta" href="#offers">找到適合我的合作方式</OriginButton><a className="hero-secondary" href="#work">探索工作情境</a></div>
          <p className="hero-note">企業內訓・一對一陪跑・實作課程</p>
        </div>
        <div className="pro-hero-visual">
          <span className="portrait-monogram" aria-hidden="true">v.</span>
          <div className="pro-hero-photo"><img src={sitePath('img/vivichen.webp')} alt="Vivi 陳盈臻，AI 陪跑教練" fetchPriority="high" width="1706" height="2560"/></div>
          <div className="portrait-note"><span>Vivi Chen.</span><p>陳盈臻｜你的 AI 科技麻瓜好朋友</p></div>
        </div>
        <div className="hero-bottom"><p>把技術翻譯成人話，<br/>把想法做成日常。</p><span>以人為本，讓科技剛剛好。</span></div>
      </section>
      <div className="pro-content">
        <div className="experience-strip" aria-label="Vivi 的業務經驗"><p><strong>18<span>+</span></strong><span>年業務實戰經驗</span></p><p><strong>450<span>+</span></strong><span>服務企業與政府單位</span></p><div>懂工具，也懂你的工作。<br/><span>從商業現場出發的 AI 陪跑教練。</span></div></div>
        <Services/>
        <WorkSketch/>
        <div dangerouslySetInnerHTML={pageMarkup[0]}/>
        <TestimonialMarquee/>
        <div dangerouslySetInnerHTML={pageMarkup[1]}/>
        <SiteFooter/>
      </div>
    </main>
  </div>
}
