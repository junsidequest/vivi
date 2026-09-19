// 橋尾一旦接手便不再接受操作，保留一段向前走的轉場步伐。
export function createBridgeExit(triggerZ) {
  let active=false, endZ=0, finished=false
  return {
    get active(){return active},
    start(position){if(active)return false;active=true;endZ=position.z+1.1;return true},
    shouldStart(previousZ,position){return !active&&position.z>previousZ&&position.z>=triggerZ&&Math.abs(position.x)<.8},
    advance(position,dt){
      if(!active||finished)return {distance:0,complete:false}
      const distance=Math.min(1.25*dt,Math.max(0,endZ-position.z))
      position.z+=distance
      finished=position.z>=endZ
      return {distance,complete:finished}
    }
  }
}
