// fixtalk2: who may say what. A kid next to its parent gets kid talks, people walking together never get a "meet" talk
// (third element 1: greetings, "where are you off to"), they close with "let's go" instead of a goodbye
const talkKid=q=>q&&q.look&&q.look.age==='kid'?1:0;
const talkComp=mem=>mem.length>1&&mem.slice(1).every(q=>q.lead===mem[0]);
const talkFits=(t,mem)=>(t[0]==='kid')===!!talkKid(mem[1])&&!(t[2]&&talkComp(mem));
let goRecent=null;
function pickGo(){const c=pick(TALK_GO.filter(x=>x!==goRecent));goRecent=c;return c;}
