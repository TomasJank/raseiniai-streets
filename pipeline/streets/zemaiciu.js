// at the game's own garden gates on this street: wheelie bins, a few benches by the gate, thuja pairs
function streetBuild_zemaiciu(ctx){
  const bear=(dx,dz)=>(Math.atan2(dx,-dz)*180/Math.PI+360)%360;
  for(const [gx,gz,,r] of ctx.world.gaps||[]){
    if(r.t.name!=='Žemaičių g.')continue;
    let best=null;
    for(let i=0;i<r.pts.length-1;i++){const a=r.pts[i],b=r.pts[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz)||1,
      t=Math.max(0,Math.min(L,((gx-a[0])*dx+(gz-a[1])*dz)/L)),px=a[0]+dx/L*t,pz=a[1]+dz/L*t,d=Math.hypot(gx-px,gz-pz);
      if(!best||d<best.d)best={d,ux:dx/L,uz:dz/L,nx:(gx-px)/(d||1),nz:(gz-pz)/(d||1)};}
    const {ux,uz,nx,nz}=best,k=ctx.hash('zemaiciu'+gx.toFixed(1)+','+gz.toFixed(1)),road=bear(-nx,-nz),
      at=(u,n)=>[gx+ux*u-nx*n,gz+uz*u-nz*n];
    if(k<.6)ctx.put('bin',{xz:at(3.4,.45),hd:road,s:[.6,1.05,.7],col:k<.35?'#3f5f3c':'#c7a52a'});
    if(k>.93)ctx.put('bench',{xz:at(-4.2,.45),hd:road,s:[1.5,.9,.45]});
    else if(k>.6)for(const u of[-3.2,3.2])ctx.put('bush',{xz:at(u,-.8),s:[.9,2.3,.9],col:'#2f4a28'});
  }
}
