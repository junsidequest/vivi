import { it, expect } from 'vitest'
import * as T from 'three'
import { maxFollowZ } from './cameraBounds.js'

it.each([[390,844,5.2],[1280,720,4.6],[844,390,4.6]])('鏡頭下移上限在 %s×%s 保留箭頭下方 20px', (width,height,half)=>{
  const marker=[0,.16,7.3], target=new T.Vector3(0,.6,maxFollowZ(marker,.6,half,height))
  const camera=new T.OrthographicCamera(-half*width/height,half*width/height,half,-half,.1,100)
  camera.position.copy(target).add(new T.Vector3(0,14,14));camera.lookAt(target);camera.updateMatrixWorld()
  const point=new T.Vector3(...marker).project(camera)
  const buttonBottom=(1-point.y)*height/2+32
  expect(height-buttonBottom).toBeCloseTo(20,5)
})
