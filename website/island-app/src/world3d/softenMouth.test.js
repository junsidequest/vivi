import { expect, it } from 'vitest'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { mouthDepth, softenMouth } from './softenMouth.js'

it('嘴腔壓淺但仍留在外唇後方', () => {
  expect(mouthDepth(0, .715, .125)).toBeGreaterThan(.20)
  expect(mouthDepth(0, .715, .125)).toBeLessThan(.223)
  expect(mouthDepth(0, .715, .23)).toBe(.23)
})
it('不改變眼睛、鼻尖、臉頰與頭部背面', () => {
  for (const [x, y, z] of [[.13, .82, .22], [0, .78, .24], [.16, .71, .20], [0, .71, -.1]]) expect(mouthDepth(x, y, z)).toBe(z)
})
it('變形保留 UV 與骨架權重，法線維持有限單位向量', () => {
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute([0, .715, .125], 3))
  g.setAttribute('normal', new Float32BufferAttribute([0, 0, 1], 3))
  g.setAttribute('uv', new Float32BufferAttribute([.2, .7], 2))
  g.setAttribute('skinWeight', new Float32BufferAttribute([1, 0, 0, 0], 4))
  const uv = [...g.attributes.uv.array]
  softenMouth(g)
  expect([...g.attributes.uv.array]).toEqual(uv)
  expect([...g.attributes.skinWeight.array]).toEqual([1, 0, 0, 0])
  expect(Math.hypot(...g.attributes.normal.array)).toBeCloseTo(1)
})
