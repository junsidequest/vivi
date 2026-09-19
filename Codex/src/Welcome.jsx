import { isMobilePresentation } from './mobile.js'
import { sitePath } from './routes.js'
import { useState } from 'react'
import './welcome.css'

const choices = [
  {id:'island', title:'互動小島', description:'操控角色逛小島，探索我的故事與服務。', image:'img/vivi-hero.webp', alt:'穿綠色洋裝的 Vivi 角色', action:'進入小島', label:'遊戲探索版'},
  {id:'professional', title:'講師介紹', description:'直接查看我的經歷、課程與企業內訓服務。', image:'img/vivichen.png', alt:'講師陳盈臻 Vivi 的真實照片', action:'查看介紹', label:'網站介紹版'},
]
export default function Welcome(){
  const [active,setActive]=useState(null)
  return <main className={`welcome welcome--${active || 'neutral'}`}>
    <div className="welcome-wash" aria-hidden="true"/>
    <div className="welcome-shell">
      <header className="welcome-header"><a href={sitePath('')} className="welcome-brand">Vivi Chen<span>陳盈臻</span></a><span className="welcome-role">AI 陪跑教練 · 企業內訓講師</span></header>
      <div className="welcome-content">
        <section className="welcome-intro"><span className="welcome-kicker">AI 陪跑教練 · 陳盈臻</span><h1>嗨，我是<br/>Vivi Chen<span>。</span></h1><p>我陪非技術背景的團隊，<br/>把 AI 用進每天的工作。</p></section>
        <div className="welcome-choices" aria-label="選擇瀏覽方式">
          {choices.map(c=><a key={c.id} href={sitePath(c.id==='island'?'island/':'about/')} className={`welcome-card welcome-card--${c.id} ${active===c.id?'is-active':''}`} onPointerEnter={e=>{if(e.pointerType==='mouse'&&!isMobilePresentation())setActive(c.id)}} onPointerLeave={()=>setActive(null)} onFocus={()=>{if(!isMobilePresentation())setActive(c.id)}} onBlur={()=>setActive(null)} aria-label={c.action}>
            <div className="welcome-card-copy"><span className="welcome-card-tag">{c.label}</span><span className="welcome-card-arrow" aria-hidden="true">↗</span><h2>{c.title}</h2><p>{c.description}</p></div>
            <div className="welcome-portrait"><span className="welcome-orbit" aria-hidden="true"/><img src={sitePath(c.image)} alt={c.alt} fetchPriority="high"/><span className="welcome-card-bottom">{c.action}<span aria-hidden="true">→</span></span></div>
          </a>)}
        </div>
      </div>
      <footer className="welcome-footer"><span>把 AI，帶進你的日常。</span><span>© {new Date().getFullYear()} VIVI CHEN</span></footer>
    </div>
  </main>
}
