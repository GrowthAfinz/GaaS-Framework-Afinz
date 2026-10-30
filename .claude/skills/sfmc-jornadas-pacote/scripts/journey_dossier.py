"""Dossies SFMC, somente leitura. Python 3.11+, biblioteca padrao.

python journey_dossier.py --env calendar-estrategico/.env.agent --packages-dir "$HOME/Downloads"
python journey_dossier.py --input <snapshot-local.json> --packages-dir <pasta>

GET paginado no Data API, ou exportacao JSON pelo conector SQL da skill.
Nenhuma chamada RPC, escrita remota, migration ou alteracao no app.
"""
import argparse
import collections
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import statistics
import urllib.parse
import urllib.request

from pkg_common import Package, walk_strings, crit_text

CHANNEL = {'WHATSAPPACTIVITY': 'WhatsApp', 'EMAILV2': 'E-mail', 'SMSSYNC': 'SMS'}
KNOWN = set(CHANNEL) | {'WAIT', 'STOWAIT', 'MULTICRITERIADECISION', 'ENGAGEMENTDECISION', 'RANDOMSPLIT', 'WAITUNTILCHATRESPONSE', 'UPDATECONTACTDATA'}
FOCUS = {'LIMITE_CRD', 'ULTIMO_LIMITE', 'MES_REF', 'DATA_VALIDADE_CRD', 'DESCRICAO_LIMITE', 'NM_PARCEIRO'}
METRICS = {'base': 'Base Acionável', 'propostas': 'Propostas', 'aprovados': 'Aprovados', 'cartoes': 'Cartões Gerados', 'custo': 'Custo Total Campanha', 'aberturas': 'Abertura', 'cliques': 'Cliques'}
ZONE = dt.timezone(dt.timedelta(hours=-3))


def norm(s):
    return (s or '').strip().upper().replace('JOR_AQS_', 'JOR_AQUISICAO_', 1)


def channel(s):
    return re.sub(r'[^a-z]', '', (s or '').lower()).replace('email', 'email').replace('whatsapp', 'wpp')


def date_of(row):
    value = row.get('Data de Disparo')
    return dt.datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(ZONE).date() if value else None


def total(rows, source=None):
    out = {'registros': len(rows)}
    for key, col in METRICS.items():
        vals = [r.get(col) for r in rows if r.get(col) is not None]
        # Rentabilizacao nao mede conversao ou venda, mesmo que o schema tenha a coluna.
        if source == 'rentabilizacao_activities' and key in ('propostas', 'aprovados', 'cartoes'):
            vals = []
        out[key] = {'soma_informada': sum(vals) if vals else None, 'informados': len(vals), 'ausentes': len(rows)-len(vals)}
    return out


def partitions(rows):
    groups = collections.defaultdict(list)
    for r in rows:
        d = date_of(r)
        groups[(r['_source'], d.strftime('%Y-%m') if d else None, r.get('Segmento'), r.get('BU'), r.get('parceiro_canonico'), r.get('Subgrupos'), r.get('Canal'))].append(r)
    return [dict(zip(('fonte','mes','segmento','bu','parceiro_canonico','subgrupo_observado','canal'), k), metricas=total(v,k[0]), ids=[r['id'] for r in v]) for k,v in sorted(groups.items(), key=lambda kv: str(kv[0]))]


def fetch(env_file, since):
    env = dict(os.environ)
    if env_file:
        for line in Path(env_file).read_text(encoding='utf-8-sig').splitlines():
            if '=' in line and not line.lstrip().startswith('#'):
                k,v = line.split('=',1); env[k.strip()] = v.strip().strip('"').strip("'")
    url, key = env['SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']
    if urllib.parse.urlparse(url).hostname != 'mipiwxadnpwtcgfcedym.supabase.co':
        raise ValueError('Projeto diferente do autorizado')
    cols = ['id','jornada','Activity name / Taxonomia','Canal','Data de Disparo','BU','Segmento','Subgrupos','Etapa de aquisição','Ordem de disparo','Safra'] + list(METRICS.values())
    selects = {'sfmc_journey_snapshots':['id','import_id','journey_name','journey_version','reference','graph','messages','created_at'], 'sfmc_package_imports':['id','package_sha256','uploaded_at','parser_version','sfmc_bu'], 'journey_flow_context_aliases':['*'], 'activities':cols+['parceiro_canonico','template_id'], 'rentabilizacao_activities':cols+['Parceiro']}
    data = {}
    for table, fields in selects.items():
        print('Leitura: '+table, flush=True)
        rows = []
        while True:
            q = {'select': ','.join('"'+c+'"' if c!='*' else '*' for c in fields), 'order': 'snapshot_id,occurrence_key' if table=='journey_flow_context_aliases' else 'id', 'offset':str(len(rows)), 'limit':'500'}
            if table in ('activities','rentabilizacao_activities'):
                q['Data de Disparo'] = 'gte.'+since+'T00:00:00-03:00'
            req = urllib.request.Request(url+'/rest/v1/'+table+'?'+urllib.parse.urlencode(q), headers={'apikey':key,'Authorization':'Bearer '+key}, method='GET')
            batch = json.load(urllib.request.urlopen(req, timeout=90))
            rows.extend(batch)
            if len(batch)<500: break
        data[table] = rows
    return data


