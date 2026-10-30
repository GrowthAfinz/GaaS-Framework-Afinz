"""Testes dos contratos que podem multiplicar resultados ou inventar tempo."""
import unittest
import journey_dossier as jd


def node(key, kind, nexts=(), **config):
    return {'key':key,'name':key,'type':kind,'configuration':config,
        'outcomes':[{'key':str(i),'label':str(i),'next':n,'arguments':{}} for i,n in enumerate(nexts)]}


def snapshot(nodes):
    return {'id':'s','import_id':'i','journey_name':'JOR_AQS_TEST','journey_version':1,'reference':'journeys/test','created_at':'2026-10-07',
        'graph':{'nodes':nodes,'roots':[nodes[0]['key']],'entry':{'de':{'name':'TEST','fields':[]}}},
        'messages':[{'occurrence_key':'journeys/test:1:'+n['key'],'activity_key':n['key'],'activity_name':n['name'],'channel':jd.CHANNEL[n['type']]} for n in nodes if n['type'] in jd.CHANNEL]}


class Contracts(unittest.TestCase):
    def test_sao_paulo_boundary(self):
        self.assertEqual(str(jd.date_of({'Data de Disparo':'2026-08-01T01:00:00Z'})),'2026-07-31')

    def test_cycle_and_missing_edge_are_alerts(self):
        s=jd.structure(snapshot([node('a','WAIT',['b','missing']),node('b','WAIT',['a'])]),None)
        self.assertEqual({a['tipo'] for a in s['alertas']},{'ciclo','aresta_sem_no'})

    def test_update_absence_is_explicit(self):
        s=jd.structure(snapshot([node('update','UPDATECONTACTDATA')]),None)
        self.assertIsNone(s['nos'][0]['gravacoes'])
        self.assertTrue(any(a['tipo']=='update_sem_campos_no_snapshot' for a in s['alertas']))

    def test_shared_name_is_not_split_into_nodes(self):
        ns=[node('split','RANDOMSPLIT',['m1','m2']),node('m1','SMSSYNC'),node('m2','SMSSYNC')]
        for n in ns[1:]:n['name']='same'
        s=snapshot(ns)
        r={'id':'r','jornada':'JOR_AQS_TEST','Activity name / Taxonomia':'same','Canal':'SMS','Data de Disparo':'2026-09-01T03:00:00Z','Cartões Gerados':7,'Segmento':'Negados','BU':'B2C'}
        data={'sfmc_package_imports':[{'id':'i','package_sha256':'none'}],'sfmc_journey_snapshots':[s],'journey_flow_context_aliases':[],'activities':[r],'rentabilizacao_activities':[]}
        meta,ds,_,_=jd.build(data,None,'2026-07-01','2026-10-29')
        self.assertEqual(meta['reconciliacao']['cartoes_grupos_ligados_uma_vez'],7)
        self.assertEqual(ds[0]['grupos_resultado'][0]['activity_keys_candidatos'],('m1','m2'))
        self.assertTrue(all(not b['mensal'] for b in ds[0]['resultados_por_ramo']))

    def test_null_is_not_zero(self):
        out=jd.total([{'Cartões Gerados':None},{'Cartões Gerados':0}])
        self.assertEqual(out['cartoes'],{'soma_informada':0,'informados':1,'ausentes':1})
        self.assertIsNone(jd.total([{}])['cartoes']['soma_informada'])

    def test_diamond_preserves_paths(self):
        nodes=[node('split','RANDOMSPLIT',['left','right']),node('left','WAIT',['msg'],waitDuration=1,waitUnit='DAYS'),node('right','WAIT',['msg'],waitDuration=3,waitUnit='DAYS'),node('msg','EMAILV2')]
        s=jd.structure(snapshot(nodes),None)
        self.assertEqual(sorted(p['toques'][0]['dia_exato'] for p in s['caminhos']),[1,3])

    def test_einstein_and_event_are_not_fixed_days(self):
        nodes=[node('sto','STOWAIT',['response'],params={'slidingWindowHours':24}),node('response','WAITUNTILCHATRESPONSE',['msg'],waitDuration=2,waitUnit='DAYS'),node('msg','WHATSAPPACTIVITY')]
        s=jd.structure(snapshot(nodes),None)
        self.assertIsNone(s['caminhos'][0]['toques'][0]['dia_exato'])

    def test_unknown_is_an_alert(self):
        s=jd.structure(snapshot([node('unknown','FUTURE_NODE')]),None)
        self.assertTrue(any(a['tipo']=='no_desconhecido' for a in s['alertas']))

    def test_one_execution_not_multiplied_by_diamond_or_exports(self):
        nodes=[node('before','EMAILV2',['split']),node('split','RANDOMSPLIT',['left','right']),node('left','WAIT',['joined'],waitDuration=1,waitUnit='DAYS'),node('right','WAIT',['joined'],waitDuration=2,waitUnit='DAYS'),node('joined','EMAILV2')]
        s=snapshot(nodes);s2=dict(s,id='s2')
        rows=[{'id':str(i),'jornada':'JOR_AQUISICAO_TEST','Activity name / Taxonomia':name,'Canal':'E-mail','Data de Disparo':'2026-09-01T03:00:00+00:00','Cartões Gerados':cards,'Base Acionável':100,'Segmento':'CRM','BU':'B2C'} for i,(name,cards) in enumerate([('before',2),('joined',3)])]
        data={'sfmc_package_imports':[{'id':'i','package_sha256':'none'}],'sfmc_journey_snapshots':[s,s2],'journey_flow_context_aliases':[],'activities':rows,'rentabilizacao_activities':[]}
        meta,ds,_,_=jd.build(data,None,'2026-07-01','2026-10-28')
        self.assertEqual(meta['reconciliacao']['cartoes_grupos_ligados_uma_vez'],5)
        self.assertEqual(meta['reconciliacao']['diferenca'],0)
        for branch in ds[0]['resultados_por_ramo']:
            self.assertNotIn('before',branch['activities_exclusivas'])
            self.assertNotIn('joined',branch['activities_exclusivas'])


class PrivacyContracts(unittest.TestCase):
    def test_sanitization_preserves_identifiers_and_numeric_metrics(self):
        value={'id':'001207af-52a8-4ca7-a5b9-3a123456789012','custo':145.12345678901234,'channelId':'5511999999999'}
        clean=jd.safe(value)
        self.assertEqual(clean['id'],value['id'])
        self.assertEqual(clean['custo'],value['custo'])
        self.assertNotIn('channelId',clean)

    def test_literal_contacts_are_removed(self):
        self.assertNotIn('5511999999999',jd.safe('contato 5511999999999'))
        self.assertNotIn('cliente@example.test',jd.safe('cliente@example.test'))


if __name__=='__main__':unittest.main()
