import sys,json,colorsys
from PIL import Image,ImageDraw,ImageStat
import crops,walls
# grid.py out.jpg bid:k ...   (k = index of the frame in walls.frames order)
out=sys.argv[1];tiles=[]
for a in sys.argv[2:]:
    bid,k=a.split(':');dist,da,r=walls.frames(bid,6)[int(k)]
    c=crops.crop(bid,r,dist,da,crops.cands(bid)[2]).convert('RGB')
    c.save('crop_%s_%s.png'%(bid,k))
    d=ImageDraw.Draw(c)
    for x in range(0,c.width,50):
        d.line([(x,0),(x,c.height)],fill=(255,255,0) if x%100==0 else (120,120,0),width=1);d.text((x+2,2),str(x),fill=(255,255,0))
    for y in range(0,c.height,50):
        d.line([(0,y),(c.width,y)],fill=(255,255,0) if y%100==0 else (120,120,0),width=1);d.text((2,y+2),str(y),fill=(255,255,0))
    d.text((300,c.height-12),'%s:%s'%(bid,k),fill=(255,0,0))
    tiles.append(c)
H=max(t.height for t in tiles);W=560
im=Image.new('RGB',(W*2,H*((len(tiles)+1)//2)),'black')
for i,t in enumerate(tiles): im.paste(t,((i%2)*W,(i//2)*H))
im.save(out,quality=88)
