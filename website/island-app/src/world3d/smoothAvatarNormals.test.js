import { describe, it, expect } from 'vitest'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { smoothAvatarNormals } from './smoothAvatarNormals.js'

function seam(normals) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute([0, 0, 1, 1], 2))
  return geometry
}
describe('角色接縫平滑', () => {
  it('相鄰緩曲面消除 UV 接縫，保留頂點及 UV', () => {
    const g = seam([0, 1, 0, .5, Math.sqrt(.75), 0])
    smoothAvatarNormals(g)
    expect(g.attributes.normal.getX(0)).toBeCloseTo(g.attributes.normal.getX(1))
    expect(g.attributes.normal.getY(0)).toBeCloseTo(g.attributes.normal.getY(1))
    expect([...g.attributes.position.array]).toEqual([0, 0, 0, 0, 0, 0])
    expect([...g.attributes.uv.array]).toEqual([0, 0, 1, 1])
  })
  it('保留直角稜線', () => {
    const g = seam([0, 1, 0, 1, 0, 0])
    smoothAvatarNormals(g)
    expect([...g.attributes.normal.array]).toEqual([0, 1, 0, 1, 0, 0])
  })
  it('不混合由不同骨骼驅動的相接表面', () => {
    const g = seam([0, 1, 0, .5, Math.sqrt(.75), 0])
    g.setAttribute('skinIndex', new Float32BufferAttribute([0, 0, 0, 0, 1, 0, 0, 0], 4))
    g.setAttribute('skinWeight', new Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0], 4))
    const before = [...g.attributes.normal.array]
    smoothAvatarNormals(g)
    expect([...g.attributes.normal.array]).toEqual(before)
  })
})
