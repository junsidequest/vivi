export const GREETING='Hi 我是陳盈臻 Vivi，陪你和你的團隊把 AI 真的用起來'
const IDLE_LINES=['要不要去郵筒那邊看看？','AI 不會取代你，會用 AI 的人才會。','走累了嗎？按 Shift 可以用跑的喔。','佈告欄有我的新消息～']
export const PLAYER_HINTS={duck:'聽鴨子在說什麼',services:'看服務和課程'}
const DUCK_LINES=['這隻鴨子只出一張嘴','牠說牠也想學 AI','呱的意思是：先搞清楚問題再選工具','牠是本島唯一不用打卡的員工']
// 時序沿用 pixel 版；距離改用目前 3D 世界的公尺座標。
export function createPixelHints(points,{greeting=true}={}){
  let time=0,greeted=!greeting,say=null,sayUntil=0,owner=null,idleSaying=false,idle=0,idleIndex=0,cooldown=0
  let walkingIdle=Infinity,awake=false,hintTime=0,hintOn=false,peek=null,suppress=null,sampleTime=0
  const ids=['about','contact'],visited={about:0,contact:0},previous={about:Infinity,contact:Infinity}
  const speak=(line,duration)=>{say=line;sayUntil=time+duration}
  return {
    suppress(id){suppress=id},
    interactDuck(){speak(DUCK_LINES[Math.floor(Math.random()*DUCK_LINES.length)],3.5);owner='duck';idleSaying=false},
    tick({dt,moving,x,z,near,paused=false,autoWalking=false}){
      time+=dt
      const distances=Object.fromEntries(ids.map(id=>[id,Math.hypot(x-points[id].x,z-points[id].z)]))
      if(!greeted && time>=1.3 && !paused){greeted=true;speak(GREETING,6.5)}
      if(say && (time>=sayUntil || (owner && near!==owner))){say=null;owner=null;idleSaying=false}
      if(suppress && !autoWalking && near!==suppress)suppress=null
      if(near in visited)visited[near]=time
      const pick=()=>{
        const approaching=ids.filter(id=>distances[id]<previous[id]-.15)
        return [...(approaching.length?approaching:ids)].sort((a,b)=>visited[a]-visited[b] || distances[a]-distances[b])[0]
      }
      const approach=ids.filter(id=>distances[id]<2.1).sort((a,b)=>distances[a]-distances[b])[0]??null
      walkingIdle=moving?0:walkingIdle+dt
      const nextAwake=walkingIdle<2.5 && !paused && !autoWalking
      if(nextAwake!==awake){awake=nextAwake;hintTime=0;hintOn=awake;peek=hintOn?pick():null}
      else if(awake){hintTime+=dt;if(hintTime>=(hintOn?3.5:9)){hintTime=0;hintOn=!hintOn;peek=hintOn?pick():null}}
      sampleTime+=dt;if(sampleTime>=2){sampleTime=0;Object.assign(previous,distances)}
      const hasHint=Boolean(PLAYER_HINTS[near])
      if(hasHint){cooldown=2;if(idleSaying){say=null;idleSaying=false}}
      else cooldown=Math.max(0,cooldown-dt)
      if(moving||say||paused||autoWalking||hasHint||cooldown>0)idle=0
      else {idle+=dt;if(idle>30){speak(IDLE_LINES[idleIndex++%IDLE_LINES.length],4);idleSaying=true;idle=0}}
      return {say,peek:paused?null:peek,approach:paused?null:approach,suppress}
    }
  }
}
