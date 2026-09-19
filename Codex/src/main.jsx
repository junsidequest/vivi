import React, { useEffect, useState, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import WalkingLoader from './ui/WalkingLoader.jsx'
import './welcome.css'
// 介紹頁樣式隨入口載入，避免正式建置的條件式動態載入遺漏 CSS。
import './professional.css'
import './style.css'
import './ui/ui.css'
import './ui/pixel.css'

const view=new URLSearchParams(window.location.search).get('view')
document.title=view==='island'?'Vivi 的小島 · 來走走吧':view==='professional'?'Vivi Chen 陳盈臻｜AI 陪跑教練':'Vivi Chen｜選一種方式，認識我'
function Site(){
  const [Page,setPage]=useState(null),[contentReady,setContentReady]=useState(false),[modelReady,setModelReady]=useState(false),[finished,setFinished]=useState(false),[failed,setFailed]=useState(false),[progress,setProgress]=useState(0)
  const loaded=useCallback(()=>setContentReady(true),[])
  const advanced=useCallback(value=>setProgress(p=>Math.max(p,.15+value*.75)),[])
  useEffect(()=>{
    let cancelled=false
    const module=view==='island'?import('./App.jsx'):view==='professional'?import('./Professional.jsx'):import('./Welcome.jsx')
    module.then(result=>{
      if(cancelled)return
      setPage(()=>result.default);setProgress(p=>Math.max(p,.15))
      if(view!=='island'){setContentReady(true);setProgress(.85)}
    }).catch(()=>{if(!cancelled)setFailed(true)})
    return ()=>{cancelled=true}
  },[])
  useEffect(()=>{
    if(!contentReady||!modelReady)return
    setProgress(1)
    const timer=setTimeout(()=>setFinished(true),matchMedia('(prefers-reduced-motion: reduce)').matches?0:1450)
    return ()=>clearTimeout(timer)
  },[contentReady,modelReady])
  return <>
    {Page&&<div className="site-page" inert={!finished}><Page externalLoading pageVisible={finished} onLoadReady={loaded} onLoadProgress={advanced}/></div>}
    {!finished&&<WalkingLoader theme={view==='professional'?'professional':'island'} progress={progress} error={failed} label={view==='island'?'小島正在準備中':'頁面載入中'} onModelReady={()=>setModelReady(true)}/>}
  </>
}
createRoot(document.getElementById('root')).render(<Site/> )
