import tickerOutlines from './content/ticker-outlines.json'
import { sitePath } from './routes.js'
import { useEffect, useRef, useState, useId } from 'react'
import TestimonialMarquee from './components/ui/marquee-01.jsx'
import WorkSketch from './components/WorkSketch.jsx'
import ClientLogos from './components/ClientLogos.jsx'
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
  { value: 95, suffix: '%+', label: '講座與課程滿意度' },
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
  { src: 'img/credentials/aws-ai-practitioner-cutout.png', alt: 'AWS Certified AI Practitioner', issuer: 'AWS', name: 'Certified AI Practitioner' },
]

const courses = {
  online: [
    { category: 'efficiency', format: '線上課程', lead: '天下學習', title: '零基礎打造專屬 AI 助理：用 Apps Script 提升職場效率', href: 'https://www.cwlearning.com.tw/courses/84e77516-cf9e-44ab-82d0-1bfbe1c9307b' },
    { category: 'knowledge', format: '線上課程', lead: '天下學習', title: 'Notion 實戰入門：打造筆記系統到任務管理的數位整理術', href: 'https://www.cwlearning.com.tw/courses/5503463d-0610-4bec-a22d-b00a10717e0e' },
    { category: 'efficiency', format: '線上課程', lead: '天下學習', title: '打造 AI 加速器，解決 90% 經營難題｜頭家必學 AI 工具，今天學會明天翻倍', href: 'https://www.cwlearning.com.tw/courses/f5d1a6c9-92d5-4adb-a7dd-74942dba8804' },
    { category: 'tools', format: '線上課程', lead: '2025 Generative 生成式 AI 年會講座回放', title: '用 AI，解鎖我的跨域新篇章', href: 'https://live.gaiconf.com/courses/gaiconf2025' },
    { category: 'tools', format: '線上課程', lead: 'Generative AI 社群', title: '上班族 AI 寫程式自動化', href: 'https://live.gaiconf.com/courses/14' },
    { category: 'efficiency', format: '線上課程', lead: '中小企業網路大學校', title: 'AI ✕ 工作流程優化 是放大問題，還是解決問題？', href: 'https://www.smelearning.org.tw/class.php?course=18374' },
    { category: 'knowledge', format: '線上課程', lead: '五倍學院', title: '用工具打造 AI 簡報工作流', href: 'https://5xcampus.com/courses/ai-slide-flow?gad_source=1&gad_campaignid=23090853254&gbraid=0AAAAADCYj6pqQX8xvkV0Oc8INQt5fH0QI&gclid=CjwKCAiAkvDMBhBMEiwAnUA9BZS8-AsJlEQ0LSISQKumr2-c5Zn-nbozCpMdZBHUyuLvuZdnct8vkRoCwtEQAvD_BwE' },
  ],
  offline: [
    { category: 'efficiency', format: '實體課程', lead: 'AI 自動化入門：打造高效省時工作模式', title: '超過八個梯次已完課，實體課程累計超過千位學員' },
    { category: 'tools', format: '實體課程', lead: '燒賣研究所', title: 'FDE AI 架構師實戰學程：打造第一個企業 AI 自動化流程（62H+）', href: 'https://www.shumai.com.tw/ai_product' },
    { category: 'tools', format: '實體課程', lead: 'Claude 入門 － 打造 AI 工作流', title: '2026 首度招生即額滿，目前已開兩個梯次' },
  ],
}

const steps = [
  { title: '現況盤點', body: '了解工作使用習慣與場景，辨識導入和使用 AI 卡關的地方' },
  { title: '目標確認', body: '確認導入 AI 真正想解決的問題，一起訂出具體、可衡量的目標' },
  { title: '深層需求挖掘', body: '不只問你們想要什麼，也協助釐清為什麼要做，找出最值得導入的環節' },
  { title: '客製化方案', body: '依照團隊的程度與情境，設計專屬課程和導入計畫' },
  { title: '手把手教學', body: '用每個人都懂的方式解釋複雜概念，帶你和你的團隊用 AI 跨出第一步' },
]