def raw_packages(data, folder):
    """Reutiliza Package e resolucao do raio-X, somente ZIP com SHA da importacao."""
    result = {}
    allowed = {p['package_sha256'] for p in data['sfmc_package_imports']}
    if not folder: return result
    for p in sorted(Path(folder).glob('*.zip')):
        if p.stat().st_size > 200_000_000: continue
        sha = hashlib.sha256(p.read_bytes()).hexdigest()
        if sha not in allowed: continue
        pkg = Package(str(p))
        for ref,e in pkg.of_type('journeys').items():
            d = e.get('data',{})
            result[(sha,ref,d.get('version'))] = (pkg,d)
    return result


def safe(value):
    """Metadados apenas. Remove enderecos literais e numeros de contato do pack."""
    if isinstance(value,dict):
        return {k:safe(v) for k,v in value.items() if k.lower() not in {'channelid','appid','mobilenumber','emailaddress','to','requestbody','channeladdress'}}
    if isinstance(value,list): return [safe(v) for v in value]
    if isinstance(value,str):
        value = re.sub(r'\b[A-Za-z0-9_.+-]{1,64}@[A-Za-z0-9.-]{1,200}\.[A-Za-z]{2,20}\b','[endereco removido]',value) if '@' in value else value
        value = re.sub(r'(?<![A-Za-z0-9-])\+?\d{10,14}(?![A-Za-z0-9-])','[numero removido]',value)
        return value.replace('\u2014', ':')
    return value


class Resolver:
    def resolve(self, value): return value  # referencias opacas conservadas quando falta ZIP


def structure(snapshot, raw):
    g = snapshot['graph']; pkg,d = raw if raw else (Resolver(),{})
    raw_nodes = {n['key']:n for n in d.get('activities',[])}
    nodes, alerts = [], []
    for original in g.get('nodes',[]):
        n = {k: original.get(k) for k in ('key','name','type','outcomes')}
        c = original.get('configuration') or {}; t = n['type']
        n['configuration'] = safe(c)
        if t not in KNOWN: alerts.append({'tipo':'no_desconhecido','key':n['key'],'node_type':t})
        if t=='UPDATECONTACTDATA':
            a = raw_nodes.get(n['key'],{})
            fs = a.get('arguments',{}).get('activityData',{}).get('updateContactFields')
            n['gravacoes'] = safe([{'campo':pkg.resolve(f.get('field')), 'valor':f.get('value')} for f in fs]) if fs is not None else None
            if fs is None: alerts.append({'tipo':'update_sem_campos_no_snapshot','key':n['key']})
        if t in ('MULTICRITERIADECISION','ENGAGEMENTDECISION','RANDOMSPLIT','WAITUNTILCHATRESPONSE'):
            n['ramos'] = []
            for o in n['outcomes'] or []:
                criteria = c.get('criteria',{}); criteria = criteria.get(o['key']) if isinstance(criteria,dict) else criteria
                n['ramos'].append({'key':o['key'],'rotulo':o.get('label'),'next':o.get('next'),'criterio_xml':safe(pkg.resolve(criteria)) if criteria else None,'criterio_resumo':crit_text(pkg,criteria) if criteria else (o.get('metadata') or {}).get('criteriaDescription'),'percentual':(o.get('arguments') or {}).get('percentage'),'when':(o.get('arguments') or {}).get('when')})
            if t=='RANDOMSPLIT': n['leitura']='A/B natural; aleatorizacao configurada, sem certificar exposicao nem efeito causal'
            if t=='ENGAGEMENTDECISION': n['atividade_referenciada']=c.get('refActivityCustomerKey')
        nodes.append(n)
    bykey = {n['key']:n for n in nodes}; paths=[]; visited=set();traversals=0
    def walk(key, trail, branches, waits, touches, fixed, variable):
        nonlocal traversals
        traversals+=1
        if traversals>200000:raise ValueError('Limite de caminhos excedido; nao truncar silenciosamente')
        if key in trail:
            alerts.append({'tipo':'ciclo','key':key,'trilha':trail});return
        if key not in bykey:
            alerts.append({'tipo':'aresta_sem_no','key':key});return
        visited.add(key); n=bykey[key]; t=n['type']; c=n['configuration']; trail=trail+[key]
        waits=list(waits); touches=list(touches)
        if t in ('WAIT','STOWAIT','WAITUNTILCHATRESPONSE'):
            w={'key':key,'tipo':t,'configuracao':c}
            if t=='WAIT':
                unit=str(c.get('waitUnit','')).upper(); factor={'DAYS':1,'HOURS':1/24,'MINUTES':1/1440}.get(unit)
                duration=c.get('waitDuration'); v=bool(c.get('waitEndDateAttributeExpression')) or bool(c.get('specifiedTime')) or factor is None or duration is None
                days=float(duration)*factor if not v else None
                w['dias_fixos']=days; w['horario_alvo']=c.get('specifiedTime'); variable=variable or v
                if days is not None: fixed+=days
            elif t=='STOWAIT':
                w['janela_horas']=(c.get('params') or {}).get('slidingWindowHours');variable=True
            else: variable=True;w['evento']='resposta ou expiracao; tempo realizado desconhecido'
            waits.append(w)
        if t in CHANNEL:
            opt = 'resposta_optout' in (n['name'] or '').lower()
            touches.append({'key':key,'activity_name':n['name'],'canal':CHANNEL[t],'optout':opt,'ordem_no_caminho':len([v for v in touches if not v['optout']])+ (0 if opt else 1),'esperas_antes':waits,'dias_fixos_acumulados':round(fixed,6),'dia_exato':None if variable else round(fixed,6),'tempo_variavel':variable})
            waits=[]
        outs=n.get('outcomes') or []
        if not outs: paths.append({'nos':trail,'ramos':branches,'toques':touches,'fim':key,'esperas_finais':waits});return
        for o in outs:
            bs=branches
            if t in ('MULTICRITERIADECISION','ENGAGEMENTDECISION','RANDOMSPLIT','WAITUNTILCHATRESPONSE'):
                detail=next(r for r in n['ramos'] if r['key']==o['key'])
                bs=branches+[dict(detail,decision_key=key,decision_type=t,decision_name=n['name'],atividade_referenciada=c.get('refActivityCustomerKey'))]
            if o.get('next'):walk(o['next'],trail,bs,waits,touches,fixed,variable)
            else:paths.append({'nos':trail,'ramos':bs,'toques':touches,'fim':key,'outcome_final':o['key'],'esperas_finais':waits})
    roots=g.get('roots') or [k for k in bykey if k not in {o.get('next') for n in nodes for o in (n['outcomes'] or [])}]
    for k in roots:walk(k,[],[],[],[],0,False)
    for key in sorted(set(bykey)-visited):alerts.append({'tipo':'no_inacessivel','key':key})
    de=(g.get('entry') or {}).get('de') or {}
    fields=[{'name':f.get('name'),'type':f.get('type'),'length':f.get('length'),'nullable':f.get('isNullable'),'destaque':str(f.get('name','')).upper() in FOCUS} for f in de.get('fields',[])]
    refs=' '.join(v for _,v in walk_strings({'nodes':g.get('nodes'),'goals':g.get('goals'),'entry':g.get('entry')}))
    return {'snapshot_id':snapshot['id'],'import_id':snapshot['import_id'],'versao':snapshot['journey_version'],'reference':snapshot['reference'],'origem_update':'ZIP com SHA conferido' if raw else 'indisponivel','entrada':{'de':de.get('name'),'fields':fields,'campos_referenciados':[f['name'] for f in fields if re.search(r'(?<!\w)'+re.escape(f['name'])+r'(?!\w)',refs,re.I)],'configuracao':safe({k:v for k,v in (g.get('entry') or {}).items() if k!='de'})},'nos':nodes,'caminhos':paths,'metas':safe(g.get('goals')),'criterios_saida':safe(g.get('exitCriteria')),'alertas':alerts}


