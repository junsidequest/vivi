// 踏上橋入口就接手，持續走到橋尾才轉場。
export const BRIDGE_ENTRY_Z=5
export const BRIDGE_EXIT_Z=8.15
export function createBridgeExit(triggerZ=BRIDGE_ENTRY_Z) {
  let active=false, endZ=0, finished=false
  return {
    get active(){return active},
    start(position){if(active)return false;active=true;endZ=Math.max(BRIDGE_EXIT_Z,position.z+1.1);return true},
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
