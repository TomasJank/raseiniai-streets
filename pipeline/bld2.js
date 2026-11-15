// ---------- bld2: cadastre classes make garages, barns, greenhouses and garden sheds look like themselves (add_bld2.py) ----------
// BLD2D: "idx:class[:roof rrggbb];..." idx = rasData way index. Classes: g garage, h greenhouse, f farm outbuilding (PASK 240),
// a garden house (PASK 266), s small unclassified outbuilding, m mid-size unclassified, r dwelling. Only g h f a change a building
// that OSM already had; s m r exist only on buildings this step added.
const BLD2=new Map(BLD2D.split(';').map(e=>{const [i,c,r]=e.split(':');return['c'+i,{c,col:r&&[1,3,5].map(k=>parseInt(r.slice(k-1,k+1),16)/255)}];}));
const B2_METAL=[[.66,.69,.68],[.58,.62,.60],[.52,.60,.52],[.60,.56,.50],[.55,.60,.66],[.70,.66,.58]];
const B2_BOARD=[[.55,.40,.28],[.62,.52,.40],[.48,.36,.27],[.66,.58,.46],[.45,.50,.42],[.58,.30,.22]];
const B2_BLOCK=[[.78,.77,.73],[.70,.69,.66],[.82,.78,.70],[.66,.34,.26]];
const b2pick=(a,u)=>a[Math.floor(u*a.length)%a.length];
function bld2Look(sp,w,pts,area){
  const e=BLD2.get(w.id);if(!e||LOOK[w.id])return sp;
  const t=w.tags,id=w.id,c=e.c,photo=!ROOFS.has(id),fresh=!!t.bld2;
  if(fresh&&e.col)sp.roof=e.col;
  if(c==='r')return sp;
  const four=pts.length===4,measured=!fresh&&(t.lidar||t.roof||t.parts||t.skel||t['gba:height']>0||t['building:levels']>0);
  // a measured two-storey building stays what it was
  if(measured&&sp.h>=5)return sp;
  if(c==='m'){if(fresh)sp.h=3.1+hash(id+'h')*.5;return sp;}
  const u=hash(id+'b2'),noWin=()=>{sp.faces={windows:Array(pts.length).fill(0)};};
  if(!fresh&&photo&&e.col)sp.roof=e.col;
  sp.chimney=false;sp.dormer=false;sp.balcony=false;
  if(c==='h'){
    sp.kind='shed';sp.sty=STY.glass;sp.wall=[.80,.90,.86];sp.windows=true;sp.pitched=four;sp.rh=1.1;sp.hip=false;sp.skel=null;sp.tops=null;
    if(photo){sp.roof=[.74,.84,.80];sp.roofSty=STY.flat;}if(!measured)sp.h=2.3;return sp;
  }
  if(c==='g'){
    sp.kind='shed';sp.pitched=false;sp.hip=false;sp.skel=null;sp.tops=null;sp.rh=null;
    if(u<.45){sp.sty=STY.corrugated;sp.wall=b2pick(B2_METAL,hash(id+'w'));}
    else if(u<.75){sp.sty=STY.panel;sp.wall=b2pick(B2_BLOCK,hash(id+'w'));}
    else{sp.sty=STY.brick;sp.wall=b2pick(B2_BLOCK,hash(id+'w'));}
    sp.windows=true;noWin();if(photo)sp.roofSty=u<.5?'flat':'sheet';
    if(!measured||sp.h>3.6)sp.h=2.5+hash(id+'h')*.5;return sp;
  }
  const hall=area>=150&&(c==='f'||c==='s');
  if(c==='f'||c==='s'){
    if(hall){sp.kind='industrial';sp.pitched=false;sp.sty=u<.55?STY.corrugated:STY.panel;sp.wall=u<.55?b2pick(B2_METAL,hash(id+'w')):b2pick(B2_BLOCK,hash(id+'w'));sp.hip=false;sp.skel=null;sp.tops=null;sp.rh=null;
      if(photo)sp.roofSty=u<.5?'corrugated':'asbestos';if(!measured)sp.h=4.4+Math.min(area,700)/700*1.6;}
    else{
      sp.kind='shed';sp.pitched=four&&(sp.pitched||!measured);if(!sp.pitched){sp.hip=false;sp.skel=null;sp.tops=null;}sp.rh=null;
      if(u<.4){sp.sty=STY.plank;sp.wall=b2pick(B2_BOARD,hash(id+'w'));}
      else if(u<.7){sp.sty=STY.corrugated;sp.wall=b2pick(B2_METAL,hash(id+'w'));}
      else{sp.sty=STY.brick;sp.wall=b2pick(B2_BLOCK,hash(id+'w'));}
      sp.windows=true;if(area<30||u>.85)noWin();else if(sp.sty===STY.plank)noWin();
      if(photo)sp.roofSty=u<.5?'corrugated':'asbestos';
      if(!measured)sp.h=2.4+Math.min(area,120)/120*1.1+hash(id+'h')*.3;
    }
    return sp;
  }
  if(c==='a'){
    sp.kind='shed';sp.pitched=four&&(sp.pitched||!measured);if(!sp.pitched){sp.hip=false;sp.skel=null;sp.tops=null;}sp.rh=null;
    if(u<.55){sp.sty=STY.plank;sp.wall=b2pick(WOOD,hash(id+'w'));}
    else if(u<.8){sp.sty=STY.plaster;sp.wall=b2pick(PASTEL,hash(id+'w'));}
    else{sp.sty=STY.brick;sp.wall=b2pick(B2_BLOCK,hash(id+'w'));}
    sp.windows=true;if(photo)sp.roofSty=u<.5?'asbestos':'sheet';
    if(!measured)sp.h=2.7+hash(id+'h')*.5;
  }
  return sp;
}
{const bs=buildingSpec;buildingSpec=(w,pts,area)=>bld2Look(bs(w,pts,area),w,pts,area);}
