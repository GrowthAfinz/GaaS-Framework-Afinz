"""Read XLSX governance and Excel rich-value images without changing the source.
Standard library only. Exports provenance, cached values AND formulas; never recalculates.
"""
import argparse, collections, hashlib, json, pathlib, posixpath, re, zipfile
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit, parse_qs
NS = {'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'rd':'http://schemas.microsoft.com/office/spreadsheetml/2017/richdata'}
R = '{'+NS['r']+'}'
def local(tag): return tag.rsplit('}',1)[-1]
def norm(value): return re.sub(r'\s+',' ',str(value or '')).strip()
def inspect(path, out, images=False):
    path=pathlib.Path(path);out=pathlib.Path(out);out.mkdir(parents=True,exist_ok=True)
    summary={'file_name':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'sheets':[]}
    sheets={};manifest=[]
    with zipfile.ZipFile(path) as z:
        def xml(name): return ET.fromstring(z.read(name))
        def rels(name, base):
            if name not in z.namelist():return {}
            return {x.attrib['Id']:posixpath.normpath(posixpath.join(base,x.attrib['Target'])) for x in xml(name) if x.attrib.get('TargetMode')!='External'}
        strings=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            strings=[''.join(t.text or '' for t in x.iter('{'+NS['s']+'}t')) for x in xml('xl/sharedStrings.xml')]
        rich=[]
        if 'xl/richData/richValueRel.xml' in z.namelist():
            richrels=rels('xl/richData/_rels/richValueRel.xml.rels','xl/richData')
            references=[richrels.get(x.attrib.get(R+'id')) for x in xml('xl/richData/richValueRel.xml')]
            richvalues=[int(next(iter(x)).text) for x in xml('xl/richData/rdrichvalue.xml')]
            meta=xml('xl/metadata.xml')
            future=[int(next(x.iter('{'+NS['rd']+'}rvb')).attrib['i']) for x in meta.findall('s:futureMetadata/s:bk',NS)]
            for item in meta.findall('s:valueMetadata/s:bk',NS):
                rc=item.find('s:rc',NS);rich.append(references[richvalues[future[int(rc.attrib['v'])]]])
        wb=xml('xl/workbook.xml');workrels=rels('xl/_rels/workbook.xml.rels','xl')
        for sheet in wb.find('s:sheets',NS):
            title=sheet.attrib['name'];sheetfile=workrels[sheet.attrib[R+'id']]
            root=xml(sheetfile);cells={}
            for c in root.findall('.//s:sheetData/s:row/s:c',NS):
                address=c.attrib['r'];v=c.find('s:v',NS);f=c.find('s:f',NS);t=c.attrib.get('t')
                value=v.text if v is not None else None
                if t=='s' and value is not None:value=strings[int(value)]
                elif t=='inlineStr':value=''.join(x.text or '' for x in c.findall('.//s:t',NS))
                elif t=='b' and value is not None:value=value=='1'
                elif t not in ('str','e','s','inlineStr') and value is not None:
                    try:value=float(value) if '.' in value else int(value)
                    except ValueError:pass
                if value is None and f is None and 'vm' not in c.attrib:continue
                item={'value':value}
                if f is not None:item['formula']='='+''.join(f.itertext())
                if 'vm' in c.attrib:
                    index=int(c.attrib['vm'])-1
                    if 0<=index<len(rich) and rich[index]:
                        item['image']=rich[index];manifest.append({'sheet':title,'cell':address,'media':rich[index],'kind':'in_cell'})
                    else:item['unresolved_image_metadata']=c.attrib['vm']
                cells[address]=item
            headers={re.sub(r'\d+$','',k):norm(v['value']) for k,v in cells.items() if re.search(r'(?<!\d)1$',k)}
            outside_headers=sum(1 for addr in cells if re.sub(r'\d+$','',addr) not in headers)
            # Bound semantic extraction to declared table headers; polluted far columns are counted.
            if any(h.startswith('ID TEMPLATE') for h in headers.values()):
                cells={addr:c for addr,c in cells.items() if re.sub(r'\d+$','',addr) in headers}
            else:outside_headers=0
            rows=collections.defaultdict(dict)
            for addr,c in cells.items():
                col=re.sub(r'\d+$','',addr);row=int(re.search(r'\d+$',addr).group())
                if row>1:rows[row][headers.get(col,col)]={'cell':addr,**c}
            idheader=next((h for h in headers.values() if h.startswith('ID TEMPLATE')),None)
            records=[{'row':r,'fields':fields} for r,fields in sorted(rows.items()) if idheader and fields.get(idheader,{}).get('value')]
            for rec in records:
                get=lambda prefix:next((x.get('value') for h,x in rec['fields'].items() if h.startswith(prefix)),None)
                channel=get('CANAL'); values=[x.get('value') for x in rec['fields'].values()]
                rec['issues']=[]
                if channel and norm(channel).lower() not in ('email','sms','whatsapp','push','whatsapp mkt','meta_ads','google_ads'):
                    rec['issues'].append('Canal fora do domínio observado')
                if len(values)>=8 and len({str(x) for x in values})==1:rec['issues'].append('Linha de valores repetidos sem estrutura de template')
                rec['status']='quarantined' if rec['issues'] else 'review'
            sheets[title]={'state':sheet.attrib.get('state','visible'),'headers':headers,'cells':cells,'records':records}
            sr=rels(posixpath.join(posixpath.dirname(sheetfile),'_rels',posixpath.basename(sheetfile)+'.rels'),posixpath.dirname(sheetfile))
            for drawing in root.findall('s:drawing',NS):
                target=sr.get(drawing.attrib.get(R+'id'))
                if not target:continue
                dr=rels(posixpath.join(posixpath.dirname(target),'_rels',posixpath.basename(target)+'.rels'),posixpath.dirname(target))
                for anchor in xml(target):
                    frm=next((x for x in anchor if local(x.tag)=='from'),None)
                    row=col=None
                    if frm is not None:
                        row=next((int(x.text)+1 for x in frm if local(x.tag)=='row'),None)
                        col=next((int(x.text)+1 for x in frm if local(x.tag)=='col'),None)
                    for blip in anchor.iter():
                        if local(blip.tag)=='blip' and R+'embed' in blip.attrib:
                            manifest.append({'sheet':title,'anchor_row':row,'anchor_col':col,'media':dr[blip.attrib[R+'embed']],'kind':'floating'})
            ids=[str(rec['fields'][idheader]['value']) for rec in records] if idheader else []
            summary['sheets'].append({'sheet':title,'state':sheet.attrib.get('state','visible'),'meaningful_cells':len(cells),'template_rows':len(records),'quarantined_rows':sum(r['status']=='quarantined'for r in records),'outside_declared_columns':outside_headers,'unique_ids':len(set(ids)),'images':sum(x['sheet']==title for x in manifest)})
        for item in manifest:
            raw=z.read(item['media']);item['sha256']=hashlib.sha256(raw).hexdigest()
            if images:
                target=out/'images'/posixpath.basename(item['media']);target.parent.mkdir(exist_ok=True);target.write_bytes(raw);item['local_file']=str(target.resolve())
        summary['image_occurrences']=len(manifest);summary['unique_image_hashes']=len(set(x['sha256'] for x in manifest))
        summary['defined_names']=[{'name':x.attrib['name'],'value':x.text} for x in wb.findall('s:definedNames/s:definedName',NS)]
    issues=[]
    for title,s in sheets.items():
        if title not in ('Base_Links_CRM_VIBE','Base_Links_CRM_COPA'):continue
        for rec in s['records']:
            fields=rec['fields'];get=lambda prefix:next((x for h,x in fields.items() if h.startswith(prefix)),{})
            tid=get('ID TEMPLATE').get('value');link=get('LINK URL FINAL').get('value')
            if isinstance(link,str) and link.startswith('https://'):
                params=parse_qs(urlsplit(link).query,keep_blank_values=True)
                if params.get('af_sub3')!=[str(tid).strip()]:issues.append({'sheet':title,'row':rec['row'],'issue':'af_sub3 difere do ID','cell':get('LINK URL FINAL').get('cell')})
            elif tid:issues.append({'sheet':title,'row':rec['row'],'issue':'URL final ausente ou não HTTPS'})
    summary['link_issues']=issues
    for name,obj in [('workbook.json',sheets),('images.json',manifest),('summary.json',summary)]:
        (out/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2),encoding='utf-8')
    return summary
if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('xlsx');a.add_argument('--out',required=True);a.add_argument('--images',action='store_true');args=a.parse_args()
    result=inspect(args.xlsx,args.out,args.images)
    print(json.dumps({k:v for k,v in result.items() if k not in('link_issues','defined_names')},ensure_ascii=True,indent=2))

