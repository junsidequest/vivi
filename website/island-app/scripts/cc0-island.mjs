import { readFile } from 'node:fs/promises'
import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { buildIsland } from '../src/world3d/buildIsland.js'

// 庭院使用自製圓角幾何，樹木沿用上一版的 Kenney CC0 模型。
export async function buildCC0Island() {
  const root = buildIsland()
  function replace(name) {
    root.getObjectByName(name)?.removeFromParent()
    const group = new T.Group(); group.name = name; root.add(group); return group
  }
  const trees = replace('Trees_and_shrubs')
  trees.userData.source = 'Kenney Nature Kit 2.1 — CC0'
  for (const [name, x, z, width, height, depth, angle] of [
    ['tree_detailed', -4.25, -2.7, 2.65, 3.5, 2.45, .35],
    ['tree_oak', 3.7, -3.2, 2.65, 3.7, 2.7, -.4],
  ]) {
    const bytes = await readFile(new URL(`../assets/cc0/kenney-nature/${name}.glb`, import.meta.url))
    const { scene: object } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
    object.traverse(mesh => {
      if (!mesh.isMesh) return
      mesh.material = mesh.material.clone()
      const materialName = mesh.material.name
      mesh.material.color.set(materialName.includes('leaf') ? '#5f7b42' : materialName.includes('wood') ? '#b98b51' : '#d1ac73')
      mesh.material.metalness = 0; mesh.material.roughness = .88
      mesh.castShadow = true; mesh.receiveShadow = true
    })
    const bounds = new T.Box3().setFromObject(object), size = bounds.getSize(new T.Vector3()), center = bounds.getCenter(new T.Vector3())
    object.position.set(-center.x, -bounds.min.y, -center.z)
    const scaled = new T.Group(); scaled.add(object); scaled.scale.set(width / size.x, height / size.y, depth / size.z)
    const wrapper = new T.Group(); wrapper.name = `CC0_${name}`; wrapper.add(scaled)
    wrapper.position.set(x, .065, z); wrapper.rotation.y = angle; trees.add(wrapper)
  }
  root.getObjectByName('Stone_path')?.removeFromParent()
  const walkway = replace('Path_base')
  walkway.userData.source = 'Custom fitted wood boards'
  // 改用直邊實體木板，避免原素材的梯形板留下三角形空隙。
  const boardMaterials = ['#c8a477', '#c3a071', '#cba87c'].map(color => new T.MeshStandardMaterial({ color, roughness: .9 }))
  function board(x, z, width, depth, i) {
    const mesh = new T.Mesh(new RoundedBoxGeometry(width, .037, depth, 2, .004), boardMaterials[i % 3])
    mesh.name = 'Tight_wood_board'; mesh.position.set(x, .0865, z)
    mesh.castShadow = true; mesh.receiveShadow = true; walkway.add(mesh)
  }
  for (let i = 0; i < 20; i++) board(0, .14 + i * .248, 1.48, .240, i)
  // 左支線下移，從狗屋後方通往鞦韆入口；右支線沿池邊轉向長椅前方。
  for (let i = 0; i < 14; i++) board(-(.868 + i * .248), 2.45, .240, 1.02, i)
  for (let i = 0; i < 14; i++) board(.868 + i * .248, 1.70, .240, 1.02, i)
  for (let i = 0; i < 10; i++) board(3.718, 2.338 + i * .248, .988, .240, i)

  // 信箱下方回接中央步道，轉角按木板邊緣銜接。
  for (let i = 0; i < 10; i++) board(.868 + i * .248, 4.202, .240, .984, i)

  root.userData.design = 'Rounded garden with fitted wood walkway'
  root.updateMatrixWorld(true)
  return root
}
