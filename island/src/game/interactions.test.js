import { describe, it, expect } from 'vitest'
import { nearestInRange } from './interactions.js'

const ITEMS = [
  { id: 'a', pos: [0, 0, 0], range: 2 },
  { id: 'b', pos: [1, 0, 0], range: 2 },
]

describe('nearestInRange', () => {
  it('範圍外回 null', () => {
    expect(nearestInRange({ x: 10, z: 10 }, ITEMS)).toBe(null)
  })
  it('回傳最近的一個', () => {
    expect(nearestInRange({ x: 0.9, z: 0 }, ITEMS).id).toBe('b')
  })
  it('剛好在 range 邊界上算在內', () => {
    expect(nearestInRange({ x: 2, z: 0 }, [ITEMS[0]]).id).toBe('a')
  })
})
