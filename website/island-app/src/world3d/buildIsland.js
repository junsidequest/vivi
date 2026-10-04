import * as T from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'

// 蜂蜜色木作、陶土圓瓦與奶油石牆；幾何同時供網站與 Blender 使用。
export function buildIsland() {
  const root=new T.Group();root.name='Vivi_Island'
  let seed=48
  const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
  const palette={duckYellow:'#ffd52f',duckBeak:'#ef8c27',shiba:'#bd793e',post:'#547d72',glass:'#7eaaa2',glassLight:'#b9d1b9',grass:'#788c4d',earth:'#927149',sand:'#d1ac73',rock:'#d5c7a7',wood:'#b98b51',dark:'#795731',wall:'#eadbb9',tile:'#b85f46',tileLight:'#c77758',leaf:'#5e793c',leafLight:'#81944d',water:'#69aaa9',cream:'#f2e5be',yellow:'#e7bd6d',black:'#413b28',lamp:'#ffdda0',brick:'#c2a275'}
  const mats=Object.fromEntries(Object.entries(palette).map(([k,c])=>{const m=new T.MeshStandardMaterial({color:c,roughness:.88});m.name=k;return[k,m]}))
  mats.water.roughness=.3;mats.lamp.emissive.set('#ffbd65');mats.lamp.emissiveIntensity=.5
  let group=root
  const part=(name,id,fn)=>{const prev=group;group=new T.Group();group.name=name;if(id)group.userData.interaction=id;prev.add(group);fn();group=prev}
  function mesh(geo,mat,x,y,z,sx=1,sy=1,sz=1){const m=new T.Mesh(geo,mats[mat]);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;group.add(m);return m}
  const box=(mat,x,y,z,w,h,d,r=.08)=>mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/2.1,h/2.1,d/2.1)),mat,x,y,z)
  const ball=(mat,x,y,z,sx,sy=sx,sz=sx)=>mesh(new T.SphereGeometry(1,18,12),mat,x,y,z,sx,sy,sz)
  const cyl=(mat,x,y,z,rt,rb,h,n=24)=>mesh(new T.CylinderGeometry(rt,rb,h,n),mat,x,y,z)
  function roundShape(w,h,r){const s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
  function slab(mat,w,d,top,depth,r){const geo=new T.ExtrudeGeometry(roundShape(w,d,r),{depth,bevelEnabled:true,bevelSize:.08,bevelThickness:.07,bevelSegments:3,curveSegments:12});const m=mesh(geo,mat,0,top-depth-.07,0);m.rotation.x=-Math.PI/2;return m}
  function arch(mat,x,y,z,w,h,d){const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h-w/2);s.absarc(0,h-w/2,w/2,0,Math.PI,false);s.lineTo(-w/2,0);return mesh(new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:3,curveSegments:18}),mat,x,y,z)}
  part('Island_ground',null,()=>{
    slab('earth',12.45,10.45,-.18,.66,1.1)
    slab('sand',12.42,10.42,-.10,.22,1.1)
    slab('grass',12.24,10.24,.065,.2,1.03)
    // 去掉前緣兩端突出圓弧島壁的裝飾塊。
    for(let i=1;i<22;i++){const x=-5.7+i*.51;box(i%3?'earth':'sand',x,-.49,5.18,.49,.23,.10,.055)}
  })
  part('Path_base',null,()=>{
    box('sand',0,.03,2.05,1.63,.1,6.04,.04)
    box('sand',0,.025,.8,10.6,.10,1.18,.04)
  })
  part('Cottage','services',()=>{
    box('brick',0,.22,-2.48,3.66,.44,2.92,.12)
    box('wall',0,1.22,-2.48,3.45,2.35,2.8,.16)
    const shape=new T.Shape();shape.moveTo(-1.73,0);shape.lineTo(1.73,0);shape.lineTo(0,1.2);shape.closePath()
    mesh(new T.ExtrudeGeometry(shape,{depth:2.8,bevelEnabled:false}),'wall',0,2.4,-3.88)
    for(const side of [-1,1]){
      const roof=box('tile',side*.94,2.98,-2.48,2.4,.22,3.5,.10);roof.rotation.z=-side*.6
      for(let row=0;row<6;row++)for(let col=0;col<9;col++){
        const u=.2+row*.36, z=-4.05+col*.385+(row%2)*.025
        const geo=new T.ExtrudeGeometry(roundShape(.44,.34,.13),{depth:.075,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,curveSegments:7})
        geo.rotateX(-Math.PI/2)
        const t=mesh(geo,rnd()>.8?'tileLight':'tile',side*u*Math.cos(.6),3.81+(5-row)*.025-u*Math.sin(.6),z);t.rotation.z=-side*.6

      }
      const fascia=box('wood',side*.99,2.98,-.73,2.51,.20,.2,.09);fascia.rotation.z=-side*.6
      box('wood',side*1.91,2.36,-2.48,.19,.2,3.56,.08)
    }
    for(let i=0;i<10;i++){const ridge=cyl('tileLight',0,3.81,-4.08+i*.36,.14,.14,.39,20);ridge.rotation.x=Math.PI/2}
    box('brick',1.02,3.65,-3.17,.51,1.03,.56,.065)
    for(let j=0;j<4;j++)for(let i=0;i<2;i++)box('rock',.9+i*.25,3.27+j*.22,-2.87,.235,.18,.05,.025)
    box('sand',1.02,4.2,-3.17,.68,.19,.71,.06);box('dark',1.02,4.305,-3.17,.4,.016,.43,.02)
    // 木門的圓拱框、門板與鉸鏈。
    arch('wood',0,.12,-1.15,1.30,1.81,.24)
    arch('dark',0,.15,-.88,1.06,1.53,.045)
    arch('wood',0,.17,-.815,.96,1.46,.035)
    for(let i=-2;i<=2;i++)box('dark',i*.18,.75,-.755,.012,1.07,.008,.003)
    for(const y of [.46,1.1])box('sand',0,y,-.72,.88,.062,.038,.025)
    for(const y of [.48,1.1])box('dark',-.4,y,-.68,.08,.075,.025,.013)
    ball('yellow',.30,.79,-.695,.045)
    for(const side of [-1,1]){
      // 窗框、玻璃與窗櫺各自錯開深度，避免牆面遮蓋及重疊閃爍。
      box('wood',side*1.29,1.20,-1.005,.69,.92,.20,.09)
      box('dark',side*1.29,1.21,-.893,.55,.76,.028,.065)
      box('glass',side*1.29,1.21,-.872,.49,.69,.022,.06)
      box('wood',side*1.29,1.21,-.839,.038,.70,.035,.014)
      box('wood',side*1.29,1.20,-.835,.51,.038,.04,.014)
      const reflection=box('glassLight',side*1.29-.13,1.38,-.852,.034,.16,.005,.01);reflection.rotation.z=-.25
      box('sand',side*1.29,1.72,-.95,.80,.11,.28,.05)
      box('sand',side*1.29,.72,-.89,.80,.13,.38,.055)
      box('wood',side*1.75,1.25,-2.55,.08,.99,.93,.04)
      box('glass',side*1.81,1.25,-2.55,.04,.73,.67,.04)
      box('wood',side*1.84,1.25,-2.55,.045,.07,.72,.02)
      box('wood',side*1.84,1.25,-2.55,.045,.78,.06,.02)
    }
    for(let row=0;row<3;row++)for(let i=0;i<8;i++){
      const x=-1.53+i*.44+(row%2)*.04
      if(Math.abs(x)>.72)box(row%2?'sand':'brick',x,.17+row*.21,-1.09,.42,.19,.14,.038)
    }
    for(const [x,y] of [[-1.6,1.8],[-.94,1.95],[.92,1.91],[1.57,1.78],[-.74,2.29],[.77,2.32]])box('rock',x,y,-1.085,.25,.12,.055,.025)
    for(const x of [-.82,.82]){
      box('wood',x,1.35,-.93,.18,.32,.2,.04)
      box('lamp',x,1.35,-.81,.12,.21,.06,.023)
      box('sand',x,1.55,-.92,.25,.08,.24,.03)
    }
  })
  const tree=(x,z,s=1)=>{
    const branch=(points,r)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(([a,b,c])=>new T.Vector3(x+a*s,b*s,z+c*s))),16,r*s,12,false),'wood',0,0,0)
    branch([[0,.04,0],[-.08,.55,.025],[.03,1.05,0],[.14,1.72,-.06]],.16)
    for(const [dx,dz,y] of [[-.65,.1,1.9],[.7,.08,2.15],[.08,-.5,2.4]])branch([[0,.75,0],[dx*.3,1.25,dz*.3],[dx,y,dz]],.075)
    for(let i=0;i<4;i++){const a=i*1.57;const r=ball('wood',x+Math.cos(a)*.18*s,.10*s,z+Math.sin(a)*.18*s,.27*s,.1*s,.11*s);r.rotation.y=-a}
    // 不對稱、分層的寬闊樹冠；用柔和起伏塑形，保留枝幹間的空隙。
    const crowns=[[-.64,1.96,.1,.65,.48,.58],[.57,2.18,.1,.72,.53,.58],[.05,2.58,-.28,.69,.52,.60],[-.37,2.50,-.15,.5,.4,.45],[.09,2.12,.40,.55,.44,.45]]
    crowns.forEach(([dx,y,dz,w,h,d],index)=>{
      const geo=new T.SphereGeometry(1,28,20),pos=geo.attributes.position
      for(let i=0;i<pos.count;i++){
        const px=pos.getX(i),py=pos.getY(i),pz=pos.getZ(i)
        const ripple=1+.025*Math.sin(px*5+index)*Math.sin(py*4+pz*4)+.012*Math.cos(pz*7+px*3)
        pos.setXYZ(i,px*ripple,py*ripple,pz*ripple)
      }
      geo.computeVertexNormals()
      const crown=mesh(geo,index%3?'leaf':'leafLight',x+dx*s,y*s,z+dz*s,w*s,h*s,d*s);crown.rotation.y=index*.8
    })
  }
  part('Trees_and_shrubs',null,()=>{tree(-4.25,-2.7);tree(3.7,-3.2,1.08)})
  part('Pond','duck',()=>{
    const rim=cyl('sand',4,.055,-.4,1.40,1.44,.14,64);rim.scale.z=.93
    const water=cyl('water',4,.13,-.4,1.17,1.17,.055,64);water.scale.z=.91
    // 縮短相鄰石塊的間距並交疊邊緣，圍成沒有缺口的池岸。
    for(let i=0;i<24;i++){const a=i/24*Math.PI*2;const stone=box('rock',4+1.29*Math.cos(a),.19,-.4+1.16*Math.sin(a),.53,.32,.48,.14);stone.rotation.y=-a}
    const lily=mesh(new T.CylinderGeometry(.31,.31,.024,32,1,false,.25,5.75),'leafLight',4.36,.173,-.69);lily.rotation.y=.8
    part('Duck',null,()=>{
      ball('duckYellow',3.7,.32,-.3,.26,.2,.17);ball('duckYellow',3.9,.52,-.3,.15)
      box('duckBeak',4.07,.49,-.3,.18,.07,.12,.035);ball('black',3.97,.56,-.17,.026)
      ball('duckYellow',3.65,.36,-.15,.17,.09,.055)
    })
  })
  part('Notice_board','about',()=>{
    for(const x of [-3.59,-2.17]){cyl('wood',x,.65,-.6,.085,.10,1.3);ball('sand',x,1.31,-.6,.12,.07,.12)}
    box('wood',-2.88,1.02,-.6,1.7,.85,.17,.08)
    box('dark',-2.88,1.02,-.493,1.47,.64,.04,.025)
    for(let i=0;i<3;i++){const x=-3.36+i*.48;box('cream',x,1.04,-.46,.39,.52,.024,.024);ball('yellow',x,1.24,-.435,.025);for(let j=0;j<3;j++)box('sand',x,1.07-j*.085,-.435,.24,.012,.006,.002)}
    for(let i=0;i<7;i++)box(i%3?'tile':'tileLight',-3.63+i*.25,1.5,-.6,.29,.15,.61,.09)
  })
  part('Mailbox','contact',()=>{
    cyl('sand',1.85,.13,3.18,.22,.25,.14)
    box('wood',1.85,.55,3.18,.13,.86,.13,.025)
    box('post',1.85,1.12,3.18,.68,.58,.48,.07)
    box('cream',1.85,1.11,3.435,.56,.45,.025,.04)
    for(const side of [-1,1]){
      const roof=box('tile',1.85+side*.185,1.49,3.18,.46,.075,.65,.025)
      roof.rotation.z=-side*.40
    }
    box('dark',1.85,1.25,3.458,.37,.043,.022,.009)
    box('post',1.85,1.04,3.459,.26,.15,.018,.01)
    for(const side of [-1,1]){
      const fold=box('cream',1.85+side*.061,1.07,3.472,.15,.012,.007,.002)
      fold.rotation.z=side*.53
    }
    ball('yellow',2.055,1.03,3.463,.027,.027,.018)
  })
  part('Stone_path',null,()=>{
    // 先建立不規則多邊形，再倒角；每顆的長寬、頂點數與方向各自不同。
    const stone=(x,z,w,d)=>{
      const n=5+Math.floor(rnd()*4),points=[]
      for(let i=0;i<n;i++){const a=(i+(rnd()-.5)*.25)/n*Math.PI*2,r=.80+rnd()*.20;points.push(new T.Vector2(Math.cos(a)*w*r,Math.sin(a)*d*r))}
      const shape=new T.Shape(points),thickness=.04+rnd()*.018
      const geo=new T.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelSize:.035,bevelThickness:.014,bevelSegments:3,curveSegments:1})
      geo.rotateX(-Math.PI/2)
      const m=mesh(geo,rnd()>.82?'cream':'rock',x,.076,z);m.rotation.y=(rnd()-.5)*1.25
    }
    for(let j=0;j<9;j++)for(let i=0;i<2;i++){
      const x=(i-.5)*.68+(rnd()-.5)*.13,z=.08+j*.55+(rnd()-.5)*.11
      stone(x,z,.23+rnd()*.11,.18+rnd()*.085)
    }
    for(const side of [-1,1])for(let i=0;i<5;i++)stone(side*(1.13+i*.58)+(rnd()-.5)*.08,.80+(rnd()-.5)*.15,.21+rnd()*.07,.21+rnd()*.06)
  })
  part('Steps',null,()=>{box('sand',0,.115,.14,1.47,.20,.56,.08);box('rock',0,.18,-.35,1.42,.33,.64,.065)})
  part('Dock','dock',()=>{
    // 保留延伸橋面；畫面的下方邊界由鏡頭限制，不裁切橋樑模型。
    for(let i=0;i<60;i++){
      const z=5.2066666667+i*(2.6/6)
      box('wood',0,.02,z,1.5,.16,2.6/6-.015,.04)
      for(const x of [-.59,.59])cyl('dark',x,.105,z,.022,.022,.01,8)
      for(const offset of [-.11,.11])box('sand',0,.101,z+offset,1.30,.004,.012,.002)
    }
    for(const x of [-.56,.56])for(const z of [5.3,7.2])cyl('dark',x,-.42,z,.09,.1,1)
  })
  function lantern(x,z){
    // 圓角庭園燈：奶油石座、細綠色燈柱與暖色四面燈罩。
    box('rock',x,.14,z,.42,.15,.42,.065)
    box('post',x,.25,z,.23,.16,.23,.045)
    box('post',x,.68,z,.105,.78,.105,.025)
    box('sand',x,1.035,z,.16,.055,.16,.018)
    box('post',x,1.10,z,.37,.09,.37,.035)
    box('lamp',x,1.32,z,.28,.36,.28,.045)
    for(const dx of [-.155,.155])for(const dz of [-.155,.155]){
      box('post',x+dx,1.32,z+dz,.035,.40,.035,.012)
    }
    box('post',x,1.54,z,.46,.105,.46,.05)
    box('post',x,1.61,z,.31,.10,.31,.045)
    ball('sand',x,1.695,z,.045,.055,.045)
  }
  part('Garden_details',null,()=>{lantern(-5.65,-.35);lantern(5.75,1.50)})
  part('Fence',null,()=>{
    for(const side of [-1,1]){
      for(let i=0;i<4;i++){const x=side*(2.2+i*.88);cyl('wood',x,.42,-4.35,.09,.1,.72);cyl('sand',x,.8,-4.35,.13,.13,.07)}
      for(const y of [.3,.59])box('wood',side*3.53,y,-4.35,2.75,.14,.095,.04)
    }
  })
  // 各區域以實際可用的庭院設施組成，中央通道維持開放。
  const bench=(x,z,angle=0)=>{
    const parent=group;const local=new T.Group();local.position.set(x,0,z);local.rotation.y=angle;parent.add(local);group=local
    local.name="Garden_bench";local.userData.seat={label:"長椅",point:[0,.5475,-.06],stand:[0,0,-.72],backLimit:.1875,frontEdge:-.235,halfWidth:.81,entryWidth:.55,entryDepth:.22}
    for(const px of [-.62,.62]){box('post',px,.29,0,.13,.44,.45,.045);box('post',px,.64,.21,.09,.77,.09,.035)}
    for(let i=0;i<3;i++)box('wood',0,.50,-.16+i*.16,1.62,.095,.15,.035)
    for(let i=0;i<2;i++)box('wood',0,.76+i*.17,.23,1.58,.14,.085,.04)
    for(const px of [-.75,.75])box('wood',px,.69,-.01,.10,.08,.48,.035)
    group=parent
  }
  const hedge=(x,z,w,d)=>{
    box('sand',x,.14,z,w+.14,.16,d+.14,.14)
    box('leaf',x,.38,z,w,.44,d,.24)
    box('leafLight',x-.02,.54,z-.015,w*.91,.18,d*.85,.12)
  }
  part('Waiting_garden',null,()=>{
    // 整組鞦韆以座椅為中心，斜向朝向右下角。
    const garden=group,swing=new T.Group();swing.name='Swing';swing.userData.seat={label:'盪鞦韆',point:[0,.585,-.12],stand:[0,0,-.92],entryWidth:.30,entryDepth:.16,backLimit:.165,frontEdge:-.415,motion:'Swing_suspended'};garden.add(swing);group=swing
    // 雙側 A 字木架、固定吊繩及圓角座椅，構成完整的庭院盪鞦韆。
    const beam=(a,b,r,material='wood')=>{
      const start=new T.Vector3(...a),end=new T.Vector3(...b),direction=end.clone().sub(start)
      const pole=cyl(material,...start.clone().add(end).multiplyScalar(.5).toArray(),r,r,direction.length())
      pole.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize())
    }
    for(const x of [-4.43,-2.57]){
      for(const z of [2.56,3.70]){
        beam([x,.12,z],[x,2.13,3.13],.085)
        ball('sand',x,.12,z,.13,.07,.13)
      }
      beam([x,.72,2.73],[x,.72,3.53],.055)
    }
    beam([-4.58,2.13,3.13],[-2.42,2.13,3.13],.115)
    for(const x of [-4.04,-2.96])ball('sand',x,2.13,3.13,.13)
    const suspended=new T.Group();suspended.name='Swing_suspended';swing.add(suspended);group=suspended
    for(const x of [-4.04,-2.96])for(const z of [2.88,3.28])beam([x,2.04,3.13],[x,.56,z],.018,'cream')
    for(let i=0;i<4;i++)box('wood',-3.5,.53,2.79+i*.16,1.28,.11,.15,.045)
    box('post',-3.5,.79,3.34,1.28,.39,.09,.045)
    for(const x of [-4.07,-2.93])box('post',x,.68,3.04,.09,.075,.61,.03)
    const suspension=new T.Vector3(-3.5,2.04,3.13)
    for(const child of suspended.children)child.position.sub(suspension)
    suspended.position.copy(suspension);group=swing
    const pivot=new T.Vector3(-3.5,0,3.13)
    for(const child of swing.children)child.position.sub(pivot)
    swing.position.set(-4.8,0,3.45);swing.rotation.y=-Math.PI+Math.atan2(3.5,5.61)
    group=garden
    // 書刊箱位於佈告欄左側。
    box('post',-4.30,.39,-.60,.40,.64,.36,.055)
    box('sand',-4.30,.74,-.60,.48,.08,.44,.04)
    box('dark',-4.30,.51,-.40,.29,.18,.012,.025)
    for(let i=0;i<3;i++)box(i%2?'cream':'tileLight',-4.40+i*.10,.50,-.375,.073,.15,.025,.007)
    // 鞦韆左側保留空地。
  })
  part('Pond_rest',null,()=>{
    bench(4.65,2.90,Math.PI/2)
    hedge(5.75,2.82,.36,1.86)
    // 水邊維護用品集中於後側，與散步路線分開。
    cyl('post',5.08,.32,-2.36,.19,.16,.42)
    const handle=mesh(new T.TorusGeometry(.18,.026,10,24),'wood',5.08,.49,-2.36);handle.rotation.y=Math.PI/2
    const spout=mesh(new T.CylinderGeometry(.045,.065,.33,16),'post',4.89,.44,-2.36);spout.rotation.z=-.7
    hedge(4.89,-4.40,1.38,.36)
  })
  part('Dog_house',null,()=>{
    group.position.set(-4.52,0,.05)
    // 奶油色小狗屋，圓角陶土屋頂與深色拱門。
    box('wood',2.72,.14,3.95,1.05,.15,.88,.06)
    // 空心屋身與真正的拱形開口，讓狗待在屋內。
    box('cream',2.72,.54,3.62,.92,.77,.10,.035)
    for(const x of [2.31,3.13])box('cream',x,.54,3.95,.10,.77,.76,.035)
    const front=new T.Shape();front.moveTo(-.46,.155);front.lineTo(.46,.155);front.lineTo(.46,.925);front.lineTo(-.46,.925);front.closePath()
    const opening=new T.Path();opening.moveTo(-.215,.175);opening.lineTo(-.215,.545);opening.absarc(0,.545,.215,Math.PI,0,true);opening.lineTo(.215,.175);opening.closePath();front.holes.push(opening)
    mesh(new T.ExtrudeGeometry(front,{depth:.065,bevelEnabled:true,bevelSize:.013,bevelThickness:.012,bevelSegments:3,curveSegments:20}),'cream',2.72,0,4.285)
    box('dark',2.72,.22,3.96,.70,.025,.62,.025)
    box('wood',2.72,.185,4.40,.55,.07,.20,.035)
    for(const side of [-1,1]){
      const roof=box('tile',2.72+side*.28,1.01,3.95,.70,.13,1.03,.06)
      roof.rotation.z=-side*.48
    }
    const ridge=cyl('tileLight',2.72,1.17,3.95,.08,.08,1.04,20);ridge.rotation.x=Math.PI/2
    // 門上方的骨頭形銘牌。
    box('sand',2.72,.88,4.36,.19,.055,.035,.025)
    for(const x of [2.61,2.83])for(const y of [.858,.902])ball('sand',x,y,4.36,.042,.036,.025)
    // 赤柴：立耳、飽滿臉頰、白色裏白毛與捲尾。
    ball('shiba',2.72,.33,4.13,.14,.12,.235)
    ball('cream',2.72,.30,4.30,.105,.078,.105)
    for(const x of [2.64,2.80])ball('cream',x,.255,4.44,.057,.042,.11)
    ball('shiba',2.72,.45,4.385,.164,.14,.13)
    for(const side of [-1,1]){
      const earShape=new T.Shape();earShape.moveTo(-.055,0);earShape.quadraticCurveTo(-.063,.055,-.028,.145);earShape.quadraticCurveTo(.005,.155,.061,0);earShape.closePath()
      const ear=mesh(new T.ExtrudeGeometry(earShape,{depth:.043,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:3,curveSegments:12}),'shiba',2.72+side*.105,.537,4.36)
      ear.rotation.z=-side*.18
      const inset=new T.Shape();inset.moveTo(-.028,.023);inset.lineTo(-.016,.102);inset.quadraticCurveTo(.013,.068,.032,.023);inset.closePath()
      const inner=mesh(new T.ExtrudeGeometry(inset,{depth:.004,bevelEnabled:true,bevelSize:.004,bevelThickness:.002,bevelSegments:2}),'sand',2.72+side*.105,.537,4.411);inner.rotation.z=-side*.18
      ball('cream',2.72+side*.080,.414,4.485,.077,.059,.043)
      const eye=ball('black',2.72+side*.068,.487,4.503,.017,.011,.009);eye.rotation.z=side*.16
      ball('cream',2.72+side*.066,.516,4.498,.021,.010,.008)
      ball('cream',2.72+side*.064,.490,4.511,.0035)
    }
    ball('cream',2.72,.414,4.516,.080,.049,.052)
    ball('black',2.72,.443,4.562,.024,.016,.014)
    const mouth=new T.CatmullRomCurve3([new T.Vector3(2.675,.405,4.555),new T.Vector3(2.72,.394,4.562),new T.Vector3(2.765,.405,4.555)])
    mesh(new T.TubeGeometry(mouth,12,.004,6,false),'dark',0,0,0)
    mesh(new T.TorusGeometry(.075,.035,12,24,Math.PI*1.8),'shiba',2.79,.435,3.99)
  })
  part('Entry_details',null,()=>{
    // 碼頭入口的雙柱，不占用棧道中線。
    for(const x of [-.98,.98]){cyl('wood',x,.39,4.88,.08,.10,.65);ball('sand',x,.73,4.88,.12,.085,.12)}
  })
  part('Garden_hedges',null,()=>{
    // 沿邊界延續既有長方形綠籬，保留散步區與設施前方的空間。
    hedge(-5.65,-1.80,.38,1.65)
    hedge(-5.65,.75,.42,.90)
    hedge(5.75,-3.40,.38,1.18)
    hedge(5.75,-.45,.32,1.40)
    hedge(2.72,-4.68,.90,.30)
  })
  part('House_details',null,()=>{
    for(let i=0;i<3;i++){const log=cyl('wood',-2.18+i*.19,.20,-3.58,.09,.09,.62,20);log.rotation.x=Math.PI/2}
    for(let i=0;i<2;i++){const log=cyl('sand',-2.08+i*.19,.36,-3.58,.085,.085,.61,20);log.rotation.x=Math.PI/2}
    hedge(-4.62,-4.43,1.85,.36)
  })
  // 合併同一物件、同一材質的網格，降低手機上的 draw calls；互動群組仍各自保留。
  function pack(g) {
    for(const child of [...g.children])if(child.isGroup)pack(child)
    const bins=new Map()
    for(const child of [...g.children])if(child.isMesh){child.updateMatrix();const geo=(child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone()).applyMatrix4(child.matrix);const list=bins.get(child.material)||[];list.push(geo);bins.set(child.material,list);child.geometry.dispose();g.remove(child)}
    for(const [mat,geos] of bins){const raw=mergeGeometries(geos);const merged=mergeVertices(raw);raw.dispose();const m=new T.Mesh(merged,mat);m.name=g.name+'_'+mat.color.getHexString();m.castShadow=true;m.receiveShadow=true;g.add(m);geos.forEach(geo=>geo.dispose())}
  }
  pack(root)
  // 黏土表面的微小色差會一同匯入 Blender，不依賴網站特製材質。
  root.traverse(o=>{
    if(!o.isMesh)return
    const pos=o.geometry.attributes.position,normal=o.geometry.attributes.normal,colors=new Float32Array(pos.count*3)
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i)
      const noise=Math.sin(x*47.3+y*31.7+z*43.1)*Math.sin(x*19.1-z*17.4)
      const shade=.96+noise*.025+normal.getY(i)*.01
      colors[i*3]=shade;colors[i*3+1]=shade;colors[i*3+2]=shade
    }
    if(o.material.name==='grass'){const uv=new Float32Array(pos.count*2);for(let i=0;i<pos.count;i++){uv[i*2]=pos.getX(i)*.7;uv[i*2+1]=pos.getZ(i)*.7}o.geometry.setAttribute('uv',new T.BufferAttribute(uv,2))}
    o.geometry.setAttribute('color',new T.BufferAttribute(colors,3));o.material.vertexColors=true
  })
  const duck=root.getObjectByName('Duck')
  duck.traverse(o=>{if(o.isMesh)o.geometry.translate(-3.8,0,.3)})
  duck.position.set(3.8,0,-.3)
  return root
}
