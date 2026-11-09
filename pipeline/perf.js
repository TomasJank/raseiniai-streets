// ---------- frame cost: tree detail by distance, near-only tree shadows, far plane at the fog, phone resolution ----------
// trees were 81% of all triangles: 28k crowns at 320 tris each, every one also drawn into the shadow map
let perfT=0,prT0=performance.now(),prN=0;
const PR_MAX=PHONE?1.5:Math.min(devicePixelRatio||1,2);
function perfTick(dt){
  prN++;
  if((perfT-=dt)>0)return;perfT=.25;
  const px=camera.position.x,pz=camera.position.z;
  for(const t of TREES){const d=Math.hypot(t.s.center.x-px,t.s.center.z-pz)-t.s.radius,sh=d<130;
    if(t.L){t.L.geometry=d<150?t.hi:d<400?t.lo1:t.lo0;t.L.castShadow=sh;}
    if(t.C)t.C.castShadow=sh;
    t.Tk.castShadow=sh;t.Tk.visible=d<350;}
  // a car past 400 m is a few pixels but still 9 draw calls
  if(world)for(const c of world.cars)if(c.g)c.g.visible=c===player.car||Math.hypot(c.x-px,c.z-pz)<400;
  const f=scene.fog.far+60;if(Math.abs(camera.far-f)>20){camera.far=f;camera.updateProjectionMatrix();}
  // ponytail: steps of .25 every 2 s, phones only; a desktop GPU never needs it. Real time, since the game dt is clamped
  const el=(performance.now()-prT0)/1000;
  if(PHONE&&el>2){const avg=el/prN,pr=renderer.getPixelRatio();prT0=performance.now();prN=0;
    // a gap over 5 s is a hidden tab, not a slow phone
    const next=el>5?pr:avg>1/40&&pr>.75?pr-.25:avg<1/57&&pr<PR_MAX?pr+.25:pr;
    if(next!==pr){renderer.setPixelRatio(next);renderer.setSize(innerWidth,innerHeight,false);}}
}
