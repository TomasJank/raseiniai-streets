"""Street polish from data: every pipeline/streets/*.json (+ optional {slug}.js hook) merged into the build.
Files starting with '_' are examples and skipped. The contract is pipeline/streets/README.md.

usage: add_streets.py page.html [--dir pipeline/streets]     (edits in place)
       add_streets.py --check pipeline/streets/<slug>.json    (validates one file, writes nothing)
"""
import argparse, glob, json, math, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from street_ids import PAGE, Town, along, nearest

# default size [sx,sy,sz] m (x across, y up, z = the side the front faces), colour, collision footprint [fx,fz] at that size,
# parts [w,h,d, x,y,z, shade, ico] in m with y from the ground; one InstancedMesh per kind, coloured per instance
KINDS = {
    'bench': {'s': [1.7, .96, .5], 'col': '#6b5038', 'f': [1.7, .5], 'parts': [
        [1.7, .07, .42, 0, .45, .04], [1.7, .36, .06, 0, .78, -.2], [.08, .45, .46, -.7, .22, 0, .4], [.08, .45, .46, .7, .22, 0, .4]]},
    'bin': {'s': [.5, .8, .5], 'col': '#2e4636', 'f': [.5, .5], 'parts': [[.45, .75, .45, 0, .375, 0], [.5, .05, .5, 0, .775, 0, .7]]},
    'lamp': {'s': [.5, 4.7, .5], 'col': '#3a3f42', 'f': [.18, .18], 'parts': [[.13, 4.5, .13, 0, 2.25, 0], [.5, .2, .5, 0, 4.6, 0, .8]]},
    'bollard': {'s': [.2, .9, .2], 'col': '#3b3e40', 'f': [.2, .2], 'parts': [[.2, .9, .2, 0, .45, 0]]},
    'planter': {'s': [1.2, .5, 1.2], 'col': '#8d8a82', 'f': [1.2, 1.2], 'parts': [[1.2, .5, 1.2, 0, .25, 0], [1.0, .04, 1.0, 0, .5, 0, .35]]},
    'post': {'s': [.1, 2.6, .1], 'col': '#8a8f93', 'f': [.12, .12], 'parts': [[.1, 2.6, .1, 0, 1.3, 0]]},
    'box': {'s': [.7, 1.2, .4], 'col': '#9a9c94', 'f': [.7, .4], 'parts': [[.7, 1.2, .4, 0, .6, 0]]},
    'bush': {'s': [1.2, .9, 1.2], 'col': '#4a6b35', 'f': [1.0, 1.0], 'parts': [[1.2, .9, 1.2, 0, .45, 0, 1, 1]]},
    'treeS': {'s': [2.2, 4.5, 2.2], 'col': '#4f7a3a', 'f': [.25, .25], 'parts': [[.18, 1.8, .18, 0, .9, 0, .4], [2.2, 2.9, 2.2, 0, 3.05, 0, 1, 1]]},
}
FENCES = {'picket': [1.1, .05, '#d8d2c0'], 'mesh': [1.5, .04, '#6f7a72'], 'hedge': [1.3, .7, '#3f5f2e'], 'wall': [1.6, .25, '#b9b4a8']}
PLACES = {'shop': 'commercial', 'cafe': 'commercial', 'bank': 'commercial', 'pharmacy': 'commercial', 'school': 'civic',
          'church': 'church', 'monument': 'civic', 'bus_stop': 'civic'}
STY = ['plaster', 'old', 'shop', 'block', 'brick', 'wood', 'industrial', 'glass', 'tiles', 'sheet', 'flat', 'none']
TOP = {'street', 'slug', 'flavour', 'looks', 'props', 'signs', 'fences', 'parking', 'places', 'views'}
ITEM = {  # key -> (allowed keys, required keys)
    'props': ({'k', 'll', 'hd', 's', 'col', 'solid', 'knock'}, {'k', 'll'}),
    'signs': ({'text', 'll', 'hd', 'w', 'h', 'y', 'bg', 'fg'}, {'text', 'll', 'hd'}),
    'fences': ({'style', 'll', 'h'}, {'style', 'll'}),
    'parking': ({'ll', 'side', 'every', 'fill'}, {'ll'}),
    'places': ({'name', 'll', 'kind'}, {'name', 'll', 'kind'}),
    'views': ({'ll', 'hd'}, {'ll', 'hd'}),
}
LOOK_KEYS = {'wall', 'roof', 'sty', 'windows', 'pitched', 'hip', 'h', 'rh'}
MAX_SIGNS, NEAR, LOOK_NEAR = 10, 60, 45

