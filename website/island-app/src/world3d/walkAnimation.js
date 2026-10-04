import { Quaternion } from 'three'

// 以原有步態的中間姿勢減幅，避免混回建模姿勢而讓手臂向外張開。
export function prepareWalk(model, original) {
  const clip = original.clone(), q = new Quaternion()
  for (const track of clip.tracks) {
    const split = track.name.lastIndexOf('.'), name = track.name.slice(0, split), property = track.name.slice(split + 1)
    const bone = model.getObjectByName(name)
    if (!bone) continue
    const arms = /^(Left|Right)(Shoulder|Arm|ForeArm|Hand)$/.test(name)
    if (property === 'quaternion') {
      const mean = new Quaternion(0, 0, 0, 0), first = new Quaternion().fromArray(track.values)
      for (let i = 0; i < track.values.length; i += 4) {
        q.fromArray(track.values, i)
        const sign = first.dot(q) < 0 ? -1 : 1
        mean.x += q.x * sign; mean.y += q.y * sign; mean.z += q.z * sign; mean.w += q.w * sign
      }
      mean.normalize()
      // 原步態為較窄身形製作；保留少量外展，讓手掌落在衣服兩側。
      const rest = arms ? mean.clone().slerp(bone.quaternion, .45) : mean
      const correction = rest.clone().multiply(mean.clone().invert())
      const amplitude = arms ? .85 : name === 'Hips' ? .65 : /Spine/.test(name) ? .7 : /UpLeg/.test(name) ? .9 : 1
      for (let i = 0; i < track.values.length; i += 4) {
        // q 不能同時作為 slerpQuaternions 的輸出與第二個輸入；
        // 該方法先 copy 第一個輸入，會覆蓋尚未讀取的原始影格。
        q.fromArray(track.values, i).slerp(mean, 1 - amplitude).premultiply(correction).normalize().toArray(track.values, i)
      }
      if (arms) bone.quaternion.copy(rest)
    } else if (name === 'Hips' && property === 'position') {
      for (let axis = 0; axis < 3; axis++) {
        let sum = 0
        for (let i = axis; i < track.values.length; i += 3) sum += track.values[i]
        const mean = sum / (track.values.length / 3), amplitude = axis === 1 ? .65 : .35
        for (let i = axis; i < track.values.length; i += 3) track.values[i] = mean + (track.values[i] - mean) * amplitude
      }
    }
    // 原動畫尾端不是同一姿勢，短暫銜接可消除每輪重播時的跳動。
    const size = track.getValueSize(), duration = track.times.at(-1), blend = .14
    for (let sample = 0; sample < track.times.length; sample++) {
      const t = Math.max(0, (track.times[sample] - (duration - blend)) / blend)
      if (!t) continue
      const weight = t * t * (3 - 2 * t), offset = sample * size
      if (property === 'quaternion') {
        q.fromArray(track.values, offset).slerp(new Quaternion().fromArray(track.values), weight).toArray(track.values, offset)
      } else for (let axis = 0; axis < size; axis++) track.values[offset + axis] += (track.values[axis] - track.values[offset + axis]) * weight
    }
  }
  return clip
}
