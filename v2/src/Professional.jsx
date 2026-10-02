import { sitePath } from './routes.js'
import { useEffect, useRef, useState } from 'react'
import TestimonialMarquee from './components/ui/marquee-01.jsx'
import WorkSketch from './components/WorkSketch.jsx'
import OriginButton from './components/ui/origin-button.jsx'
import NavigationMenu from './components/ui/navigation-menu-05.jsx'
import SiteFooter from './components/ui/site-footer.jsx'
import { useProcessNumbers } from './ui/useProcessNumbers.js'

const FORM_URL = 'https://forms.gle/qDyknssNkfJDAto8A'

const stats = [
  { value: 18, suffix: '+', label: '年業務實戰經驗' },
  { value: 450, suffix: '+', label: '服務企業與政府單位' },
  { value: 10000, suffix: '+', label: '線上課程學習' },
  { value: 1000, suffix: '+', label: '實體授課學員' },
]

// 招牌段落：把常見術語翻成工作上聽得懂的說法。
const glossary = [
  { term: 'Prompt Engineering', human: '把需求說清楚，AI 才幫得上忙' },
  { term: 'Workflow Automation', human: '讓每週重複的事，自己跑完' },
  { term: 'API Integration', human: '讓兩個工具直接互相傳話' },
  { term: 'RAG', human: '讓 AI 先查你的資料，再回答' },
  { term: 'AI Agent', human: '會自己拆步驟、把事做完的助手' },
]

const career = [
  { label: '媒體', org: '天下雜誌', role: '整合傳播部副理' },
  { label: '媒體', org: '關鍵評論網媒體集團', role: '業務發展中心總監' },
  { label: '廣告科技', org: '艾迪英特股份有限公司', role: '業務總監' },
  { label: '現在', org: 'AI 陪跑教練', role: 'AI 應用顧問・企業內訓' },
]

const credentials = [
  { src: 'img/credentials/iii.svg', alt: '資策會', issuer: '資策會', name: '生成式 AI 能力認證', mod: 'iii' },
  { src: 'img/credentials/ipas.webp', alt: 'iPAS', issuer: '經濟部 iPAS', name: 'AI 應用規劃師' },
  { src: 'img/credentials/google.svg', alt: 'Google', issuer: 'Google for Education', name: 'Gemini Certified Educator' },
  { src: 'img/credentials/aws-ai-practitioner-transparent.png', alt: 'AWS Certified AI Practitioner', issuer: 'AWS', name: 'Certified AI Practitioner' },
]

const courses = {
  online: [
    { lead: '天下學習', title: '《零基礎打造專屬 AI 助理》與《Notion 實戰入門》', href: 'https://s.vivichen.ai/cwlearning' },
    { lead: '2025 Generative 生成式 AI 年會講座回放', title: '《用 AI，解鎖我的跨域新篇章》', href: 'https://live.gaiconf.com/courses/gaiconf2025' },
    { lead: 'Generative AI 社群', title: '上班族 AI 寫程式自動化', href: 'https://live.gaiconf.com/courses/14' },
    { lead: '中小企業網路大學校', title: '《AI ✕ 工作流程優化 是放大問題，還是解決問題？》', href: 'https://www.smelearning.org.tw/class.php?course=18374' },
    { lead: '五倍學院', title: '《用工具打造 AI 簡報工作流》', href: 'https://5xcampus.com/courses/ai-slide-flow?gad_source=1&gad_campaignid=23090853254&gbraid=0AAAAADCYj6pqQX8xvkV0Oc8INQt5fH0QI&gclid=CjwKCAiAkvDMBhBMEiwAnUA9BZS8-AsJlEQ0LSISQKumr2-c5Zn-nbozCpMdZBHUyuLvuZdnct8vkRoCwtEQAvD_BwE' },
  ],
  offline: [
    { lead: 'AI 自動化入門：打造高效省時工作模式', title: '超過八個梯次已完課，實體課程累計超過千位學員' },
    { lead: '燒賣研究所', title: '《FDE AI 架構師實戰學程：打造第一個企業 AI 自動化流程（62H+）》', href: 'https://www.shumai.com.tw/ai_product' },
    { lead: 'Claude 入門 － 打造 AI 工作流', title: '2026 首度招生即額滿，目前已開兩個梯次' },
  ],
}

