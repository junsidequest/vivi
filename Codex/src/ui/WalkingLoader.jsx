import { isMobilePresentation } from '../mobile.js'
import { useEffect, useRef, useState } from 'react'
import './walking-loader.css'

function useAnimatedProgress(target,reducedMotion){
  const initial=target??0
  const [value,setValue]=useState(initial),valueRef=useRef(initial)
  useEffect(()=>{
    if(target===null)return
    const end=Math.max(0,Math.min(1,target))
    if(reducedMotion||end<=valueRef.current){
      valueRef.current=end;setValue(end);return
    }
    const start=valueRef.current,distance=end-start
    // 依剩餘距離決定時間，維持等速前進，避免數字前段暴衝、尾端停滯。
    const duration=end===1
      ?Math.min(1000,Math.max(350,distance*1150))
      :Math.min(900,Math.max(220,distance*1050))
    let frame,startTime
    const tick=now=>{
      startTime??=now
      const elapsed=Math.min(1,(now-startTime)/duration)
      const next=start+distance*elapsed
      valueRef.current=next;setValue(next)
      if(elapsed<1)frame=requestAnimationFrame(tick)
      else{valueRef.current=end;setValue(end)}
    }
    frame=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(frame)
  },[target,reducedMotion])
  return value
}

export default function WalkingLoader({progress=null,error=false,theme='island'}){
  const [mobile]=useState(isMobilePresentation)
  const [reducedMotion]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)
  const animatedProgress=useAnimatedProgress(progress,reducedMotion)
  const percent=progress===null?null:Math.round(animatedProgress*100)
  return <div className={`walking-loader ${mobile?'walking-loader--mobile':''} ${theme==='professional'?'walking-loader--professional':''} ${percent===null?'is-indeterminate':''} ${error?'has-error':''} ${percent===100?'is-complete':''}`}>
    <div className="walking-loader-content">
      <div className="walking-loader-stage">
        <div className="walking-loader-route" style={{'--progress':`${percent===null?0:animatedProgress*100}%`}}>
          <div className="walking-loader-track" role="progressbar" aria-label="頁面載入進度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent??undefined} aria-valuetext={error?'載入失敗':percent===null?'正在準備':`${percent}%`}><span/></div>
        </div>
      </div>
      <div className="walking-loader-status" role={error?'alert':'status'}><h1>{error?'頁面暫時沒有載入成功':'loading'}</h1>{percent!==null&&!error&&<span aria-hidden="true">{percent}%</span>}</div>
      {error&&<button onClick={()=>location.reload()}>重新載入</button>}
    </div>
  </div>
}
