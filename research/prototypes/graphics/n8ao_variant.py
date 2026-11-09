"""Prototype only: swap GTAOPass for N8AOPass in a built page. usage: n8ao_variant.py in.html out.html (bundle at window.__N8URL, see report)"""
import sys
h=open(sys.argv[1],encoding='utf-8').read()
a="    c.addPass(new RenderPass(scene,camera));\n    if(ga){"
assert h.count(a)==1
h=h.replace(a,"""    if(window.__N8URL){const m=await import(window.__N8URL),n=new m.N8AOPass(scene,camera,sz.x*pr,sz.y*pr);const q=GFX.n8||{};
      n.configuration.aoRadius=q.radius??3;n.configuration.distanceFalloff=q.falloff??1;n.configuration.intensity=q.intensity??3;n.configuration.halfRes=q.halfRes??false;
      if(q.quality)n.setQualityMode(q.quality);c.addPass(n);gfxState.n8=n;}else c.addPass(new RenderPass(scene,camera));
    if(ga&&!window.__N8URL){""")
open(sys.argv[2],'w',encoding='utf-8').write(h)