def build(data, packages, since, until):
    imports={p['id']:p for p in data['sfmc_package_imports']}; raw=raw_packages(data,packages)
    journeys=collections.defaultdict(list)
    for s in data['sfmc_journey_snapshots']:journeys[s['journey_name'].strip()].append(s)
    dossiers=[]; exact=collections.defaultdict(set); aliases=collections.defaultdict(list); occurrence={}
    for name,snaps in sorted(journeys.items()):
        variants={}; refs=collections.defaultdict(list)
        for s in sorted(snaps,key=lambda v:(v['created_at'],v['id'])):
            sig=hashlib.sha256(json.dumps(s['graph'],sort_keys=True).encode()).hexdigest()
            sha=imports[s['import_id']]['package_sha256']; raw_pair=raw.get((sha,s['reference'],s['journey_version']))
            if sig not in variants:variants[sig]=structure(s,raw_pair)
            refs[sig].append(s['id'])
            for n in s['graph'].get('nodes',[]):
                if n['type'] in CHANNEL:
                    exact[(norm(name),(n.get('name') or '').strip(),channel(CHANNEL[n['type']]))].add((name,n['key']))
            for m in s.get('messages',[]):
                occurrence[(s['id'],m['occurrence_key'])]=(name,m.get('activity_key'))
        vs=[]
        for sig,v in variants.items():v['snapshots_equivalentes']=refs[sig];v['graph_sha256']=sig;vs.append(v)
        dossiers.append({'jornada':name,'nomes_origem':sorted({s['journey_name'] for s in snaps}),'versoes_e_variantes':vs,'grupos_resultado':[]})
    for a in data['journey_flow_context_aliases']:
        target=occurrence.get((a['snapshot_id'],a['occurrence_key']))
        if target:aliases[(norm(a['target_journey']),a['target_activity'].strip(),channel(a['channel']))].append((target,a))
    rows=[]
    for source in ('activities','rentabilizacao_activities'):
        for original in data[source]:
            r=dict(original,_source=source); date=date_of(r)
            if date and since<=date.isoformat()<=until:
                if source=='rentabilizacao_activities':r['parceiro_canonico']=None
                rows.append(r)
    byjourney={d['jornada']:d for d in dossiers}; normalized_names={norm(n) for n in byjourney}; groups=collections.defaultdict(list); covered=set(); unmatched=[]; ambiguous=[]
    for r in rows:
        k=(norm(r.get('jornada')),(r.get('Activity name / Taxonomia') or '').strip(),channel(r.get('Canal')))
        candidates=set(exact.get(k,set())); method='exato'
        raw_match={c for c in candidates if c[0]==(r.get('jornada') or '').strip()}
        if raw_match:candidates=raw_match;method='exato_nome_original'
        if not candidates:
            method='alias_auditado'
            for target,a in aliases.get(k,[]):
                date=date_of(r).isoformat()
                if (not a['start_date'] or date>=a['start_date']) and (not a['end_date'] or date<=a['end_date']):candidates.add(target)
        jnames={c[0] for c in candidates}
        date=date_of(r).isoformat()
        alias_context=any(norm(a['target_journey'])==k[0] and (not a['start_date'] or date>=a['start_date']) and (not a['end_date'] or date<=a['end_date']) for a in data['journey_flow_context_aliases'])
        if k[0] in normalized_names or candidates or alias_context:covered.add((r['_source'],r['id']))
        if len(jnames)>1:ambiguous.append(r);continue
        if not candidates:unmatched.append(r);continue
        j=next(iter(jnames));keys=tuple(sorted(c[1] for c in candidates))
        groups[(j,k[1],k[2],keys,method)].append(r)
    for (j,activity,ch,keys,method),rr in sorted(groups.items(),key=lambda kv:str(kv[0])):
        variants=byjourney[j]['versoes_e_variantes']; cad=[]
        for v in variants:
            for p in v['caminhos']:
                for t in p['toques']:
                    if t['key'] in keys:
                        prefix=p['nos'][:p['nos'].index(t['key'])+1]
                        item={'snapshot_id':v['snapshot_id'],'caminho':prefix,'ramificacoes':[b for b in p['ramos'] if b['decision_key'] in prefix and b['decision_key']!=t['key']],'toque':t}
                        if item not in cad:cad.append(item)
        dates=sorted(set(date_of(r) for r in rr)); gaps=[(b-a).days for a,b in zip(dates,dates[1:])]
        byjourney[j]['grupos_resultado'].append({'activity_name_execucao':activity,'canal_normalizado':ch,'activity_keys_candidatos':keys,'vinculo':method,'atribuicao_no':'unico' if len(keys)==1 else 'ambiguo; resultado no grupo, nao distribuido','versao_executada':'nao certificada pelo historico','optout':'resposta_optout' in activity.lower(),'mensal':partitions(rr),'cadencia_desenhada':cad,'cadencia_observada':{'primeiro':str(min(dates)),'ultimo':str(max(dates)),'datas_distintas':len(dates),'intervalo_mediano_dias':statistics.median(gaps) if gaps else None,'limite':'Intervalo entre datas registradas, nao tempo individual entre toques.'}})
    # Resultado de ramo inclui apenas grupos exclusivos daquele outcome em todos os caminhos.
    for d in dossiers:
        for v in d['versoes_e_variantes']:
            for n in v['nos']:
                if n['type'] in CHANNEL:
                    n['grupos_resultado_indices']=[i for i,g in enumerate(d['grupos_resultado']) if n['key'] in g['activity_keys_candidatos']]
                    n['estado_resultado']='ligado_sem_certificar_versao' if n['grupos_resultado_indices'] else 'sem_execucao_ligada_no_recorte'
        d['resultados_por_ramo']=[]
        for v in d['versoes_e_variantes']:
            for n in v['nos']:
                if n['type'] not in ('MULTICRITERIADECISION','ENGAGEMENTDECISION','RANDOMSPLIT'):continue
                for branch in n['ramos']:
                    exclusive=[]; shared=[]
                    for group in d['grupos_resultado']:
                        reached=[p for p in v['caminhos'] if any(t['key'] in group['activity_keys_candidatos'] for t in p['toques'])]
                        membership=[any(b['decision_key']==n['key'] and b['key']==branch['key'] for b in p['ramos']) and any(t['key'] in group['activity_keys_candidatos'] and p['nos'].index(n['key']) < p['nos'].index(t['key']) for t in p['toques']) for p in reached]
                        if membership and all(membership):exclusive.append(group['activity_name_execucao'])
                        elif any(membership):shared.append(group['activity_name_execucao'])
                    eligible=[r for (j,a,ch,ks,method),rs in groups.items() if j==d['jornada'] and a in exclusive for r in rs]
                    d['resultados_por_ramo'].append({'snapshot_id':v['snapshot_id'],'decision_key':n['key'],'tipo':n['type'],'outcome':branch,'activities_exclusivas':exclusive,'activities_compartilhadas_sem_atribuicao':shared,'mensal':partitions(eligible),'limite':'Resultados associados a nomes exclusivos; nao prova passagem de pessoas ou versao executada. Nao somar decisoes aninhadas.'})
        linked=[r for (j,*_),rs in groups.items() if j==d['jornada'] for r in rs]
        d['contextos_observados']=sorted({(r['_source'],r.get('Segmento'),r.get('BU'),r.get('parceiro_canonico')) for r in linked},key=str)
        missed=[r for r in unmatched if (r.get('jornada') or '').strip()==d['jornada'] or (norm(r.get('jornada'))==norm(d['jornada']) and not any((r.get('jornada') or '').strip()==n for n in byjourney) and d['jornada']==sorted(n for n in byjourney if norm(n)==norm(d['jornada']))[0])]
        d['disparos_sem_no']=partitions(missed)
        missed_groups=collections.defaultdict(list)
        for r in missed:missed_groups[(r.get('Activity name / Taxonomia'),r.get('Canal'))].append(r)
        d['activities_sem_no']=[{'activity_name':a,'canal':c,'mensal':partitions(rs)} for (a,c),rs in sorted(missed_groups.items(),key=lambda x:str(x[0]))]
    linked=[r for rs in groups.values() for r in rs]
    covered_rows=[r for r in rows if (r['_source'],r['id']) in covered]
    covered_unmatched=[r for r in unmatched if (r['_source'],r['id']) in covered]
    def cards(rr):return sum(r['Cartões Gerados'] for r in rr if r['_source']=='activities' and r.get('Cartões Gerados') is not None)
    audit={'cartoes_jornadas_cobertas':cards(covered_rows),'cartoes_grupos_ligados_uma_vez':cards(linked),'cartoes_sem_no':cards(covered_unmatched),'cartoes_ambiguos_entre_jornadas':cards(ambiguous),'linhas_cobertas':len(covered_rows),'linhas_ligadas':len(linked),'linhas_sem_no':len(covered_unmatched),'linhas_ambiguas':len(ambiguous)}
    audit['diferenca']=audit['cartoes_jornadas_cobertas']-sum(audit[k] for k in ('cartoes_grupos_ligados_uma_vez','cartoes_sem_no','cartoes_ambiguos_entre_jornadas'))
    audit['cartoes_ausentes_fonte']=sum(r['_source']=='activities' and r.get('Cartões Gerados') is None for r in covered_rows)
    assert audit['diferenca']==0
    identities=[(r['_source'],r['id']) for r in linked];assert len(identities)==len(set(identities))
    counts=collections.Counter(n['type'] for d in dossiers for v in d['versoes_e_variantes'] for n in v['nos'])
    meta={'projeto':'mipiwxadnpwtcgfcedym','coleta_utc':dt.datetime.now(dt.timezone.utc).isoformat(),'periodo':[since,until],'snapshots':len(data['sfmc_journey_snapshots']),'jornadas':len(dossiers),'tipos_no':dict(counts),'tipos_desconhecidos':sorted(set(counts)-KNOWN),'reconciliacao':audit,'imports':data['sfmc_package_imports'],'zip_jornadas_recuperadas':len(raw),'regras':['Segmento, BU e parceiro canonico procedem da execucao.','Rentabilizacao sem parceiro_canonico no schema; nao inferir pelo nome da jornada.','Mes ausente nao e zero; somas parciais acompanham contagem de informados e ausentes.','Aliases respeitam canal e vigencia. Correspondencia exata tem prioridade.','Variantes preservadas; metricas guardadas uma vez por grupo de Activity Name.','Contagens fisicas da fonte, sem excluir duplicidades operacionais por suposicao.']}
    meta['jornadas_nomes_distintos']=len({s['journey_name'].strip() for s in data['sfmc_journey_snapshots']})
    meta['grupos_normalizados']=len({norm(s['journey_name']) for s in data['sfmc_journey_snapshots']})
    meta['residuos']=[{'source':r['_source'],'id':r['id'],'jornada':r['jornada'],'activity_name':r.get('Activity name / Taxonomia'),'canal':r.get('Canal'),'data':date_of(r).isoformat(),'cartoes':r.get('Cartões Gerados')} for r in covered_unmatched]
    meta['data_quality']=quality(rows,until)
    meta['gate']='proceed_with_limits'
    return meta,dossiers,rows,covered


