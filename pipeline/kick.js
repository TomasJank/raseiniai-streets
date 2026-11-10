// ---------- kick: the KayKit kick, retargeted onto the mannequin skeleton (research/assets/characters/build_kick.mjs), replaces fight2's procedural leg lift ----------
// a mannequin that has the clip plays it over whatever charAnim chose (arms keep the guard pose); anything else keeps the procedural kick.
async function kkLoad(){
  const e=document.getElementById('agz_kick_clips'),s=atob(e.textContent.trim()),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);
  const u=new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  let t='';for(let i=0;i<u.length;i+=8192)t+=String.fromCharCode.apply(null,u.subarray(i,i+8192));
  const d=document.createElement('script');d.type='application/octet-stream';d.id='asset_kick_clips';d.textContent=btoa(t);document.body.appendChild(d);
  return(await ASSETS.load('kick_clips')).animations[0];
}
const kkInit0=charInit,kkAnim0=charAnim;
charInit=async function(){
  const[,clip]=await Promise.all([kkInit0(),kkLoad().catch(e=>{console.warn('procedural kick stays:',e.message);})]);
  if(clip)CHAR.clips.kick=clip;
};
// move time to clip time: the clip's contact frame lands in the middle of the move's active window, the rest of the clip fills wind-up and recovery
function kickTime(m,clip){
  const d=m.d,c=d.su+d.ac/2,tot=d.su+d.ac+d.rc,k=clip.userData.contact;
  return Math.min(clip.duration-1e-3,m.t<c?m.t/c*k:k+(m.t-c)/(tot-c)*(clip.duration-k));
}
charAnim=function(st,dt){
  const C=CHAR.clips.kick;
  if(C&&!st.act.kick)st.act.kick=st.mx.clipAction(C);
  const i=CHAR.list.indexOf(st),pl=i===PLAYER_I,mv=pl?cmb.mv:i>=0&&peds[i]&&peds[i].mv,kick=C&&mv&&mv.n==='kick';
  // fight2 reads n==='kick' as the procedural move and skips the one-shot clip: hide the name while it runs
  if(kick){st.mvSeen=mv;mv.n='kickc';}
  try{kkAnim0(st,dt);}finally{if(kick)mv.n='kick';}
  if(!kick)return;
  // the mixer normalises per property: against the pose actions' weight of ~1, a weight of w/(1-w) makes the kick take fraction w of the legs, hips and spine,
  // while the arms (no kick tracks) keep the guard pose
  const a=st.act.kick,w=clamp(Math.min(mv.t/.05,(mv.d.su+mv.d.ac+mv.d.rc-mv.t)/.1),0,1);
  a.play();a.setEffectiveWeight(w/(1.001-w));a.time=kickTime(mv,C);
  st.mx.update(0);
  a.setEffectiveWeight(0);
  if(st.b==='f')st.bone.pelvis.position.multiplyScalar(CHAR.body.f.hip);
  st.o.updateMatrixWorld(true);
};
