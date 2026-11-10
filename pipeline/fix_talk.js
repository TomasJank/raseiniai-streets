// fixtalk: friends walking together get no goodbye and talk again only after a rest; goodbye pairs and fillers rotate
let byeRecent=[];
function pickBye(companions,out){
  if(companions){const f=TALK_HM.filter(x=>!out.some(o=>o[1]===x)),a=pick(f.length>1?f:TALK_HM);return[a,pick((f.length>1?f:TALK_HM).filter(x=>x!==a))];}
  const o=TALK_BYE.filter(b=>!byeRecent.includes(b)),b=pick(o.length?o:TALK_BYE);byeRecent=[b,...byeRecent].slice(0,2);return b;}
const talkRested=mem=>mem.every(p=>pedClock-(p.lastTalk||-1e9)>150);