def quality(rows, until):
    end=dt.date.fromisoformat(until)
    result=[]
    for source in ('activities','rentabilizacao_activities'):
        rr=[r for r in rows if r['_source']==source];dates=sorted({date_of(r) for r in rr})
        counts=collections.Counter((norm(r.get('jornada')),r.get('Activity name / Taxonomia'),channel(r.get('Canal')),date_of(r)) for r in rr)
        windows={}
        for name,n in [('D-1',1),('7d',7),('14d',14),('MTD',end.day)]:
            windows[name]=[(end-dt.timedelta(days=i)).isoformat() for i in range(n) if end-dt.timedelta(days=i) not in dates]
        result.append({'source':source,'business_date_field':'Data de Disparo, Sao Paulo','min_date':str(min(dates)) if dates else None,'max_date':str(max(dates)) if dates else None,'expected_max_date':until,'dias_distintos':len(dates),'missing_dates':windows,'duplicate_groups':sum(n>1 for n in counts.values()),'duplicate_count':sum(n-1 for n in counts.values() if n>1),'critical_nulls':{f:sum(r.get(f) is None or r.get(f)=='' for r in rr) for f in ['BU','Segmento','jornada','Activity name / Taxonomia']+list(METRICS.values())},'pipeline_status':'nao certificado nesta leitura','readiness':'partial','restrictions':['Contagens fisicas preservadas; candidatos a duplicidade nao removidos.','Dias sem linha nao sao zero.','Nao certifica maturacao, exposicao nem versao enviada.']})
    return result


