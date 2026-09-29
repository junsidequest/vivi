import { fadeToInk } from './ui/iris.js'
import { isMobilePresentation } from './mobile.js'
import { sitePath } from './routes.js'
import { useEffect, useRef } from 'react'
import content from './content/professional.html?raw'
import TestimonialMarquee from './components/ui/marquee-01.jsx'
import ScrollGuide from './components/ui/scroll-guide.jsx'
import OriginButton, { setButtonOrigin } from './components/ui/origin-button.jsx'
import NavigationMenu from './components/ui/navigation-menu-05.jsx'
import SiteFooter from './components/ui/site-footer.jsx'
import { useProcessNumbers } from './ui/useProcessNumbers.js'

// 保持原始內容的引用穩定，避免載入狀態更新時重建時間軸 DOM。
const pageMarkup = content.split('<!-- TESTIMONIAL_MARQUEE -->').map(part => ({__html:part.replace('href="__ISLAND_URL__"', `href="${sitePath('island/')}"`).replaceAll('src="img/', `src="${sitePath('img/')}`)}))

export default function Professional(){
  const page = useRef(null)
  useProcessNumbers(page)
  useEffect(() => {
    const buttons = page.current.querySelectorAll('.offer-course-link, .offer-consult-link, .connect-ctas .pro-island')
    const pointer = event => { if (event.pointerType !== 'touch' || event.type === 'pointerdown') setButtonOrigin(event.currentTarget, event) }
    const focus = event => { if (event.currentTarget.matches(':focus-visible')) setButtonOrigin(event.currentTarget, event, true) }
    buttons.forEach(button => {
      button.addEventListener('pointerenter', pointer)
      button.addEventListener('pointerdown', pointer)
      button.addEventListener('focus', focus)
    })
    return () => buttons.forEach(button => {
      button.removeEventListener('pointerenter', pointer)
      button.removeEventListener('pointerdown', pointer)
      button.removeEventListener('focus', focus)
    })
  }, [])
  useEffect(()=>{
    let leaving=false
    const enter=async e=>{
      const link=e.target.closest('a.pro-island')
      if(!link||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return
      e.preventDefault()
      if(leaving)return
      leaving=true
      await fadeToInk(450)
      sessionStorage.setItem('vivi-island-entry','bridge')
      if(isMobilePresentation())window.dispatchEvent(new CustomEvent('site-navigate',{detail:{url:link.href}}))
      else window.location.assign(link.href)
    }
    page.current.addEventListener('click',enter)
    const root=page.current
    return()=>root.removeEventListener('click',enter)
  },[])
  useEffect(()=>{
    const root=page.current, card=root.querySelector('.offer-flip')
    const front=card.querySelector('.offer-front'), back=card.querySelector('.offer-back')
    const toggles=[...card.querySelectorAll('.offer-flip-toggle')]
    const touch=matchMedia('(hover: none), (pointer: coarse)')
    const smallScreen=matchMedia('(max-width: 760px)')
    const isMobile=()=>touch.matches||smallScreen.matches
    const bell=root.querySelector('.pro-course-bell')
    let revealFrame=0, revealing=false, revealedFromBell=false
    const cancelReveal=()=>{cancelAnimationFrame(revealFrame);revealing=false}
    const setFlipped=(flipped,{focus=false,fromBell=false}={})=>{
      revealedFromBell=flipped&&fromBell
      card.classList.toggle('is-flipped',flipped)
      toggles.forEach(toggle=>toggle.setAttribute('aria-expanded',String(flipped)))
      front.setAttribute('aria-hidden',String(flipped))
      back.setAttribute('aria-hidden',String(!flipped))
      front.inert=flipped;back.inert=!flipped
      bell.setAttribute('aria-expanded',String(flipped))
      if(focus&&flipped)card.querySelector('.offer-back').focus({preventScroll:true})
      if(!flipped&&back.contains(document.activeElement))document.activeElement.blur()
    }
    setFlipped(false)
    const revealCourse=()=>{
      cancelReveal()
      setFlipped(false)
      revealing=true
      const keyboard=bell.matches(':focus-visible')
      const offers=root.querySelector('#offers')
      const header=root.querySelector('.pro-header')
      const target=Math.max(0,Math.min(root.scrollHeight-root.clientHeight,
        root.scrollTop+offers.getBoundingClientRect().top-header.getBoundingClientRect().bottom-16))
      if(location.hash!=='#offers')history.pushState(null,'','#offers')
      root.scrollTo({top:target,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})
      const started=performance.now()
      let lastTop=root.scrollTop, lastMovement=started
      const finish=()=>{
        if(!revealing)return
        const now=performance.now()
        if(root.scrollTop!==lastTop){lastTop=root.scrollTop;lastMovement=now}
        if(Math.abs(root.scrollTop-target)<2&&now-lastMovement>120){revealing=false;setFlipped(true,{focus:keyboard,fromBell:true});return}
        if(performance.now()-started>3000){cancelReveal();return}
        revealFrame=requestAnimationFrame(finish)
      }
      revealFrame=requestAnimationFrame(finish)
    }
    const click=e=>{
      if(e.target.closest('.pro-course-bell')){revealCourse();return}
      cancelReveal()
      if(e.target.closest('.offer-course-list a'))return
      const button=e.target.closest('.offer-flip-toggle')
      if(button){setFlipped(!button.closest('.offer-back'),{focus:!isMobile()});return}
      if(e.target.closest('.offer-flip'))return
      if(card.classList.contains('is-flipped'))setFlipped(false)
    }
    const scroll=()=>{
      if(revealing||!isMobile()||!card.classList.contains('is-flipped'))return
      const bounds=card.getBoundingClientRect()
      if(revealedFromBell&&bounds.bottom>root.querySelector('.pro-header').getBoundingClientRect().bottom&&bounds.top<root.getBoundingClientRect().bottom)return
      setFlipped(false)
    }
    const interrupt=()=>{cancelReveal();scroll()}
    const key=e=>{if(['Escape','ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))cancelReveal();if(e.key==='Escape'&&card.classList.contains('is-flipped'))setFlipped(false)}
    root.addEventListener('click',click)
    root.addEventListener('scroll',scroll,{passive:true})
    window.addEventListener('scroll',scroll,{passive:true})
    document.addEventListener('scroll',scroll,{passive:true,capture:true})
    document.addEventListener('touchmove',interrupt,{passive:true})
    document.addEventListener('wheel',interrupt,{passive:true})
    root.addEventListener('keydown',key)
    return()=>{cancelReveal();root.removeEventListener('click',click);root.removeEventListener('scroll',scroll);window.removeEventListener('scroll',scroll);document.removeEventListener('scroll',scroll,true);document.removeEventListener('touchmove',interrupt);document.removeEventListener('wheel',interrupt);root.removeEventListener('keydown',key)}
  },[])
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
    <header className="pro-header"><a className="pro-brand" href={sitePath('')}>Vivi Chen<span>陳盈臻</span></a><NavigationMenu/><div className="pro-header-actions"><OriginButton className="pro-contact" href="#connect">服務諮詢</OriginButton></div></header>
    <main>
      <section className="pro-hero" aria-labelledby="pro-title"><div className="pro-hero-copy"><span className="pro-kicker">AI 陪跑教練 × 企業內訓</span><h1 id="pro-title">把 AI 用進<br/>每天的工作中</h1><p>從企業內訓到實作陪跑，陪非技術團隊解決工作卡點，做出真正放大價值的成果</p><OriginButton className="pro-cta" href="#offers">了解課程與合作方式</OriginButton></div><div className="pro-hero-photo"><img src={sitePath('img/vivichen.png')} alt="AI 陪跑教練陳盈臻 Vivi" fetchPriority="high"/></div></section>
      <ScrollGuide/>
      <div className="pro-content">
        <div dangerouslySetInnerHTML={pageMarkup[0]}/>
        <TestimonialMarquee/>
        <div dangerouslySetInnerHTML={pageMarkup[1]}/>
        <SiteFooter/>
      </div>
    </main>
  </div>
}