RUNTIME = r"""
const STREETS=%(streets)s,STREET_KINDS=%(kinds)s,STREET_FENCE=%(fences)s,STREET_PLACE=%(places)s,STREET_SLUG=%(slugs)s,STREET_KNOCK=%(knock)s;
TALKS.push(...STREETS.flatMap(s=>(s.flavour||[]).map(l=>['street:'+s.slug,l])));
%(hooks)s
function buildStreets(){
  const W=world,deg=d=>Math.PI-(d||0)*Math.PI/180,L={},signs=[],solids=[],segs=[],unit=new THREE.BoxGeometry(1,1,1);
  W.streets={props:0,hook:0,signs:0,solids,segs};
  const wall=(x0,z0,x1,z1)=>{addWall(x0,z0,x1,z1);segs.push([x0,z0,x1,z1]);};
  const put=(k,o)=>{const K=STREET_KINDS[k];if(!K)throw new Error('street prop kind '+k);const [x,z]=o.xz||LL(...o.ll),p={x,y:GY(x,z),z,h:deg(o.hd),s:o.s||K.s,col:o.col||K.col,o};
    (L[k]||(L[k]=[])).push(p);return p;};
  const rect=(x,z,w,d,h)=>{const c=Math.cos(h),s=Math.sin(h),q=[[-w,-d],[w,-d],[w,d],[-w,d]].map(([a,b])=>[x+a/2*c+b/2*s,z-a/2*s+b/2*c]);for(let i=0;i<4;i++)wall(...q[i],...q[(i+1)%%4]);};
  const ctx={LL,GY,put:(k,o)=>{W.streets.hook++;return put(k,o);},sign:o=>{signs.push(o);},addWall:wall,addProp:p=>{addProp(p);solids.push(p);},
    solid:(x,z,w,d,hd)=>rect(x,z,w,d,deg(hd)),world:W,STY,LOOK,hash};
  const cars=[];
  for(const S of STREETS){
    for(const o of S.props||[]){put(o.k,o);W.streets.props++;}
    signs.push(...S.signs||[]);
    for(const f of S.fences||[]){const st=STREET_FENCE[f.style],h=f.h||st[0],P=f.ll.map(q=>LL(...q));
      for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l<.05)continue;const ux=(b[0]-a[0])/l,uz=(b[1]-a[1])/l,hd=Math.atan2(ux,uz),
          at=(k,t,y,sx,sy,sz)=>{const x=a[0]+ux*t,z=a[1]+uz*t;(L['fence:'+k]||(L['fence:'+k]=[])).push([x,GY(x,z)+y,z,hd,sx,sy,sz]);};
        if(f.style==='picket'){for(const y of[.3,.8])at('picket',l/2,h*y,.03,.07,l);for(let t=.07;t<l;t+=.14)at('picket',t,h/2,.025,h,.08);}
        else{at(f.style,l/2,h/2,st[1],h,l);if(f.style==='mesh')for(let t=0;t<=l;t+=2.5)at('post',t,h/2,.06,h,.06);}
        wall(a[0],a[1],b[0],b[1]);}}
    S.parking&&S.parking.forEach((p,j)=>{const [a,b]=p.ll.map(q=>LL(...q)),l=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/l,uz=(b[1]-a[1])/l,sd=p.side||0,ev=p.every||(sd?2.6:6),fill=p.fill??.6;
      for(let t=ev/2,i=0;t<=l-ev/2+1e-6;t+=ev,i++){if(hash(S.slug+j+'p'+i)>=fill)continue;const x=a[0]+ux*t,z=a[1]+uz*t,dx=sd?-uz*sd:ux,dz=sd?ux*sd:uz;
        cars.push([x,GY(x,z),z,Math.atan2(dx,dz),CAR_COLORS[Math.floor(hash(S.slug+j+'c'+i)*CAR_COLORS.length)],Math.floor(hash(S.slug+j+'k'+i)*LOT_GEOS.length)]);
        const q=[[-2.2,-.9],[2.2,-.9],[2.2,.9],[-2.2,.9]].map(([u,v])=>[x+dx*u-dz*v,z+dz*u+dx*v]);for(let k=0;k<4;k++)wall(...q[k],...q[(k+1)%%4]);}});
    for(const pl of S.places||[]){const [x,z]=LL(...pl.ll),n=shortName(pl.name);if(W.labels.some(q=>shortName(q.text)===n&&Math.hypot(q.x-x,q.z-z)<60))continue;
      const y=GY(x,z)+6,sp=makeLabel(pl.name,STREET_PLACE[pl.kind]);sp.position.set(x,y,z);worldGroup.add(sp);W.labels.push({x,z,y,text:pl.name,kind:STREET_PLACE[pl.kind],sp});}
    const hook=STREET_HOOKS[S.slug];if(hook)hook(ctx);
  }
  if(cars.length)addParkedCars(cars);
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),V=new THREE.Vector3(),SC=new THREE.Vector3(),C=new THREE.Color();
  for(const k in L){
    if(k.startsWith('fence:')){const st=k.slice(6),m=instances(unit,st==='post'?'#4a524c':STREET_FENCE[st][2],L[k]);if(st==='mesh'){m.material.transparent=true;m.material.opacity=.45;m.castShadow=false;}continue;}
    const K=STREET_KINDS[k],pos=[],nor=[],col=[];
    for(const [w,h,d,x,y,z,sh=1,ico] of K.parts){let g=ico?new THREE.IcosahedronGeometry(.5,0):new THREE.BoxGeometry(1,1,1);if(g.index)g=g.toNonIndexed();
      g.scale(w/K.s[0],h/K.s[1],d/K.s[2]).translate(x/K.s[0],y/K.s[1],z/K.s[2]);pos.push(...g.attributes.position.array);nor.push(...g.attributes.normal.array);
      for(let i=g.attributes.position.count;i--;)col.push(sh,sh,sh);g.dispose();}
    const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));G.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));G.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    const m=new THREE.InstancedMesh(G,new THREE.MeshLambertMaterial({vertexColors:true}),L[k].length);m.userData.street=k;m.castShadow=true;worldGroup.add(m);
    L[k].forEach((p,i)=>{Q.setFromAxisAngle(Y_AXIS,p.h);M.compose(V.set(p.x,p.y,p.z),Q,SC.set(...p.s));m.setMatrixAt(i,M);m.setColorAt(i,C.set(p.col));
      if(p.o.solid===false)return;
      const fx=K.f[0]*p.s[0]/K.s[0],fz=K.f[1]*p.s[2]/K.s[2],c=Math.cos(p.h),s=Math.sin(p.h);
      if(p.o.knock&&STREET_KNOCK){const q={x:p.x,z:p.z,r:Math.max(fx,fz)/2,snap:true,minSp:5,h:p.s[1],parts:[[m,i]]};addProp(q);solids.push(q);}
      else if(fx>2*fz)wall(p.x-c*fx/2,p.z+s*fx/2,p.x+c*fx/2,p.z-s*fx/2);
      else if(fz>2*fx)wall(p.x-s*fz/2,p.z-c*fz/2,p.x+s*fz/2,p.z+c*fz/2);
      else{const q={x:p.x,z:p.z,r:Math.max(fx,fz)/2};addProp(q);solids.push(q);}});
  }
  W.streets.signs=signs.length;if(!signs.length)return;
  let u=0,v=0,row=0;for(const g of signs){g.cw=512;g.ch=Math.max(32,Math.min(512,Math.round(512*(g.h||.6)/(g.w||2.4))));if(u+512>1024){u=0;v+=row;row=0;}g.u=u;g.v=v;u+=512;row=Math.max(row,g.ch);}
  const TH=v+row,tex=canvasTex(1024,TH,x=>{x.textAlign='center';x.textBaseline='middle';
    for(const g of signs){x.fillStyle=g.bg||'#1f5fae';x.fillRect(g.u,g.v,g.cw,g.ch);x.fillStyle=g.fg||'#fff';let f=g.ch*.62;x.font=`700 ${f}px Barlow,"Segoe UI",sans-serif`;
      const tw=x.measureText(g.text).width;if(tw>g.cw*.9){f*=g.cw*.9/tw;x.font=`700 ${f}px Barlow,"Segoe UI",sans-serif`;}x.fillText(g.text,g.u+g.cw/2,g.v+g.ch/2);}});
  const pos=[],uv=[],nor=[];
  for(const g of signs){const [x,z]=g.xz||LL(...g.ll),h=deg(g.hd),y=GY(x,z)+(g.y??3.2),w=(g.w||2.4)/2,hh=(g.h||.6)/2,rx=Math.cos(h)*w,rz=-Math.sin(h)*w,
      u0=g.u/1024,u1=(g.u+g.cw)/1024,v1=1-g.v/TH,v0=1-(g.v+g.ch)/TH,c=[[x-rx,y-hh,z-rz,u0,v0],[x+rx,y-hh,z+rz,u1,v0],[x+rx,y+hh,z+rz,u1,v1],[x-rx,y+hh,z-rz,u0,v1]];
    for(const i of[0,1,2,0,2,3]){pos.push(c[i][0],c[i][1],c[i][2]);uv.push(c[i][3],c[i][4]);nor.push(Math.sin(h),0,Math.cos(h));}}
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));G.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));G.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  const m=new THREE.Mesh(G,new THREE.MeshLambertMaterial({map:tex}));m.userData.street='signs';worldGroup.add(m);
}
"""