def fmt(v):return 'desconhecido' if v is None else f'{v:,.2f}'.replace(',','_').replace('.',',').replace('_','.')


def reports(meta, dossiers, rows, covered):
    audit=meta['reconciliacao']
    header=['# Inteligencia das jornadas SFMC', '',f"Periodo: {meta['periodo'][0]} a {meta['periodo'][1]} inclusivos, datas de Sao Paulo. Coleta: {meta['coleta_utc']}.",'',f"{meta['jornadas_nomes_distintos']} nomes de jornada, agrupados em {meta['grupos_normalizados']} identidades normalizadas, {meta['snapshots']} snapshots. Tipos tratados: "+', '.join(meta['tipos_no'])+'.','', '## Conferencia de cartoes','', '| Parcela | Cartoes |','|---|---:|']
    header += [f'| {k} | {fmt(v)} |' for k,v in audit.items() if k.startswith('cartoes') or k=='diferenca']
    header+=['','A igualdade inclui uma parcela explicita de disparos sem no. Isso nao equivale a cobertura completa por no. Campos ausentes continuam desconhecidos. Resultados por ramo sao associacoes ao Activity Name, sem certificar exposicao ou versao enviada.','', 'As somas reproduzem registros fisicos de activities, nao pessoas unicas. Opt-outs ficam na reconciliacao e fora do ranking. Rentabilizacao mede atencao. Nao comparar Serasa/eCred com outros parceiros por conversao.','', 'Cadencia desenhada soma esperas fixas por caminho; STOWAIT fica como janela variavel. Cadencia real e intervalo entre datas de registros, sem identidade de cliente.','', 'Problemas conhecidos sinalizados, sem correcao: subgrupos de carrinho fora de Abandonados; ordem preenchida com data; Safra em formatos diferentes.']
    segments=collections.defaultdict(list)
    for r in rows:segments[(r['_source'],r.get('Segmento') or 'Sem Segmento')].append(r)
    for (source,segment),rr in sorted(segments.items()):
        relevant=[d for d in dossiers if any(c[0]==source and c[1]==segment for c in d['contextos_observados'])]
        allj={norm(r.get('jornada')) for r in rr};cov={norm(r.get('jornada')) for r in rr if (source,r['id']) in covered}
        head=[f'## {segment} ({source})','',f'1. **Fato observado:** {len(allj)} jornadas com registro, {len(cov)} com pacote ou alias auditado no recorte; {len(allj-cov)} sem pacote.']
        variants=[v for d in relevant for v in d['versoes_e_variantes']]
        touch_counts=[len([t for t in p['toques'] if not t['optout']]) for v in variants for p in v['caminhos']]
        channels=sorted({r.get('Canal') or 'desconhecido' for r in rr})
        types=collections.Counter(n['type'] for v in variants for n in v['nos'])
        head += [f'2. **Fato observado:** canais registrados: {", ".join(channels)}. Toques de campanha por caminho completo exportado: '+(f'minimo {min(touch_counts)}, mediana {statistics.median(touch_counts)}, maximo {max(touch_counts)}.' if touch_counts else 'desenho indisponivel.'),f'3. **Fato observado:** {types["MULTICRITERIADECISION"]} decisoes de criterio, {types["ENGAGEMENTDECISION"]} de engajamento e {types["RANDOMSPLIT"]} splits em variantes distintas. '+('A/B natural descreve a configuracao; nao valida um vencedor.' if types['RANDOMSPLIT'] else 'Sem A/B natural observado nos pacotes ligados.'),'4. **Hipotese a validar:** '+('avaliar se diferencas de espera e engajamento explicam o resultado dentro do mesmo BU, parceiro, subgrupo, mes e ramo. Exige eventos de exposicao e controle de maturacao.' if variants else 'exportar os pacotes ausentes pode revelar oportunidades de cadencia; os dados atuais nao permitem especificar mudanca de regua.')]
        bad=[r for r in rr if segment!='Abandonados' and 'Abandonados' in (r.get('Subgrupos') or '')]
        order=[r for r in rr if isinstance(r.get('Ordem de disparo'),int) and r['Ordem de disparo']>10000]
        head += [f'5. **Fato observado de qualidade:** {len(bad)} registros com subgrupo de carrinho neste segmento; {len(order)} ordens acima de 10.000. Marcados sem alterar a fonte.','', '### Jornadas e cadencia','']
        for d in relevant:
            fields=sorted({f['name'] for v in d['versoes_e_variantes'] for f in v['entrada']['fields'] if f['destaque']})
            head += [f"- `{d['jornada']}`. Campos de credito/personalizacao destacados: {', '.join(fields) or 'nenhum dos seis campos alvo'}. Detalhe completo dos campos, criterios, caminhos, estado e metas em fichas.json."]
            for g in d['grupos_resultado']:
                months=[m for m in g['mensal'] if m['fonte']==source and m['segmento']==segment]
                if not months:continue
                timings=sorted({str(c['toque']['dia_exato']) if c['toque']['dia_exato'] is not None else f"{c['toque']['dias_fixos_acumulados']} dias fixos + janela/evento" for c in g['cadencia_desenhada']})
                head += [f"  - `{g['activity_name_execucao']}`: desenho {', '.join(timings)}; intervalo mediano entre datas registradas {g['cadencia_observada']['intervalo_mediano_dias']} dias. {'Resposta operacional de opt-out.' if g['optout'] else ''}"]
        head += ['', '### Resultado por no e contexto', '', 'Cartoes e custo abaixo sao os informados. Ranking so inclui cartoes e base completos, base >=300, sem opt-out e sem disparo nos ultimos 10 dias do corte. Comparacao restrita ao mesmo mes, BU, parceiro e subgrupo. Top 3 por conversao, separados tambem por jornada e ramos exclusivos; nao e teste de superioridade nem efeito incremental.', '']
        ranking=collections.defaultdict(list);cost_only=[]
        for d in relevant:
            for g in d['grupos_resultado']:
                if g['optout']:continue
                for m in g['mensal']:
                    if m['fonte']!=source or m['segmento']!=segment:continue
                    ms=m['metricas'];b=ms['base'];c=ms['cartoes'];cost=ms['custo'];latest=dt.date.fromisoformat(g['cadencia_observada']['ultimo'])
                    branch_sets=[{(b['decision_key'],b['key']) for b in c['ramificacoes'] if b['decision_key'] in c['caminho'] and c['caminho'].index(b['decision_key'])<c['caminho'].index(c['toque']['key'])} for c in g['cadencia_desenhada']]
                    branches=tuple(sorted(set.intersection(*branch_sets))) if branch_sets else ()
                    context=(m['mes'],m['bu'],m['parceiro_canonico'],m['subgrupo_observado'],d['jornada'],branches)
                    if source=='activities' and b['soma_informada'] and b['soma_informada']>=300 and not b['ausentes'] and not c['ausentes'] and latest<=dt.date.fromisoformat(meta['periodo'][1])-dt.timedelta(days=10):ranking[context].append((c['soma_informada'],b['soma_informada'],g['activity_name_execucao'],cost['soma_informada']))
                    if c['soma_informada']==0 and not c['ausentes'] and cost['soma_informada'] and not cost['ausentes']:cost_only.append((context,g['activity_name_execucao'],cost['soma_informada']))
        for ctx,rs in sorted(ranking.items(),key=lambda x:str(x[0])):
            head += [f'- Contexto `{ctx}`: '+ '; '.join(f'`{a}`: {fmt(c)} cartoes / {fmt(b)} base ({100*c/b:.2f}%), custo informado R$ {fmt(cost)}' for c,b,a,cost in sorted(rs,key=lambda v:v[0]/v[1],reverse=True)[:3])+'.']
        if not ranking:head+=['- Sem ranking elegivel de conversao neste recorte. Para rentabilizacao, consultar base, abertura e clique mensais nas fichas.']
        head+=['','**Custo positivo e zero cartoes informado:** sinal para revisao, nao aprendizado de ineficiencia. Maturacao e contexto precisam de verificacao.']
        head += [f'- `{ctx}` / `{a}`: R$ {fmt(cost)}.' for ctx,a,cost in cost_only]
        if not cost_only:head+=['- Nenhum grupo com essas duas metricas completas. Ausencias nao entram como zero.']
        header+=['']+head
    coverage=['# Cobertura de pacotes SFMC','',f"Periodo {meta['periodo'][0]} a {meta['periodo'][1]}. Priorizacao por soma de cartoes informados. Nulos ficam no fim. Classificacao pela execucao, sem inferir segmento da jornada.",'','## Reconciliacao','']+[f'- {k}: {fmt(v)}' for k,v in audit.items()]+['','## Jornadas com disparo e sem pacote','', '| Fonte | Segmento | BU | Parceiro canonico | Jornada | Registros | Cartoes informados | Cartoes ausentes |','|---|---|---|---|---|---:|---:|---:|']
    missing=collections.defaultdict(list)
    for r in rows:
        if (r['_source'],r['id']) not in covered:missing[(r['_source'],r.get('Segmento'),r.get('BU'),r.get('parceiro_canonico'),norm(r.get('jornada')))].append(r)
    def sort_missing(item):
        k,v=item;t=total(v,k[0])['cartoes']['soma_informada'];return (str(k[:3]),t is None,-(t or 0),str(k))
    for k,v in sorted(missing.items(),key=sort_missing):
        c=total(v,k[0])['cartoes'];coverage.append('| '+' | '.join(str(x or 'desconhecido') for x in k)+f" | {len(v)} | {fmt(c['soma_informada'])} | {c['ausentes']} |")
    coverage+=['','## Disparos de jornadas cobertas sem correspondencia em no','', 'Nao somados artificialmente aos nos. Conferir diferenca de Activity Name, canal, versao ou pacote parcial. Detalhe mensal em fichas.json.']
    for d in dossiers:
        if d['disparos_sem_no']:coverage.append(f"- `{d['jornada']}`: "+str(sum(m['metricas']['registros'] for m in d['disparos_sem_no']))+' registros sem no.')
    coverage+=['','## Limites','', '- sfmc_bu vazio nas importacoes nao e preenchido por inferencia.', '- Rentabilizacao nao possui parceiro_canonico neste schema. Preservado como desconhecido.', '- Todas as variantes exportadas foram preservadas. Metricas historicas nao sao repetidas por versao ou caminho.', '- UPDATECONTACTDATA recuperado dos ZIPs apenas quando o SHA coincide com a importacao.', '- Os arquivos contem schema e metadados, nunca registros de clientes.']
    coverage+=['','## Qualidade da fonte','', 'Gate: proceed_with_limits. Dados e logs de coleta sao evidencias diferentes. Nao foi certificado o estado dos jobs.','']
    for q in meta['data_quality']:
        coverage += [f"- {q['source']}: {q['min_date']} a {q['max_date']}; {q['dias_distintos']} datas distintas; {q['duplicate_groups']} grupos candidatos a duplicidade, {q['duplicate_count']} registros excedentes preservados.",'- Nulos: '+json.dumps(q['critical_nulls'],ensure_ascii=False),'- Dias sem linha por janela: '+json.dumps(q['missing_dates'],ensure_ascii=False)]
    return '\n'.join(header)+'\n','\n'.join(coverage)+'\n'


