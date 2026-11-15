// ---------- marozas: the player wears a black tracksuit with three white stripes down each sleeve and leg, white trainers, a buzz cut ----------
// player only: the casual outfit body, recoloured, and a pattern drawn in the outfit shader from the bind-pose position, so stripes ride the limbs as they bend.
// Pedestrians can roll a dark casual outfit but never the stripes, zip or buzz cut.
const MZ={on:false,col:{shirt:0x16171b,fore:0x16171b,legs:0x16171b,shin:0x16171b,shoe:0xe6e6e2,skin:0xe2b493,hair:0x2e2a27}};
Object.assign(PLAYER_LOOK,{male:true,young:true,age:'adult',clo:'casual'});
dress(PLAYER_I,MZ.col);
function mzSetup(){
  const k=CL.body.m.k,sc=CL.body.m.scene,sk=sc.getObjectByProperty('isSkinnedMesh',true).skeleton,V=THREE.Vector3;sc.updateMatrixWorld(true);
  const at=n=>sk.getBoneByName(n).getWorldPosition(new V()).multiplyScalar(k),A=[],D=[],O=[],L=[];
  // limb axes in the bind pose (arms out along x): the outside of an arm is its top, which faces out once the arm hangs; a leg's is its outer side
  for(const [a,b,o] of [['upperarm_l','hand_l',[0,1,0]],['upperarm_r','hand_r',[0,1,0]],['thigh_l','foot_l',[1,0,0]],['thigh_r','foot_r',[-1,0,0]]]){
    const p=at(a),d=at(b).sub(p),u=new V(...o);L.push(d.length());d.normalize();u.addScaledVector(d,-u.dot(d)).normalize();A.push(p);D.push(d);O.push(u);}
  MZ.u={mzA:{value:A},mzD:{value:D},mzO:{value:O},mzSx:{value:A[0].x+.02},mzL:{value:L[0]-.075},mzNy:{value:at('neck_01').y-.015},mzZc:{value:0},mzW:{value:new THREE.Matrix4()},mzH:{value:new THREE.Matrix4()},mzHi:{value:new THREE.Matrix4()},mzBuzz:{value:0}};
  MZ.head=new THREE.Matrix4().makeScale(k,k,k).multiply(sk.getBoneByName('Head').matrixWorld);
}
function mzDress(st){
  if(!MZ.u)mzSetup();
  const mat=st.mesh.material,ob=mat.onBeforeCompile,u={...MZ.u,mzW:{value:MZ.head.clone().multiply(st.hatL)},mzH:{value:new THREE.Matrix4()},mzHi:{value:new THREE.Matrix4()},mzBuzz:{value:0}};
  st.mz=u;
  mat.onBeforeCompile=s=>{ob(s);Object.assign(s.uniforms,u);
    s.vertexShader=s.vertexShader.replace('uniform vec3 rc[8];','uniform vec3 rc[8];uniform vec3 mzA[4],mzD[4],mzO[4];uniform float mzSx,mzZc,mzBuzz,mzL,mzNy;uniform mat4 mzW,mzH,mzHi;varying vec3 vSt;')
      .replace('vRc=rc[int(uv.x*8.+.5)];',`vRc=rc[int(uv.x*8.+.5)];
{int r=int(uv.x*8.+.5);vec3 p=(mzW*vec4(transformed,1.)).xyz;vSt=vec3(0.);int l=-1;
// the outfit is a T-shirt: bare forearms and the neckline become jacket, up to the wrist and the neck
// a tracksuit has no belt or buckle
if(r==7&&p.y<1.2){r=3;vRc=rc[3];}
if(r==0&&(abs(p.x)>mzSx?dot(p-mzA[p.x>0.?0:1],mzD[p.x>0.?0:1])<mzL:p.y<mzNy)){r=1;vRc=rc[1];}
if((r==1||r==2)&&abs(p.x)>mzSx)l=p.x>0.?0:1;else if(r==3||r==4)l=p.x>0.?2:3;
if(l>=0){vec3 d=p-mzA[l];d-=dot(d,mzD[l])*mzD[l];vSt=vec3(dot(d,mzO[l]),dot(d,cross(mzD[l],mzO[l])),l<2?1.:2.);}
else if(r==1)vSt=vec3(p.x,p.z-mzZc,3.);else if(r==5)vSt=vec3(p.y,0.,4.);
// buzz cut: the hair mesh folds into the head and the scalp above the hairline takes the hair colour
if(mzBuzz>.5&&(r==6||r==0)){vec3 q=(mzH*vec4(transformed,1.)).xyz;vec3 a=abs(q);float n=pow(pow(a.x,P)+pow(a.y,P)+pow(a.z,P),1./P);
  if(r==6&&(q.z<.55*n||q.y>.35*n))transformed=(mzHi*vec4(q*(.5/max(n,1.)),1.)).xyz;else if(n<1.4&&q.y>(-.15+.45*max(q.z,0.))*n)vRc=rc[6];}}`);
    s.fragmentShader=s.fragmentShader.replace('varying vec3 vRc;','varying vec3 vRc;varying vec3 vSt;')
      .replace('vec4 diffuseColor = vec4( diffuse*vRc, opacity );',`vec4 diffuseColor = vec4( diffuse*vRc, opacity );
{float k=floor(vSt.z+.5),w=0.;
if(k==1.||k==2.){float u=atan(vSt.y,vSt.x)*length(vSt.xy),c=k==1.?.017:.023,h=k==1.?.0055:.0075;w=vSt.x>0.&&(abs(u)<h||abs(u-c)<h||abs(u+c)<h)?1.:0.;}
else if(k==3.)w=abs(vSt.x)<.004&&vSt.y>0.?1.:0.;
else if(k==4.&&vSt.x<.025)diffuseColor.rgb=vec3(.07);
diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.88),w);}`);};
  mat.customProgramCacheKey=()=>'clothes_mz';
}
const mzMk0=clMake,mzPose0=charPose,mzTick0=charTick;
clMake=function(b,k){const st=mzMk0(b,k);if(MZ.on&&b==='m')mzDress(st);return st;};
charPose=function(i,...r){MZ.on=i===PLAYER_I;try{return mzPose0(i,...r);}finally{MZ.on=false;}};
charTick=function(){
  mzTick0();
  const st=CHAR.list[PLAYER_I];
  if(st&&st.mz&&!st.mz.mzBuzz.value&&typeof FG!=='undefined'&&FG.ready){const u=st.mz;
    u.mzH.value.multiplyMatrices(FG.hat.m.U,st.hatL);u.mzHi.value.copy(u.mzH.value).invert();u.mzZc.value=FG.tor.mcasual.zc;u.mzBuzz.value=1;}
};
