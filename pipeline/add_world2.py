"""Weather by rules (rain needs humidity and cloud, snow needs frost, by the real month and the hour; Y still forces one for a while)
and grass blades around the camera that sit on the real ground, stay off roads and buildings, sway in the wind and flatten under tyres (G toggles).
usage: add_world2.py page.html   (edits in place; run after add_feel.py)
"""
import os, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'world2.js'), encoding='utf-8').read()
def rep(a, b, n=1):
    global h
    assert h.count(a) == n, (h.count(a), a[:80])
    h = h.replace(a, b)

rep('function updateEnv(dt){', js + 'function updateEnv(dt){')
rep('  if((weather.next-=dt)<=0)nextWeather();\n', '  wxRules(dt);\n')
rep("  if(force){weather.kind=", "  if(force){weather.force=150;weather.kind=")
rep("$('#clock').textContent=clockText()+(w>.3?' · '+(weather.kind==='rain'?'Rain':'Snow'):'');",
    "$('#clock').textContent=clockText()+' · '+Math.round(weather.temp)+'°C'+(w>.3?' · '+(weather.kind==='rain'?'Rain':'Snow'):'');")
# what counts as grass for the blades
rep('const ground=new THREE.Mesh(gg,gMat);', 'const ground=new THREE.Mesh(gg,gMat);ground.userData.grass=true;')
rep('for(const A of [RD,MK,GR])if(A.pos.length){const m=new THREE.Mesh(mkGeo(A.pos,A.col,A.nor),flatMat);m.receiveShadow=true;worldGroup.add(m);}',
    'for(const A of [RD,MK,GR])if(A.pos.length){const m=new THREE.Mesh(mkGeo(A.pos,A.col,A.nor),flatMat);m.receiveShadow=true;m.userData.grass=A===GR;worldGroup.add(m);}')
rep('  updateEnv(playing?dt:0);\n', '  updateEnv(playing?dt:0);updateGrass(dt);\n')
rep("  else if(code==='KeyR')resetToRoad();", "  else if(code==='KeyR')resetToRoad();\n  else if(code==='KeyG'){grassOn=!grassOn;toast(grassOn?'Grass on':'Grass off','G switches it.');}")
open(path, 'w', encoding='utf-8').write(h)
print('world2 ok')
