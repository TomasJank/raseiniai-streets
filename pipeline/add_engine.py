"""Move the game from three r128 (cdnjs) to three 0.187 (jsdelivr ES module) with the r128 look kept.
Colour management is off and output stays linear, as r128 did; r155 dropped the pi factor on lights, so it goes back on in updateEnv.
Shader patches move to r187 chunk names: opaque_fragment replaces the bare gl_FragColor line, maps read vMapUv (vUv needs USE_UV now).
usage: add_engine.py page.html   (edits in place; run last)
"""
import sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()
def rep(a, b, n=1, s=None):
    global h
    t = h if s is None else h[s[0]:s[1]]
    assert t.count(a) == n, (t.count(a), a[:80])
    t = t.replace(a, b)
    h = t if s is None else h[:s[0]] + t + h[s[1]:]

THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js'
rep('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script>\n(function(){\n"use strict";\n',
    f'<script type="module">\nimport * as THREE from \'{THREE_URL}\';\nTHREE.ColorManagement.enabled=false;\n(function(){{\n"use strict";\n')
rep('renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;',
    'renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.LinearSRGBColorSpace;')
rep("  $('#clock').textContent=clockText()+(w>.3?' · '+(weather.kind==='rain'?'Rain':'Snow'):'');\n}\n",
    "  $('#clock').textContent=clockText()+(w>.3?' · '+(weather.kind==='rain'?'Rain':'Snow'):'');\n  hemi.intensity*=Math.PI;sun.intensity*=Math.PI;\n}\n")
rep("renderer.capabilities.isWebGL2?", "true?")

a = h.index('function facadeShader(sh){')
b = h.index('\nfunction ', a + 10)
rep('vUv', 'vMapUv', 6, (a, b))
rep('diffuseColor.rgb*=vColor;', 'diffuseColor.rgb*=vColor.rgb;', 1, (a, b))
rep(".replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );','",
    ".replace('#include <opaque_fragment>','")
rep("outgoingLight=mix(outgoingLight,sk,gM*fr);gl_FragColor = vec4( outgoingLight, diffuseColor.a );')",
    "outgoingLight=mix(outgoingLight,sk,gM*fr);\\n#include <opaque_fragment>')")

open(path, 'w', encoding='utf-8').write(h)
print('engine ok')
