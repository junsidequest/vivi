import { describe, it, expect } from 'vitest'
import { resolveRoute } from './routes.js'

describe('獨立頁面與舊網址相容', () => {
  for (const base of ['/', '/vivi/']) {
    it(`${base} 下的三個入口與靜態 HTML`, () => {
      for (const [path,view] of [['','welcome'],['island/','island'],['about/','professional']]) {
        const url=`https://example.com${base}${path}`
        expect(resolveRoute(url)).toEqual({base,view,canonical:base+path,redirect:false})
        expect(resolveRoute(url+'index.html').canonical).toBe(base+path)
      }
    })
    it(`${base} 舊參數保留課程錨點與其他參數`, () => {
      expect(resolveRoute(`https://example.com${base}?view=professional#offers`)).toMatchObject({canonical:base+'about/#offers',redirect:true})
      expect(resolveRoute(`https://example.com${base}?view=island&debug=1`)).toMatchObject({canonical:base+'island/?debug=1',redirect:true})
      expect(resolveRoute(`https://example.com${base}about#offers`)).toMatchObject({canonical:base+'about/#offers',redirect:true})
    })
  }
})
