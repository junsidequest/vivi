import { isMobilePresentation } from '../mobile.js'
import { useEffect, useState } from 'react'
import './walking-loader.css'

export default function WalkingLoader({progress=null,error=false,theme='island'}){
  const [mobile]=useState(isMobilePresentation)
  const [showIslandMessage,setShowIslandMessage]=useState(false)
  const complete=progress!==null&&progress>=1

  useEffect(()=>{
    if(theme!=='island'||complete||error){setShowIslandMessage(false);return}
    const timer=setTimeout(()=>setShowIslandMessage(true),2000)
    return()=>clearTimeout(timer)
  },[theme,complete,error])

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
