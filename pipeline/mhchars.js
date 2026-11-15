// ---------- mhchars: near townsfolk are MakeHuman people (CC0/CC-BY, generated in Blender with MPFB) ----------
// The player keeps the Quaternius body and tracksuit. Everyone else near the camera keeps an invisible Quaternius rig, so
// chars/clothes/fixgear behaviour and clips are untouched; a MakeHuman body is posed from that rig every frame.
// Retarget: MPFB's game_engine rig has the UAL bone names. Each MakeHuman bone is first swung to point where the UAL bone
// points at rest, then follows the UAL bone's world rotation change from its rest pose.
// One person, one body: a look names its MakeHuman body (look.mh) from the moment it is made, and the far instanced figure is
// coloured, dressed and sized from that body, with the same per-person tint the near shader applies.
const MH={ready:false,busy:false,vars:[],by:{},all:[],cnt:{},seq:0,on:[],ms:0,n:0,
  meta:/*MH_META*/[]};
MH.meta.forEach((m,k)=>{if(m.player)return;MH.all.push(k);(MH.by[m.sex+m.age]||(MH.by[m.sex+m.age]=[])).push(k);});
// MakeHuman textures are far darker than the game's flat colours and go black in shade: lift the dark tones
const MH_LIFT='diffuseColor.rgb=pow(diffuseColor.rgb,vec3(.6))*1.5;',MH_FAR_H=1.756;// top of the instanced figure's hair at look.s=1
const MH_LIN=Float32Array.from({length:256},(_,i)=>{const c=i/255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);});
// body regions: 0 head, 1 hand, 3 upper arm, 4 forearm by heaviest bone; the trunk and legs by where the cloth is: 2 the middle of the
// trunk from the navel up (its sides go with the upper arm: braces, shoulders), 5 hips, 6 thigh, 7 calf, 8 foot
const MH_BONE=[['head',0],['neck',0],['hand',1],['index',1],['middle',1],['ring',1],['pinky',1],['thumb',1],['spine_02',2],['spine_03',2],['clavicle',2],['upperarm',3],['lowerarm',4],['thigh',6],['calf',7],['foot',8],['ball',8]];
// which palette entry colours each part of the instanced figure (PARTS 0..18; the hat goes by its option)
const MH_PART=['hips','top','skin','skin','hair','hair','uarm','fore','skin','uarm','fore','skin','thigh','shin','shoe','thigh','shin','shoe','skirt'];
const MH_DYE=[[.62,.7,.86],[.9,.8,.62],[.66,.8,.68],[.88,.66,.66],[.55,.56,.6],[.8,.72,.86],[.95,.9,.8],[.5,.58,.74]];
// Every mesh of one body in its bind pose: area and mean drawn colour (after the lift) per region, sampled at triangle centres,
// how low it hangs on the legs (hem) and how far down the arm it reaches (0 shoulder, 1 wrist).
function mhMeasure(root){
  root.updateMatrixWorld(true);
  const J={};root.traverse(n=>{if(n.isBone){const p=n.getWorldPosition(new THREE.Vector3());p.x=Math.abs(p.x);J[n.name.toLowerCase()]=p;}});
  const hip=J.thigh_l.y,knee=J.calf_l.y,ankle=J.foot_l.y,S=J.upperarm_l,W=J.hand_l.clone().sub(S),W2=W.lengthSq(),navel=hip+.25*(J.neck_01.y-hip),side=.55*S.x,fwd=Math.sign(J.ball_l.z-J.foot_l.z)||1,chest=J.spine_03.z*fwd;
  const out=[],v=new THREE.Vector3(),e1=new THREE.Vector3(),e2=new THREE.Vector3(),uv=new THREE.Vector2(),cv=document.createElement('canvas'),N=cv.width=cv.height=64,cx=cv.getContext('2d',{willReadFrequently:true});
  root.traverse(o=>{
    if(!o.isSkinnedMesh)return;
    const g=o.geometry,P=g.attributes.position,UV=g.attributes.uv,SI=g.attributes.skinIndex,SW=g.attributes.skinWeight,ix=g.index,n=P.count,pos=new Float32Array(n*3),reg=new Uint8Array(n);
    const br=o.skeleton.bones.map(b=>{const nm=b.name.toLowerCase(),e=MH_BONE.find(e=>nm.startsWith(e[0]));return e?e[1]:5;});
    let y0=1e9,y1=-1e9;
    for(let i=0;i<n;i++){let b=0,w=-1;for(let j=0;j<4;j++)if(SW.getComponent(i,j)>w){w=SW.getComponent(i,j);b=SI.getComponent(i,j);}
      reg[i]=br[b];o.getVertexPosition(i,v).applyMatrix4(o.matrixWorld);v.toArray(pos,i*3);y0=Math.min(y0,v.y);y1=Math.max(y1,v.y);}
    const map=o.material.map,col=o.material.color||{r:1,g:1,b:1};let px=null,blind=false;
    if(map&&UV)try{cx.clearRect(0,0,N,N);cx.drawImage(map.image,0,0,N,N);px=cx.getImageData(0,0,N,N).data;map.updateMatrix();}catch(e){blind=true;}
    const A=new Float64Array(9),T=new Float64Array(9),Hs=Array.from({length:9},()=>({}));let tot=0,clear=0,hem=1e9,reach=-1e9;
    for(let t=0,m=ix?ix.count:n;t<m;t+=3){
      const a=ix?ix.getX(t):t,b=ix?ix.getX(t+1):t+1,c=ix?ix.getX(t+2):t+2;
      e1.set(pos[b*3]-pos[a*3],pos[b*3+1]-pos[a*3+1],pos[b*3+2]-pos[a*3+2]);e2.set(pos[c*3]-pos[a*3],pos[c*3+1]-pos[a*3+1],pos[c*3+2]-pos[a*3+2]);
      const ar=e1.cross(e2).length()/2,y=(pos[a*3+1]+pos[b*3+1]+pos[c*3+1])/3,low=reg[a]>4,trunk=low?y>=navel:reg[a]===2,
        r=trunk?Math.abs(pos[a*3]+pos[b*3]+pos[c*3])/3<side?2:3:low?y>=hip?5:y>=knee?6:y>=ankle+.04?7:8:reg[a];tot+=ar;T[r]+=ar;
      let R=1,G=1,B=1;
      if(px){uv.set((UV.getX(a)+UV.getX(b)+UV.getX(c))/3,(UV.getY(a)+UV.getY(b)+UV.getY(c))/3).applyMatrix3(map.matrix);
        const k=((((uv.y%1)+1)%1*N|0)*N+(((uv.x%1)+1)%1*N|0))*4;
        if(px[k+3]<128){clear+=ar;continue;}
        R=MH_LIN[px[k]];G=MH_LIN[px[k+1]];B=MH_LIN[px[k+2]];}
      if(low)hem=Math.min(hem,y);else if(reg[a]>2)reach=Math.max(reach,v.set(Math.abs(pos[a*3]),pos[a*3+1],pos[a*3+2]).sub(S).dot(W)/W2);
      R=Math.pow(R*col.r,.6)*1.5;G=Math.pow(G*col.g,.6)*1.5;B=Math.pow(B*col.b,.6)*1.5;A[r]+=ar;
      // the top's colour is the front's: a bib, an open jacket or a print is what a passer-by sees
      if(r===2&&(pos[a*3+2]+pos[b*3+2]+pos[c*3+2])/3*fwd<chest)continue;
      const q=(Math.min(7,R/.1875|0)*8+Math.min(7,G/.1875|0))*8+Math.min(7,B/.1875|0),h=Hs[r][q]||(Hs[r][q]=[0,0,0,0]);h[0]+=ar;h[1]+=R*ar;h[2]+=G*ar;h[3]+=B*ar;}
    out.push({o,name:(o.name+' '+(o.material.name||'')).toLowerCase(),A,T,Hs,tot,clear,y0,y1,hem,reach,blind});});
  out.mid=[(hip+knee)/2,(knee+ankle)/2];return out;
}
// What the meshes are (hair and lash cards, eyes, hat, clothes) and what the body shows from afar. Palette colours are linear and
// as drawn, each with the tint group of the garment it comes from: t tops, dresses and skirts; l trousers and one-piece suits; h hair.
function mhForm(M,meta,root,pre){
  const hairN=(meta.hair||'\0').toLowerCase(),ALL=[0,1,2,3,4,5,6,7,8];
  // mean colour, or with dom the colour most of the cloth has: on the chest a white shirt under a blue bib is blue from afar, not
  // grey-blue (a patterned skirt is better as its mean). Colours are binned 8 levels a channel; the bin whose 3x3x3 neighbourhood
  // holds most area gives the mean of that neighbourhood
  const mean=(m,rs,dom)=>{const H={};for(const r of rs)for(const q in m.Hs[r]){const h=m.Hs[r][q],o=H[q]||(H[q]=[0,0,0,0]);for(let j=0;j<4;j++)o[j]+=h[j];}
    let best=null,ba=0;
    if(!dom){best=[0,0,0,0];for(const q in H)for(let t=0;t<4;t++)best[t]+=H[q][t];ba=best[0];}
    else for(const q in H){const x=q>>6,y=q>>3&7,z=q&7,s=[0,0,0,0];
      for(let i=-1;i<2;i++)for(let j=-1;j<2;j++)for(let k=-1;k<2;k++){const n=H[(x+i)*64+(y+j)*8+z+k];if(n&&x+i>=0&&x+i<8&&y+j>=0&&y+j<8&&z+k>=0&&z+k<8)for(let t=0;t<4;t++)s[t]+=n[t];}
      if(s[0]>ba){ba=s[0];best=s;}}
    return best?[best[1]/ba,best[2]/ba,best[3]/ba]:null;};
  const named=m=>/hair|brow|lash/.test(m.name),body=M.filter(m=>!named(m)).reduce((a,b)=>b.T[1]>a.T[1]?b:a),skull=body.y1;
  for(const m of M){m.head=m.T[0]>.9*m.tot;
    // stock MakeHuman hair has no "hair" in its name. Otherwise a card is a mesh with holes in its texture that stays on the head,
    // or hangs from the crown without sleeves or legs (long hair is weighted to the back); glasses are not
    const crown=m.y1>skull-.03&&m.tot-m.T[0]-m.T[2]-m.T[3]<.1*m.tot,stock=m.name.includes(hairN)||/\b(bob|braid|short|long|ponytail|afro)\d/.test(m.name);
    m.card=named(m)||m!==body&&(m.head||crown)&&(stock||m.clear>.2*m.tot)&&!/glass|optic/.test(m.name);
    m.eye=m.head&&!m.card&&/eye|low-?poly/.test(m.name);
    m.shoe=m.T[7]+m.T[8]>.9*m.tot&&m.T[8]>.2*m.tot;}
  const plain=M.filter(m=>!m.card&&!m.eye),skirt=m=>!m.shoe&&/skirt|dress/.test(m.name);
  const hair=M.filter(m=>m.card&&!/brow|lash/.test(m.name)&&m.y1>skull-.03).sort((a,b)=>b.tot-a.tot)[0];
  const hat=plain.find(m=>m.head&&m.y1>skull+.01&&!/glass|optic/.test(m.name)),wear=plain.filter(m=>!m.head&&m!==body);
  const listed=m=>!meta.tint||meta.tint.some(s=>m.name.includes(String(s).toLowerCase()));
  for(const m of wear){const legs=m.T[5]+m.T[6]+m.T[7]>.5*m.tot&&!skirt(m);
    m.k=!listed(m)||m.shoe&&!meta.tint?null:m.shoe||legs?'l':'t';}
  if(hat)hat.k=meta.tint&&listed(hat)?'t':null;
  for(const m of M)if(m.card&&!/lash/.test(m.name))m.k='h';
  const skin={c:mean(body,ALL)||[.8,.6,.5],k:null};
  // a region shows the garment that has most cloth there, or skin where no hem or sleeve gets halfway
  const soft=wear.filter(m=>!m.shoe),hem=Math.min(...soft.map(m=>m.hem)),reach=Math.max(...soft.map(m=>m.reach)),boot=wear.find(m=>m.shoe&&m.y1>M.mid[1]);
  const win=(rs,ok=true,pool=soft,dom)=>{let b=null,ba=0;if(ok)for(const m of pool){const a=rs.reduce((s,r)=>s+m.A[r],0);if(a>ba){ba=a;b=m;}}return b?{c:mean(b,rs,dom),k:b.k}:skin;};
  const arm=win([3,4],reach>=.15);
  let neck=skull-.25;root.traverse(n=>{if(n.isBone&&/^neck/i.test(n.name))neck=n.getWorldPosition(new THREE.Vector3()).y;});
  const pal={skin,top:win([2],true,soft,true),uarm:arm,fore:reach>=.7?arm:skin,hips:win([5]),thigh:win([6],hem<=M.mid[0]),shin:boot?win([7],true,[boot]):win([7],hem<=M.mid[1]),shoe:win([8],true,wear.filter(m=>m.shoe)),
    hair:hair&&mean(hair,ALL)?{c:mean(hair,ALL),k:'h'}:skin,hat:hat?{c:mean(hat,ALL),k:hat.k}:{c:[.15,.15,.15],k:null}};
  const fl=(k,d)=>typeof meta[k]==='boolean'?meta[k]:d;
  if(meta.bare_legs===true)pal.shin=skin;else if(meta.bare_legs===false&&pal.shin===skin)pal.shin=pal.thigh;
  // the instanced skirt is a cone from the waist (.552 of the height) a quarter of the height long: sk stretches it to the real hem
  const sk=soft.filter(skirt).sort((a,b)=>a.hem-b.hem)[0];
  pal.skirt=sk?win([5,6,7],true,[sk]):pal.thigh!==skin?pal.thigh:pal.hips;
  // textures that cannot be read back (a compressed format) leave the palette from the JSON in charge
  return{h:meta.height||skull,hm:skull,sk:clamp((.552-(sk?sk.hem:hem)/skull)/.25,.35,1.75),skirt:fl('skirt',wear.some(skirt)),long:fl('long_hair',!!hair&&hair.y0<neck-.03),hat:fl('hat',!!hat),
    pal:pre.pal&&M.some(m=>m.blind)?pre.pal:pal};
}
// the same from the JSON alone, for the seconds before the models decode. pal hex is the value on screen, so it goes in unconverted
function mhPre(m){
  const hx=s=>s?[0,2,4].map(j=>parseInt(String(s).replace('#','').slice(j,j+2),16)/255):null,p=m.pal;let pal=null;
  if(p&&p.skin&&p.top&&p.legs){const skin={c:hx(p.skin),k:null},top={c:hx(p.top),k:'t'},legs={c:hx(p.legs),k:m.skirt?'t':'l'};
    pal={skin,top,uarm:top,fore:top,hips:legs,thigh:legs,skirt:legs,shin:m.bare_legs?skin:legs,shoe:{c:hx(p.shoe)||[.1,.1,.1],k:null},hair:p.hair?{c:hx(p.hair),k:'h'}:skin,hat:{c:[.15,.15,.15],k:null}};}
  return{h:m.height,hm:m.height,sk:1,skirt:!!m.skirt,long:!!m.long_hair,hat:!!m.hat,pal};
}
MH.pre=MH.meta.map(mhPre);
const mhF=look=>{const v=MH.vars[look.mh];return v&&v.F||MH.pre[look.mh];};
async function mhInit(){
  const gs=await Promise.all(MH.meta.map((m,k)=>ASSETS.load('mh_'+String(k).padStart(2,'0'))));
  gs.forEach((g,k)=>{
    const m=MH.meta[k],v={k,meta:m,scene:g.scene,rest:{}},M=mhMeasure(g.scene),F=mhForm(M,m,g.scene,MH.pre[k]);
    // the sole: up to 64 of the vertices it stands on in the bind pose, spread over both feet ([mesh, vertex])
    {const lo=Math.min(...M.map(q=>q.y0))+.01,c=[];let n=0;
      g.scene.traverse(o=>{if(!o.isSkinnedMesh)return;const P=o.geometry.attributes.position,k=n++;
        for(let i=0;i<P.count;i++)if(_mv.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld).y<=lo)c.push([k,i]);});
      v.sole=c.filter((_,i)=>i%Math.ceil(c.length/64)===0);}
    for(const{o,card,eye,k:tint}of M){
      // the exporter marks every material blended, which shows the mouth through the face; only cards need alpha
      const src=o.material,mat=new THREE.MeshLambertMaterial({map:src.map,color:src.color,alphaTest:card?.5:0,side:card?THREE.DoubleSide:THREE.FrontSide,name:src.name});
      if(mat.map)mat.map.colorSpace=THREE.SRGBColorSpace;
      // eyes keep their own colours: lifted, a brown iris turns red
      if(!eye){mat.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n'+MH_LIFT);};
        mat.customProgramCacheKey=()=>'mhlift'+(card?'a':'');}
      if(m.player&&/sweat_jacket|trouser/i.test(src.name))mat.userData.stripes=true;
      // the owner did not want the flat cap; the model still carries it, so it is only hidden
      if(m.player&&/newsboy|cap/i.test(o.name))o.visible=false;
      if(!m.player&&tint)o.userData.mhT=tint;
      o.material=mat;o.castShadow=true;o.frustumCulled=false;}
    MH.vars.push(v);
    if(m.player){mhStripes(g.scene);MH.player=v;}else v.F=F;});
  if(ASSETS.has('mh_phone'))mhPhoneModel((await ASSETS.load('mh_phone')).scene);
  MH.ready=true;
  peds.forEach((p,i)=>mhApply(p.look,i));
}
// Three white stripes down the sleeves and trouser legs of the player's tracksuit. Each vertex gets its distance round the
// limb from the outer line (top of the arm in the A-pose, outside of the leg) and its limb weight; the shader draws the bands.
function mhStripes(root){
  root.updateMatrixWorld(true);
  const bp={};root.traverse(n=>{if(n.isBone)bp[n.name.toLowerCase()]=n.getWorldPosition(new THREE.Vector3());});
  const box=new THREE.Box3().setFromObject(root),U=(box.max.y-box.min.y)/1.8;
  const SEG={upperarm:['upperarm','lowerarm',0],lowerarm:['lowerarm','hand',0],thigh:['thigh','calf',1],calf:['calf','foot',1]};
  const v=new THREE.Vector3(),a=new THREE.Vector3(),ref=new THREE.Vector3(),side=new THREE.Vector3(),rad=new THREE.Vector3();
  root.traverse(o=>{
    if(!o.isSkinnedMesh||!o.material.userData.stripes)return;
    const g=o.geometry,P=g.attributes.position,SI=g.attributes.skinIndex,SW=g.attributes.skinWeight,names=o.skeleton.bones.map(b=>b.name.toLowerCase()),out=new Float32Array(P.count*2);
    for(let i=0;i<P.count;i++){
      let W=0,best=null,bw=0;
      for(let j=0;j<4;j++){const w=SW.getComponent(i,j),n=names[SI.getComponent(i,j)]||'',k=n.slice(0,-2);if(SEG[k]&&/_[lr]$/.test(n)){W+=w;if(w>bw){bw=w;best=n;}}}
      out[i*2]=1;out[i*2+1]=W;if(!best)continue;
      const[s0,s1,leg]=SEG[best.slice(0,-2)],sfx=best.slice(-2),A=bp[s0+sfx],B=bp[s1+sfx];
      v.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld).sub(A);a.copy(B).sub(A).normalize();
      ref.set(leg?Math.sign(A.x)||1:0,leg?0:1,0).addScaledVector(a,-ref.dot(a)).normalize();side.crossVectors(a,ref);
      rad.copy(v).addScaledVector(a,-v.dot(a));
      out[i*2]=Math.atan2(rad.dot(side),rad.dot(ref))*rad.length()/U;}
    g.setAttribute('mhs',new THREE.BufferAttribute(out,2));
    const m=o.material,lift=m.onBeforeCompile;
    m.onBeforeCompile=sh=>{lift(sh);
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 mhs;varying vec2 vMhs;').replace('#include <begin_vertex>','#include <begin_vertex>\nvMhs=mhs;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vMhs;')
        .replace(MH_LIFT,MH_LIFT+'{float d=abs(vMhs.x);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.92),step(.5,vMhs.y)*(1.-smoothstep(.0085,.0095,d)+smoothstep(.0225,.0235,d)*(1.-smoothstep(.0405,.0415,d))));}');};
    m.customProgramCacheKey=()=>'mhstripes';});
}
const _mq=new THREE.Quaternion(),_mq2=new THREE.Quaternion(),_mv=new THREE.Vector3(),_ms=new THREE.Vector3();
// rest pose of the UAL rig a person uses, relative to its root object. Inverse bind matrices only give bones relative to each
// other (their frame differs between the mannequins and the re-rigged outfits), so the skeleton's top bone, which no clip
// moves, anchors them in the root object's space.
function mhSrcRest(st){
  let sk=null;st.o.traverse(n=>{if(!sk&&n.isSkinnedMesh)sk=n;});
  st.o.updateMatrixWorld(true);
  const bs=sk.skeleton.bones,inv=sk.skeleton.boneInverses,top=bs.findIndex(b=>!(b.parent&&b.parent.isBone));
  const anchor=new THREE.Matrix4().copy(st.o.matrixWorld).invert().multiply(bs[top].matrixWorld).multiply(inv[top]),r={};
  bs.forEach((b,k)=>{const m=new THREE.Matrix4().multiplyMatrices(anchor,new THREE.Matrix4().copy(inv[k]).invert());
    const p=new THREE.Vector3(),q=new THREE.Quaternion();m.decompose(p,q,_ms);r[b.name.toLowerCase()]={p,q,m,name:b.name,parent:b.parent&&b.parent.isBone?b.parent.name.toLowerCase():null};});
  return r;
}
const MH_FEET=['foot_l','foot_r','ball_l','ball_r'];
// the MakeHuman rest swung onto the UAL rest directions, per variant and per UAL rig (one sex has several: the outfits are
// re-rigged, and their bone sets differ, so a rig is known by its bone names; rigs sharing them share the alignment)
const MH_AIM={pelvis:'spine_01',spine_03:'neck_01',hand_l:'middle_01_l',hand_r:'middle_01_r',foot_l:'ball_l',foot_r:'ball_r',root:'pelvis'};
function mhAligned(v,src){
  const key=src.key||(src.key=Object.keys(src).sort().join());
  if(v.rest[key])return v.rest[key];
  const o=ASSETS.clone(v.scene);o.updateMatrixWorld(true);
  const bones=[];o.traverse(n=>{if(n.isBone&&src[n.name.toLowerCase()])bones.push(n);});
  const has=new Set(bones),depth=b=>{let d=0;for(let p=b.parent;p;p=p.parent)d++;return d;};
  bones.sort((a,b)=>depth(a)-depth(b));
  for(const t of bones){
    // collarbones keep their own rest: the UAL ones start lower and point up, which hunches MakeHuman shoulders to the ears
    if(/^clavicle/i.test(t.name))continue;
    const kids=t.children.filter(c=>has.has(c)),want=MH_AIM[t.name.toLowerCase()];
    const c=kids.find(c=>c.name.toLowerCase()===want)||(kids.length===1?kids[0]:null);if(!c)continue;
    o.updateMatrixWorld(true);
    const dt=c.getWorldPosition(new THREE.Vector3()).sub(t.getWorldPosition(new THREE.Vector3())).normalize();
    const ds=src[c.name.toLowerCase()].p.clone().sub(src[t.name.toLowerCase()].p).normalize();
    const w=new THREE.Quaternion().setFromUnitVectors(dt,ds).multiply(t.getWorldQuaternion(new THREE.Quaternion()));
    t.quaternion.copy(t.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(w));}
  o.updateMatrixWorld(true);
  const names=bones.map(b=>b.name),q={};for(const b of bones)q[b.name]=b.getWorldQuaternion(new THREE.Quaternion());
  const pel=bones.find(b=>b.name==='pelvis');
  const R={names,q,hip0:pel.position.clone(),k:pel.getWorldPosition(new THREE.Vector3()).y/src.pelvis.p.y};
  return v.rest[key]=R;
}
// Per-person variation: one affine colour change (hue turn, saturation, brightness, a dye, a lift) per tint group. The near
// shader applies it to the garment and the far palette gets the same matrix, so both stay one person. Skin is never in a group.
function mhAffine(hue,sat,gain,dye=[1,1,1],off=0){
  const c=Math.cos(hue),s=Math.sin(hue),L=[.213,.715,.072],
    H=[.213+c*.787-s*.213,.715-c*.715-s*.715,.072-c*.072+s*.928,.213-c*.213+s*.143,.715+c*.285+s*.14,.072-c*.072-s*.283,.213-c*.213-s*.787,.715-c*.715+s*.715,.072+c*.928+s*.072];
  return{M:new THREE.Matrix3().set(...H.map((h,k)=>gain*dye[k/3|0]*(L[k%3]*(1-sat)+h*sat))),O:new THREE.Vector3(off,off,off)};
}
function mhVary(look){
  if(look.mhX)return look.mhX;
  const u=k=>hash('mh'+look.mhN+':'+k),grey=look.age==='old'&&!(look.male===false&&u(10)<.25),fair=u(15)<.3;
  return look.mhX={
    t:mhAffine(u(1)<.4?(u(2)-.5)*.9:u(2)*TAU,.4+.45*u(3),.75+.4*u(4),u(5)<.5?undefined:MH_DYE[u(6)*MH_DYE.length|0]),
    l:mhAffine((u(7)-.5)*.5,.5+.4*u(8),.7+.45*u(9)),
    h:grey?mhAffine(0,.12,1.3+u(11),undefined,.1+.2*u(12)):mhAffine((u(13)-.5)*.3,.6+.5*u(14),fair?1.6+u(16):.6+.7*u(16),fair?[1,.92,.7]:undefined)};
}
function mhPal(look){
  if(look.mhP)return look.mhP;
  const F=mhF(look);if(!F.pal)return null;
  const X=mhVary(look),P={};
  for(const n in F.pal){const e=F.pal[n],x=e.k&&X[e.k];P[n]=x?_mv.fromArray(e.c).applyMatrix3(x.M).add(x.O).max(_ms.set(0,0,0)).toArray():e.c;}
  return look.mhP=P;
}
// Flags, height and colours of the instanced figure from the body. Runs when the look is made and again once the models decode.
function mhApply(look,i){
  if(look.mh==null)return;
  const F=mhF(look),kid=look.age==='kid';
  // the old instanced gear is gone: a far figure shows only what its near body has
  for(const g of['cap','pack','bag','coat','scarf','tail','stick'])look[g]=false;
  look.hat=F.hat;look.long=F.long;look.skirt=F.skirt;look.mhSk=F.sk;
  if(F.h)look.s=clamp(F.h,kid?1:1.5,kid?1.5:1.9)*(.97+.06*hash('mh'+look.mhN+':s'))/MH_FAR_H;
  look.mhP=null;const P=mhPal(look);if(!P)return;
  // straight into the instance colours, unclamped: the lift takes light cloth above 1 and it has to stay there in shade
  PARTS.forEach((p,k)=>{const c=P[MH_PART[k]||(p.opt==='hat'?'hat':'')];if(c)pedMesh[k].setColorAt(i,_pc.setRGB(c[0],c[1],c[2]));});
  pedMesh.forEach(m=>{if(m.instanceColor)m.instanceColor.needsUpdate=true;});
  const hx=c=>_pc.setRGB(Math.min(1,c[0]),Math.min(1,c[1]),Math.min(1,c[2])).getHex();
  charCols(i,{skin:hx(P.skin),shirt:hx(P.top),fore:hx(P.fore),legs:hx(P.hips),shin:hx(P.shin),shoe:hx(P.shoe),hair:hx(P.hair)});
}
// bodies are dealt round robin within sex and age, so every one is used and the street holds as few twins as it can
function mhId(look,i){
  if(look===PLAYER_LOOK||i===FARE_I||!MH.all.length)return look;
  if(look.mh==null){const key=(look.male===false?'f':'m')+(look.age==='kid'||look.age==='old'?look.age:'adult'),a=MH.by[key]||MH.by[key[0]+'adult']||MH.all;
    look.mh=a[(MH.cnt[key]=(MH.cnt[key]||0)+1)%a.length];look.mhN=MH.seq++;}
  mhApply(look,i);return look;
}
function mhPick(look,i){if(look.mh==null)mhId(look,i);return MH.vars[look.mh];}
function mhTinted(base,x){
  const m=base.clone();
  m.onBeforeCompile=sh=>{sh.uniforms.mhM={value:x.M};sh.uniforms.mhO={value:x.O};
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform mat3 mhM;uniform vec3 mhO;').replace('#include <map_fragment>','#include <map_fragment>\n'+MH_LIFT+'diffuseColor.rgb=max(mhM*diffuseColor.rgb+mhO,0.);');};
  m.customProgramCacheKey=()=>'mhtint';return m;
}
function mhAttach(st,i){
  const pl=i===PLAYER_I&&MH.player,v=pl||mhPick(st.look,i),o=ASSETS.clone(v.scene),bone={},mats=[];o.traverse(n=>{if(n.isBone)bone[n.name]=n;});
  const src=st.mhSrc||(st.mhSrc=mhSrcRest(st)),r=mhAligned(v,src);
  // rotations of the non-bone parents (the armature node) relative to the root, measured while the root is still at the origin
  o.updateMatrixWorld(true);const pq={};
  for(const n of r.names){const p=bone[n].parent;if(!r.q[p.name])pq[n]=p.getWorldQuaternion(new THREE.Quaternion());}
  if(!pl){const X=mhVary(st.look);o.traverse(n=>{const k=n.isMesh&&n.userData.mhT;if(k)mats.push(n.material=mhTinted(n.material,X[k]));});}
  const sk=[];o.traverse(n=>{if(n.isSkinnedMesh)sk.push(n);});
  pedMesh[1].add(o);
  // as tall as the instanced figure it replaces
  return{st,look:st.look,v,o,bone,src,r,pq,p0:mhPel(st),mats,sole:v.sole.map(([k,i])=>[sk[k],i]),k:pl?1:st.look.s*MH_FAR_H/v.F.hm};
}
function mhDrop(i){const e=MH.on[i];e.o.removeFromParent();for(const m of e.mats)m.dispose();MH.on[i]=null;}
const _mw={};
function mhPose(e){
  const st=e.st,so=st.o,o=e.o,r=e.r,src=e.src;
  o.position.copy(so.position);o.rotation.set(0,so.rotation.y,0);o.scale.setScalar(e.k);
  const qoInv=_mq2.copy(so.quaternion).invert();
  for(const n of r.names){
    const t=e.bone[n],sr=src[n.toLowerCase()],s=st.bone[sr.name];if(!s)continue;
    // world change of the UAL bone since its rest, both relative to their root objects, applied to the aligned rest
    const w=(_mw[n]||(_mw[n]=new THREE.Quaternion())).copy(qoInv).multiply(s.getWorldQuaternion(_mq)).multiply(_mq.copy(sr.q).invert()).multiply(r.q[n]);
    const pw=e.pq[n]||_mw[t.parent.name];
    t.quaternion.copy(_mq.copy(pw).invert().multiply(w));}
  // hips: the clip's pelvis travel (sitting, lying, bobbing), scaled to this body's hip height
  const sp=st.bone.pelvis;
  if(sp)e.bone.pelvis.position.copy(r.hip0).add(_mv.copy(sp.position).sub(e.p0).multiplyScalar(r.k));
  o.updateMatrixWorld(true);
  // retargeted legs and feet do not end where the rig's do (the body hung 3-9 cm into the ground): move the body until its
  // lowest sole vertex is where the rig's lowest sole is (a rig bone's rest height over its root is its height over the sole)
  let lo=1e9,mh=1e9;
  for(const n of MH_FEET){const s=st.bone[n];if(s)lo=Math.min(lo,s.getWorldPosition(_mv).y-src[n].p.y*so.scale.y);}
  for(const[m,i]of e.sole)mh=Math.min(mh,m.getVertexPosition(i,_mv).applyMatrix4(m.matrixWorld).y);
  // and never below the ground at the person's spot: mid-stride and crouched the rig's own heel dips a few centimetres
  const g=GY(so.position.x,so.position.z)+world.surf(so.position.x,so.position.z);
  if(lo<1e9&&mh<1e9){o.position.y+=Math.max(lo,g)-mh;o.updateMatrixWorld(true);}
}
// Phones. The UAL rig held its phone to the ear in its own hand, which on a MakeHuman body is centimetres away, so the phone floated
// by the cheek while standing and by the thigh while walking (the walk clip has no phone). A MakeHuman person with a phone instead
// looks down at it: right upper arm down, forearm bent up across the front, palm up, head bowed; the far figure (pedAct) already
// stands like that. The phone sits on that palm. MH_PHONE_GEO is a real phone's size in metres, centred, screen towards +z.
const MH_PHONE_GEO=new THREE.BoxGeometry(.07,.15,.008);
const MH_PHONE=new THREE.InstancedMesh(MH_PHONE_GEO,new THREE.MeshLambertMaterial({color:0x2b2e34}),PED_ALL);
MH_PHONE.frustumCulled=false;for(let i=0;i<PED_ALL;i++)MH_PHONE.setMatrixAt(i,ZERO_M);scene.add(MH_PHONE);
const _pa=new THREE.Vector3(),_pb2=new THREE.Vector3(),_pf=new THREE.Vector3(),_pr2=new THREE.Vector3(),_pu=new THREE.Vector3(),_pt2=new THREE.Vector3(),_pn=new THREE.Vector3(),_hw=new THREE.Vector3(),_hx=new THREE.Vector3(),
  _hq=new THREE.Quaternion(),_hq2=new THREE.Quaternion(),_hid=new THREE.Quaternion(),_pm=new THREE.Matrix4();
// a downloaded phone (add_mhchars.py embeds it when the file is there): its biggest mesh, turned so its width is x, its length y
// and its thickness z, and stretched to MH_PHONE_GEO's size. If its screen comes out facing the palm, set MH_PHONE_FLIP.
const MH_PHONE_FLIP=false;
function mhPhoneModel(root){
  root.updateMatrixWorld(true);let m=null;root.traverse(o=>{if(o.isMesh&&(!m||o.geometry.attributes.position.count>m.geometry.attributes.position.count))m=o;});if(!m)return;
  const g=m.geometry.clone().applyMatrix4(m.matrixWorld);g.computeBoundingBox();
  const sz=g.boundingBox.getSize(new THREE.Vector3()).toArray(),c=g.boundingBox.getCenter(new THREE.Vector3());
  const [L,W,T]=[0,1,2].sort((a,b)=>sz[b]-sz[a]),ax=k=>new THREE.Vector3().setComponent(k,1),M=new THREE.Matrix4().makeBasis(ax(W),ax(L),ax(T)).transpose();
  if(M.determinant()<0)M.premultiply(new THREE.Matrix4().makeScale(1,1,-1));// a turn, never a mirror
  g.translate(-c.x,-c.y,-c.z).applyMatrix4(M).scale(.07/sz[W],.15/sz[L],.008/sz[T]);if(MH_PHONE_FLIP)g.rotateY(Math.PI);
  MH_PHONE.geometry=g;const src=m.material;// the screen glows through its emissive map
  MH_PHONE.material=new THREE.MeshLambertMaterial({map:src.map||null,color:src.map?0xffffff:src.color,emissiveMap:src.emissiveMap||null,emissive:src.emissiveMap?0xffffff:0});
  for(const t of[src.map,src.emissiveMap])if(t)t.colorSpace=THREE.SRGBColorSpace;}
// turn bone b by the world rotation q (blended in by w), keeping its children attached
function mhTurn(b,q,w){
  _hq2.copy(_hid).slerp(q,w).multiply(b.getWorldQuaternion(_mq));
  b.quaternion.copy(b.parent.getWorldQuaternion(_hq).invert().multiply(_hq2));b.updateMatrixWorld(true);}
// swing b so the line to its child c points along want
function mhAim(b,c,want,w){
  _pa.setFromMatrixPosition(c.matrixWorld).sub(_pb2.setFromMatrixPosition(b.matrixWorld)).normalize();
  mhTurn(b,_hq.setFromUnitVectors(_pa,want),w);}
function mhPhone(e,i){
  const st=e.st,B=e.bone;
  const w=e.phw=clamp((e.phw||0)+(st.phone&&i<PED_N?1:-1)*pedDt*4,0,1);
  if(!w||!B.hand_r||!B.middle_01_r||!B.index_01_r||!B.pinky_01_r){MH_PHONE.setMatrixAt(i,ZERO_M);return;}
  // the body's own frame: forward, up and its right-hand side
  const f=_pf.set(Math.sin(st.o.rotation.y),0,Math.cos(st.o.rotation.y)),u=_pu.set(0,1,0),r=_pr2.crossVectors(f,u);
  mhAim(B.upperarm_r,B.lowerarm_r,_pt2.set(0,-1,0).addScaledVector(f,.25).addScaledVector(r,-.05).normalize(),w);
  mhAim(B.lowerarm_r,B.hand_r,_pt2.copy(f).multiplyScalar(.75).addScaledVector(u,.42).addScaledVector(r,-.5).normalize(),w);
  mhAim(B.hand_r,B.middle_01_r,_pt2.copy(f).multiplyScalar(.85).addScaledVector(u,.15).addScaledVector(r,-.3).normalize(),w);
  // roll the hand about its length until the palm faces up and back, towards the eyes
  const h=_pb2.setFromMatrixPosition(B.hand_r.matrixWorld),a=_pa.setFromMatrixPosition(B.middle_01_r.matrixWorld).sub(h),len=a.length();a.divideScalar(len);
  // the hand's length crossed with the line across the knuckles, pinky to index: the palm side (signs settled by looking at the
  // four combinations, research/mh/trial/phone/signs.png)
  const palm=()=>_pn.copy(a).cross(_hw.setFromMatrixPosition(B.index_01_r.matrixWorld).sub(_hx.setFromMatrixPosition(B.pinky_01_r.matrixWorld))).normalize();
  _pt2.copy(u).multiplyScalar(.6).addScaledVector(f,-.8);_pt2.addScaledVector(a,-_pt2.dot(a)).normalize();palm();_pn.addScaledVector(a,-_pn.dot(a)).normalize();
  mhTurn(B.hand_r,_hq.setFromUnitVectors(_pn,_pt2),w);
  // fingers closed round the phone's edges
  palm();const curl=_pt2.crossVectors(_pn,a).normalize();
  for(const n of['index','middle','ring','pinky'])for(const[j,g]of[['01',.3],['02',.55],['03',.45]]){const fb=B[n+'_'+j+'_r'];if(fb)mhTurn(fb,_hq.setFromAxisAngle(curl,g),w);}
  // head bowed to the screen
  for(const n of['neck_01','head'])if(B[n])mhTurn(B[n],_hq.setFromAxisAngle(r,-.28),w);
  if(w<1){MH_PHONE.setMatrixAt(i,ZERO_M);return;}
  h.setFromMatrixPosition(B.hand_r.matrixWorld);a.setFromMatrixPosition(B.middle_01_r.matrixWorld).sub(h).normalize();palm();
  const x=_pt2.crossVectors(a,_pn).normalize();a.crossVectors(_pn,x);
  _pm.makeBasis(x,a,_pn).setPosition(h.addScaledVector(a,len*.6).addScaledVector(_pn,.016));
  MH_PHONE.setMatrixAt(i,_pm);
}
// the UAL pelvis position at rest in its parent's space
function mhPel(st){
  const r=st.mhSrc,pel=r.pelvis,par=pel.parent&&r[pel.parent];
  return new THREE.Vector3().setFromMatrixPosition(par?new THREE.Matrix4().copy(par.m).invert().multiply(pel.m):pel.m);
}
const mhTick0=charTick;
charTick=function(){
  mhTick0();
  if(!CHAR.ready)return;
  if(!MH.ready){if(!MH.busy&&ASSETS.has('mh_00')){MH.busy=true;mhInit().catch(e=>console.warn('MakeHuman people off:',e.message));}return;}
  const t0=performance.now();MH.n=0;
  CHAR.list.forEach((st,i)=>{
    let e=MH.on[i];
    const use=st&&st.o.visible&&(i!==PLAYER_I||MH.player)&&i!==FARE_I;
    if(e&&(!use||e.st!==st||e.look!==st.look)){mhDrop(i);e=null;}
    if(!use)return;
    if(!e)e=MH.on[i]=mhAttach(st,i);
    // the UAL rig keeps animating unseen; its outfit, face and fitted hats are hidden, and its instanced gear is dropped
    st.o.traverse(n=>{if(n.isMesh)n.visible=false;});
    for(const k of CHAR.G)pedMesh[k].setMatrixAt(i,CHAR.park);
    mhPose(e);if(e.v!==MH.player)mhPhone(e,i);MH.n++;});
  MH.on.forEach((e,i)=>{if(e&&!CHAR.list[i])mhDrop(i);});
  // the instanced phone follows the UAL hand: only far figures keep it
  for(let i=0;i<PED_ALL;i++)if(!MH.on[i]||MH.on[i].v===MH.player)MH_PHONE.setMatrixAt(i,ZERO_M);else if(i<PED_N)pedPhone.setMatrixAt(i,ZERO_M);
  MH_PHONE.instanceMatrix.needsUpdate=pedPhone.instanceMatrix.needsUpdate=true;
  MH.ms=performance.now()-t0;
};
// the far skirt at its own length
const mhPoseAt0=poseAt,_mm=new THREE.Matrix4();
poseAt=function(i,look,x,z,h,fall,lift,ph,gait,wave,yaw,act){
  mhPoseAt0(i,look,x,z,h,fall,lift,ph,gait,wave,yaw,act);
  if(look.skirt&&look.mhSk&&!CHAR.use[i])pedMesh[18].setMatrixAt(i,_mm.copy(PM[18]).scale(_ms.set(1,look.mhSk,1)));
};
// a new mannequin is made visible, so charPose never snaps its clips in: for a fifth of a second the body it drives stood in the
// bind pose, arms out, right at the switch
const mhMake0=charMake;
charMake=function(b){const st=mhMake0(b);st.snap=true;return st;};
// a MakeHuman person with a phone stands in the idle clip (the UAL phone clip holds it to the ear) and mhPhone bends the arm
const mhAnim0=charAnim;
charAnim=function(st,dt){
  if(!st.phone||!MH.on.some(e=>e&&e.st===st&&e.v!==MH.player))return mhAnim0(st,dt);
  const m=st.mode;st.phone=false;if(m==='watch')st.mode='idle';mhAnim0(st,dt);st.phone=true;st.mode=m;};
const mhLook0=randomLook;
randomLook=function(i,age){return mhId(mhLook0(i,age),i);};
peds.forEach((p,i)=>mhId(p.look,i));
