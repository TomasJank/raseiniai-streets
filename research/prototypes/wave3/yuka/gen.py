import json
t=open('template.html').read();g=open('graph.json').read()
for name,cfg in {'index':dict(mode='yuka',N=26,avoid=True),'yuka300':dict(mode='yuka',N=300,avoid=True),'yuka300_noavoid':dict(mode='yuka',N=300,avoid=False),'legacy':dict(mode='legacy',N=26,avoid=False),'legacy300':dict(mode='legacy',N=300,avoid=False)}.items():
    open(name+'.html','w').write(t.replace('__CFG__',json.dumps(cfg).replace('true','true')).replace('__GRAPH__',g))
