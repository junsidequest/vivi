import {describe,it,expect} from 'vitest'
import {createBridgeExit} from './bridgeExit.js'
describe('橋尾自動離場',()=>{
  it('只有沿橋往下越過界線才接手',()=>{
    const exit=createBridgeExit(7.05)
    expect(exit.shouldStart(7,{x:0,z:7.06})).toBe(true)
    expect(exit.shouldStart(7.1,{x:0,z:7.06})).toBe(false)
    expect(exit.shouldStart(6.9,{x:0,z:7})).toBe(false)
    expect(exit.shouldStart(7,{x:2,z:7.06})).toBe(false)
  })
  it('接手後持續前進，抵達只觸發一次轉場',()=>{
    const exit=createBridgeExit(7.05),position={x:.2,z:7.05}
    expect(exit.start(position)).toBe(true)
    expect(exit.start(position)).toBe(false)
    let completed=0
    for(let i=0;i<60;i++)if(exit.advance(position,1/30).complete)completed++
    expect(position.z).toBeCloseTo(8.15)
    expect(position.x).toBe(.2)
    expect(completed).toBe(1)
    expect(exit.shouldStart(7,position)).toBe(false)
  })
})

it('踏上橋入口就接手，持續走到原本橋尾才完成',()=>{
 const exit=createBridgeExit(),position={x:0,z:5.01}
 expect(exit.shouldStart(4.99,position)).toBe(true)
 expect(exit.shouldStart(5.1,position)).toBe(false)
 expect(exit.shouldStart(4.8,{x:0,z:4.99})).toBe(false)
 exit.start(position)
 expect(exit.advance(position,.8).complete).toBe(false)
 expect(position.z).toBeCloseTo(6.01)
 let completed=0
 for(let i=0;i<120;i++)if(exit.advance(position,1/30).complete)completed++
 expect(position.z).toBeCloseTo(8.15)
 expect(completed).toBe(1)
})
