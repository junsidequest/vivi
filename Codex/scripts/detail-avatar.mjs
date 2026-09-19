import fs from 'node:fs/promises'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { detailAvatar } from '../src/world3d/detailAvatar.js'
globalThis.ProgressEvent=class{constructor(type,values){Object.assign(this,{type},values)}}
globalThis.FileReader=class{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.()})}}
const raw=await fs.readFile(new URL('../public/3d/vivi.glb',import.meta.url))
const length=raw.readUInt32LE(12),original=JSON.parse(raw.subarray(20,20+length)),bin=raw.subarray(28+length)
const json=structuredClone(original)
delete json.images;delete json.textures
json.materials=json.materials.map(m=>({name:m.name}))
json.buffers[0].uri=`data:application/octet-stream;base64,${bin.toString('base64')}`
const gltf=await new GLTFLoader().parseAsync(JSON.stringify(json),'')
detailAvatar(gltf.scene)
const exported=Buffer.from(await new GLTFExporter().parseAsync(gltf.scene,{binary:true,animations:gltf.animations}))
const n=exported.readUInt32LE(12),out=JSON.parse(exported.subarray(20,20+n)),meshBin=exported.subarray(28+n)
const offset=meshBin.length
out.images=original.images.map(image=>{
  const view=original.bufferViews[image.bufferView]
  out.bufferViews.push({...view,buffer:0,byteOffset:offset+(view.byteOffset||0)})
  return {...image,bufferView:out.bufferViews.length-1}
})
out.textures=original.textures;out.samplers=original.samplers
const materialIndex=out.materials.findIndex(m=>m.name===original.materials[0].name)
out.materials[materialIndex]=structuredClone(original.materials[0])
out.materials[materialIndex].pbrMetallicRoughness.roughnessFactor=.72
out.materials[materialIndex].pbrMetallicRoughness.metallicFactor=0
out.materials[materialIndex].emissiveFactor=[.035,.035,.035]
delete out.materials[materialIndex].extensions
out.buffers=[{byteLength:offset+bin.length}]
const payload=Buffer.from(JSON.stringify(out)),padding=(4-payload.length%4)%4,jsonBin=Buffer.concat([payload,Buffer.alloc(padding,32)]),fullBin=Buffer.concat([meshBin,bin,Buffer.alloc((4-(offset+bin.length)%4)%4)])
const result=Buffer.alloc(28+jsonBin.length+fullBin.length)
result.writeUInt32LE(0x46546c67,0);result.writeUInt32LE(2,4);result.writeUInt32LE(result.length,8);result.writeUInt32LE(jsonBin.length,12);result.writeUInt32LE(0x4e4f534a,16);jsonBin.copy(result,20)
result.writeUInt32LE(fullBin.length,20+jsonBin.length);result.writeUInt32LE(0x004e4942,24+jsonBin.length);fullBin.copy(result,28+jsonBin.length)
await fs.writeFile(new URL('../public/3d/vivi-detailed.glb',import.meta.url),result)
console.log(`Detailed avatar: ${(result.length/1024/1024).toFixed(2)} MB`)
