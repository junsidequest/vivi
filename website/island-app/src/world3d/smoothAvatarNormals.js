// 平滑 UV 接縫的光照，不焊接頂點，保留貼圖、骨架權重與輪廓。
export function smoothAvatarNormals(geometry, creaseAngle = Math.PI / 3) {
  const position = geometry.getAttribute('position'), normal = geometry.getAttribute('normal')
  if (!position || !normal) return
  const joints = geometry.getAttribute('skinIndex'), weights = geometry.getAttribute('skinWeight')
  const groups = new Map(), original = normal.array.slice(), threshold = Math.cos(creaseAngle)
  for (let i = 0; i < position.count; i++) {
    let key = [position.getX(i), position.getY(i), position.getZ(i)].map(v => Math.round(v * 1e6)).join(',')
    if (joints && weights) {
      key += '/' + [0, 1, 2, 3].map(k => `${joints.getComponent(i, k)}:${Math.round(weights.getComponent(i, k) * 1e6)}`).join(',')
    }
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(i)
  }
  for (const indices of groups.values()) {
    if (indices.length < 2) continue
    for (const i of indices) {
      const offset = i * 3, seen = new Set()
      let x = 0, y = 0, z = 0
      for (const j of indices) {
        const k = j * 3, nx = original[k], ny = original[k + 1], nz = original[k + 2]
        if (original[offset] * nx + original[offset + 1] * ny + original[offset + 2] * nz < threshold) continue
        const key = [nx, ny, nz].map(v => Math.round(v * 1e6)).join(',')
        if (seen.has(key)) continue
        seen.add(key); x += nx; y += ny; z += nz
      }
      const length = Math.hypot(x, y, z)
      if (length) normal.setXYZ(i, x / length, y / length, z / length)
    }
  }
  normal.needsUpdate = true
}
