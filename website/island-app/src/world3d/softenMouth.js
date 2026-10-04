import { Vector3 } from 'three'

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// 原模型的嘴腔約深 0.1；壓淺內部，保留嘴角、外唇與露齒笑容。
export function mouthDepth(x, y, z) {
  const surface = .223 - .9 * x * x
  if (z >= surface) return z
  const weight = (1 - smooth(.085, .12, Math.abs(x)))
    * smooth(.663, .681, y) * (1 - smooth(.746, .763, y))
    * smooth(.09, .115, z)
  return z + (surface - z) * .84 * weight
}

export function softenMouth(geometry) {
  const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal')
  if (!positions) return
  const normal = new Vector3(), epsilon = .00001
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i), next = mouthDepth(x, y, z)
    if (Math.abs(next - z) < 1e-9) continue
    positions.setZ(i, next)
    if (normals) {
      // 以變形的 Jacobian 更新原有法線，避免跨越嘴唇、牙齒接縫重新平滑。
      const dx = (mouthDepth(x + epsilon, y, z) - mouthDepth(x - epsilon, y, z)) / (2 * epsilon)
      const dy = (mouthDepth(x, y + epsilon, z) - mouthDepth(x, y - epsilon, z)) / (2 * epsilon)
      const dz = (mouthDepth(x, y, z + epsilon) - mouthDepth(x, y, z - epsilon)) / (2 * epsilon)
      normal.fromBufferAttribute(normals, i)
      const nz = normal.z / Math.max(.01, dz)
      normal.set(normal.x - dx * nz, normal.y - dy * nz, nz).normalize()
      normals.setXYZ(i, normal.x, normal.y, normal.z)
    }
  }
  positions.needsUpdate = true
  if (normals) normals.needsUpdate = true
  geometry.computeBoundingBox(); geometry.computeBoundingSphere()
}