const steps = [
  { title: '現況盤點', body: '了解工作使用習慣與場景，辨識導入和使用 AI 卡關的地方。' },
  { title: '目標確認', body: '確認導入 AI 真正想解決的問題，一起訂出具體、可衡量的目標。' },
  { title: '深層需求挖掘', body: '不只問你們想要什麼，也協助釐清為什麼要做，找出最值得導入的環節。' },
  { title: '客製化方案', body: '依照團隊的程度與情境，設計專屬課程和導入計畫。' },
  { title: '手把手教學', body: '用每個人都懂的方式解釋複雜概念，帶你和你的團隊用 AI 跨出第一步。' },
]

const partners = [
  { name: '智谷網絡', role: '企業培訓機構', body: '擔任特約講師，把 AI 應用與自動化課程帶進企業內訓現場。', href: 'https://www.kvalley.biz/team-member/%E9%99%B3%E7%9B%88%E8%87%BBvivi/' },
  { name: '言果學習', role: '企業內訓平台', body: '合作講師，為企業團隊設計生成式 AI 導入與實作課程。', href: 'https://yanguo.com.tw/teacher/yingzhen-chen' },
  { name: '天下學習中心', role: '全台最大企業內訓平台', body: '課程講師。' },
]


const marqueeWords = ['把技術翻譯成人話', '把想法做成日常', 'Human first', '從真實工作出發']

// 逐行遮罩進場；文字仍保留在同一個標題節點，讀屏器照常朗讀。
const Line = ({ children, i = 0 }) => <span className="line" style={{ '--i': i }}><span>{children}</span></span>

function Counter({ value }) {
  const node = useRef(null)
  const [shown, setShown] = useState(value)
  useEffect(() => {
    const el = node.current
    if (value < 10 || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const tick = now => {
        const t = Math.min(1, (now - start) / 1400)
        setShown(Math.round(value * (1 - Math.pow(1 - t, 4))))
        if (t < 1) frame = requestAnimationFrame(tick)
      }
      setShown(0)
      frame = requestAnimationFrame(tick)
    }, { threshold: .6 })
    observer.observe(el)
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [value])
  return <span ref={node} className="counter">{shown}</span>
}

