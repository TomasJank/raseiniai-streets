// ---------- takepark: E next to a parked car takes it ----------
// Parked cars are instances with no car behind them. The one the player stands by is taken off the parked list (its instance,
// collision and far silhouette go with the rebuild, about 10 ms for the whole town) and a real car of the same model and colour
// is put in its place; enterExit then finds it like any other car. Car-park cars also stand in a 4.4 x 1.8 m box of wall
// segments (buildTown): that box goes too, or the new car could not leave it.
// ponytail: only with the model fleet on (CARS4.on); without it the lot shapes have no wheels or lamps to make a car from
{const ee=enterExit;enterExit=function(){
  if(world&&player.mode!=='car'&&CARS4.on&&!nearestCar(4.2)){let o=null,bd=4.2;
    for(const q of parkedNear(player.x,player.z)){const d=Math.hypot(q.x-player.x,q.z-player.z);if(d<bd){bd=d;o=q;}}
    const F=o&&CARS4.models[(LOT_GEOS[o.k]||0).cars4];
    // newCar hashes its colour into the traffic palette; handing the body a plain colour (the garage's respray path) keeps the parked one's
    if(F){const f=Math.sin(o.h),g=Math.cos(o.h),C=[[-2.2,-.9],[2.2,-.9],[2.2,.9],[-2.2,.9]].map(([a,b])=>[o.x+f*a+g*b,o.z+g*a-f*b]),at=(x,z)=>C.some(q=>Math.hypot(q[0]-x,q[1]-z)<.05);
      for(let i=Math.floor((o.x-3)/8);i<=Math.floor((o.x+3)/8);i++)for(let j=Math.floor((o.z-3)/8);j<=Math.floor((o.z+3)/8);j++){const l=walls.get(i+','+j);
        if(l)for(let k=l.length;k--;)if(at(l[k][0],l[k][1])&&at(l[k][2],l[k][3]))l.splice(k,1);}
      PARKED.cars.splice(PARKED.cars.indexOf(o),1);addParkedCars([]);newCar(o.x,o.z,o.h,o.c,F).g.userData.body.children[0].material={color:new THREE.Color(o.c)};}}
  return ee();};}
