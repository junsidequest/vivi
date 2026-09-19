import {describe,it,expect} from 'vitest'
import {approachSpeed,turnTowards,arrivalSpeed} from './locomotion.js'
describe('自然移動',()=>{
  it('起步逐步加速，停止能在有限時間內歸零',()=>{
    let speed=0
    for(let i=0;i<30;i++){const next=approachSpeed(speed,1.25,1/60);expect(next-speed).toBeLessThanOrEqual(.071);speed=next}
    expect(speed).toBe(1.25)
    for(let i=0;i<30;i++)speed=approachSpeed(speed,0,1/60)
    expect(speed).toBe(0)
  })
  it('角度跨過正負 π 時沿短邊轉身',()=>{
    const next=turnTowards(Math.PI-.04,-Math.PI+.04,1/60)
    expect(next-(Math.PI-.04)).toBeCloseTo(.08)
  })
  it('抵達前減速，不越過目標',()=>{
    expect(arrivalSpeed(0)).toBe(0)
    expect(arrivalSpeed(.02)).toBeLessThan(arrivalSpeed(.2))
    expect(arrivalSpeed(8)).toBe(1.25)
  })
})
