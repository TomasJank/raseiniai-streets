// ---------- fixfreeze: one headlamp pair for the whole fleet ----------
// carLamps built two SpotLights per car the player ever drove and never removed them. three recompiles every lit
// material when the light count changes (130 ms to 1.7 s per steal) and each extra spot costs every fragment.
let ffPair=null;
const ffLamps0=carLamps;
carLamps=function(c){
  const fresh=!c.lamps,L=ffLamps0(c),b=c.g.userData.body;
  if(!L.sl.length)return L;
  if(fresh){
    L.slp=L.sl.map(l=>[l.position.clone(),l.target.position.clone()]);
    if(ffPair){for(const l of L.sl)b.remove(l,l.target);L.sl=ffPair;}else ffPair=L.sl;
  }
  if(L.sl[0].parent!==b)L.sl.forEach((l,i)=>{l.position.copy(L.slp[i][0]);l.target.position.copy(L.slp[i][1]);b.add(l,l.target);});
  return L;
};
