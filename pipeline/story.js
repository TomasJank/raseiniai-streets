// ---------- story missions: errands for friends, started from green rings ----------
MARK_COL.story='#2fd47a';LABEL_COL.story=MARK_COL.story;
const SPOTS={gvidas:[55.3726278,23.1208895,'Pas Gvidą'],energy:[55.3891249,23.1278722,'Energy gym'],gimn:[55.3849963,23.1076177,'Žemaičio gimnazija'],
  svilpa:[55.3757416,23.1207139,'Švilpos namai'],sale:[55.3722196,23.1275741,'Sporto centras']};
// do: get = pick up an item (on foot is fine), pick = a passenger (needs the car, stopped), drop = deliver either
const STORY=[
  {id:'alus',title:'Alaus Gvidui',pay:300,steps:[
    {at:'Maxima XX',do:'get',lbl:'Nupirk alaus',say:['Alus paimtas','Gvidas laukia. Nesudaužyk butelių.']},
    {at:'gvidas',do:'drop',lbl:'Nuvežk Gvidui',say:['Į sveikatą!','Gvidas atidaro pirmą.']}]},
  {id:'vistiena',title:'Vištiena Baužai',pay:300,steps:[
    {at:'Norfa',do:'get',lbl:'Nupirk vištienos krūtinėlės',say:['Vištiena paimta','Bauža pietauja tarp serijų. Skubėk.']},
    {at:'energy',do:'drop',lbl:'Pietūs Baužai',tight:.8,say:['Baltymai pristatyti','Bauža: „Dabar bus rekordas.“']}]},
  {id:'svilpa',title:'Parvežk Švilpą',pay:300,steps:[
    {at:'gimn',do:'pick',lbl:'Paimk Švilpą',say:['Švilpa įlipo','„Pagaliau. Važiuojam namo.“']},
    {at:'svilpa',do:'drop',lbl:'Parvežk namo',say:['Švilpa namie','„Ačiū, rytoj vėl.“']}]},
  {id:'domux',title:'Domux į salę',pay:300,steps:[
    {at:'gimn',do:'pick',lbl:'Paimk Domuxą',say:['Domux įlipo','„Krepšinis tuoj prasideda.“']},
    {at:'sale',do:'drop',lbl:'Į sporto salę',say:['Domux salėje','Laikas pamėtyti.']}]},
  {id:'kebabas',title:'Bauža po treniruotės',pay:250,steps:[
    {at:'energy',do:'pick',lbl:'Paimk Baužą',say:['Bauža įlipo','„Vištiena buvo gerai, bet dabar kebabo.“']},
    {at:'Kebabai',do:'drop',lbl:'Į kebabinę',say:['Kebabinė','Bauža užsisako dvigubą.']}]},
  {id:'kamuolys',title:'Pamirštas kamuolys',pay:300,steps:[
    {at:'gimn',do:'get',lbl:'Paimk Domux kamuolį',say:['Kamuolys paimtas','Rungtynės prasideda. Greičiau.']},
    {at:'sale',do:'drop',lbl:'Nuvežk į salę',tight:.75,say:['Kamuolys atvežtas','Domux: „Spėjai, legenda.“']}]},
  {id:'vakaras',title:'Visi pas Gvidą',pay:800,need:4,steps:[
    {at:'svilpa',do:'pick',lbl:'Paimk Švilpą',say:['Švilpa įlipo','Dabar Domux.']},
    {at:'sale',do:'pick',lbl:'Paimk Domuxą',say:['Domux įlipo','Dabar Bauža.']},
    {at:'energy',do:'pick',lbl:'Paimk Baužą',say:['Bauža įlipo','Visi viduje. Pas Gvidą.']},
    {at:'gvidas',do:'drop',lbl:'Vežk visus',say:['Kompanija vietoje','Gvidas jau atšaldė alų.']}]},
];
let storyPts={},storyMarks=[],storyAway=true;
// poker at Aivaras's (Gintaro g. 18): drive up, play a hand, lose every time
MARK_COL.poker='#ff5a4f';LABEL_COL.poker=MARK_COL.poker;
const POKER_MINE=['pora dvejukų','aukščiausia dama','dvi poros','trys septynetai','tiesė iki devynetų'],
  POKER_HIS=['karališkas flešas','ketveri tūzai','pilnas namas','flešas','spalvota tiesė'];
