"""Build canonical, connected discovery notes from the audited inventory, never the public bundle."""
import argparse, csv, hashlib, json, re, unicodedata
from collections import defaultdict
from pathlib import Path

p=argparse.ArgumentParser();p.add_argument('--inventory',required=True);p.add_argument('--vault',required=True);p.add_argument('--manifest',required=True)
a=p.parse_args();I=Path(a.inventory);V=Path(a.vault);manifest=[]
registry=json.loads((I/'registro.json').read_text(encoding='utf-8'))
def rows(name):
    with (I/name).open(encoding='utf-8-sig',newline='') as f:return list(csv.DictReader(f))
crm=rows('03-crm-669-campanhas.csv');renta=rows('04-renta-92-campanhas.csv')
def slug(text):return re.sub(r'[^a-zA-Z0-9]+','-',unicodedata.normalize('NFKD',text).encode('ascii','ignore').decode()).strip('-')
def name(r):return 'Assunto-'+slug(r['id'])
def link(target,title=None):return '[['+target+('|' + title if title else '')+']]'
def fm(values):return '---\n'+'\n'.join(key+': '+json.dumps(value,ensure_ascii=False) for key,value in values.items())+'\n---\n\n'
def write(path,meta,body):
    dest=V/path;dest.parent.mkdir(parents=True,exist_ok=True)
    text=fm(meta)+body;dest.write_text(text,encoding='utf-8')
    manifest.append({'path':path,'sha256':hashlib.sha256(text.encode()).hexdigest()})
def table(headers,data):
    esc=lambda v:re.sub(r'\[\[([^|\]]+)\|[^\]]*\]\]',r'[[\1]]',str(v if v is not None else 'não informado')).replace('|',' / ').replace('\n',' ')
    return '| '+' | '.join(headers)+' |\n|'+'|'.join(['---']*len(headers))+'|\n'+'\n'.join('| '+' | '.join(esc(x) for x in row)+' |' for row in data)+'\n'
