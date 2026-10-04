"""將頭髮三角形改用同一個 PBR 材質，保留幾何、貼圖與骨架。"""
import json,struct,io,math
from pathlib import Path
from PIL import Image
path=Path(__file__).resolve().parents[1]/'public/3d/vivi-detailed.glb'
raw=path.read_bytes();size=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+size]);binary=bytearray(raw[28+size:])
def read_accessor(i):
 a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];count={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];fmt={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']];stride=v.get('byteStride',struct.calcsize('<'+fmt*count));off=v.get('byteOffset',0)+a.get('byteOffset',0)
 return [struct.unpack_from('<'+fmt*count,binary,off+j*stride) for j in range(a['count'])]
matidx=next(i for i,m in enumerate(doc['materials']) if m.get('name')=='Material_1')
texture=doc['textures'][doc['materials'][matidx]['pbrMetallicRoughness']['baseColorTexture']['index']]
view=doc['bufferViews'][doc['images'][texture['source']]['bufferView']];start=view.get('byteOffset',0);im=Image.open(io.BytesIO(binary[start:start+view['byteLength']])).convert('RGB')
def sample(uv):return im.getpixel((min(im.width-1,max(0,int(uv[0]*im.width))),min(im.height-1,max(0,int(uv[1]*im.height)))))
def hair(position,color):
 x,y,z=position;r,g,b=color
 region=y>.74 or (y>.56 and (abs(x)>.15 or z<.02)) or (y>.40 and z<-.10)
 brown=r>g*1.15 and r>b*1.18 and 40<r<185 and g<125
 return region and (brown or y>.90)
def linear(c):c=c/255;return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
hairmat=len(doc['materials']);doc['materials'].append({'name':'Vivi_Hair_Uniform_Brown','pbrMetallicRoughness':{'baseColorFactor':[linear(99),linear(59),linear(42),1],'roughnessFactor':.84,'metallicFactor':0},'doubleSided':True})
def add_indices(indices):
 binary.extend(b'\x00'*((-len(binary))%4));off=len(binary);data=struct.pack('<'+'I'*len(indices),*indices);binary.extend(data)
 view=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':len(data),'target':34963})
 acc=len(doc['accessors']);doc['accessors'].append({'bufferView':view,'componentType':5125,'count':len(indices),'type':'SCALAR','min':[min(indices)],'max':[max(indices)]});return acc
def compact_primitive(primitive,indices,material):
 used=sorted(set(indices));remap={v:i for i,v in enumerate(used)};attributes={}
 for name,accessor_id in primitive['attributes'].items():
  old=doc['accessors'][accessor_id];values=read_accessor(accessor_id);selected=[values[i] for i in used];fmt={5126:'f',5125:'I',5123:'H',5121:'B'}[old['componentType']]
  data=struct.pack('<'+fmt*sum(len(v) for v in selected),*(value for row in selected for value in row))
  binary.extend(b'\x00'*((-len(binary))%4));offset=len(binary);binary.extend(data);view=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(data),'target':34962})
  acc={k:v for k,v in old.items() if k in ['componentType','type','normalized']};acc.update(bufferView=view,count=len(used))
  if name=='POSITION':acc.update(min=[min(row[k] for row in selected) for k in range(3)],max=[max(row[k] for row in selected) for k in range(3)])
  attributes[name]=len(doc['accessors']);doc['accessors'].append(acc)
 return {**primitive,'attributes':attributes,'indices':add_indices([remap[v] for v in indices]),'material':material}
hair_count=0
for mesh in doc['meshes']:
 result=[]
 for primitive in mesh['primitives']:
  if primitive.get('material')!=matidx:result.append(primitive);continue
  pos=read_accessor(primitive['attributes']['POSITION']);uv=read_accessor(primitive['attributes']['TEXCOORD_0']);indices=[v[0] for v in read_accessor(primitive['indices'])];hair_faces=[];body_faces=[]
  for i in range(0,len(indices),3):
   tri=indices[i:i+3];centroid=tuple(sum(pos[v][a] for v in tri)/3 for a in range(3));tex=tuple(sum(uv[v][a] for v in tri)/3 for a in range(2));is_hair=hair(centroid,sample(tex))
   (hair_faces if is_hair else body_faces).extend(tri)
  result.extend([compact_primitive(primitive,body_faces,matidx),compact_primitive(primitive,hair_faces,hairmat)]);hair_count+=len(hair_faces)//3
 mesh['primitives']=result
binary.extend(b'\x00'*((-len(binary))%4));doc['buffers']=[{'byteLength':len(binary)}];encoded=json.dumps(doc,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
output=struct.pack('<III',0x46546c67,2,28+len(encoded)+len(binary))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(binary),0x004e4942)+binary
path.write_bytes(output);print(f'Unified material on {hair_count} hair triangles; geometry and skin weights preserved.')
