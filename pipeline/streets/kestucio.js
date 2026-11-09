const kestucio_line=[[55.3995,23.131296],[55.40107,23.131451],[55.401508,23.131477],[55.408572,23.132017],[55.409277,23.132098],[55.411115,23.132247],[55.411641,23.132306],[55.412054,23.132346],[55.412427,23.132394],[55.412783,23.132457],[55.413037,23.13252],[55.413452,23.132637],[55.419419,23.134384],[55.422638,23.135318],[55.423137,23.135469]];
function streetBuild_kestucio(ctx){
  const P=kestucio_line.map(q=>ctx.LL(...q));let run=0;
  for(let i=0;i<P.length-1;i++){
    const [x0,z0]=P[i],[x1,z1]=P[i+1],l=Math.hypot(x1-x0,z1-z0),ux=(x1-x0)/l,uz=(z1-z0)/l,hd=Math.atan2(ux,-uz)*180/Math.PI;
    for(let t=0;t<l;t+=10,run+=10){
      const x=x0+ux*t,z=z0+uz*t;
      for(const sd of[-1,1]){
        const at=(off,a=0)=>[x-uz*off*sd+ux*a,z+ux*off*sd+uz*a],k=run+':'+sd,h=ctx.hash('kestucio'+k);
        if(run%50===0){const q=at(5.8);ctx.put('post',{xz:q,hd:hd+(sd>0?90:270),s:[.12,1.05,.12],col:'#ecebe4',knock:true});}
        // ponytail: verge greenery picked per 80 m chunk by hash, not from land-use data (the page has none here)
        const g=ctx.hash('kestucio-g'+Math.floor(run/80)+sd);
        const q=at(10.5+h*3,(h-.5)*4);if(ctx.world.inBuilding(q[0],q[1]))continue;
        if(g<.45)ctx.put('treeS',{xz:q,s:[3.2+h,8+h*4,3.2+h],col:h<.5?'#3f6b33':'#4d7a3a'});
        else if(g<.62&&h<.6)ctx.put('bush',{xz:q,s:[1.6+h,1.1+h*.6,1.6+h],col:'#4a6b35'});
      }
    }
  }
}