partners=sorted({r['partner'] for r in registry if isinstance(r.get('partner'),str) and r['partner'] not in ('','N/A')})
segments=sorted({r['segment'] for r in registry if isinstance(r.get('segment'),str) and r['segment'] not in ('','N/A')})
for r in registry:
    domain=r['domain'];tags=['growth','growth-assunto','resultados','dominio:'+domain]
    for field,label in [('partner','parceiro'),('segment','segmento'),('bu','bu')]:
        values=r.get(field);values=values if isinstance(values,list) else [values]
        tags.extend(label+':'+str(value) for value in values if value)
    meta={'title':r['title'],'tags':tags,'tipo':'assunto-growth','camada':'evolucao','atualizado':'2026-10-03','status':'candidato' if r['source'] in ('activities','rentabilizacao_activities') else 'inventariado','fonte':r['source'],'inventory_id':r['id'],'inventory_date':'2026-10-03'}
    campaigns=[x for x in (crm if r['source']=='activities' else renta) if x['operation_scope_id']==r['id']] if r['source'] in ('activities','rentabilizacao_activities') else []
    config=None
    if r['source']=='activities':config={'domain':'crm','scope':{'bu':r['bu'],'segment':r['segment'],'partner':r['partner'],'operation_id':r['id']}}
    elif r['source']=='rentabilizacao_activities':
        config={'domain':'renta','scope':{'bu':r['bu'],'operation_id':r['id']},'any_of':[{'segment':x['segment'],'partner':x['partner'],'subgroup':x['subgroup'],'stage':x['stage'],'journey':x['jornada'],'safra':x['safra']} for x in campaigns]}
    elif r['source']=='paid_media_metrics':
        ids=r.get('canonical_ids',[]);config={'domain':'media','scope':{'channel':r['platform'],'campaign':ids[0] if len(ids)==1 else r['title'],'operation_id':r['id']}}
    elif r['source']=='b2c_daily_metrics':config={'domain':'b2c','scope':{'type':r['title'].split(' — ')[-1],'operation_id':r['id']}}
    if config:meta['analytics']=config
    connections=[link('07-Evolucao/Resultados-Evolucao-e-Retrospectivas','Resultados'),link('07-Evolucao/Inventario-Operacoes-Growth','Inventário e regras'),link('07-Evolucao/Retrospectiva-Mensal-Growth','Retrospectiva mensal'),link('07-Evolucao/Loop-de-Aprendizado-Growth','Loop de aprendizado')]
    # Resolve the existing loop/concept note by exact basename rather than inventing folders.
    for i,target in enumerate(connections):
        raw=target[2:-2].split('|')[0];matches=list(V.rglob(Path(raw).name+'.md'))
        if len(matches)==1:connections[i]=link(matches[0].relative_to(V).as_posix()[:-3],target[2:-2].split('|')[-1])
    if r.get('canonical_note') and (V/r['canonical_note']).exists():connections.append(link(r['canonical_note'][:-3],'Definição relacionada'))
    if r.get('partner') in partners:connections.append(link('07-Evolucao/Parceiro-'+slug(r['partner']),'Visão do parceiro'))
    if isinstance(r.get('segment'),str) and r['segment'] in segments:connections.append(link('07-Evolucao/Segmento-'+slug(r['segment']),'Visão do segmento'))
    body='# '+r['title']+'\n\n## O que este assunto representa\n\n'+str(r.get('definition','Cadastro preservado para conciliação.'))+'\n\n'
    body+='**Tipo de entrada:** '+r['kind']+'. **Estado da evidência:** '+r['status']+'.\n\n'
    body+='Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.\n\n'
    body+='## Escopo, mecanismo e elegibilidade\n\n'+table(['Campo','Contexto observado'],[[k,json.dumps(r[k],ensure_ascii=False) if isinstance(r[k],(list,dict)) else r[k]] for k in ['bu','partner','segment','stages','subgroups','channels','products','offers','promotions'] if k in r])+'\n'
    body+='**O que precisa ser validado:** '+r.get('validation','Reconciliar fonte, mecanismo, evento e vigência antes de tomar decisão.')+'\n\n'
    body+='Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.\n\n'
    body+='## Campanhas e variantes observadas\n\n'
    if campaigns:
        body+='As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.\n\n'
        body+=table(['Agrupamento','Jornada','Safra','Etapa','Subgrupo','Linhas'],[[x['campaign_cluster_id'],x['jornada'],x['safra'],x['stage'],x['subgroup'],x['row_count']] for x in campaigns])+'\n'
    else:body+='A identificação desta entrada e suas relações registradas estão preservadas abaixo. Documentação ou cadastro não comprova execução.\n\n'
    body+='## Resultados, evolução e retrospectiva\n\n'
    if config:body+='O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.\n\n'
    else:body+='Esta entrada ainda não tem contrato analítico homologado no reader. Consulte a fonte e os assuntos relacionados; não substitua resultados ausentes por zero ou por um snapshot editorial. A evolução e a retrospectiva só devem ser apresentadas quando população, eventos e cobertura estiverem reconciliados.\n\n'
    body+='A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.\n\n'
    if r.get('flags'):body+='## Pendências específicas\n\n'+'\n'.join('- '+x for x in r['flags'])+'\n\n'
    body+='## Proveniência do inventário\n\n'+table(['Campo','Evidência'],[['ID',r['id']],['Fonte',r['source']],['Linhas no corte do inventário',r.get('records')],['Primeira data observada',r.get('first_date')],['Última data observada',r.get('last_date')]])+'\n'
    body+='O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.\n\n'
    body+='## Assuntos conectados\n\n'+' · '.join(connections)+'\n\n'
    body+='## Registro de descoberta\n\n```json\n'+json.dumps(r,ensure_ascii=False,indent=2)+'\n```\n'
    write('07-Evolucao/'+name(r)+'.md',meta,body)

