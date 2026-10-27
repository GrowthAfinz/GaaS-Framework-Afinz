"""Contraste dos pixels finais. Ignora antialias escolhendo a tinta mais forte de cada nó."""
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

root=Path(sys.argv[1])
def lum(rgb):
    s=rgb/255.0
    linear=np.where(s<=0.04045,s/12.92,((s+0.055)/1.055)**2.4)
    return linear @ np.array([0.2126,0.7152,0.0722])

summary={}
for file in sorted(root.glob('*-nodes.json')):
    prefix=file.name.removesuffix('-nodes.json')
    data=json.loads(file.read_text(encoding='utf8'))
    ink=np.asarray(Image.open(root/(prefix+'.png')).convert('RGB')).astype(float)
    bg=np.asarray(Image.open(root/(prefix+'-background.png')).convert('RGB')).astype(float)
    nodes=[]
    for node in data['texts']:
        best=None
        for r in node['rects']:
            x,y=max(0,int(r['x'])),max(0,int(r['y']))
            right,bottom=min(ink.shape[1],int(np.ceil(r['x']+r['w']))),min(ink.shape[0],int(np.ceil(r['y']+r['h'])))
            if right<=x or bottom<=y: continue
            a=ink[y:bottom,x:right]; b=bg[y:bottom,x:right]
            delta=np.linalg.norm(a-b,axis=2)
            flat=int(np.argmax(delta)); yy,xx=np.unravel_index(flat,delta.shape)
            strength=float(delta[yy,xx])
            if best is None or strength>best[0]:best=(strength,a[yy,xx],b[yy,xx])
        if best is None: continue
        strength,fg,bgcolor=best
        l1,l2=lum(fg),lum(bgcolor)
        ratio=float((max(l1,l2)+.05)/(min(l1,l2)+.05))
        nodes.append({**node,'ratio':round(ratio,3),'pass':ratio+0.015>=node['threshold'],'foreground':fg.astype(int).tolist(),'background':bgcolor.astype(int).tolist(),'pixelDifference':round(strength,2)})
    failures=[n for n in nodes if not n['pass']]
    result={**data,'texts':nodes,'failures':failures,'worst':min((n['ratio'] for n in nodes),default=None)}
    (root/(prefix+'-contrast.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
    mode=prefix.split('-v')[1]
    entry=summary.setdefault(mode,{'nodes':0,'failures':0,'brandFailures':0,'brokenImages':0,'overflow':0,'changedSurfaces':0,'worst':21,'examples':[]})
    entry['nodes']+=len(nodes);entry['failures']+=len(failures);entry['brandFailures']+=sum(n['brand'] for n in failures)
    entry['brokenImages']+=len(data['brokenImages']);entry['overflow']+=int(data['overflow'])
    entry['changedSurfaces']+=len(data.get('changedSurfaces',[]))
    entry['worst']=min(entry['worst'],result['worst'] or 21)
    if failures:entry['examples'].append({'render':prefix,'failures':[{'text':n['text'],'ratio':n['ratio'],'brand':n['brand']} for n in failures]})
(root/'contrast-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({k:{x:y for x,y in v.items() if x!='examples'} for k,v in summary.items()},indent=2))

manifest_path=root/'manifest.json'
if manifest_path.exists():
    for item in json.loads(manifest_path.read_text(encoding='utf8'))['manifest']:
        panel_path=root/(item['key']+'-painel.png')
        if panel_path.exists() and panel_path.stat().st_mtime >= max((root/(r['prefix']+'.png')).stat().st_mtime for r in item['records']):
            continue
        width=int(item['key'].rsplit('-',1)[1]); modes=list(dict.fromkeys(r['mode'] for r in item['records']))
        versions=list(dict.fromkeys(r['version'] for r in item['records']))
        rows=[]
        for version in versions:
            shots=[Image.open(root/(next(r['prefix'] for r in item['records'] if r['version']==version and r['mode']==m)+'.png')).convert('RGB') for m in modes]
            height=max(im.height for im in shots)+36
            strip=Image.new('RGB',(width*len(modes)+12*(len(modes)-1)+40,height),'#e9ecf1');draw=ImageDraw.Draw(strip)
            for i,im in enumerate(shots):
                draw.text((20+i*(width+12),6),version.upper()+' '+modes[i],fill='#172033')
                # An overflow is shown at actual size in its own PNG and flagged in JSON.
                strip.paste(im,(20+i*(width+12),30))
            rows.append(strip)
        panel=Image.new('RGB',(width*len(modes)+12*(len(modes)-1)+40,sum(im.height for im in rows)+50),'#e9ecf1');draw=ImageDraw.Draw(panel)
        draw.text((20,14),item['key'],fill='#172033');y=40
        for im in rows:panel.paste(im,(0,y));y+=im.height
        panel.save(root/(item['key']+'-painel.png'))