SQL = '''-- PROPOSTA SOMENTE. Nao aplicar como migration.
-- Views invoker, sem grants ou mudancas de RLS. Exigem revisao de permissao e plano.
-- Nenhuma atribuicao de versao enviada ou de caminho e inventada.
create or replace view public.journey_dossier_nodes_proposed
with (security_invoker = true) as
select s.id snapshot_id, s.import_id, s.journey_name, s.journey_version,
       n.value->>'key' activity_key, n.value->>'name' activity_name,
       n.value->>'type' node_type, n.value->'outcomes' outcomes,
       n.value->'configuration' configuration
from public.sfmc_journey_snapshots s
cross join lateral jsonb_array_elements(s.graph->'nodes') n(value);

-- Grao: jornada normalizada + Activity Name + canal + mes SP + contexto.
-- sum(NULL) continua NULL; informados/ausentes acompanham as somas parciais.
create or replace view public.journey_dossier_monthly_proposed
with (security_invoker = true) as
select replace(upper(btrim(jornada)), 'JOR_AQS_', 'JOR_AQUISICAO_') journey_norm,
       btrim("Activity name / Taxonomia") activity_name, "Canal" canal,
       date_trunc('month', "Data de Disparo" at time zone 'America/Sao_Paulo') mes,
       "Segmento" segmento, "BU" bu, parceiro_canonico, "Subgrupos" subgrupo,
       count(*) registros, sum("Base Acionável") base_informada,
       count("Base Acionável") base_informados,
       sum("Propostas") propostas_informadas, count("Propostas") propostas_informados,
       sum("Aprovados") aprovados_informados, count("Aprovados") aprovados_informados,
       sum("Cartões Gerados") cartoes_informados, count("Cartões Gerados") cartoes_informados_n,
       count(*)-count("Cartões Gerados") cartoes_ausentes,
       sum("Custo Total Campanha") custo_informado, count("Custo Total Campanha") custo_informados
from public.activities
group by 1,2,3,4,5,6,7,8;

create or replace view public.journey_dossier_rentabilizacao_monthly_proposed
with (security_invoker = true) as
select replace(upper(btrim(jornada)), 'JOR_AQS_', 'JOR_AQUISICAO_') journey_norm,
       btrim("Activity name / Taxonomia") activity_name, "Canal" canal,
       date_trunc('month', "Data de Disparo" at time zone 'America/Sao_Paulo') mes,
       "Segmento" segmento, "BU" bu, "Subgrupos" subgrupo,
       count(*) registros, sum("Base Acionável") base_informada, count("Base Acionável") base_informados,
       sum("Abertura") aberturas_informadas, count("Abertura") aberturas_informados,
       sum("Cliques") cliques_informados, count("Cliques") cliques_informados,
       sum("Custo Total Campanha") custo_informado, count("Custo Total Campanha") custo_informados
from public.rentabilizacao_activities
group by 1,2,3,4,5,6,7;
-- Nao fazer JOIN direto destas somas com snapshots/nos: multiplicaria resultados.
-- Etapa futura: bridge de execucao (source,id) -> candidatos de ocorrencia,
-- aliases auditados com canal/vigencia, prioridade exata, conflito explicito.
-- Guardar resultados uma vez no grupo; referencias de ramos nao sao aditivas.
-- graph nao preserva updateContactFields: necessario enriquecimento auditado do ZIP.
'''


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--input');p.add_argument('--env',default=str(Path(__file__).resolve().parents[4]/'calendar-estrategico/.env.agent'));p.add_argument('--packages-dir');p.add_argument('--save-input')
    p.add_argument('--since',default='2026-07-01');p.add_argument('--until',default=(dt.datetime.now(ZONE).date()-dt.timedelta(days=1)).isoformat(),help='Ultimo dia fechado, inclusivo em Sao Paulo')
    p.add_argument('--out',default='docs/plans/sfmc-jornadas')
    args=p.parse_args();data=json.loads(Path(args.input).read_text(encoding='utf-8')) if args.input else fetch(args.env,args.since)
    if args.save_input:
        dest=Path(args.save_input);dest.parent.mkdir(parents=True,exist_ok=True)
        dest.write_text(json.dumps(safe(data),ensure_ascii=False),encoding='utf-8')
    meta,dossiers,rows,covered=build(data,args.packages_dir,args.since,args.until)
    meta['proveniencia_leitura']={'modo':'GET Data API somente leitura ou replay local','fonte_sha256':hashlib.sha256(Path(args.input).read_bytes()).hexdigest() if args.input else None,'fuso':'America/Sao_Paulo','fim_exclusivo':(dt.date.fromisoformat(args.until)+dt.timedelta(days=1)).isoformat(),'contagens_fonte':{s:total([r for r in rows if r['_source']==s],s) for s in ('activities','rentabilizacao_activities')}}
    summary,coverage=reports(meta,dossiers,rows,covered);out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    coverage+='\n## Reproducao\n\nNa raiz do projeto, com a credencial local ja prevista na skill:\n\n```powershell\npython .claude/skills/sfmc-jornadas-pacote/scripts/journey_dossier.py --packages-dir "$HOME/Downloads" --since '+args.since+' --until '+args.until+'\n```\n\nO corte final e inclusivo. A janela equivalente e ['+args.since+', '+meta['proveniencia_leitura']['fim_exclusivo']+'), em Sao Paulo. Para replay auditavel, usar --input outputs/sfmc-jornadas-20261029/fonte-revisao.json. SHA256: '+str(meta['proveniencia_leitura']['fonte_sha256'])+'.\n'
    for name,body in [('fichas.json',json.dumps(safe({'metadados':meta,'jornadas':dossiers}),ensure_ascii=False,indent=2)),('resumo-por-segmento.md',summary),('cobertura.md',coverage),('views-propostas.sql',SQL)]:
        (out/name).write_text(body.replace('\u2014',':'),encoding='utf-8')
    print(json.dumps({k:meta[k] for k in ('jornadas','snapshots','tipos_no','reconciliacao','gate')},ensure_ascii=False,indent=2))


if __name__=='__main__':main()