const partners = [
  { name: 'Oceanic Innovation', role: 'AI 產品導入', body: '包含 AI Operating System、多渠道 AI 客服、LINE 群組裡的 AI 同事、會議記錄與公司大腦、AI Code Review', href: 'https://www.oceaninnov.com/', action: '產品導入洽詢' },
  { name: '天下學習中心', role: '全台最大企業內訓平台', body: '課程講師', href: 'https://www.cwlearning.com.tw/@cf1ae297-46ef-4bad-abfd-032c81dbaa9b' },
  { name: '言果學習', role: '企業內訓平台', body: '合作講師，為企業團隊設計生成式 AI 導入與實作課程', href: 'https://yanguo.com.tw/teacher/yingzhen-chen' },
  { name: '智谷網絡', role: '企業培訓機構', body: '擔任特約講師，把 AI 應用與自動化課程帶進企業內訓現場', href: 'https://www.kvalley.biz/team-member/%E9%99%B3%E7%9B%88%E8%87%BBvivi/' },
]


const marqueeWords = ['把技術翻譯成人話', '把想法做成日常', 'Human first', '從真實工作出發']

// 逐行遮罩進場；文字仍保留在同一個標題節點，讀屏器照常朗讀。
const Line = ({ children, i = 0 }) => <span className="line" style={{ '--i': i }}><span>{children}</span></span>