for values,kind,key in [(partners,'Parceiro','parceiro'),(segments,'Segmento','segmento')]:
    for value in values:
        meta={'title':kind+' — '+value,'tags':['growth','resultados','hub-growth'],'tipo':'mapa-conteudo','camada':'evolucao','status':'confirmado','atualizado':'2026-10-03','fonte':'inventario-2026-10-03','growth_catalog':{key:value},'analytics':{'domain':'crm','scope':{'partner' if key=='parceiro' else 'segment':value}}}
        members=[r for r in registry if r.get('partner' if key=='parceiro' else 'segment')==value]
        body='# '+kind+' — '+value+'\n\n## Como acompanhar\n\nComece pela visão geral do mês, abra o assunto e suas variantes, e consulte a retrospectiva do mesmo recorte. O resumo pode agregar públicos diferentes; comparabilidade precisa de validação. A seleção de mês e o contexto de cada nota ficam no endereço compartilhável.\n\n'
        body+='## Assuntos relacionados\n\n'+table(['Assunto','Tipo','Fonte'],[[link('07-Evolucao/'+name(r),r['title']),r['kind'],r['source']] for r in members])+'\n'
        body+='## Contexto do parceiro e público\n\n'+link('03-Dimensoes/Parceiros')+' · '+link('03-Dimensoes/Segmentos')+' · '+link('07-Evolucao/Resultados-Evolucao-e-Retrospectivas','Resultados')+'\n'
        write('07-Evolucao/'+kind+'-'+slug(value)+'.md',meta,body)
write('07-Evolucao/Inventario-Operacoes-Growth.md',{'title':'Inventário de operações e campanhas de Growth','tags':['growth','resultados','inventario'],'tipo':'guia-operacional','status':'confirmado','fonte':'auditoria-supabase-vault-2026-10-03','atualizado':'2026-10-03','growth_catalog':{}},'# Inventário de operações e campanhas de Growth\n\n'+(I/'INVENTARIO-GROWTH.md').read_text(encoding='utf-8').split('# ',1)[-1].split('\n',1)[-1].split('[Abrir catálogo interativo]')[0]+'\n## Navegar por parceiro\n\n'+' · '.join(link('07-Evolucao/Parceiro-'+slug(x),x) for x in partners)+'\n\n## Navegar por segmento\n\n'+' · '.join(link('07-Evolucao/Segmento-'+slug(x),x) for x in segments)+'\n')

# Preserve existing editorial notes; add metadata and a small connected entry section.
for filename,config in [('Resultados-Evolucao-e-Retrospectivas',None),('Resultados-CRM',{'domain':'crm','scope':{}}),('Resultados-Midia-Paga',{'domain':'media','scope':{}}),('Resultados-B2C',{'domain':'b2c','scope':{'type':'total'}})]:
    dest=V/'07-Evolucao'/ (filename+'.md');text=dest.read_text(encoding='utf-8')
    end=text.index('\n---',4);extras='\ngrowth_catalog: {}' if config is None else '\nanalytics: '+json.dumps(config,ensure_ascii=False)
    if config is None and 'growth_catalog:' not in text[:end] or config and 'analytics:' not in text[:end]:text=text[:end]+extras+text[end:]
    marker='## Operações, parceiros e segmentos — inventário integrado'
    if marker not in text:text+='\n\n'+marker+'\n\n'+link('07-Evolucao/Inventario-Operacoes-Growth','Inventário completo e critérios')+' organiza aquisição, rentabilização, seguros, mídia, originação, funis e réguas. As entradas distinguem operações candidatas, campanhas, populações e cadastros.\n\n**Parceiros:** '+' · '.join(link('07-Evolucao/Parceiro-'+slug(x),x) for x in partners)+'\n\n**Segmentos:** '+' · '.join(link('07-Evolucao/Segmento-'+slug(x),x) for x in segments)+'\n'
    dest.write_text(text,encoding='utf-8');manifest.append({'path':dest.relative_to(V).as_posix(),'sha256':hashlib.sha256(text.encode()).hexdigest()})
Path(a.manifest).write_text(json.dumps({'registry_entries':len(registry),'crm_campaigns':len(crm),'renta_campaigns':len(renta),'files':manifest},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'assuntos':len(registry),'parceiros':len(partners),'segmentos':len(segments),'notas_criadas_ou_conectadas':len(manifest)},ensure_ascii=False))
