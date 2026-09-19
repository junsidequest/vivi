import {describe,it,expect} from 'vitest'
import {PLACES} from './engine.js'
import {nearbyPlace,isTextInput} from './interactions.js'
describe('小屋互動',()=>{
 it('門前、上層階梯與下層階梯皆可互動',()=>{
  for(const z of [-.85,-.35,.14,.4,.95])expect(nearbyPlace(PLACES,{x:0,z})).toBe('services')
 })
 it('屋後、遠處與側邊不觸發小屋',()=>{
  for(const p of [{x:0,z:-2},{x:0,z:1.5},{x:1.2,z:-.35}])expect(nearbyPlace(PLACES,p)).not.toBe('services')
 })
 it('按鈕焦點可使用快捷鍵，文字輸入不被干擾',()=>{
  expect(isTextInput({tagName:'BUTTON'})).toBe(false)
  expect(isTextInput({tagName:'A'})).toBe(false)
  expect(isTextInput({tagName:'INPUT'})).toBe(true)
  expect(isTextInput({tagName:'DIV',isContentEditable:true})).toBe(true)
 })
})
