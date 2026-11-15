"""Money amounts on a small-town scale: fares in single euros, fixed fines, repairs worth a few jobs.
usage: add_fixmoney.py page.html   (edits in place; after fixgear)
"""
import re, sys
path = sys.argv[1]
h = open(path, encoding='utf-8').read()


def rep(a, b):
    global h
    assert h.count(a) == 1, (h.count(a), a[:80])
    h = h.replace(a, b)


# flag-fall plus a rate per km, up to double for arriving early, cut for a rough ride, +10% per streak (at most double)
JS = """function jobPay(m){const km=(m.d||600)/1000,base=m.kind==='taxi'?2+1.2*km:3+2*km,quick=Math.min(1,Math.max(0,m.time/(km*1000/8.5+25)));
  return Math.max(1,Math.round(base*(1+quick)*Math.min(2,1+streak*.1)*(.3+cargo*.7)));}
"""
rep("time:Math.round(d/8.5+25)};", "d,time:Math.round(d/8.5+25)};")
rep("const pay=Math.round((100+mission.time*12)*(1+streak*.25)*(.3+cargo*.7));", "const pay=jobPay(mission);")
rep("pay=Math.round(m.s.pay*(first?1:.5)*(.4+.6*cargo)+m.time*3);", "pay=Math.round(m.s.pay/20*(first?1:.5)*(.4+.6*cargo)+m.time*.1);")
rep("const pay=first?250:150;", "const pay=first?50:30;")
rep("rec?'+€'+(first?250:150):", "rec?'+€'+(first?50:30):")
rep("cash+=all?1000:75;", "cash+=all?100:5;")
rep("(all?' · +€1,000':' · +€75')", "(all?' · +€100':' · +€5')")
rep("const fine=Math.round(cash*.25);", "const fine=Math.min(cash,[30,30,80,150,300,500][Math.min(5,stars())]);")
rep("bill=Math.min(cash,100);", "bill=Math.min(cash,30);")
rep("cost=Math.round((1-hp)*180)+stars()*120;", "cost=Math.round((1-hp)*80)+stars()*30;")
rep("loss=Math.min(cash,10*Math.round(5+Math.random()*25));", "loss=Math.min(cash,Math.round(5+Math.random()*25));")
rep("cash=Math.max(0,cash-50);money();store();addHeat(1);toast('Tave partrenkė','−€50');", "cash=Math.max(0,cash-20);money();store();addHeat(1);toast('Tave partrenkė','−€20');")
h, n = re.subn(r'hit:\{cash:(\d+)', lambda m: 'hit:{cash:%d' % (int(m.group(1)) // 2), h)
assert n == 12, n
rep("// ---------- boot ----------", JS + "// ---------- boot ----------")
open(path, 'w', encoding='utf-8').write(h)
print('fixmoney ok')
