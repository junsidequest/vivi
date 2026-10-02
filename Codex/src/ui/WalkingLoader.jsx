import { isMobilePresentation } from '../mobile.js'
import { useEffect, useRef, useState } from 'react'
import './walking-loader.css'

export default function WalkingLoader({progress=null,error=false,theme='island'}){
  const [mobile]=useState(isMobilePresentation)
  const showIslandMessage=theme==='island'&&!error
  const [completionAllowed,setCompletionAllowed]=useState(false)
  const startedAt=useRef(performance.now())
  const assetsReady=progress!==null&&progress>=1
  const complete=assetsReady&&completionAllowed

  useEffect(()=>{
    if(!assetsReady){setCompletionAllowed(false);return}
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){setCompletionAllowed(true);return}
    // 與 CSS 節拍同步：進場立即旋轉，每 950ms 轉一次，轉動本身為 550ms。
    // 載入若在轉動途中完成，只等到該次 90 度轉完；停頓期間則可直接退場。
    const elapsed=performance.now()-startedAt.current
    const arrive=0,quarter=950,turn=550
    let delay=0
    if(elapsed<arrive+turn)delay=arrive+turn-elapsed
    else{
      const phase=(elapsed-arrive)%quarter
      if(phase<turn)delay=turn-phase
    }
    const timer=setTimeout(()=>setCompletionAllowed(true),Math.max(0,delay))
    return()=>clearTimeout(timer)
  },[assetsReady])


  return <div
    className={`walking-loader walking-loader--${theme} ${mobile?'walking-loader--mobile':''} ${complete?'is-complete':''} ${error?'has-error':''}`}
    role={error?'alert':'status'}
    aria-live="polite"
    aria-label={error?'頁面暫時沒有載入成功':showIslandMessage?'正在前往小島':'頁面正在載入'}
  >
    <span className="walking-loader-shape" aria-hidden="true"/>
    {showIslandMessage&&!error&&<p className="walking-loader-message">正在前往小島</p>}
    {error&&<div className="walking-loader-error"><p>頁面暫時沒有載入成功</p><button onClick={()=>location.reload()}>重新載入</button></div>}
  </div>
}
