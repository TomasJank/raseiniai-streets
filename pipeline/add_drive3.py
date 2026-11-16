"""Per-model car performance and speed bumps (drive3.js; data in pipeline/drive3/perf.json and bumps.json).

The arcade constants live inline in driveCar0, updateTraffic, driveCop, updateBus and the gear bands of drive.js, updateAudio0
and carsound, so those lines are swapped for per-car values by text (each anchor exactly once); everything else wraps at run time.
usage: add_drive3.py page.html   (edits in place; after carsound, before hud2)
"""
import json, os, sys

path = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
h = open(path, encoding='utf-8').read()
js = open(os.path.join(here, 'drive3.js'), encoding='utf-8').read()
spec = json.load(open(os.path.join(here, 'drive3', 'perf.json')))
bumps = json.load(open(os.path.join(here, 'drive3', 'bumps.json')))


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


assert 'function carBumpSound(' in h, 'run add_carsound.py first'
# driveCar0: top speed, pull, brakes, grip, wall bounce, car-vs-car shove
rep('const MAX=37*SF.max*', 'const P3=d3P(c),MAX=P3.T*SF.max*')
rep('9.5*SF.acc*(1-c.speed/MAX)', 'P3.A*SF.acc*(1-c.speed/MAX)')
rep('else if(dn&&!up){c.speed-=(c.speed>0?20:6)*dt;', 'else if(dn&&!up){c.speed-=(c.speed>0?P3.brake:6)*dt;')
rep('*(1-.3*ENV.wet.value-.5*ENV.snow.value)*SF.grip;', '*(1-.3*ENV.wet.value-.5*ENV.snow.value)*SF.grip*P3.grip;')
rep('c.speed*=-.22;c.trav=c.h;', 'c.speed*=-P3.bounce;c.trav=c.h;')
rep('c.x+=nx*ov*.6;c.z+=nz*ov*.6;o.x-=nx*ov*.4;o.z-=nz*ov*.4;',
    'const mr=d3MR(c,o);c.x+=nx*ov*1.2*(1-mr);c.z+=nz*ov*1.2*(1-mr);o.x-=nx*ov*.8*mr;o.z-=nz*ov*.8*mr;')
rep('c.speed*=.55;if(o.ai)o.stun=2.5;', 'c.speed*=clamp(.55+.5*(mr-.5),.3,.8);if(o.ai)o.stun=2.5;')
# traffic, police, route bus
rep('c.speed+=clamp(target-c.speed,-12*dt,4*dt);', 'c.speed+=d3AI(c,target,dt);')
rep('c.speed+=clamp(target-c.speed,-20*dt,10*dt);', 'c.speed+=d3Cop(c,target,dt);')
rep('    let target=9;\n', '    let target=Math.min(9,d3Cap({x:bus.x,z:bus.z,h:bus.h},D3.VB.bus));\n')
# gears: drive.js (shift timing), updateAudio0 (synth fallback), carsound (recorded engine)
rep('const BANDS=[0,8,15,22,29,37,99];', 'const BANDS=d3Bands(inCar?c:null);')
rep('const B=[0,8,15,22,29,37,99];let g=0;', 'const B=d3Bands(inCar?c:null);let g=0;')
rep('v.g=csGear(v.g||0,s);const w0=csWant(s,v.g,acc>.4);', 'v.g=csGear(v.g||0,s,c);const w0=csWant(s,v.g,acc>.4,c);')
rep('const want=csWant(s,g,th);', 'const want=csWant(s,g,th,inCar?c:null);')
dump = lambda o: json.dumps(o, separators=(',', ':'), sort_keys=True)
rep('// ---------- boot ----------', 'const D3_SPEC=%s;\nconst D3_BUMPS=%s;\n' % (dump(spec), dump(bumps)) + js + '\n// ---------- boot ----------')
open(path, 'w', encoding='utf-8').write(h)
print('drive3 ok: %d models, %d bumps' % (len(spec) - 1, len(bumps)))