function OutlineTicker({ text }) {
  const clipId = useId()
  const glyph = tickerOutlines[text]
  return <svg className="ticker-outline" viewBox={`0 0 ${glyph.width} 76.8`} style={{width:`${glyph.width / 64}em`}} aria-hidden="true">
    <defs><clipPath id={clipId}><path d={glyph.path}/></clipPath></defs>
    <path d={glyph.path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" clipPath={`url(#${clipId})`}/>
  </svg>
}

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
  const [tab, setTab] = useState('efficiency')
  const tabs = [['efficiency', '工作效率'], ['knowledge', '知識管理 / 內容產出'], ['tools', '打造工具']]
  const matchingCourses = [...courses.online, ...courses.offline].filter(course => course.category === tab)
  const key = (event, index) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
    setTab(tabs[next][0])
    event.currentTarget.parentElement.children[next].focus()
  }
  return <>
    <div className="course-tabs course-topic-tabs" role="tablist" aria-label="公開課程主題">
      {tabs.map(([id, label], index) => <button key={id} id={`course-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls="course-panel" tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)} onKeyDown={event => key(event, index)}>{label}</button>)}
    </div>
    <ul id="course-panel" className="course-list" role="tabpanel" aria-labelledby={`course-tab-${tab}`} key={tab}>
      {matchingCourses.map(course => <li key={course.title}>
        <span>{course.lead} · {course.format}</span>
        {course.href ? <a href={course.href} target="_blank" rel="noopener"><span className="course-link-label">{course.title}</span></a> : <strong>{course.title}</strong>}
      </li>)}
    </ul>
  </>
}


function TeamServiceTabs() {
  const [tab, setTab] = useState('training')
  const tabs = [['training', '企業內訓 / 客製化工作坊'], ['consulting', '企業級 AI Agent 導入']]
  const onKey = (event, index) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index
    setTab(tabs[next][0])
    event.currentTarget.parentElement.children[next].focus()
  }
  return <>
    <div className="course-tabs team-service-tabs" role="tablist" aria-label="企業合作類型">
      {tabs.map(([id, label], index) => <button key={id} id={`team-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`team-panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)} onKeyDown={event => onKey(event, index)}>{label}</button>)}
    </div>
    <div id="team-panel-training" role="tabpanel" aria-labelledby="team-tab-training" hidden={tab !== 'training'} tabIndex={0}>
      <ul className="service-scope"><li><strong>評估工具與導入方向</strong><p>依 Google／Microsoft 生態系、預算與人員程度，選擇合適的 AI 平台組合</p></li><li><strong>用部門真實情境實作</strong><p>為行政、行銷、業務等職能建立專屬 Skill 與工作流</p></li><li><strong>建立可延伸的使用規範</strong><p>釐清資料敏感度、機敏資訊分級與 AI 產出查核方式</p></li></ul><OriginButton className="offer-cta" href="#partners">企業內訓洽詢</OriginButton>
    </div>
    <div id="team-panel-consulting" role="tabpanel" aria-labelledby="team-tab-consulting" hidden={tab !== 'consulting'} tabIndex={0}>
      <p className="service-consulting-intro">適合正在評估導入企業版 AI 的企業</p>
                <ul className="service-scope service-products">
                  <li><strong>AI Operating System</strong></li>
                  <li><strong>多渠道 AI 客服</strong></li>
                  <li><strong>LINE 群組裡的 AI 同事</strong></li>
                  <li><strong>會議記錄與公司大腦</strong></li>
                  <li><strong>AI Code Review</strong></li>
                </ul>
                <OriginButton className="offer-cta" href="https://www.oceaninnov.com/">產品導入洽詢</OriginButton>
                <p className="service-footnote">前往 Oceanic Innovation 查看更多細節</p>
    </div>
  </>
}

const servicePaths = [
  { id: 'learn', title: '自己學', type: '公開課程', hint: '想先掌握方法，照自己的步調練習' },
  { id: 'coach', title: '一起做', type: '陪跑教練', hint: '有想解決的問題，希望有人陪我完成' },
  { id: 'team', title: '帶團隊', type: '企業 AI 導入', hint: '讓同事一起學會，用進實際工作流程' },
]

function ServiceGuide({ selected, setSelected, courseNotice }) {
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
            <div className="service-story"><span className="service-caption">從一堂課開始</span><h3>學會方法<br/>帶回自己的工作</h3><p>從 AI 素養、工作流與自動化<br/>到 AI 簡報與 Vibe Coding<br/>透過實作理解方法，再用到熟悉的工作情境</p><p className="service-proof">線上課程逾萬人學習・實體授課逾千人</p></div>
            <div className="service-details"><CourseTabs/><div id="course-line-notice" className={`course-line-notice${courseNotice ? " is-noticed" : ""}`}><span className="course-notice-tag">不錯過下一堂課</span><OriginButton className="offer-cta course-line-cta" href="https://line.me/R/ti/p/@026adbfw">LINE 獲取開課資訊</OriginButton></div><p className="service-footnote">開課時間與報名資訊，以各課程平台公告為準</p></div>
          </> : path.id === 'coach' ? <>
            <div className="service-story"><span className="service-caption">帶著一個真實問題來</span><h3>你的工作難題<br/>我們一起拆解</h3><p>適合已經有具體需求，希望有人一起釐清方向、選擇工具，逐步做出可用成果的工作者、經理人與企業主</p><p className="service-proof">已陪跑超過 30 位高階經理人與企業主</p></div>
            <div className="service-details"><h4>一對一 AI 陪跑</h4><ul className="service-scope"><li><strong>先看工作怎麼做</strong><p>從你的資料、步驟與卡關點開始，找到值得改善的環節</p></li><li><strong>一起做出能用的工具</strong><p>報表整理、會議紀錄、提案與報價，或自己的知識庫</p></li><li><strong>留下能持續用的方法</strong><p>陪你理解、調整與驗證，讓成果融入日常工作</p></li></ul><OriginButton className="offer-cta" href={FORM_URL}>填寫諮詢表單</OriginButton></div>
          </> : <>
            <div className="service-story"><span className="service-caption">從個人使用走向團隊應用</span><h3>讓 AI 成為<br/>團隊的工作方法</h3><p>適合正在啟動 AI 導入，或希望把零散試用轉成共同流程的企業<br/>依團隊程度與既有系統，規劃內訓、實作工作坊與導入陪跑</p><p className="service-proof">企業內訓與講座超過 50 場</p></div>
            <div className="service-details"><TeamServiceTabs/></div>
          </>}
        </div>)}
      </div>
    </div>
  </div>
}

export default function Professional() {
  const [selectedService, setSelectedService] = useState('learn')
  const [noticeRequest, setNoticeRequest] = useState(0)
  const [courseNotice, setCourseNotice] = useState(false)
  useEffect(() => {
    if (!noticeRequest) return
    setCourseNotice(false)
    let frame = 0, clearTimer
    const scrollTimer = setTimeout(() => {
      const button = page.current?.querySelector('.course-line-cta')
      if (!button) return
      button.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
      let lastTop = button.getBoundingClientRect().top
      let settledSince = performance.now()
      const started = settledSince
      const waitForArrival = now => {
        const rect = button.getBoundingClientRect()
        if (Math.abs(rect.top - lastTop) > .25) settledSince = now
        lastTop = rect.top
        const visible = rect.top >= 80 && rect.bottom <= innerHeight
        if (visible && now - settledSince >= 300) {
          button.focus({ preventScroll: true })
          setCourseNotice(true)
          clearTimer = setTimeout(() => setCourseNotice(false), 5500)
          return
        }
        if (now - started < 10000) frame = requestAnimationFrame(waitForArrival)
      }
      frame = requestAnimationFrame(waitForArrival)
    }, 350)
    return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); cancelAnimationFrame(frame) }
  }, [noticeRequest])
  useEffect(() => {
    if (!courseNotice) return
    const restore = event => {
      if (event.pointerType !== 'mouse') return
      setCourseNotice(false)
      const button = page.current?.querySelector('.course-line-cta')
      if (document.activeElement === button) button.blur()
    }
    window.addEventListener('pointermove', restore, { passive: true })
    return () => window.removeEventListener('pointermove', restore)
  }, [courseNotice])
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

  return <div className="professional" data-palette="rose" ref={page}>
    <a className="pro-skip" href="#main">跳至主要內容</a>
    <div className="scroll-progress" aria-hidden="true"/>
    <header className="pro-header">
      <a className="pro-brand" href={sitePath('')} aria-label="Vivi Chen 首頁">vivi<span className="brand-dot">.</span><span className="brand-caption">陳盈臻<br/>AI WORK & LIFE</span></a>
      <NavigationMenu onCourseNotice={() => { setSelectedService('learn'); setNoticeRequest(value => value + 1) }}/>
    </header>

    <main id="main">
      <section className="hero" aria-labelledby="pro-title">
        <div className="hero-copy">
          <p className="hero-kicker"><span className="dot" aria-hidden="true"/>AI 應用顧問 × 企業內訓 × 實作陪跑</p>
          <h1 id="pro-title" className="hero-title">
            <Line i={0}>把 <em className="latin">AI</em> 用進</Line>
            <Line i={1}>每天的<span className="work-word">工作<svg viewBox="0 0 320 160" fill="none" aria-hidden="true" preserveAspectRatio="none"><path pathLength="1" d="M292 34C237-4 77 4 24 49C-39 105 73 159 219 137C320 122 355 60 285 28C242 9 172 12 134 20"/></svg></span>中</Line>
          </h1>
          <p className="hero-intro">不用先變成科技高手<br/><mark className="hl">從你熟悉的工作出發</mark>，一起讓 AI 真正派上用場</p>
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
            <strong><Counter value={stat.value}/>{stat.suffix === '%+' ? <><span className="stat-percent">%</span><sup>+</sup></> : <sup>{stat.suffix}</sup>}</strong>
            <span>{stat.label}</span>
          </li>)}
        </ul>
      </section>


      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map(copy => <div className="ticker-group" key={copy}>
            {marqueeWords.map(word => <span key={word}><b className="ticker-word">{tickerOutlines[word] ? <OutlineTicker text={word}/> : word}</b><i/></span>)}
          </div>)}
        </div>
      </div>

      <section className="translate band" id="translate" aria-labelledby="translate-title">
        <div className="translator" style={{ '--n': glossary.length }}>
          <div className="translator-stage">
        <div className="section-head translator-heading">
          <p className="eyebrow"><span>01</span>LOST IN TRANSLATION</p>
          <h2 id="translate-title">AI 的術語<br/>我幫你<span className="serif">翻成人話</span></h2>
          <p className="lede">工具名詞聽起來很難，但背後要解決的，<mark className="hl">都是你每天在處理的事</mark></p>
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
        <p className="eyebrow about-eyebrow" id="about-title"><span>03</span>ABOUT VIVI</p>
        <div className="about-aside">
          <div className="about-introduction">
          <div className="section-head">
            <p className="lede about-hello"><img src={sitePath('img/vivichen-700.webp')} alt="" loading="lazy" width="700" height="1051"/><span>Hi 我是 Vivi 陳盈臻<br/>也有人叫我大師姐</span></p>
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
          <h3>從工作問題出發<br/>讓 AI 真正為你所用</h3>
          <p className="about-lead">我有 <mark className="hl">18 年媒體與廣告科技 B2B 業務經驗</mark>，服務過 <mark className="hl">450 家以上的企業與政府單位</mark>。從開發、提案、報價到長期客戶經營，每一段都親身跑過。</p>
          <p>雖然是文組背景、至今仍看不懂程式碼，卻靠著 AI 工具與實作，<mark className="hl">打造出上百個實用工具</mark>，甚至也能做出完整的專案管理系統。</p>
          <p>作為非技術背景的 AI 實作者，我知道大家最容易卡在哪裡。我用聽得懂的比喻講清楚原理，從真實工作問題出題，<mark className="hl">陪你拆解需求、選對工具、當場做出成果</mark>，回到工作也能舉一反三。</p>
          <p>現在，我也陪企業從個人試用走向部門工作流：依照既有系統、預算與人員程度選擇工具，一起釐清資料分級、產出查核與 AI 導入的下一步。</p>
          <blockquote>比學會一個工具更重要的，<br/>是學會如何在變化中找到可用的答案</blockquote>
          <ul className="chips" aria-label="Vivi 的特色">
            <li>零程式背景</li><li>把技術概念翻譯成人話</li><li>你的 AI 科技麻瓜好朋友</li>
          </ul>
        </div>

      </section>

      <section className="offers band" id="offers" aria-labelledby="offers-title">
        <div className="section-head section-head--split">
          <div>
            <p className="eyebrow"><span>04</span>WAYS TO WORK TOGETHER</p>
            <h2 id="offers-title">你想怎麼開始？</h2>
          </div>
          <p className="lede">先選一個貼近你的情境，再看看適合的合作方式</p>
        </div>
        <ServiceGuide selected={selectedService} setSelected={setSelectedService} courseNotice={courseNotice}/>

      </section>

      <TestimonialMarquee/>

      <section className="process band" id="process" aria-labelledby="process-title">
        <div className="section-head process-head">
          <p className="eyebrow"><span>06</span>THE PROCESS</p>
          <h2 id="process-title">合作流程</h2>
          <p className="lede">每個階段都先確認方向，再往下走</p>
        </div>
        <ol className="steps">
          {steps.map((step, index) => <li className="step" key={step.title}>
            <span className="step-no" aria-hidden="true"><span className="step-no-glyph">{String(index + 1).padStart(2, '0')}</span></span>
            <div><h3>{step.title}</h3><p>{step.body}</p></div>
          </li>)}
        </ol>
      </section>

      <section className="partners band" id="partners" aria-labelledby="partners-title">
        <div className="section-head section-head--split">
          <div>
            <p className="eyebrow"><span>07</span>TRAINING PARTNERS</p>
            <h2 id="partners-title">把改變帶進團隊</h2>
          </div>
        </div>
        <ClientLogos/>
        <div className="translator-next partners-intro"><span className="translator-next-rule" aria-hidden="true"/><span className="translator-next-title">歡迎透過合作培訓機構，洽詢企業內訓</span></div>
        <ul className="partner-list">
          {partners.map((partner, index) => {
            const inner = <>
              <span className="partner-no">{String(index + 1).padStart(2, '0')}</span>
              <span className="partner-name">{partner.name}</span>
              <span className="partner-role">{partner.role}</span>
              <span className="partner-body">{partner.body}</span>
              <span className="partner-action">{partner.action || (partner.href ? '前往講師頁' : '洽詢請填表')}</span>
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
        <div className="connect-inner">
          <p className="eyebrow eyebrow--light"><span>08</span>LET’S MAKE IT WORK.</p>
          <h2 id="connect-title">下一個可能<br/><span className="serif">從聊聊開始</span></h2>
          <p>如果你的團隊也卡在「知道 AI 重要，但不知道從哪開始」，<br/>先說說你的工作與想解決的問題，一起找到適合的起點。</p>
          <div className="connect-actions">
            <div className="connect-email">
              <OriginButton className="connect-cta" aria-describedby="email-guidance" href="mailto:hi@vivichen.ai">Email 聯繫</OriginButton>
              <p className="connect-email-guidance" id="email-guidance">來信請附：單位名稱、聯絡人與職稱、預計參與人數、想解決的問題或主題、希望的時間</p>
            </div>
            <OriginButton className="connect-cta" href="https://line.me/R/ti/p/@026adbfw">LINE 獲取開課資訊</OriginButton>
          </div>
        </div>
        <nav className="connect-routes" aria-label="依需求選擇入口" data-reveal style={{ '--d': '120ms' }}>
          <p>不確定從哪開始？</p>
          <a href="#offers" onClick={() => setSelectedService('learn')}><span>自學</span>公開課程</a>
          <a href="#offers" onClick={() => setSelectedService('coach')}><span>個人</span>一對一 AI 陪跑</a>
          <a href="#partners"><span>團隊</span>企業內訓與工作坊</a>
        </nav>
        <div className="wordmark-row">
          <div className="wordmark" aria-hidden="true">vivi<span>.</span></div>
          <div className="wordmark-actions">
            <OriginButton className="back-to-island" href={sitePath('island/')}>回到小島</OriginButton>
            <button type="button" className="to-top" onClick={toTop} aria-label="回到頂端" title="回到頂端"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20V4m-7 7 7-7 7 7"/></svg></button>
          </div>
        </div>
      </section>
    </main>
    <div className="footer-wrap">
      <SiteFooter/>
    </div>
  </div>
}