def is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def check_ll(v):
    if not (isinstance(v, list) and len(v) == 2 and all(is_num(q) for q in v)):
        return 'want [lat, lon]'
    if not (55.30 < v[0] < 55.45 and 23.00 < v[1] < 23.25):
        return '%s is outside Raseiniai (lat ~55.38, lon ~23.12; swapped?)' % v
    return None


def validate(path, d, T, page_look):
    """Error strings for one street file; [] when valid."""
    f = os.path.basename(path)
    E = []
    err = lambda where, msg: E.append('%s: %s: %s' % (f, where, msg))
    if not isinstance(d, dict):
        return ['%s: top level must be an object' % f]
    for k in sorted(set(d) - TOP):
        err(k, 'unknown key (allowed: %s)' % ', '.join(sorted(TOP)))
    bad = [k for k in ('street', 'slug') if not isinstance(d.get(k), str) or not d.get(k)]
    for k in bad:
        err(k, 'required string')
    if bad:
        return E
    slug, name = d['slug'], d['street']
    if not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', slug):
        err('slug', 'lowercase ascii words joined by "-"')
    stem = os.path.splitext(f)[0]
    if not stem.startswith('_') and stem != slug:
        err('slug', 'file must be named %s.json' % slug)
    if not T.street_ways(name):
        close = sorted(n for n in T.street_names() if n[:4].lower() == name[:4].lower())
        return E + ['%s: street: no highway named %r (similar: %s)' % (f, name, ', '.join(close) or '-')]
    segs = T.segments(T.street_ways(name))

    def ll_near(where, v):
        m = check_ll(v)
        if m:
            return err(where, m)
        dist = nearest(*T.xz(*v), segs)[0]
        if dist > NEAR:
            err(where, '%.0f m from %s, more than %d m' % (dist, name, NEAR))

    fl = d.get('flavour', [])
    if not isinstance(fl, list):
        err('flavour', 'want a list of dialogues')
    else:
        for i, t in enumerate(fl):
            if not (isinstance(t, list) and 2 <= len(t) <= 6 and all(isinstance(s, str) and s.strip() for s in t)):
                err('flavour[%d]' % i, 'want a dialogue: a list of 2-6 non-empty lines, speakers alternating')

    looks = d.get('looks', {})
    mine = {r[0] for r in along(T, name, LOOK_NEAR)}
    if not isinstance(looks, dict):
        err('looks', 'want an object keyed by building id')
        looks = {}
    for bid, L in looks.items():
        w = 'looks.' + bid
        m = re.fullmatch(r'c(\d+)', bid)
        if not m or int(m.group(1)) >= len(T.tags):
            err(w, 'not a building id c0..c%d' % (len(T.tags) - 1))
            continue
        if not T.tags[int(m.group(1))].get('building'):
            err(w, 'way %s is not a building' % bid)
        elif bid in page_look:
            err(w, 'already styled in LOOK by another step; keep it, do not restyle')
        elif bid not in mine:
            err(w, 'not within %d m of %s (only ids street_ids.py prints)' % (LOOK_NEAR, name))
        if not isinstance(L, dict):
            err(w, 'want an object')
            continue
        for k in sorted(set(L) - LOOK_KEYS):
            err(w + '.' + k, 'unknown key (allowed: %s)' % ', '.join(sorted(LOOK_KEYS)))
        for k in ('wall', 'roof'):
            if k in L and not (isinstance(L[k], list) and len(L[k]) == 3 and all(is_num(c) and 0 <= c <= 1 for c in L[k])):
                err(w + '.' + k, 'want [r, g, b] with each 0..1')
        if 'sty' in L and L['sty'] not in STY:
            err(w + '.sty', '%r not one of %s' % (L['sty'], ', '.join(STY)))
        for k in ('windows', 'pitched', 'hip'):
            if k in L and not isinstance(L[k], bool):
                err(w + '.' + k, 'want true/false')
        if 'h' in L and not (is_num(L['h']) and 2.2 <= L['h'] <= 80):
            err(w + '.h', 'wall height in m, 2.2..80')
        if 'rh' in L and not (is_num(L['rh']) and 0 <= L['rh'] <= 12):
            err(w + '.rh', 'roof rise in m, 0..12')

    for key, (allowed, required) in ITEM.items():
        items = d.get(key, [])
        if not isinstance(items, list):
            err(key, 'want a list')
            continue
        for i, o in enumerate(items):
            w = '%s[%d]' % (key, i)
            if not isinstance(o, dict):
                err(w, 'want an object')
                continue
            for k in sorted(set(o) - allowed):
                err(w + '.' + k, 'unknown key (allowed: %s)' % ', '.join(sorted(allowed)))
            for k in sorted(required - set(o)):
                err(w + '.' + k, 'required')
            if 'hd' in o and not is_num(o['hd']):
                err(w + '.hd', 'degrees clockwise from north')
            for k in ('col', 'bg', 'fg'):
                if k in o and not (isinstance(o[k], str) and re.fullmatch(r'#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?', o[k])):
                    err(w + '.' + k, 'want "#rrggbb"')
            if key in ('fences', 'parking'):
                pts = o.get('ll')
                if not (isinstance(pts, list) and len(pts) >= 2 and (key == 'fences' or len(pts) == 2)):
                    err(w + '.ll', 'want [[lat, lon], [lat, lon]%s]' % (', ...' if key == 'fences' else ''))
                else:
                    for j, q in enumerate(pts):
                        ll_near('%s.ll[%d]' % (w, j), q)
            elif 'll' in o:
                ll_near(w + '.ll', o['ll'])
            if key == 'props':
                if 'k' in o and o['k'] not in KINDS:
                    err(w + '.k', '%r not one of %s' % (o['k'], ', '.join(KINDS)))
                if 's' in o and not (isinstance(o['s'], list) and len(o['s']) == 3 and all(is_num(q) and 0 < q <= 12 for q in o['s'])):
                    err(w + '.s', 'want [sx, sy, sz] in m, each 0..12')
                for k in ('solid', 'knock'):
                    if k in o and not isinstance(o[k], bool):
                        err(w + '.' + k, 'want true/false')
            elif key == 'signs':
                if 'text' in o and not (isinstance(o['text'], str) and 0 < len(o['text']) <= 40):
                    err(w + '.text', 'want 1-40 characters')
                for k, lo, hi in (('w', .2, 12), ('h', .1, 4), ('y', 0, 20)):
                    if k in o and not (is_num(o[k]) and lo <= o[k] <= hi):
                        err(w + '.' + k, 'metres, %g..%g' % (lo, hi))
            elif key == 'fences':
                if 'style' in o and o['style'] not in FENCES:
                    err(w + '.style', '%r not one of %s' % (o['style'], ', '.join(FENCES)))
                if 'h' in o and not (is_num(o['h']) and .2 <= o['h'] <= 4):
                    err(w + '.h', 'metres, 0.2..4')
            elif key == 'parking':
                if 'side' in o and o['side'] not in (-1, 0, 1):
                    err(w + '.side', 'want -1, 0 or 1')
                if 'every' in o and not (is_num(o['every']) and 2.3 <= o['every'] <= 20):
                    err(w + '.every', 'metres between cars, 2.3..20')
                if 'fill' in o and not (is_num(o['fill']) and 0 <= o['fill'] <= 1):
                    err(w + '.fill', 'want 0..1')
            elif key == 'places':
                if 'kind' in o and o['kind'] not in PLACES:
                    err(w + '.kind', '%r not one of %s' % (o['kind'], ', '.join(PLACES)))
                if 'name' in o and not (isinstance(o['name'], str) and o['name'].strip()):
                    err(w + '.name', 'want a name')
    if len(d.get('signs', [])) > MAX_SIGNS:
        err('signs', '%d signs, at most %d per street' % (len(d['signs']), MAX_SIGNS))
    if not (isinstance(d.get('views'), list) and len(d['views']) == 2):
        err('views', 'required: exactly 2 views on the street')
    return E


