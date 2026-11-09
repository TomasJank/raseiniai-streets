# three/addons need a bare 'three' specifier; the importmap resolves it to the same module the game already imports.
import sys
p=sys.argv[1];h=open(p,encoding='utf-8').read()
old='<script type="module">';assert h.count(old)==1 and 'importmap' not in h
im='<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/"}}</script>\n'
open(p,'w',encoding='utf-8').write(h.replace(old,im+old));print('importmap ok')
