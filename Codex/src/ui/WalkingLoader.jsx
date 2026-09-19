import { isMobilePresentation } from '../mobile.js'
import { useEffect, useRef, useState } from 'react'
import './walking-loader.css'

export default function WalkingLoader({progress=null,error=false,theme='island',onModelReady}){
  const [mobile]=useState(isMobilePresentation)
  const [modelVisible,setModelVisible]=useState(false)
  const host=useRef(null),callbacks=useRef({onModelReady})
  callbacks.current={onModelReady}
  useEffect(()=>{
    if(mobile){callbacks.current.onModelReady?.();return}
    let cancelled=false,dispose
    import('../world3d/loadingCharacter.js').then(({createLoadingCharacter})=>{
      if(cancelled)return
      dispose=createLoadingCharacter(host.current,{onReady:()=>{setModelVisible(true);callbacks.current.onModelReady?.()},onError:()=>callbacks.current.onModelReady?.()})
    }).catch(()=>callbacks.current.onModelReady?.())
    return ()=>{cancelled=true;dispose?.()}
  },[])
  const percent=progress===null?null:Math.round(Math.max(0,Math.min(1,progress))*100)
  return <div className={`walking-loader ${mobile?'walking-loader--mobile':''} ${theme==='professional'?'walking-loader--professional':''} ${percent===null?'is-indeterminate':''} ${error?'has-error':''} ${percent===100?'is-complete':''}`}>
    <div className="walking-loader-content">
      <div className="walking-loader-stage">
        <div className="walking-loader-route" style={{'--progress':`${(mobile||modelVisible)?(percent??0):0}%`}}>
          {!mobile&&<div className="walking-loader-avatar" ref={host} aria-hidden="true"/>}
          <div className="walking-loader-track" role="progressbar" aria-label="頁面載入進度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent??undefined} aria-valuetext={error?'載入失敗':percent===null?'正在準備':`${percent}%`}><span/></div>
        </div>
      </div>
      <div className="walking-loader-status" role={error?'alert':'status'}><h1>{error?'頁面暫時沒有載入成功':'loading'}</h1>{percent!==null&&!error&&<span aria-hidden="true">{percent}%</span>}</div>
      {error&&<button onClick={()=>location.reload()}>重新載入</button>}
    </div>
  </div>
}
