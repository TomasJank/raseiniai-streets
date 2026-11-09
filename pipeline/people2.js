// ---------- people: age, clothes for the weather, hats, bags, coats, sticks ----------
// a kid only ever appears as the follower of an adult (its guard); the old walk slowly and stoop; the colder it is, the more coats and hats
const cat=(...gs)=>{const o=new THREE.BufferGeometry(),n=gs.map(g=>g.index?g.toNonIndexed():g);
  for(const a of['position','normal'])o.setAttribute(a,new THREE.Float32BufferAttribute(n.flatMap(g=>[...g.attributes[a].array]),3));return o;};
const GEAR=[
  {g:cat(new THREE.SphereGeometry(1,12,6,0,TAU,0,1.5).scale(.12,.15,.13).translate(0,.135,-.006),new THREE.CylinderGeometry(.124,.124,.05,12).scale(1,1,1.08).translate(0,.135,-.006)),col:'hat',o:[0,0,0],at:3,opt:'hat'},
  {g:cat(new THREE.SphereGeometry(1,12,6,0,TAU,0,1.5).scale(.114,.11,.122).translate(0,.15,-.006),new THREE.BoxGeometry(.17,.014,.11).rotateX(-.12).translate(0,.155,.135)),col:'hat',o:[0,0,0],at:3,opt:'cap'},
  {g:cat(new THREE.BoxGeometry(.27,.34,.13).translate(0,.28,-.185),new THREE.BoxGeometry(.035,.3,.02).translate(-.09,.33,.11),new THREE.BoxGeometry(.035,.3,.02).translate(.09,.33,.11)),col:'pack',o:[0,0,0],at:1,opt:'pack'},
  {g:cat(new THREE.BoxGeometry(.07,.2,.25).translate(.26,.02,.03),new THREE.BoxGeometry(.025,.56,.012).rotateZ(.75).translate(.06,.29,.115)),col:'bag',o:[0,0,0],at:1,opt:'bag'},
  {g:new THREE.CylinderGeometry(.19,.245,.42,14).scale(1,1,.76).translate(0,-.21,0),col:'coat',o:[0,.97,0],opt:'coat'},
  {g:cat(new THREE.TorusGeometry(.075,.033,6,14).rotateX(Math.PI/2).scale(1,1,.85).translate(0,.53,.005),new THREE.BoxGeometry(.06,.2,.025).translate(.05,.43,.1)),col:'scarf',o:[0,0,0],at:1,opt:'scarf'},
  {g:new THREE.SphereGeometry(1,8,6).scale(.045,.11,.045).rotateX(.3).translate(0,.08,-.14),col:'hair',o:[0,0,0],at:4,opt:'tail'},
  {g:new THREE.CylinderGeometry(.013,.013,.88,6).translate(0,-.44,.03),col:'stick',o:[0,0,0],at:8,opt:'stick'}];
const SUMMER=[0xe8e4da,0x7fb3d5,0xf2c14e,0xe07a5f,0x9cc9a0,0xd9d2e9,0xc94c4c,0x5b8fd1,0xf4f1ea],
  COATS=[0x1f2328,0x2b3446,0x3d3a36,0x5a4632,0xb8a58a,0x4b5640,0x6a2c35,0x55606b,0x23272b],KIDCOATS=[0xd0413b,0x2f7fd0,0xf0b429,0xd65fa0,0x3aa37a,0x6a4fb0],
  HATS=[0x1f2328,0x8a2c2c,0x2c4a7a,0xd8d4c8,0x6b6f76,0xc0782f,0x3b5e3b,0xb03a6a],SCARVES=[0xb22d2d,0xd8a23a,0x2f5a8a,0xe8e4da,0x6b3f7a,0x404448,0x2f6b4f],
  PACKS=[0x23272b,0x2f4f7a,0x7a2f2f,0x4e6b3a,0xd6a23a,0x3a6f8f],BAGS=[0x3a2a1f,0x1d1c1b,0x8a5a3a,0xc9b79c,0xe8e4da,0xb0302c,0x6b2a3a],
  FACES=[0xf2d0b8,0xe8bfa0,0xe8bfa0,0xe2b493,0xe2b493,0xd9a884,0xe6a98c,0xf0c4a8,0xc8916c,0xa8714f],
  HAIR_Y=[0x3a2c20,0x3a2c20,0x6b5136,0x6b5136,0xb59a6a,0xd8c08a,0xe2cf9a,0x23201c,0x8a4a2a,0x5a3a26],HAIR_O=[0x9c9c98,0xd0cfc9,0xb8b6b0,0xe6e4de,0x8a8680],HAIR_DYE=[0x5a2a3a,0x7a3a2a,0x9a6a4a];
