import {describe,it,expect} from 'vitest'
import {createPixelHints} from './pixelHints.js'
const points={about:{x:0,z:0},contact:{x:10,z:0}}
function setup(){const hints=createPixelHints(points);let state;return {hints,step(seconds,extra={}){for(let i=0;i<Math.round(seconds*100);i++)state=hints.tick({dt:.01,moving:false,x:5,z:5,near:null,...extra});return state}}}
describe('沿用 pixel 提示時序',()=>{
 it('開場延遲 1.3 秒並停留 6.5 秒',()=>{const c=setup();expect(c.step(1.29).say).toBeNull();expect(c.step(.02).say).toContain('陳盈臻');expect(c.step(6.51).say).toBeNull()})
 it('走動顯示 3.5 秒、隱藏 9 秒，停走 2.5 秒休眠',()=>{const c=setup();expect(c.step(.01,{moving:true}).peek).not.toBeNull();expect(c.step(3.51,{moving:true}).peek).toBeNull();expect(c.step(9.01,{moving:true}).peek).not.toBeNull();expect(c.step(2.51).peek).toBeNull()})
 it('靠近時保持圖示，選單帶路後直到走開才恢復提示',()=>{const c=setup();expect(c.step(.1,{x:1,z:0}).approach).toBe('about');c.hints.suppress('about');expect(c.step(.1,{autoWalking:true}).suppress).toBe('about');expect(c.step(.1,{near:'about'}).suppress).toBe('about');expect(c.step(.1).suppress).toBeNull()})
 it('招呼結束後靜止 30 秒出現閒置語錄，持續 4 秒',()=>{const c=setup();c.step(8);expect(c.step(29).say).toBeNull();expect(c.step(1.1).say).toContain('郵筒');expect(c.step(4.1).say).toBeNull()})
 it('小屋互動提示與彈窗不被閒置語錄覆蓋',()=>{const c=setup();c.step(8);expect(c.step(40,{near:'services'}).say).toBeNull();expect(c.step(40,{paused:true}).say).toBeNull()})
 it('鴨子台詞走出互動範圍就消失',()=>{const c=setup();c.step(8);c.hints.interactDuck();expect(c.step(.1,{near:'duck'}).say).not.toBeNull();expect(c.step(.1).say).toBeNull()})
})
