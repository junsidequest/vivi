import WalkingLoader from './ui/WalkingLoader.jsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import { currentRoute, resolveRoute, sitePath } from './routes.js'

const titles={welcome:'Vivi Chen｜選一種方式，認識我',island:'Vivi 的小島 · 來走走吧',professional:'Vivi Chen 陳盈臻｜AI 陪跑教練'}
const loaders={welcome:()=>import('./Welcome.jsx'),island:()=>import('./App.jsx'),professional:()=>import('./Professional.jsx')}
function PreparedPage({entry,visible,onReady,onError,onProgress}){
  const host=useRef(null)
  const ready=useCallback(()=>onReady(entry),[entry,onReady])
  useEffect(()=>{
    if(entry.view==='island')return
    let cancelled=false
    // 等待實際可見的主圖；跑馬燈等延後載入的圖片不阻擋換頁。
    const images=[...host.current.querySelectorAll('img:not([loading="lazy"])')]
    Promise.all(images.map(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true})}))).then(()=>{if(!cancelled)ready()})
    return()=>{cancelled=true}
  },[entry,ready])
  const Page=entry.Page
  return <div ref={host} className={`mobile-site-page${visible?' is-visible':''}`} aria-hidden={!visible} inert={!visible}>
    <Page externalLoading pageVisible={visible} onLoadReady={ready} onLoadError={onError} onLoadProgress={onProgress}/>
  </div>
}
export default function MobileSite(){
  const [shown,setShown]=useState(null),[pending,setPending]=useState(null),[error,setError]=useState(false)
  const [enteringIsland,setEnteringIsland]=useState(currentRoute.view==='island'),[progress,setProgress]=useState(0)
  const latest=useRef(0),request=useRef(null),shownRef=useRef(null)
  const prepare=useCallback(async(url,options={})=>{
    const id=++latest.current, route=resolveRoute(new URL(url,location.href).href)
    request.current={url,options};setError(false);setPending(null);setEnteringIsland(route.view==='island');setProgress(0)
    try{
      const module=await loaders[route.view]()
      if(id!==latest.current)return
      setPending({id,view:route.view,url:route.canonical,Page:module.default,...options})
    }catch{if(id===latest.current){setError(true);setEnteringIsland(false)}}
  },[])
  const ready=useCallback(async entry=>{
    if(entry.id!==latest.current||shownRef.current?.id===entry.id)return
    // 新頁完成後才播放原有的小島圓形轉場，不在準備期間收黑。
    if(entry.beforeReveal)await entry.beforeReveal()
    if(entry.id!==latest.current)return
    if(!entry.pop)history.pushState(null,'',entry.url)
    document.title=titles[entry.view]
    shownRef.current=entry;setShown(entry);setPending(null);setEnteringIsland(false)
    requestAnimationFrame(()=>{
      const hash=new URL(entry.url,location.origin).hash.slice(1)
      if(!hash)document.querySelector('.mobile-site-page.is-visible .professional, .mobile-site-page.is-visible .welcome')?.scrollTo({top:0,behavior:'instant'})
      if(hash)document.querySelector('.mobile-site-page.is-visible')?.querySelector(`[id="${CSS.escape(hash)}"]`)?.scrollIntoView({behavior:'instant',block:'start'})
    })
  },[])
  useEffect(()=>{
    prepare(location.href,{pop:true})
    const click=e=>{
      if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return
      const a=e.target.closest('a[href]')
      if(!a||a.target==='_blank'||a.hasAttribute('download'))return
      const url=new URL(a.href,location.href)
      if(url.origin!==location.origin)return
      if(url.pathname===location.pathname&&url.search===location.search&&url.hash)return
      if(!['', 'about/', 'island/'].some(path=>url.pathname===sitePath(path)))return
      e.preventDefault();prepare(url.href)
    }
    const navigate=e=>prepare(e.detail.url,{beforeReveal:e.detail.beforeReveal})
    const pop=()=>prepare(location.href,{pop:true})
    document.addEventListener('click',click);window.addEventListener('site-navigate',navigate);window.addEventListener('popstate',pop)
    return()=>{latest.current++;document.removeEventListener('click',click);window.removeEventListener('site-navigate',navigate);window.removeEventListener('popstate',pop)}
  },[prepare])
  return <div className="mobile-site">
    {shown&&<PreparedPage key={shown.id} entry={shown} visible onReady={ready} onError={()=>setError(true)}/>}
    {pending&&<PreparedPage key={pending.id} entry={pending} visible={false} onReady={ready} onError={()=>{setPending(null);setError(true);setEnteringIsland(false)}} onProgress={setProgress}/>}
    {enteringIsland&&<WalkingLoader progress={progress}/> }
    {error&&<div className="mobile-navigation-error" role="alert">頁面暫時沒有載入成功。<button onClick={()=>prepare(request.current.url,request.current.options)}>重試</button></div>}
  </div>
}
