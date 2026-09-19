import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { buildCC0Island } from './cc0-island.mjs'

// GLTFExporter 使用瀏覽器 FileReader；Node 的 Blob 提供相同的二進位資料。
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result=result; this.onloadend?.() }) }
  readAsDataURL(blob) { blob.arrayBuffer().then(result => {this.result=`data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;this.onloadend?.()}) }
}
const scene=await buildCC0Island()
const bytes=await new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:true})
const out=new URL('../public/3d/vivi-island.glb',import.meta.url)
await mkdir(new URL('../public/3d/',import.meta.url),{recursive:true})
const raw=Buffer.from(bytes),jsonLength=raw.readUInt32LE(12),json=JSON.parse(raw.subarray(20,20+jsonLength))
const chunks=[raw.subarray(28+jsonLength)]
let byteLength=chunks[0].length
json.images=[];json.textures=[];json.samplers=[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}]
for(const [name,file] of [['wood','wood']]){
  const png=await readFile(new URL(`../public/textures/${file}.png`,import.meta.url)),view=json.bufferViews.length
  json.bufferViews.push({buffer:0,byteOffset:byteLength,byteLength:png.length})
  json.images.push({mimeType:'image/png',bufferView:view})
  const texture=json.textures.length;json.textures.push({source:json.images.length-1,sampler:0})
  const material=json.materials.find(m=>m.name===name)
  if(material)material.pbrMetallicRoughness.baseColorTexture={index:texture}
  const pad=Buffer.alloc((4-png.length%4)%4);chunks.push(png,pad);byteLength+=png.length+pad.length
}
json.buffers=[{byteLength}]
const text=Buffer.from(JSON.stringify(json)),padded=Buffer.concat([text,Buffer.alloc((4-text.length%4)%4,32)]),binary=Buffer.concat(chunks)
const glb=Buffer.alloc(28+padded.length+binary.length)
glb.writeUInt32LE(0x46546c67,0);glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);glb.writeUInt32LE(padded.length,12);glb.writeUInt32LE(0x4e4f534a,16);padded.copy(glb,20)
glb.writeUInt32LE(binary.length,20+padded.length);glb.writeUInt32LE(0x004e4942,24+padded.length);binary.copy(glb,28+padded.length)
await writeFile(out,glb)
console.log(`Exported ${out.pathname}: ${(glb.byteLength/1024/1024).toFixed(2)} MB`)
