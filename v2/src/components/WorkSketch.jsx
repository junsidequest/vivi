import { useState } from 'react'

const scenarios = [
  {label:'行政', problem:'每週都在複製貼上，\n報表還是做不完。', source:'散落的資料與表格', steps:['先統一資料欄位','讓 AI 協助整理與分類','把固定步驟串成工作流'], result:'把時間留給判斷，\n讓重複工作有方法。', example:'例如：整理表單資料，產出固定格式的每週摘要。'},
  {label:'行銷', problem:'工具收藏了一堆，\n內容還是從零開始。', source:'想法、素材與品牌語氣', steps:['釐清受眾與溝通目標','整理品牌素材與範例','建立可重複使用的內容流程'], result:'從空白頁，\n走到有方向的初稿。', example:'例如：把一篇長文整理成不同平台的貼文初稿，再由你審閱。'},
  {label:'業務', problem:'客戶資料很多，\n跟進卻總是慢一步。', source:'會議紀錄與客戶需求', steps:['定義需要保留的客戶資訊','把紀錄整理成重點與待辦','設計後續追蹤與提醒流程'], result:'把零散對話，\n變成下一步行動。', example:'例如：把會議筆記整理成需求清單、待辦事項與回覆草稿。'},
]
function ScenarioIllustration({ index }) {
 const drawings = [
  <g key="reports">
   {[{x:8,y:8,angle:-9,opacity:.45},{x:41,y:7,angle:7,opacity:.65},{x:70,y:22,angle:10,opacity:.8},{x:35,y:27,angle:-3,opacity:1}].map((sheet,i)=><g key={i} transform={`translate(${sheet.x} ${sheet.y}) rotate(${sheet.angle} 23 21)`} opacity={sheet.opacity}>
    <rect width="46" height="42" rx="3" fill="var(--ink-2)"/>
    <path d="M6 8h34v28H6Z"/>
    <path d="M6 15h34M6 22h34M6 29h34M17 8v28M29 8v28" strokeWidth="1"/>
    <path d="M6 8h34v7H6Z" fill="currentColor" fillOpacity=".15" stroke="none"/>
   </g>)}
  </g>,
  <g key="content"><rect x="18" y="14" width="40" height="46" rx="4" opacity=".4"/><path d="M27 26h22M27 34h16M27 42h20" opacity=".4"/><rect x="70" y="22" width="40" height="38" rx="4"/><path d="m79 48 7-9 7 6 7-10M79 31h9M60 12l4-6m5 9 7-2"/></g>,
  <g key="clients"><path d="M18 16h49a5 5 0 0 1 5 5v21a5 5 0 0 1-5 5H39L27 57V47h-9a5 5 0 0 1-5-5V21a5 5 0 0 1 5-5Z" opacity=".5"/><path d="M25 28h32M25 36h21" opacity=".5"/><rect x="81" y="28" width="32" height="34" rx="4"/><path d="m88 40 3 3 5-6m-8 15 3 3 5-6M101 41h5m-5 11h5"/></g>,
 ]
 return <svg className="sketch-illustration" viewBox="0 0 128 76" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{drawings[index]}</svg>
}

export default function WorkSketch(){
 const [active,setActive]=useState(0)
 const item=scenarios[active]
 const changeWithKey=(e,index)=>{
  let next=index
  if(e.key==='ArrowRight')next=(index+1)%scenarios.length
  else if(e.key==='ArrowLeft')next=(index+scenarios.length-1)%scenarios.length
  else if(e.key==='Home')next=0
  else if(e.key==='End')next=scenarios.length-1
  else return
  e.preventDefault();setActive(next);e.currentTarget.parentElement.children[next].focus()
 }
 return <section className="work-sketch" id="work" aria-labelledby="work-title">
  <div className="sketch-heading" data-reveal><p className="eyebrow eyebrow--light"><span>02</span>START HERE</p><h2 id="work-title">你卡住的地方<br/>就是我們的起點</h2><p>不必先搞懂所有工具<br/>選一個熟悉的情境，看看第一步可以怎麼走</p></div>
  <div className="sketch-board">
   <div className="sketch-tabs" role="tablist" aria-label="選擇工作情境">{scenarios.map((s,i)=><button key={s.label} id={`scenario-${i}`} role="tab" aria-selected={i===active} aria-controls="scenario-panel" tabIndex={i===active?0:-1} onClick={()=>setActive(i)} onKeyDown={e=>changeWithKey(e,i)}>{s.label}</button>)}</div>
   <div id="scenario-panel" role="tabpanel" aria-labelledby={`scenario-${active}`} tabIndex={0}>
    <div className="sketch-change" key={active}>
     <div className="sketch-problem"><span className="sketch-label">現在的工作</span><ScenarioIllustration index={active}/><h3>{item.problem}</h3><span className="sketch-source">{item.source}</span></div>
     <div className="sketch-solution"><span className="sketch-label">一起拆解之後</span><ol>{item.steps.map(step=><li key={step}>{step}</li>)}</ol><p className="sketch-result"><mark className="hl is-in">{item.result}</mark></p></div>
    </div>
   </div>
  </div>
  <div className="sketch-bottom"><div className="translator-next"><span className="translator-next-rule" aria-hidden="true"/><span className="translator-next-title">找到適合你的合作方式</span></div></div>
 </section>
}
