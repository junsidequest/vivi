import { describe, it, expect } from 'vitest'
import { sliceByTime } from './typewriter.js'

describe('sliceByTime', () => {
  it('0ms 顯示空字串', () => expect(sliceByTime('嗨！', 0, 45)).toBe(''))
  it('依 elapsed 逐字顯示', () => expect(sliceByTime('嗨！', 50, 45)).toBe('嗨'))
  it('超過總長顯示全文', () => expect(sliceByTime('嗨！', 9999, 45)).toBe('嗨！'))
})
