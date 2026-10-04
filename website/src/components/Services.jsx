import { useState } from 'react'
import './services.css'

const consultationUrl = 'https://forms.gle/qDyknssNkfJDAto8A'
const courseGroups = [
  { id: 'online', label: '線上學習', courses: [
    { organizer: 'Generative 生成式 AI 年會', title: '《用 AI，解鎖我的跨域新篇章》', detail: '2025 年會講座回放', href: 'https://live.gaiconf.com/courses/gaiconf2025' },
    { organizer: 'Generative AI 社群', title: '上班族 AI 寫程式自動化', detail: '線上課程', href: 'https://live.gaiconf.com/courses/14' },
    { organizer: '中小企業網路大學校', title: '《AI ✕ 工作流程優化 是放大問題，還是解決問題？》', detail: '線上課程', href: 'https://www.smelearning.org.tw/class.php?course=18374' },
    { organizer: '五倍學院', title: '《用工具打造 AI 簡報工作流》', detail: '線上課程', href: 'https://5xcampus.com/courses/ai-slide-flow?gad_source=1&gad_campaignid=23090853254&gbraid=0AAAAADCYj6pqQX8xvkV0Oc8INQt5fH0QI&gclid=CjwKCAiAkvDMBhBMEiwAnUA9BZS8-AsJlEQ0LSISQKumr2-c5Zn-nbozCpMdZBHUyuLvuZdnct8vkRoCwtEQAvD_BwE' },
  ] },
  { id: 'in-person', label: '實體課程', courses: [
    { title: 'AI 自動化入門：打造高效省時工作模式', detail: '超過八個梯次已完課，實體課程累計超過千位學員' },
    { organizer: '燒賣研究所', title: '《FDE AI 架構師實戰學程：打造第一個企業 AI 自動化流程（62H+）》', detail: '課程資訊', href: 'https://www.shumai.com.tw/ai_product' },
    { title: 'Claude 入門 － 打造 AI 工作流', detail: '2026 首度招生即額滿，目前已開兩個梯次' },
  ] },
]

export default function Services() {
  const [active, setActive] = useState(0)
  const changeTab = (event, index) => {
    let next
    if (event.key === 'ArrowRight') next = (index + 1) % courseGroups.length
    else if (event.key === 'ArrowLeft') next = (index + courseGroups.length - 1) % courseGroups.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = courseGroups.length - 1
    else return
    event.preventDefault()
    setActive(next)
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus()
  }
  return <section id="offers" className="v2-sec service-editorial" aria-labelledby="svc-title">
    <div className="svc-heading">
      <p className="svc-eyebrow">一起工作的方式</p>
      <h2 id="svc-title">從你的需要，<br/>開始一場合作。</h2>
      <p className="svc-intro">帶著團隊一起學，或專注解決自己的工作問題。找到適合你的方式，讓想法一步步成為日常。</p>
    </div>
    <div className="svc-options">
      <article className="svc-option svc-option-team">
        <p className="svc-category">給團隊的共同起點</p>
        <h3>企業內訓<br/>與實作工作坊</h3>
        <dl className="svc-details">
          <div><dt>適合誰</dt><dd>準備導入 AI，希望帶著行政、行銷或業務團隊一起上手的企業。</dd></div>
          <div><dt>一起做什麼</dt><dd>從團隊的工作痛點出發，設計課程與實作內容，找出能用 AI 改善的流程。</dd></div>
        </dl>
        <a className="svc-cta" href={consultationUrl} target="_blank" rel="noopener noreferrer">洽詢企業內訓<span className="svc-sr-only">（另開視窗）</span></a>
      </article>
      <article className="svc-option svc-option-personal">
        <p className="svc-category">留給你的專屬練習</p>
        <h3>一對一<br/>AI 陪跑教練</h3>
        <dl className="svc-details">
          <div><dt>適合誰</dt><dd>有具體的工作問題，希望有人陪你釐清需求、選擇工具並動手實作的人。</dd></div>
          <div><dt>一起做什麼</dt><dd>拆解你的工作情境，探索合適的 AI 應用，把想解決的問題變成可以開始的步驟。</dd></div>
        </dl>
        <a className="svc-cta" href={consultationUrl} target="_blank" rel="noopener noreferrer">聊聊我的需求<span className="svc-sr-only">（另開視窗）</span></a>
      </article>
    </div>
    <div className="svc-courses">
      <div className="svc-course-heading"><div><p className="svc-eyebrow">按自己的步調學習</p><h3>公開課程</h3></div><p>從一個主題開始，<br/>把新方法帶回工作裡。</p></div>
      <div className="svc-tabs" role="tablist" aria-label="公開課程類型">
        {courseGroups.map((group, index) => <button key={group.id} type="button" id={`svc-tab-${group.id}`} role="tab" aria-selected={active === index} aria-controls={`svc-panel-${group.id}`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => changeTab(event, index)}>{group.label}</button>)}
      </div>
      {courseGroups.map((group, index) => <div key={group.id} id={`svc-panel-${group.id}`} className="svc-panel" role="tabpanel" aria-labelledby={`svc-tab-${group.id}`} tabIndex={0} hidden={active !== index}>
        {group.id === 'in-person' && <p className="svc-course-note">既有開課紀錄，最新資訊請向主辦單位確認。</p>}
        <ul className="svc-course-list">{group.courses.map(course => <li key={course.title}>
          <div className="svc-course-copy">{course.organizer && <p className="svc-organizer">{course.organizer}</p>}<h4>{course.title}</h4><p className="svc-course-detail">{course.detail}</p></div>
          {course.href && <a className="svc-course-link" href={course.href} target="_blank" rel="noopener noreferrer" aria-label={`查看課程：${course.title}（另開視窗）`}>查看課程</a>}
        </li>)}</ul>
      </div>)}
    </div>
  </section>
}