def check_hook(path, slug):
    f, js, fn = os.path.basename(path), open(path, encoding='utf-8').read(), slug.replace('-', '_')
    E = []
    if not re.search(r'^function streetBuild_%s\(ctx\)\{' % fn, js, re.M):
        E.append('%s: must define function streetBuild_%s(ctx){...} at the start of a line' % (f, fn))
    for name in re.findall(r'^(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)', js, re.M):
        if name != 'streetBuild_' + fn and not name.startswith(fn + '_'):
            E.append('%s: top-level name %s must start with %s_' % (f, name, fn))
    if re.search(r'\bMath\.random\b', js):
        E.append('%s: no Math.random; use ctx.hash(string) so builds are deterministic' % f)
    if re.search(r'\bTHREE\s*\.', js):
        E.append('%s: no THREE objects; build through ctx.put / ctx.sign' % f)
    if re.search(r'\bLOOK\s*(\[[^\]]*\]|\.\w+)\s*=(?!=)|Object\.assign\(\s*(ctx\.)?LOOK\b', js):
        E.append('%s: LOOK is read-only here; style buildings through "looks" in the json' % f)
    return E


def load(paths, T, page_look):
    """(streets, hooks, errors) for the given json paths, including ids claimed by two files."""
    streets, hooks, E, owner = [], [], [], {}
    for p in paths:
        try:
            d = json.load(open(p, encoding='utf-8'))
        except ValueError as e:
            E.append('%s: not valid JSON: %s' % (os.path.basename(p), e))
            continue
        e = validate(p, d, T, page_look)
        E += e
        if e:
            continue
        for bid in d.get('looks', {}):
            if bid in owner:
                E.append('%s and %s both style %s; one street owns each building' % (owner[bid], os.path.basename(p), bid))
            owner[bid] = os.path.basename(p)
        js = os.path.join(os.path.dirname(p), d['slug'] + '.js')
        if os.path.exists(js):
            e = check_hook(js, d['slug'])
            E += e
            if not e:
                hooks.append((d['slug'], open(js, encoding='utf-8').read()))
        streets.append(d)
    return streets, hooks, E


