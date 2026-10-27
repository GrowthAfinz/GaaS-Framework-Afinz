import sys,json
from pathlib import Path
from PIL import Image
import numpy as np
root=Path(sys.argv[1]);data=json.loads((root/'blend-probe.json').read_text())
for mode,rows in data.items():
    a=np.asarray(Image.open(root/('blend-probe-'+mode+'.png')).convert('RGB')).astype(float)
    b=np.asarray(Image.open(root/('blend-probe-'+mode+'-background.png')).convert('RGB')).astype(float)
    for row in rows:
        x,y,w,h=[int(row[k]) for k in ['x','y','w','h']];ink=a[y:y+h,x:x+w];bg=b[y:y+h,x:x+w]
        delta=np.linalg.norm(ink-bg,axis=2);yy,xx=np.unravel_index(np.argmax(delta),delta.shape)
        row['finalColor']=ink[yy,xx].astype(int).tolist();row['background']=bg[yy,xx].astype(int).tolist()
(root/'blend-probe-results.json').write_text(json.dumps(data,indent=2))
print(json.dumps(data,indent=2))
