// Ground layers are draped at different resolutions (ground 24 m, green 8 m, roads 8 m ribbons), so on curved terrain the chords cross:
// green came up through roads and water, the ground mesh through green and the stadium field, and the blade map then saw grass on the pitch.
// Order is ground < landuse < forest < the rest of the green < everything else: overlapping green polygons all sat at y=.02 and fought each other (park vs forest vs residential landuse),
// then green vertices drop below any surface that sits under them, then the ground sinks under green and the field.
const GREEN_LOW=[[[.38,.52,.30],-.012],[[.24,.36,.20],-.006]];
function fixGround(){
  const W=world,grs=[],flat=[];
  worldGroup.children.forEach(o=>{
    const g=o.geometry;if(!o.isMesh||o.isInstancedMesh||!g||!g.attributes.position||g.parameters||g.attributes.sty)return;
    const P=g.attributes.position,I=g.index,n=(I?I.count:P.count)/3,a=new Float32Array(n*9);
    for(let t=0;t<n;t++)for(let q=0;q<3;q++){const i=I?I.getX(t*3+q):t*3+q;a[t*9+q*3]=P.getX(i);a[t*9+q*3+1]=P.getY(i);a[t*9+q*3+2]=P.getZ(i);}
    if(o.userData.grass){
      const c=g.attributes.color;
      for(let i=0;i<a.length/3;i++)for(const [k,d] of GREEN_LOW)if(Math.abs(c.getX(i)-k[0])+Math.abs(c.getY(i)-k[1])+Math.abs(c.getZ(i)-k[2])<.01){a[i*3+1]+=d;break;}
      grs.push({o,a});}else flat.push(a);
    if(o.material.polygonOffsetUnits===-4&&o.material.map)W.sinkGround({pos:a});
  });
  const C=24,key=(i,j)=>i*100000+j,grid=new Map(),tri=[];
  grs.forEach((G,gi)=>{const a=G.a;for(let t=0;t<a.length/9;t++){
    const r=tri.push([gi,t])-1;let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
    for(let q=0;q<3;q++){x0=Math.min(x0,a[t*9+q*3]);x1=Math.max(x1,a[t*9+q*3]);z0=Math.min(z0,a[t*9+q*3+2]);z1=Math.max(z1,a[t*9+q*3+2]);}
    for(let i=Math.floor(x0/C);i<=Math.floor(x1/C);i++)for(let j=Math.floor(z0/C);j<=Math.floor(z1/C);j++){const k=key(i,j);(grid.get(k)||grid.set(k,[]).get(k)).push(r);}}});
  const welded=new Map(),wk=(x,z)=>Math.round(x*50)*1e6+Math.round(z*50);
  grs.forEach((G,gi)=>{for(let v=0;v<G.a.length/3;v++){const k=wk(G.a[v*3],G.a[v*3+2]);(welded.get(k)||welded.set(k,[]).get(k)).push([gi,v]);}});
  const drop=new Map();
  const probe=(x,z,y)=>{
    const l=grid.get(key(Math.floor(x/C),Math.floor(z/C)));if(!l)return;
    for(const r of l){const [gi,t]=tri[r],a=grs[gi].a,b=t*9,x0=a[b],y0=a[b+1],z0=a[b+2],x1=a[b+3],y1=a[b+4],z1=a[b+5],x2=a[b+6],y2=a[b+7],z2=a[b+8];
      const d=(z1-z2)*(x0-x2)+(x2-x1)*(z0-z2);if(Math.abs(d)<1e-9)continue;
      const l0=((z1-z2)*(x-x2)+(x2-x1)*(z-z2))/d,l1=((z2-z0)*(x-x2)+(x0-x2)*(z-z2))/d,l2=1-l0-l1;
      if(l0<0||l1<0||l2<0)continue;
      const over=l0*y0+l1*y1+l2*y2-y+.02;
      if(over>0&&over<.5)for(let q=0;q<3;q++){const k=wk(a[b+q*3],a[b+q*3+2]);drop.set(k,Math.max(drop.get(k)||0,over));}}
  };
  for(const a of flat)for(let t=0;t<a.length;t+=9){
    if((a[t+5]-a[t+2])*(a[t+6]-a[t])-(a[t+3]-a[t])*(a[t+8]-a[t+2])<=0)continue;
    for(let q=0;q<3;q++)probe(a[t+q*3],a[t+q*3+2],a[t+q*3+1]);
    probe((a[t]+a[t+3]+a[t+6])/3,(a[t+2]+a[t+5]+a[t+8])/3,(a[t+1]+a[t+4]+a[t+7])/3);}
  for(const [k,d] of drop)for(const [gi,v] of welded.get(k))grs[gi].a[v*3+1]-=d;
  for(const G of grs){const p=G.o.geometry.attributes.position;for(let i=0;i<G.a.length/3;i++)p.setY(i,G.a[i*3+1]);p.needsUpdate=true;G.o.geometry.computeBoundingSphere();}
  for(const G of grs)W.sinkGround({pos:G.a});
  worldGroup.children.forEach(o=>{if(o.userData.grass&&o.geometry.parameters)o.geometry.attributes.position.needsUpdate=true;});
}
