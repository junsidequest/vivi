import { isMobilePresentation } from './mobile.js'
import { sitePath } from './routes.js'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import './welcome.css'
import SiteFooter from './components/ui/site-footer.jsx'

const choices = [
  {id:'island', title:'互動小島', description:'來逛逛我家', image:'img/vivi-hero.webp', alt:'穿綠色洋裝的 Vivi 角色', action:'進入小島', label:'遊戲版'},
  {id:'professional', title:'講師與服務介紹', description:'我的經歷、課程與企業內訓服務', image:'img/vivichen.png', alt:'講師陳盈臻 Vivi 的真實照片', action:'看更多介紹', label:'專業版'},
]
export default function Welcome(){
  const [active,setActive]=useState(null)
  return <main className={`welcome welcome--${active || 'neutral'}`}>
    <div className="welcome-wash" aria-hidden="true"/>
    <div className="welcome-shell">
      <header className="welcome-header"><a href={sitePath('')} className="welcome-brand">Vivi Chen<span>陳盈臻</span></a><span className="welcome-role"><span>AI 陪跑教練</span><span className="welcome-role-divider"> · </span><span>企業內訓講師</span></span></header>
      <div className="welcome-content">
        <section className="welcome-intro"><span className="welcome-kicker">AI 陪跑教練</span><h1>Hi 我是<br/>Vivi 陳盈臻</h1><p>陪非技術背景的團隊和企業<br/><strong>把 AI 帶進你的工作日常</strong></p></section>
        <div className="welcome-choices" aria-label="選擇瀏覽方式">
          {choices.map(c=><a key={c.id} href={sitePath(c.id==='island'?'island/':'about/')} className={`welcome-card welcome-card--${c.id} ${active===c.id?'is-active':''}`} onPointerEnter={e=>{if(e.pointerType==='mouse'&&!isMobilePresentation())setActive(c.id)}} onPointerLeave={()=>setActive(null)} onFocus={()=>{if(!isMobilePresentation())setActive(c.id)}} onBlur={()=>setActive(null)} aria-label={c.action}>
            <div className="welcome-card-copy"><span className="welcome-card-tag">{c.label}</span><h2>{c.title}</h2><p>{c.description}</p></div>
            <div className="welcome-portrait"><span className="welcome-orbit" aria-hidden="true"/><img src={sitePath(c.image)} alt={c.alt} fetchPriority="high"/><span className="welcome-card-bottom">{c.action}<ArrowRight className="welcome-action-arrow" size={24} strokeWidth={3.5} aria-hidden="true"/></span></div>
          </a>)}
        </div>
      </div>
      <SiteFooter/>
    </div>
  </main>
}
