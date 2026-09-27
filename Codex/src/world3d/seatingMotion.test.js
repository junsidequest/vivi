import { describe, expect, it } from 'vitest'
import { swingAngle } from './seating.js'

describe('主動坐上鞦韆後的擺動', () => {
  it.each([false, true])('減少動態效果為 %s 時仍會往返，起始不跳動', reduced => {
    expect(swingAngle(0, reduced)).toBe(0)
    const samples = Array.from({ length: 120 }, (_, i) => swingAngle(i / 10, reduced))
    expect(Math.max(...samples)).toBeGreaterThan(.04)
    expect(Math.min(...samples)).toBeLessThan(-.04)
    expect(Math.max(...samples.map(Math.abs))).toBeLessThanOrEqual(reduced ? .06 : .10)
    expect(Math.abs(swingAngle(.01, reduced))).toBeLessThan(.001)
  })
})