let pedCold=0;
function coldNow(){const t=weather.temp??MONTH_T[new Date().getMonth()];return Math.max(clamp((15-t)/12,0,1),weather.kind==='snow'?.95:0);}
// wrapped rather than patched: the talk, fight and solid steps edit these bodies
const resetPed0=resetPed,pedPlace0=pedPlace,stepPed0=stepPed,pedAct0=pedAct,driverRunsOff0=driverRunsOff;
resetPed=p=>{if(p.mode==='hide'){p.look=randomLook(peds.indexOf(p));p.sp=p.look.sp;}p.guard=null;resetPed0(p);
  if(p.look.age==='old'||p.look.age==='kid')p.pr=.5+p.pr*.5;else if(p.look.young)p.pr*=.4;};
pedPlace=p=>{pedCold=coldNow();if(!pedPlace0(p))return false;
  if(p.mode==='walk'&&!p.lead&&tod>7.5&&tod<21&&Math.random()<.22){let t=p,q;while((q=peds.find(o=>o.lead===t&&o.mode!=='hide')))t=q;
    if(t.look.age!=='kid'){addFollower(t);const k=peds.find(o=>o.lead===t&&o.mode==='walk');if(k){k.look=randomLook(peds.indexOf(k),'kid');k.guard=t;}}}
  const g=[p];for(let n=0;n<g.length;n++)for(const o of peds)if(o.lead===g[n]&&o.mode!=='hide')g.push(o);
  const sp=Math.min(...g.map(o=>o.look.sp));for(const o of g)o.sp=sp;
  return true;};
stepPed=(p,dt,M)=>{stepPed0(p,dt,M);if(p.look.age!=='kid'||p.mode==='hide')return;const g=p.guard;
  if(!g||g.mode==='hide'||g.look.age==='kid'||Math.hypot(g.x-p.x,g.z-p.z)>40){p.mode='hide';p.lead=null;}
  else if(!p.lead&&p.mode==='walk')p.lead=g;};
pedAct=p=>{let a=pedAct0(p);if(p.look.age!=='old')return a;if(!a){a=ACT;a.fill(NaN);a.phone=false;}
  if(a[1]!==a[1]){a[1]=.3;for(const k of[3,4,5])if(a[k]!==a[k])a[k]=-.24;}return a;};
// ponytail: an all-visible crowd still lets the driver be a kid; it is hidden next step by the guard check
driverRunsOff=c=>{peds.forEach((p,i)=>{if(p.mode==='hide'&&p.look.age==='kid')p.look=randomLook(i);});driverRunsOff0(c);};
function dress(i,cols){PARTS.forEach((p,k)=>pedMesh[k].setColorAt(i,_pc.setHex(cols[p.c2]??cols[p.col]??0x808080)));pedMesh.forEach(m=>{if(m.instanceColor)m.instanceColor.needsUpdate=true;});}
function randomLook(i,age){
  const r=Math.random,c=pedCold,f=r()<.5,warm=c<.15;age=age||(r()<.24?'old':'adult');
  const kid=age==='kid',old=age==='old',young=age==='adult'&&r()<.45,outer=r()<c*.85;
  const look={age,male:!f,young,s:kid?.55+r()*.15:(f?.92+r()*.08:.97+r()*.1)*(old?.97:1),sp:old?.7+r()*.15:1.2+r()*.6};
  look.coat=outer&&!kid&&r()<.7;look.hat=r()<c*(kid?.9:old?.85:.65);look.cap=!look.hat&&(kid||young&&!f)&&r()<(warm?.35:.15);
  look.scarf=r()<c*.55;look.pack=kid?r()<.55:young&&r()<.35;look.bag=!kid&&!look.pack&&r()<(f?.6:.1);look.stick=old&&r()<.35;
  const bald=!f&&r()<(old?.45:kid?0:.08);look.long=f&&!old&&r()<(kid?.4:.6);look.tail=f&&!look.long&&!old&&r()<.55;
  look.skirt=f&&!look.coat&&r()<(old?.6:.3);
  const skin=pick(FACES),hair=bald?skin:old?(f&&r()<.3?pick(HAIR_DYE):pick(HAIR_O)):f&&r()<.15?pick(HAIR_DYE):pick(HAIR_Y);
  const top=outer?(kid?pick(KIDCOATS):pick(COATS)):pick(warm?SUMMER:SHIRTS),legs=look.skirt?pick(SHIRTS):pick(TROUSERS);
  const shin=warm&&(look.skirt||(kid||!f)&&r()<.45)?skin:look.skirt?pick([0x1f2328,0x2f3236,0x4a3a36,0xc8a888]):legs;
  dress(i,{shirt:top,fore:warm&&!outer&&r()<.7?skin:top,skin,hair,legs,shin,shoe:pick(SHOES),
    hat:look.cap?pick(warm?SUMMER:HATS):pick(HATS),pack:pick(PACKS),bag:pick(BAGS),coat:top,scarf:pick(SCARVES),stick:0x4a3524});
  return look;}