def js_value(k, v):
    if k == 'sty':
        return '-1' if v == 'none' else 'STY.' + v
    return json.dumps(v)


def dump(v):
    return json.dumps(v, sort_keys=True, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('page', nargs='?')
    ap.add_argument('--check', metavar='JSON')
    ap.add_argument('--dir', default=os.path.join(HERE, 'streets'))
    ap.add_argument('--page', dest='ref', default=PAGE, help='page the --check ids are read from')
    a = ap.parse_args()
    if a.check:
        T = Town(a.ref)
        others = [p for p in sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(a.check)), '*.json')))
                  if not os.path.basename(p).startswith('_') and os.path.abspath(p) != os.path.abspath(a.check)]
        _, _, E = load(others + [a.check], T, T.look)
        mine = os.path.basename(a.check)
        E = [e for e in E if mine in re.split(r'[: ]', e)]
        if E:
            raise SystemExit('\n'.join(E) + '\n%d error(s)' % len(E))
        d = json.load(open(a.check, encoding='utf-8'))
        n = lambda k: len(d.get(k, []))
        print('%s ok: %d looks (done needs 8), %d props (6), %d signs (2..%d), %d views (2), %d flavour dialogues, %d fences, %d parking, %d places%s' % (
            mine, n('looks'), n('props'), n('signs'), MAX_SIGNS, n('views'), n('flavour'), n('fences'), n('parking'), n('places'),
            ', hook ' + d['slug'] + '.js ok' if os.path.exists(os.path.join(os.path.dirname(a.check), d['slug'] + '.js')) else ''))
        return
    if not a.page:
        ap.error('page.html or --check JSON')
    h = open(a.page, encoding='utf-8').read()
    T = Town(a.page)
    paths = [p for p in sorted(glob.glob(os.path.join(a.dir, '*.json'))) if not os.path.basename(p).startswith('_')]
    streets, hooks, E = load(paths, T, T.look)
    if E:
        raise SystemExit('\n'.join(E) + '\n%d error(s)' % len(E))

    def rep(x, y):
        nonlocal h
        assert h.count(x) == 1, (h.count(x), x[:80])
        h = h.replace(x, y)

    looks = ''.join('%s:{%s,street:1},' % (bid, ','.join('%s:%s' % (k, js_value(k, v)) for k, v in sorted(L.items())))
                    for s in streets for bid, L in sorted(s.get('looks', {}).items(), key=lambda kv: int(kv[0][1:])))
    if looks:
        rep('const LOOK={', 'const LOOK={' + looks)
        # a street look only recolours: the house keeps its yard and a block keeps its loggias
        rep('!LOOK[w.id]&&/^(yes|apartments)$/', '!(LOOK[w.id]&&!LOOK[w.id].street)&&/^(yes|apartments)$/')
        rep('look:!!LOOK[w.id]}', 'look:!!LOOK[w.id]&&!LOOK[w.id].street}')
    knock = 'p.parts' in h
    if not knock and any(o.get('knock') for s in streets for o in s.get('props', [])):
        print('add_streets: add_solid not applied, knock props stay fixed solids')
    hook_js = ''.join(js.rstrip() + '\n' for _, js in hooks)
    hook_js += 'const STREET_HOOKS={%s};' % ','.join("'%s':streetBuild_%s" % (s, s.replace('-', '_')) for s, _ in hooks)
    rt = RUNTIME % {
        'streets': dump([{k: v for k, v in s.items() if k != 'looks'} for s in streets]),
        'kinds': dump(KINDS), 'fences': dump(FENCES), 'places': dump(PLACES),
        'slugs': dump({s['street']: s['slug'] for s in streets}), 'knock': 'true' if knock else 'false', 'hooks': hook_js}
    rep('function buildTown(){', rt.lstrip() + 'function buildTown(){')
    rep('buildSignals();buildBus();buildStadium();buildTown();', 'buildSignals();buildBus();buildStadium();buildTown();buildStreets();')
    rep("const tag={'':1,day:", "const tag={['street:'+STREET_SLUG[world.street(cx,cz)]]:1,'':1,day:")
    open(a.page, 'w', encoding='utf-8').write(h)
    print('streets ok: %d streets, %d looks, %d props, %d signs, %d hooks' % (
        len(streets), sum(len(s.get('looks', {})) for s in streets),
        sum(len(s.get('props', [])) for s in streets), sum(len(s.get('signs', [])) for s in streets), len(hooks)))


if __name__ == '__main__':
    main()