function CourseTabs() {
  const [tab, setTab] = useState('online')
  const tabs = [['online', '線上課程'], ['offline', '實體課程']]
  const key = (event, index) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index
    setTab(tabs[next][0])
    event.currentTarget.parentElement.children[next].focus()
  }
  return <>
    <div className="course-tabs" role="tablist" aria-label="公開課程類型">
      {tabs.map(([id, label], index) => <button key={id} id={`course-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls="course-panel" tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)} onKeyDown={event => key(event, index)}>{label}</button>)}
    </div>
    <ul id="course-panel" className="course-list" role="tabpanel" aria-labelledby={`course-tab-${tab}`} key={tab}>
      {courses[tab].map(course => <li key={course.title}>
        <span>{course.lead}</span>
        {course.href ? <a href={course.href} target="_blank" rel="noopener">{course.title}</a> : <strong>{course.title}</strong>}
      </li>)}
    </ul>
  </>
}


const servicePaths = [
  { id: 'learn', title: '自己學', type: '公開課程', hint: '想先掌握方法，照自己的步調練習。' },
  { id: 'coach', title: '一起做', type: '陪跑教練', hint: '有想解決的問題，希望有人陪我完成。' },
  { id: 'team', title: '帶團隊', type: '企業 AI 導入', hint: '讓同事一起學會，用進實際工作流程。' },
]

function ServiceGuide() {
  const [selected, setSelected] = useState('learn')
  const inner = useRef(null)
  const [height, setHeight] = useState(null)
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height))
    observer.observe(inner.current)
    return () => observer.disconnect()
  }, [])
  const chooseService = id => {
    setSelected(id)
    if (matchMedia('(max-width: 900px)').matches) {
      requestAnimationFrame(() => inner.current?.parentElement.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start',
      }))
    }
  }
  const onKey = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3
    setSelected(servicePaths[next].id)
    event.currentTarget.parentElement.children[next].focus()
  }
  return <div className="service-guide">
    <div className="service-choices" role="tablist" aria-label="選擇合作情境">
      {servicePaths.map((path, index) => <button key={path.id} type="button" role="tab" id={`service-tab-${path.id}`} aria-controls={`service-panel-${path.id}`} aria-selected={selected === path.id} tabIndex={selected === path.id ? 0 : -1} onClick={() => chooseService(path.id)} onKeyDown={event => onKey(event,index)}>
        <span className="service-choice-top"><strong>{path.title}</strong><span>{path.type}</span></span>
        <span className="service-choice-hint">{path.hint}</span>
      </button>)}
    </div>
    <div className="service-panel-frame" style={height ? {height} : undefined}>
      <div ref={inner}>
        {servicePaths.map(path => <div key={path.id} id={`service-panel-${path.id}`} role="tabpanel" aria-labelledby={`service-tab-${path.id}`} hidden={selected !== path.id} tabIndex={0} className="service-panel">
          {path.id === 'learn' ? <>
            <div className="service-story"><span className="service-caption">從一堂課開始</span><h3>學會方法<br/>帶回自己的工作</h3><p>從 AI 素養、工作流與自動化，到 AI 簡報與 Vibe Coding<br/>透過實作理解方法，再用到熟悉的工作情境</p><p className="service-proof">線上課程逾萬人學習・實體授課逾千人</p></div>
            <div className="service-details"><CourseTabs/><p className="service-footnote">開課時間與報名資訊，以各課程平台公告為準。</p></div>
          </> : path.id === 'coach' ? <>
            <div className="service-story"><span className="service-caption">帶著一個真實問題來</span><h3>你的工作難題<br/>我們一起拆解</h3><p>適合已經有具體需求，希望有人一起釐清方向、選擇工具，逐步做出可用成果的工作者、經理人與企業主</p><p className="service-proof">已陪跑超過 30 位高階經理人與企業主</p></div>
            <div className="service-details"><h4>一對一 AI 陪跑</h4><ul className="service-scope"><li><strong>先看工作怎麼做</strong><p>從你的資料、步驟與卡關點開始，找到值得改善的環節</p></li><li><strong>一起做出能用的工具</strong><p>報表整理、會議紀錄、提案與報價，或自己的知識庫</p></li><li><strong>留下能持續用的方法</strong><p>陪你理解、調整與驗證，讓成果融入日常工作</p></li></ul><OriginButton className="offer-cta" href={FORM_URL}>聊聊我的需求</OriginButton></div>
          </> : <>
            <div className="service-story"><span className="service-caption">從個人試用走向團隊應用</span><h3>讓 AI 成為<br/>團隊的工作方法</h3><p>適合正在啟動 AI 導入，或希望把零散試用轉成共同流程的企業<br/>依團隊程度與既有系統，規劃內訓、實作工作坊與導入陪跑</p><p className="service-proof">企業內訓與講座超過 50 場</p></div>
            <div className="service-details"><h4>企業內訓與導入陪跑</h4><ul className="service-scope"><li><strong>評估工具與導入方向</strong><p>依 Google／Microsoft 生態系、預算與人員程度，選擇合適的 AI 平台組合</p></li><li><strong>用部門真實情境實作</strong><p>為行政、行銷、業務等職能建立專屬 Skill 與工作流</p></li><li><strong>建立可延伸的使用規範</strong><p>釐清資料敏感度、機敏資訊分級與 AI 產出查核方式</p></li></ul><OriginButton className="offer-cta" href={FORM_URL}>討論團隊需求</OriginButton><a className="service-partner-link" href="#partners">透過培訓機構合作</a></div>
          </>}
        </div>)}
      </div>
    </div>
  </div>
}

export default function Professional() {
  const page = useRef(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  useProcessNumbers(page)

  useEffect(() => {
    const root = page.current
    requestAnimationFrame(() => root.classList.add('is-loaded'))
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-in'); observer.unobserve(entry.target) }
    }), { root, threshold: .12, rootMargin: '0px 0px -6% 0px' })
    root.querySelectorAll('[data-reveal], mark.hl').forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // 捲動進度驅動頂部進度線、首屏視差與頁首縮合；減少動態時只保留狀態切換。
    const root = page.current
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const header = root.querySelector('.pro-header')
    const translator = root.querySelector('.translator')
    const terms = [...translator.querySelectorAll('.translator-item')]
    let frame = 0
    const update = () => {
      frame = 0
      const max = Math.max(1, root.scrollHeight - root.clientHeight)
      root.style.setProperty('--scroll', (root.scrollTop / max).toFixed(4))
      root.style.setProperty('--hero', motion.matches ? 0 : Math.min(1, root.scrollTop / root.clientHeight).toFixed(4))
      root.classList.toggle('is-scrolled', root.scrollTop > 24)
      const clamp = value => Math.max(0, Math.min(1, value))
      // 翻譯舞台：整段捲動距離平均分給每個術語，局部進度驅動劃線與逐字浮現。
      const stage = translator.getBoundingClientRect(), view = root.getBoundingClientRect()
      // 舞台抵達頁首下緣後才開始推進，先保留完整術語供閱讀。
      const lead = 0
      const span = Math.max(1, stage.height - (view.bottom - header.getBoundingClientRect().bottom) + lead)
      const t = clamp((header.getBoundingClientRect().bottom + lead - stage.top) / span) * terms.length
      const active = Math.min(terms.length - 1, Math.floor(t))
      translator.classList.toggle('is-final-term', active === terms.length - 1)
      terms.forEach((term, index) => {
        term.style.setProperty('--p', index < active ? 1 : index > active ? 0 : Math.min(1, (t - index) * 1.35).toFixed(3))
        term.classList.toggle('is-active', index === active)
        term.classList.toggle('is-past', index < active)
      })
      translator.style.setProperty('--t', (t / terms.length).toFixed(4))
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    root.addEventListener('scroll', schedule, { passive: true })
    motion.addEventListener('change', schedule)
    const observer = new ResizeObserver(schedule)
    observer.observe(root)
    update()
    return () => { root.removeEventListener('scroll', schedule); motion.removeEventListener('change', schedule); observer.disconnect(); cancelAnimationFrame(frame) }
  }, [])

  useEffect(() => {
    const root = page.current
    const node = window.location.hash && root.querySelector(`[id="${CSS.escape(window.location.hash.slice(1))}"]`)
    if (node) root.scrollTo({ top: node.offsetTop - 80, behavior: 'instant' })
  }, [])

  const toTop = () => page.current.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })

  return <div className="professional" ref={page}>
    <a className="pro-skip" href="#main">跳至主要內容</a>
    <div className="scroll-progress" aria-hidden="true"/>
    <header className="pro-header">
      <a className="pro-brand" href={sitePath('')} aria-label="Vivi Chen 首頁">vivi<span className="brand-dot">.</span><span className="brand-caption">陳盈臻<br/>AI WORK & LIFE</span></a>
      <NavigationMenu/>
      <OriginButton className="pro-contact" href="#connect">一起聊聊</OriginButton>
    </header>

    <main id="main">
      <section className="hero" aria-labelledby="pro-title">
        <div className="hero-copy">
          <p className="hero-kicker"><span className="dot" aria-hidden="true"/>AI 應用顧問 × 企業內訓 × 實作陪跑</p>
          <h1 id="pro-title" className="hero-title">
            <Line i={0}>把 <em className="latin">AI</em> 用進</Line>
            <Line i={1}>每天的<span className="work-word">工作<svg viewBox="0 0 320 160" fill="none" aria-hidden="true" preserveAspectRatio="none"><path pathLength="1" d="M292 34C237-4 77 4 24 49C-39 105 73 159 219 137C320 122 355 60 285 28C242 9 172 12 134 20"/></svg></span>中</Line>
          </h1>
          <p className="hero-intro">不用先變成科技高手。<br/><mark className="hl">從你熟悉的工作出發</mark>，一起讓 AI 真正派上用場。</p>
          <div className="hero-actions">
            <OriginButton className="pro-cta" href="#work">從我的工作開始</OriginButton>
            <a className="text-link" href="#offers">課程與合作方式</a>
          </div>
        </div>
        <figure className="hero-visual">
          <div className="hero-arch"><img src={sitePath('img/vivichen-1100.webp')} srcSet={`${sitePath('img/vivichen-700.webp')} 700w, ${sitePath('img/vivichen-1100.webp')} 1100w`} sizes="(max-width: 900px) 92vw, 520px" alt="Vivi 陳盈臻，AI 陪跑教練" fetchPriority="high" width="1100" height="1651"/></div>
          <figcaption className="hero-note"><span>Hi, I’m Vivi.</span>你的 AI 科技麻瓜好朋友</figcaption>
        </figure>
        <ul className="hero-stats" aria-label="教學與業務經歷">
          {stats.map(stat => <li key={stat.label}>
            <strong><Counter value={stat.value}/><sup>{stat.suffix}</sup></strong>
            <span>{stat.label}</span>
          </li>)}
        </ul>
      </section>

      <svg className="type-filter" width="0" height="0" aria-hidden="true"><defs><filter id="glyph-outline" x="-5%" y="-15%" width="110%" height="130%" colorInterpolationFilters="sRGB"><feMorphology in="SourceAlpha" operator="dilate" radius="0.7" result="outer"/><feMorphology in="SourceAlpha" operator="erode" radius="0.7" result="inner"/><feComposite in="outer" in2="inner" operator="out"/></filter></defs></svg>
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map(copy => <div className="ticker-group" key={copy}>
            {marqueeWords.map(word => <span key={word}><b className="ticker-word">{word}</b><i/></span>)}
          </div>)}
        </div>
      </div>

      <section className="translate band" id="translate" aria-labelledby="translate-title">
        <div className="translator" style={{ '--n': glossary.length }}>
          <div className="translator-stage">
        <div className="section-head translator-heading">
          <p className="eyebrow"><span>01</span>LOST IN TRANSLATION</p>
          <h2 id="translate-title">AI 的術語<br/>我幫你<span className="serif">翻成人話</span></h2>
          <p className="lede">工具名詞聽起來很難，但背後要解決的，<mark className="hl">都是你每天在處理的事</mark>。</p>
        </div>
            <div className="translator-meta" aria-hidden="true"><span>AI 專業術語</span><span className="translator-bar"><i/></span><span>翻譯成人話</span></div>
            <div className="translator-slides">{glossary.map((item, index) => <div className="translator-item" key={item.term} aria-hidden="true">
              <span className="translator-no"><b>{String(index + 1).padStart(2, '0')}</b>/ {String(glossary.length).padStart(2, '0')}</span>
              <span className="translator-term" lang="en"><span>{item.term}</span></span>
              <span className="translator-human">{[...item.human].map((char, i, all) => <span key={i} style={{ '--c': (i / all.length).toFixed(3) }}>{char}</span>)}</span>
            </div>)}</div>
            <div className="translator-hint"><div className="translator-next"><span className="translator-next-rule" aria-hidden="true"/><span className="translator-next-copy"><span className="translator-next-title">工具會變，要解決的事不變</span></span></div></div>
          </div>
          <ol className="glossary">
            {glossary.map((item, index) => <li key={item.term}>
              <span className="glossary-no">{String(index + 1).padStart(2, '0')}</span>
              <span className="glossary-term" lang="en"><s>{item.term}</s></span>
              <span className="glossary-human">{item.human}</span>
            </li>)}
          </ol>
        </div>
      </section>

      <WorkSketch/>

      <section className="about band" id="about" aria-labelledby="about-title">
        <p className="eyebrow about-eyebrow" id="about-title" data-reveal><span>03</span>ABOUT VIVI</p>
        <div className="about-aside">
          <div className="section-head" data-reveal>
            <p className="lede about-hello"><img src={sitePath('img/vivichen-700.webp')} alt="" loading="lazy" width="700" height="1051"/><span>Hi 我是 Vivi 陳盈臻，<br/>也有人叫我大師姐</span></p>
          </div>
          <div className={`work-history${historyOpen ? ' is-expanded' : ''}`}>
            <div className="history-heading"><h3>我的工作經歷</h3></div>
            <ol className="history-cards" id="work-history-list" aria-label="工作經歷，由現在至過往">
              {[...career].reverse().map((stop, index) => <li className={`history-slot${index === 0 ? ' is-first' : ''}`} key={stop.org} aria-hidden={index > 0 && !historyOpen} style={{ '--card-index': index, '--open-delay': `${Math.max(0, index - 1) * 120}ms`, '--close-delay': `${(career.length - 1 - index) * 70}ms` }}>
                <div className="history-clip"><div className="history-card">
                <div className="history-card-heading"><strong>{stop.org}</strong><span className={`history-tag${index === 0 ? ' is-current' : ''}`}>{stop.label}</span></div>
                <p>{stop.role}</p>
                </div></div>
              </li>)}
            </ol>
            <button className="history-toggle" type="button" aria-expanded={historyOpen} aria-controls="work-history-list" onClick={() => setHistoryOpen(open => !open)}><span className="history-toggle-label">{historyOpen ? '收合經歷' : '展開完整經歷'}</span><svg className="history-toggle-arrow" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d={historyOpen ? 'M8 13V3M3 8l5-5 5 5' : 'M8 3v10M3 8l5 5 5-5'} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          </div>
          <section className="certifications" aria-labelledby="certifications-title">
            <div className="history-heading"><h3 id="certifications-title">專業認證</h3></div>
            <ul className="certification-list">
              {credentials.map(item => <li key={item.name}>
                <span className={`certification-mark ${item.mod ? `certification-mark--${item.mod}` : ''}`}><img src={sitePath(item.src)} alt="" loading="lazy"/></span>
                <div><span>{item.issuer}</span><strong>{item.name}</strong></div>
              </li>)}
            </ul>
          </section>
        </div>
        <div className="about-body" data-reveal>
          <h3>從工作問題出發，<br/>讓 AI 真正為你所用。</h3>
          <p className="about-lead">我有 <mark className="hl">18 年媒體與廣告科技 B2B 業務經驗</mark>，服務過 <mark className="hl">450 家以上的企業與政府單位</mark>。從開發、提案、報價到長期客戶經營，每一段都親身跑過。</p>
          <p>雖然是文組背景、至今仍看不懂程式碼，卻靠著 AI 工具與實作，<mark className="hl">打造出上百個實用工具和系統</mark>，包括自動化報表、LINE BOT、Chrome 擴充功能、資料爬蟲，甚至也能做出完整的專案管理系統。</p>
          <p>作為非技術背景的 AI 實作者，我知道大家最容易卡在哪裡。我用聽得懂的比喻講清楚原理，從真實工作問題出題，<mark className="hl">陪你拆解需求、選對工具、當場做出成果</mark>，回到工作也能舉一反三。</p>
          <p>現在，我也陪企業從個人試用走向部門工作流：依照既有系統、預算與人員程度選擇工具，一起釐清資料分級、產出查核與 AI 導入的下一步。</p>
          <blockquote>工具會一直變，但我相信只要學會從工作問題和需求出發，你就能持續用 AI 解決問題、放大價值。</blockquote>
          <ul className="chips" aria-label="Vivi 的特色">
            <li>零程式背景</li><li>把技術概念翻譯成人話</li><li>你的 AI 科技麻瓜好朋友</li>
          </ul>
        </div>

      </section>

      <section className="offers band" id="offers" aria-labelledby="offers-title">
        <div className="section-head section-head--split" data-reveal>
          <div>
            <p className="eyebrow"><span>04</span>WAYS TO WORK TOGETHER</p>
            <h2 id="offers-title">你想怎麼開始？</h2>
          </div>
          <p className="lede">先選一個貼近你的情境，再看看適合的合作方式。</p>
        </div>
        <ServiceGuide/>

      </section>

      <TestimonialMarquee/>

      <section className="process band" id="process" aria-labelledby="process-title">
        <div className="section-head process-head" data-reveal>
          <p className="eyebrow"><span>06</span>THE PROCESS</p>
          <h2 id="process-title">從「我不會」<br/>走到「我做到了」</h2>
          <p className="lede">一步一步，<mark className="hl">做得到</mark>。每個階段都先確認方向，再往下走。</p>
        </div>
        <ol className="steps">
          {steps.map((step, index) => <li className="step" key={step.title}>
            <span className="step-no" aria-hidden="true"><span className="step-no-glyph">{String(index + 1).padStart(2, '0')}</span></span>
            <div><h3>{step.title}</h3><p>{step.body}</p></div>
          </li>)}
        </ol>
      </section>

      <section className="partners band" id="partners" aria-labelledby="partners-title">
        <div className="section-head section-head--split" data-reveal>
          <div>
            <p className="eyebrow"><span>07</span>TRAINING PARTNERS</p>
            <h2 id="partners-title">把改變帶進團隊</h2>
          </div>
          <p className="lede">也可以透過合作培訓機構，洽詢企業內訓</p>
        </div>
        <ul className="partner-list">
          {partners.map((partner, index) => {
            const inner = <>
              <span className="partner-no">{String(index + 1).padStart(2, '0')}</span>
              <span className="partner-name">{partner.name}</span>
              <span className="partner-role">{partner.role}</span>
              <span className="partner-body">{partner.body}</span>
              <span className="partner-action">{partner.href ? '前往講師頁' : '洽詢請填表'}</span>
            </>
            return <li key={partner.name} data-reveal style={{ '--d': `${index * 70}ms` }}>
              {partner.href
                ? <a className="partner" href={partner.href} target="_blank" rel="noopener">{inner}</a>
                : <a className="partner" href={FORM_URL} target="_blank" rel="noopener">{inner}</a>}
            </li>
          })}
        </ul>
      </section>

      <section className="connect" id="connect" aria-labelledby="connect-title">
        <div className="connect-inner" data-reveal>
          <p className="eyebrow eyebrow--light"><span>08</span>LET’S MAKE IT WORK.</p>
          <h2 id="connect-title">下一個可能<br/><span className="serif">從聊聊開始</span></h2>
          <p>如果你的團隊也卡在「知道 AI 重要，但不知道從哪開始」，<br/>先說說你的工作與想解決的問題，一起找到適合的起點。</p>
          <OriginButton className="connect-cta" href={FORM_URL}>填寫諮詢表單</OriginButton>
        </div>
        <nav className="connect-routes" aria-label="依需求選擇入口" data-reveal style={{ '--d': '120ms' }}>
          <p>不確定從哪開始？</p>
          <a href={FORM_URL} target="_blank" rel="noopener"><span>個人</span>一對一 AI 陪跑</a>
          <a href="#partners"><span>團隊</span>企業內訓與工作坊</a>
          <a href="#offers"><span>自學</span>公開課程</a>
        </nav>
        <div className="wordmark" aria-hidden="true">vivi<span>.</span></div>
      </section>
    </main>
    <div className="footer-wrap">
      <SiteFooter/>
      <button type="button" className="to-top" onClick={toTop}>回到頂端</button>
    </div>
  </div>
}
