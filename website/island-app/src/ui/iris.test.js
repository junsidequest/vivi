import { it, expect, vi } from 'vitest'
import { closeIris, disposeIris } from './iris.js'

it('低幀率不會跳過圓形收黑，遮罩保持最高層級且完成後全暗', async () => {
  let frame, node
  vi.stubGlobal('innerWidth',390);vi.stubGlobal('innerHeight',844)
  vi.stubGlobal('requestAnimationFrame',fn=>{frame=fn;return 1})
  vi.stubGlobal('cancelAnimationFrame',()=>{})
  vi.stubGlobal('document',{createElement:()=>node={style:{},dataset:{},setAttribute(){},remove(){}},body:{appendChild(){}}})
  try {
    let done=false
    const animation=closeIris(195,420,200).then(()=>{done=true})
    frame(1000);frame(4000)
    await Promise.resolve()
    expect(done).toBe(false)
    expect(node.style.background).toContain('circle at 195px 420px')
    expect(node.style.cssText).toContain('z-index:100')
    frame(4050);frame(4100);frame(4150)
    await animation
    expect(node.style.background).toContain('transparent 0px, #241c14 0px')
  } finally {disposeIris();vi.unstubAllGlobals()}
})
