// 以加速度與煞車距離限制速度；每次仍由 navigation 檢查實際位移。
export function approachSpeed(speed, desired, dt) {
  const rate=desired>speed?4.2:7.5
  return speed+Math.sign(desired-speed)*Math.min(Math.abs(desired-speed),rate*dt)
}
export function turnTowards(current, desired, dt) {
  const delta=Math.atan2(Math.sin(desired-current),Math.cos(desired-current))
  return current+Math.sign(delta)*Math.min(Math.abs(delta),dt*6.5)
}
export function arrivalSpeed(distance, maxSpeed=1.25) {
  return Math.min(maxSpeed,Math.sqrt(Math.max(0,distance)*2*4))
}
