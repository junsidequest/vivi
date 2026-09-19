import { isMobilePresentation } from './mobile.js'
import { sitePath } from './routes.js'
import WalkingLoader from './ui/WalkingLoader.jsx'
import { useEffect, useRef, useState } from 'react'
import { createWorld, PLACES } from './world3d/engine.js'
import { MenuPanel } from './ui/MenuPanel.jsx'
import { SpeechBubble } from './ui/SpeechBubble.jsx'
import { useGame } from './game/store.js'
import { createPixelHints, PLAYER_HINTS, GREETING } from './ui/pixelHints.js'
import { closeIris, openIris, disposeIris } from './ui/iris.js'

const CONTENT = {
  about: { kicker: 'ABOUT VIVI', title: '把 AI，帶進你的日常。', text: '嗨，我是陳盈臻 Vivi，也有人叫我大師姐。我不是工程師，卻把 AI 真的用進了工作裡。現在，我陪非技術背景的團隊跨出第一步。', section: 'about', link: '多認識我一點' },
  services: { kicker: 'LEARN & CREATE', title: '一起把「想做」變成「做到」。', text: '從公開課程、企業陪跑到一對一諮詢，從你的真實工作出發，一步一步做出能用的成果。', section: 'offers', link: '看看課程與服務' },
  contact: { kicker: 'SAY HELLO', title: '有個想法，想找人聊聊？', text: '如果你也卡在「知道 AI 很重要，但不知道從哪裡開始」，歡迎寫信給我。先聊聊你的日常，再一起找到值得嘗試的下一步。' },
  duck: { kicker: 'A LITTLE BREAK', title: '呱，休息一下也很好。', text: '不用一口氣學會所有工具。先解決一個每天都會遇到的小麻煩，就已經往前走了一步。' },
  help: { kicker: 'MAKE YOURSELF AT HOME', title: '操作說明', text: '點擊空地或步道，角色會走到你選的位置。也可以用方向鍵或 WASD 走動，按住 Shift 跑步。走近物件後按 E，或點選物件與左側快速選單，Vivi 就會走過去。點擊新的位置會改變目的地，方向鍵可隨時接手。手機可點地面或使用左下角搖桿。鏡頭會跟著你，沒有縮放或旋轉操作。' },
}
function Dialog({ id, onClose, onRead }) {
  const ref = useRef(), content = CONTENT[id]
  useEffect(() => {
    const previous = document.activeElement
    const dialog = ref.current; dialog.focus()
    const handler = e => {
      if (!e.repeat && e.key !== 'Tab') onClose()
      if (e.key === 'Tab') {
        const nodes = [...dialog.querySelectorAll('button,a[href]')]
        if (e.shiftKey && (document.activeElement === nodes[0] || document.activeElement === dialog)) { e.preventDefault(); nodes.at(-1)?.focus() }
        else if (!e.shiftKey && document.activeElement === nodes.at(-1)) { e.preventDefault(); nodes[0]?.focus() }
      }
    }
    window.addEventListener('keydown', handler)
    return () => { window.removeEventListener('keydown', handler); previous?.focus() }
  }, [onClose])
  return <div className="popup-mask" onClick={onClose}><section className="popup-card" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="story-title" onClick={e => e.stopPropagation()}>
    <button className="popup-close" aria-label="關閉對話" onClick={onClose}>×</button><h2 id="story-title">{content.title}</h2>{id==='help'&&isMobilePresentation()?<div className="help-grid help-grid--mobile">
      <div className="help-cell help-cell--wide"><strong>點一下，走過去</strong><p>點擊地面或步道，Vivi 就會走到那裡。再點其他位置可以改變方向。</p></div>
      <div className="help-cell help-cell--wide"><strong>拖動搖桿</strong><p>用左下角搖桿控制方向，往外推遠一點就會跑步。</p></div>
      <div className="help-cell help-cell--wide"><strong>和小島互動</strong><p>點佈告欄、信箱或小鴨，角色會走過去。也可以靠近物件後按右下角 A。</p></div>
      <div className="help-cell help-cell--wide"><strong>打開選單</strong><p>點左上角選單可快速前往，點小 i 可以再看一次操作說明。</p></div>
    </div>:id==='help'?<div className="help-grid">
      <div className="help-cell help-cell--wide"><span>點擊地面移動，或使用鍵盤</span><div className="keypad-pair">
        <div className="keypad"><span className="keycap keycap--key">W</span><div className="keypad-row">{['A','S','D'].map(k=><span key={k} className="keycap keycap--key">{k}</span>)}</div></div>
        <span className="keypad-or">或</span><div className="keypad"><span className="keycap keycap--key"><i className="arrow arrow--up"/></span><div className="keypad-row">{['left','down','right'].map(d=><span key={d} className="keycap keycap--key"><i className={`arrow arrow--${d}`}/></span>)}</div></div>
      </div></div><div className="help-cell"><span>跑步</span><span className="keycap">Shift</span></div><div className="help-cell"><span>與附近物品互動</span><span className="keycap keycap--key">E</span></div>
      <p className="help-cell--wide">左側選單可快速前往。手機可點地面或拖動搖桿，按 A 互動。</p>
    </div>:<p>{content.text}</p>}
    {content.section && <button className="primary" onClick={() => onRead(content.section)}>{content.link}<span>↗</span></button>}
    {id === 'contact' && <button className="primary" onClick={() => onRead('connect')}>Let's Connect<span>↗</span></button>}
    {(id === 'duck' || id === 'help') && <button className="primary" onClick={onClose}>{id === 'help' ? '繼續逛逛' : '繼續散步'}<span>→</span></button>}
  </section></div>
}
export default function App({externalLoading=false,pageVisible=true,onLoadReady,onLoadProgress,onLoadError}) {
  const host=useRef(),world=useRef(),speech=useRef(),markers=useRef({}),duck=useRef(),stats=useRef(),hints=useRef()
  const [fromBridge]=useState(()=>{const bridge=sessionStorage.getItem('vivi-island-entry')==='bridge';sessionStorage.removeItem('vivi-island-entry');return bridge})
  const [intro,setIntro]=useState('waiting'),introRef=useRef('waiting'),greetingTimer=useRef()
  introRef.current=intro
  const [exiting,setExiting]=useState(false)
  const [status,setStatus]=useState('loading'),[route,setRoute]=useState(''),[progress,setProgress]=useState(0)
  const [hint,setHint]=useState({peek:null,approach:null,suppress:null})
  const dialog=useGame(s=>s.activePopup),near=useGame(s=>s.nearbyId),say=useGame(s=>s.say)
  const room=useGame(s=>s.room)
  const touch=useRef({origin:null}),knob=useRef(),dockArrow=useRef(),playerScreen=useRef({x:0,y:0}),transitioning=useRef(false)
  useEffect(()=>{
    useGame.setState({activePopup:null,room:'island',aboutSection:null,say:null,nearbyId:null})
    hints.current=createPixelHints(Object.fromEntries(Object.entries(PLACES).map(([id,p])=>[id,p.stand])),{greeting:false})
    let lastHint='',disposed=false,readyTimer
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches
    const enterLanding=async(section='about')=>{
      if(transitioning.current)return
      transitioning.current=true;world.current?.setPaused(true)
      useGame.getState().closePopup()
      const beforeReveal=async()=>{
        world.current?.freezeFrame()
        const rect=host.current.getBoundingClientRect()
        const x=Math.max(0,Math.min(innerWidth,playerScreen.current.x+rect.left))
        const y=Math.max(0,Math.min(innerHeight,playerScreen.current.y+rect.top))
        await closeIris(x,y,reduced?250:950)
      }
      const url=sitePath(`about/${section ? `#${section}` : ''}`)
      if(isMobilePresentation()){
        window.dispatchEvent(new CustomEvent('site-navigate',{detail:{url,beforeReveal}}))
      }else{
        await beforeReveal()
        if(!disposed)window.location.assign(url)
      }
    }
    const open=id=>{if(id==='dock'){void enterLanding(null);return}if(id==='duck')hints.current.interactDuck();else useGame.getState().openPopup(id)}
    world.current=createWorld(host.current,{
      startOnBridge:fromBridge,
      onProgress:value=>{setProgress(value);onLoadProgress?.(value)},onReady:()=>{setProgress(1);readyTimer=setTimeout(()=>{setStatus('ready');onLoadReady?.()},350)},onError:error=>{console.error(error);setStatus('error');if(onLoadError)onLoadError();else onLoadReady?.()},
      onExitStart:()=>setExiting(true),onNear:id=>useGame.getState().setNearbyId(id),onOpen:open,onRoute:setRoute,
      onPosition:({avatar,places,x,y,z,dt,moving,autoWalking})=>{
        playerScreen.current=avatar
        if(dockArrow.current)dockArrow.current.style.transform=`translate(${places.dock.x}px,${places.dock.y}px)`
        if(speech.current)speech.current.style.transform=`translate(${avatar.x}px,${avatar.y}px)`
        for(const [id,point] of Object.entries(places))if(markers.current[id])markers.current[id].style.transform=`translate(${point.x}px,${point.y}px)`
        if(duck.current)duck.current.style.transform=`translate(${places.duck.x}px,${places.duck.y}px)`
        if(stats.current)stats.current.textContent=`x ${x.toFixed(2)} · z ${z.toFixed(2)} · 腳底 ${y.toFixed(3)} m`
        if(introRef.current!=='done')return
        const st=useGame.getState()
        const next=hints.current.tick({dt,moving,x,z,autoWalking,near:st.nearbyId,paused:Boolean(st.activePopup||st.room==='about')})
        if(next.say!==st.say)st.setSay(next.say)
        const key=`${next.peek}/${next.approach}/${next.suppress}`
        if(key!==lastHint){lastHint=key;setHint(next)}
      }
    })
    const walk=e=>{useGame.getState().closePopup();hints.current.suppress(e.detail.id);world.current.travel(e.detail.id)}
    const enter=e=>{if(e.detail?.professional){void enterLanding(null)}else{void enterLanding(e.detail?.section||'about')}}
    window.addEventListener('walk-to',walk);window.addEventListener('enter-about',enter)
    return()=>{clearTimeout(greetingTimer.current);clearTimeout(readyTimer);disposed=true;transitioning.current=false;disposeIris();world.current?.dispose();window.removeEventListener('walk-to',walk);window.removeEventListener('enter-about',enter)}
  },[])
  useEffect(()=>{world.current?.setPaused(Boolean(dialog||room==='about'||transitioning.current||(intro!=='done'&&intro!=='walking')))},[dialog,room,intro])
  const startedIntro=useRef(false)
  useEffect(()=>{
    if(status!=='ready'||!pageVisible||startedIntro.current)return
    startedIntro.current=true
    let cancelled=false
    const start=async()=>{
      if(fromBridge){
        const rect=host.current.getBoundingClientRect(),point=playerScreen.current
        await openIris(point.x+rect.left,point.y+rect.top,700)
        if(cancelled)return
        setIntro('walking')
        await world.current.startEntrance()
        if(cancelled)return
      }
      setIntro('greeting');useGame.getState().setSay(GREETING)
    }
    void start()
    return()=>{cancelled=true}
  },[status,pageVisible,fromBridge])
  const greetingComplete=()=>{
    if(introRef.current!=='greeting'||greetingTimer.current)return
    greetingTimer.current=setTimeout(()=>{
      useGame.getState().setSay(null);setIntro('help');useGame.getState().openPopup('help')
    },1000)
  }
  const open=id=>{if(id==='duck')hints.current.interactDuck();else useGame.getState().openPopup(id)}
  const close=()=>{useGame.getState().closePopup();if(intro==='help'){world.current?.unlockIntro();setIntro('done')}}
  const read=section=>window.dispatchEvent(new CustomEvent('enter-about',{detail:{section}}))
  const endTouch=()=>{touch.current.origin=null;world.current?.setJoystick(0,0);if(knob.current)knob.current.style.transform=''}
  const keyLabel=isMobilePresentation()?'A':'E'
  return <main className="island-app" inert={exiting}>
    <div className="scene" ref={host}/>
    {status==='ready' && room==='island' && <>
      <div className="pixel-world">
        <div className="pixel-anchor" ref={dockArrow}><button className="dock-arrow" aria-label="了解更多 Vivi 的課程與服務" onClick={()=>world.current?.travel('dock')}/></div>
        {['about','contact'].map(id=><div key={id} className="pixel-anchor" ref={el=>{markers.current[id]=el}}>
          <button aria-label={id==='about'?'看佈告欄':'開信箱'} tabIndex={hint.suppress!==id&&(near===id||hint.peek===id||hint.approach===id)?0:-1}
            className={`world-hint${hint.suppress===id?'':near===id?' is-near':hint.peek===id||hint.approach===id?' is-peek':''}`}
            onClick={()=>{hints.current.suppress(id);world.current?.travel(id)}}>
            <span className={`hint-mark hint-mark--${id==='about'?'pin':'mail'}`}/><span className="hint-full">按<span className="key">{keyLabel}</span>{id==='about'?'看佈告欄':'開信箱'}</span>
          </button>
        </div>)}
        <div className="pixel-anchor pixel-anchor--speech" ref={speech}><SpeechBubble onComplete={greetingComplete}/>{PLAYER_HINTS[near]&&!say&&<button className="player-hint" onClick={()=>open(near)}>按<span className="key">{keyLabel}</span>{PLAYER_HINTS[near]}</button>}</div>
        <div className="pixel-anchor pixel-anchor--duck" ref={duck}>{near==='duck'&&<div className="duck-say">呱呱~</div>}</div>
      </div>
      <div className="route-message" role="status">{route}</div>
      <div className="touch-controls" inert={intro!=='done'}><div className="joystick" aria-label="移動搖桿" onPointerDown={e=>{touch.current.origin={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!touch.current.origin)return;let x=e.clientX-touch.current.origin.x,y=e.clientY-touch.current.origin.y;const length=Math.hypot(x,y),scale=Math.max(1,length/34);x/=scale;y/=scale;knob.current.style.transform=`translate(${x}px,${y}px)`;world.current?.setJoystick(x/34,y/34,length>43)}} onPointerUp={endTouch} onPointerCancel={endTouch}><span ref={knob}/></div><button className="interact-touch" disabled={!near} onClick={()=>near&&open(near)}>A</button></div>
    </>}
    {new URLSearchParams(location.search).has('debug')&&<output className="debug" ref={stats}/>}
    {status!=='ready'&&(!externalLoading||status==='error')&&<WalkingLoader progress={progress} error={status==='error'}/>}
    <div className="ui-layer">{status==='ready'&&intro==='done'&&<MenuPanel/>}{dialog&&<Dialog id={dialog} onClose={close} onRead={read}/>}</div>
  </main>
}
