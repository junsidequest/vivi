import { isMobilePresentation } from './mobile.js'
import { sitePath } from './routes.js'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import './welcome.css'
import SiteFooter from './components/ui/site-footer.jsx'

const choices = [
  {id:'island', path:'island/', title:'互動小島', description:'來逛逛我家', image:'img/vivi-hero.webp', alt:'穿綠色洋裝的 Vivi 角色', action:'進入小島', label:'遊戲版'},
  {id:'professional', path:'v2/', title:'AI 課程與合作', description:'公開課程、企業內訓、陪跑等服務項目', image:'img/vivichen.png', alt:'講師陳盈臻 Vivi 的真實照片', action:'看更多介紹', label:'專業版'},
]
export default function Welcome(){
  const [active,setActive]=useState(null)
  const choiceHref=choice=>choice.path==='v2/'&&import.meta.env.DEV
    ? `${window.location.protocol}//${window.location.hostname}:8796/`
    : sitePath(choice.path)
  return <main className={`welcome welcome--${active || 'neutral'}`}>
    <div className="welcome-wash" aria-hidden="true"/>
    <div className="welcome-shell">
      <header className="welcome-header">
        <a href={sitePath('')} className="welcome-brand" aria-label="Vivi Chen 首頁">
          <span className="welcome-wordmark">vivi<span>.</span></span>
          <span className="welcome-brand-caption">陳盈臻<br/>AI WORK &amp; LIFE</span>
        </a>
        <span className="welcome-role"><span>企業 AI 導入顧問</span><span className="welcome-role-divider"> × </span><span>AI 陪跑教練</span><span className="welcome-role-divider"> × </span><span>生成式 AI 講者</span></span>
      </header>
      <div className="welcome-content">
        <section className="welcome-intro">
          <h1><span className="welcome-title-line">Hi</span><span className="welcome-title-line">我是 AI 陪跑教練 Vivi</span></h1>
          <p>陪非技術背景的團隊和企業<br/>把 AI 帶進你的工作日常</p>
          <div className="welcome-prompt">
            <span className="welcome-prompt-copy welcome-prompt-copy--desktop">從右邊選一種方式認識我</span>
            <span className="welcome-prompt-copy welcome-prompt-copy--mobile">從下面選一種方式認識我</span>
            <ArrowRight className="welcome-prompt-arrow" size={24} strokeWidth={2.5} aria-hidden="true"/>
          </div>
        </section>
        <div className="welcome-choices" aria-label="選擇瀏覽方式">
          {choices.map(c=><a key={c.id} href={choiceHref(c)} className={`welcome-card welcome-card--${c.id} ${active===c.id?'is-active':''}`} onPointerEnter={e=>{if(e.pointerType==='mouse'&&!isMobilePresentation())setActive(c.id)}} onPointerLeave={()=>setActive(null)} onFocus={()=>{if(!isMobilePresentation())setActive(c.id)}} onBlur={()=>setActive(null)} aria-label={c.action}>
            <div className="welcome-card-copy"><span className="welcome-card-tag">{c.label}</span><h2>{c.title}</h2><p>{c.description}</p></div>
            <div className="welcome-portrait"><span className="welcome-orbit" aria-hidden="true"/><img src={sitePath(c.image)} alt={c.alt} fetchPriority="high"/><span className="welcome-card-bottom">{c.action}<ArrowRight className="welcome-action-arrow" size={24} strokeWidth={3.5} aria-hidden="true"/></span></div>
          </a>)}
        </div>
      </div>
      <SiteFooter/>
    </div>
  </main>
}