let poker=null,pokerAway=true;
function buildPoker(){
  if(poker)worldGroup.remove(poker.ring,poker.sp);poker=null;
  const [x,z]=LL(55.3724073,23.1402232),n=onRoad(x,z,2,120);if(!n)return;
  const r=ringOf(MARK_COL.poker,6);r.position.set(n.x,GY(n.x,n.z)+.3,n.z);worldGroup.add(r);
  poker={x:n.x,z:n.z,ring:r,sp:sign('Pokeris su Aivaru','poker',n.x,n.z,5)};
}
function playPoker(){
  const mine=pick(POKER_MINE),his=pick(POKER_HIS),loss=Math.min(cash,10*Math.round(5+Math.random()*25));
  save.poker=(save.poker||0)+1;const n=save.poker;
  toast('Pokeris su Aivaru','Tavo ranka: '+mine+'.');notes([[392,.1],[440,.1]],'triangle',.1);
  setTimeout(()=>toast('Aivaras: '+his,'Jis net nesišypso.'),2600);
  setTimeout(()=>{cash=Math.max(0,cash-loss);money();store();
    toast(loss?'Pralošei €'+loss:'Neturi nė euro',loss?(n>1?'Aivaras laimėjo jau '+n+' kartus iš eilės.':'Gal kitą kartą.'):'Aivaras užrašė skolą.');
    notes([[330,.15],[262,.3]],'sawtooth',.1);},5200);
}
const storyRuns=id=>(save.story||{})[id]||0;
function buildStory(){
  for(const m of storyMarks){worldGroup.remove(m.ring,m.sp);}
  storyPts={};storyMarks=[];storyAway=true;
  if(mission&&mission.kind==='story'){mission=null;missionCool=1;}
  const L=world.labels||[];
  for(const s of STORY)for(const st of s.steps){
    if(st.at in storyPts)continue;
    let p=null,name=st.at;
    if(SPOTS[st.at]){p=LL(SPOTS[st.at][0],SPOTS[st.at][1]);name=SPOTS[st.at][2];}
    else{const l=L.find(l=>l.text===st.at);if(l){p=[l.x,l.z];name=shortName(l.text);}}
    const n=p&&onRoad(p[0],p[1],2,150);
    if(!n){storyPts[st.at]=null;continue;}
    // the person waits at the kerb on the building's side of the road
    const dx=p[0]-n.x,dz=p[1]-n.z,d=Math.hypot(dx,dz)||1,k=Math.min(4,d);
    storyPts[st.at]={x:n.x,z:n.z,px:n.x+dx/d*k,pz:n.z+dz/d*k,name};
  }
  placeStoryMarks();buildPoker();
}
const storyOk=s=>s.steps.every(st=>storyPts[st.at])&&(!s.need||STORY.filter(q=>storyRuns(q.id)).length>=s.need);
function placeStoryMarks(){
  for(const m of storyMarks){worldGroup.remove(m.ring,m.sp);}
  storyMarks=[];
  // one ring per spot: the mission there played the fewest times, earlier in the list on a tie
  const bySpot=new Map();
  for(const s of STORY){if(!storyOk(s))continue;const a=s.steps[0].at,o=bySpot.get(a);if(!o||storyRuns(s.id)<storyRuns(o.id))bySpot.set(a,s);}
  for(const [a,s] of bySpot){const p=storyPts[a],r=ringOf(MARK_COL.story,6);r.position.set(p.x,GY(p.x,p.z)+.3,p.z);worldGroup.add(r);
    storyMarks.push({s,x:p.x,z:p.z,ring:r,sp:sign(s.title,'story',p.x,p.z,5)});}
}
function storyHud(){
  const m=mission,st=m.s.steps[m.i],p=storyPts[st.at];
  $('#mLbl').textContent=m.s.title;$('#mTarget').textContent=st.lbl+' · '+p.name;
  const gy=GY(p.x,p.z);beam.visible=ring.visible=true;beam.position.set(p.x,gy+23,p.z);ring.position.set(p.x,gy+.15,p.z);showBonus();
}
function storyStep(){
  const m=mission,st=m.s.steps[m.i],prev=storyPts[m.s.steps[m.i-1].at],p=storyPts[st.at];
  m.x=p.x;m.z=p.z;m.name=p.name;m.time=Math.max(0,m.time||0)+Math.round((Math.hypot(p.x-prev.x,p.z-prev.z)/8.5+30)*(st.tight||1));
  storyHud();
}
function startStory(s){
  fare=null;cargo=1;missionCool=0;
  mission={kind:'story',s,i:1,pax:s.steps[0].do==='pick'};
  toast(s.steps[0].say[0],s.steps[0].say[1]);notes([[587,.08],[784,.12]],'triangle',.12);
  storyStep();
}
function endStory(done){
  const m=mission;mission=null;beam.visible=ring.visible=false;fare=null;storyAway=false;
  if(done){const first=!storyRuns(m.s.id),pay=Math.round(m.s.pay*(first?1:.5)*(.4+.6*cargo)+m.time*3);
    save.story=save.story||{};save.story[m.s.id]=storyRuns(m.s.id)+1;cash+=pay;money();store();
    const st=m.s.steps[m.s.steps.length-1];toast(st.say[0]+' +€'+pay.toLocaleString('en'),st.say[1]);notes([[523,.1],[659,.1],[784,.1],[1047,.3]],'triangle',.14);
    placeStoryMarks();
  }else toast(m.s.title+': nepavyko',m.time<=0?'Per vėlu. Bandyk dar kartą.':'Misija atšaukta.');
  cargo=1;missionCool=2;showBonus();
}
function updateStory(dt){
  const m=mission,st=m.s.steps[m.i],c=player.mode==='car'?player.car:null;
  m.time-=dt;const d=Math.hypot(m.x-player.x,m.z-player.z);
  $('#mDist').textContent=(d>=1000?(d/1000).toFixed(1)+' km':Math.round(d)+' m');
  const mt=$('#mTime');mt.textContent=fmtTime(m.time);mt.classList.toggle('low',m.time<10);
  beam.material.opacity=.22+.12*Math.sin(performance.now()/300);
  if(st.do==='pick'&&d<150&&!fare){const p=storyPts[st.at];fare={x:p.px,z:p.pz,h:Math.atan2(p.x-p.px,p.z-p.pz),ph:0,look:randomLook(FARE_I)};}
  if(d<8&&(st.do!=='pick'||c&&Math.abs(c.speed)<2.5)){
    fare=null;
    if(m.i===m.s.steps.length-1){endStory(true);return;}
    if(st.do==='pick')m.pax=true;
    toast(st.say[0],st.say[1]);notes([[587,.08],[784,.12]],'triangle',.12);
    m.i++;storyStep();
  }else if(st.do==='pick'&&d<8&&!c&&!m.told){m.told=true;toast('Reikia mašinos','Privažiuok prie draugo.');}
  else if(m.time<=0)endStory(false);
}
function storyTick(c,slow){
  const busy=race||(mission&&mission.kind==='story'),taxiWait=mission&&mission.kind==='taxi'&&mission.stage==='pickup';
  let near=false,waiting=null;
  for(const m of storyMarks){const d=Math.hypot(m.x-player.x,m.z-player.z);m.ring.visible=m.sp.visible=!busy&&d<600;
    if(d<12)near=true;
    if(!busy&&m.s.steps[0].do==='pick'&&d<150&&(!waiting||d<waiting.d))waiting={m,d};
    if(!busy&&storyAway&&d<7&&(m.s.steps[0].do==='pick'?c&&slow:!c||slow)){startStory(m.s);return;}}
  if(!near)storyAway=true;
  if(poker){const d=Math.hypot(poker.x-player.x,poker.z-player.z);poker.ring.visible=poker.sp.visible=!busy&&d<600;
    if(d>15)pokerAway=true;else if(!busy&&pokerAway&&d<7&&(!c||slow)){pokerAway=false;playPoker();}}
  // the friend waiting at a pick-up ring stands on the kerb, unless a taxi fare is using the same figure
  if(taxiWait)return;
  if(busy){if(fare&&fare.mark)fare=null;}
  else{
    if(waiting){const p=storyPts[waiting.m.s.steps[0].at];if(!fare||fare.mark!==waiting.m)fare={x:p.px,z:p.pz,h:Math.atan2(p.x-p.px,p.z-p.pz),ph:0,look:randomLook(FARE_I),mark:waiting.m};}
    else if(fare&&fare.mark)fare=null;
  }
}
