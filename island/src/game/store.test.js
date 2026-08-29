import { describe, it, expect, beforeEach } from 'vitest'
import { useGame } from './store.js'

const s = () => useGame.getState()

describe('game store', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState()))

  it('初始狀態：直接 playing、可移動、無 popup、聲音開', () => {
    expect(s().phase).toBe('playing')
    expect(s().movementLocked).toBe(false)
    expect(s().activePopup).toBe(null)
    expect(s().soundOn).toBe(true)
    expect(s().say).toBe(null)
    expect(s().nearbyId).toBe(null)
  })

  it('開 popup 會同時鎖移動，關 popup 解鎖', () => {
    s().setPhase('playing')
    s().unlockMovement()
    s().openPopup('about')
    expect(s().activePopup).toBe('about')
    expect(s().movementLocked).toBe(true)
    s().closePopup()
    expect(s().activePopup).toBe(null)
    expect(s().movementLocked).toBe(false)
  })

  it('intro 期間開關 popup 不會提前解鎖移動；playing 期間才會解鎖', () => {
    s().setPhase('intro')
    s().openPopup('help')
    expect(s().movementLocked).toBe(true)
    s().closePopup()
    expect(s().activePopup).toBe(null)
    expect(s().movementLocked).toBe(true)

    s().setPhase('playing')
    s().unlockMovement()
    s().openPopup('help')
    expect(s().movementLocked).toBe(true)
    s().closePopup()
    expect(s().movementLocked).toBe(false)
  })

  it('toggleSound 來回切換', () => {
    s().toggleSound()
    expect(s().soundOn).toBe(false)
    s().toggleSound()
    expect(s().soundOn).toBe(true)
  })
})
