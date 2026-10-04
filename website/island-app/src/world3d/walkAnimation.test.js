import { it, expect } from 'vitest'
import { AnimationClip, Bone, Group, Quaternion, QuaternionKeyframeTrack } from 'three'
import { prepareWalk } from './walkAnimation.js'

it('放鬆站姿沿用擺臂中間姿勢，循環首尾一致且不修改原動畫', () => {
  const model = new Group(), arm = new Bone(); arm.name = 'LeftArm'; model.add(arm)
  const a = new Quaternion(0, 0, Math.sin(.4), Math.cos(.4))
  const b = new Quaternion(0, 0, Math.sin(.6), Math.cos(.6))
  const track = new QuaternionKeyframeTrack('LeftArm.quaternion', [0, .5, 1], [...a.toArray(), ...b.toArray(), ...b.toArray()])
  const source = new AnimationClip('walk', 1, [track]), before = [...track.values]
  const result = prepareWalk(model, source)
  expect(arm.quaternion.angleTo(new Quaternion())).toBeGreaterThan(.4)
  expect([...result.tracks[0].values.slice(-4)]).toEqual([...result.tracks[0].values.slice(0, 4)])
  expect([...source.tracks[0].values]).toEqual(before)
  const start = new Quaternion().fromArray(result.tracks[0].values)
  const middle = new Quaternion().fromArray(result.tracks[0].values, 4)
  expect(start.angleTo(middle)).toBeCloseTo(a.angleTo(b) * .85, 5)
  for (let i = 0; i < result.tracks[0].values.length; i += 4) expect(new Quaternion().fromArray(result.tracks[0].values, i).length()).toBeCloseTo(1)
})
