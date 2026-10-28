/** Local read-only analysis of approved aggregate input. Never runs in CI. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {evaluatePerformance,evaluateFreshness,evaluateRevision,ENGINE_VERSION} from '../supabase/functions/_shared/growth-trigger-engine.ts';

const base='docs/plans/learning-loop/release8/';
const read=name=>JSON.parse(readFileSync(base+name,'utf8'));
const operations=read('operations.json'),rules=read('rules.json'),snapshot=read('observed-aggregates.json');
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)])):value;
const hash=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(canonical(value))).digest('hex');
const write=(name,value)=>writeFileSync(base+name,JSON.stringify(value,null,2)+'\n');
const asOf=snapshot.evaluation_as_of;
const crm=operations.filter(o=>o.domain==='CRM');
const performanceRules=rules.filter(r=>['T1','T2'].includes(r.family));
const evaluate=(month,rows)=>crm.flatMap(op=>performanceRules.map(rule=>evaluatePerformance(op,rule,month,asOf,rows)));
const matrix=['04','05','06','07','08','09'].flatMap(m=>evaluate('2026-'+m,snapshot.monthly));
const triggers=matrix.filter(r=>r.state==='triggered');
const september=matrix.filter(r=>r.period==='2026-09');
const golden=[
  ['B2C','Negados','Proprietaria','T1',934,589],['B2C','Negados','Proprietaria','T2',15.79,24.51],
  ['B2C','Abandonados','Proprietaria','T1',210,41],['B2C','Aprovados_nao_convertidos','Proprietaria','T1',70,7],
  ['B2C','Abandonados','Serasa','T2',3.25,5.77],['Plurix','CRM','Plurix','T1',118,342],
  ['Plurix','Negados','Plurix','T1',76,279],['Plurix','Abandonados','Plurix','T1',18,55],
  ['B2B2C','CRM','Bem Barato','T1',45,116],
];
const goldenComparisons=golden.map(([bu,segment,partner,family,expected,expectedMedian])=>{
  const op=crm.find(o=>o.scope.bu===bu&&o.scope.segment===segment&&o.scope.partner===partner);
  if(!op)throw new Error('Golden scope absent in inventory');
  const result=september.find(r=>r.operation_id===op.operation_id&&r.family===family);
  return {operation_id:op.operation_id,scope:op.scope,family,expected,expectedMedian,result,
    missing_evidence:snapshot.monthly.filter(r=>r.bu===bu&&r.segment===segment&&r.partner===partner&&r.month>='2026-03-01'&&r.month<='2026-09-01'&&(r.missing_cards||r.missing_cost))};
});

// Explicit diagnostic only: ignoring missing flags exposes why subtotal-based golden differs.
// Values are unchanged, no null is filled with zero. Never used as accepted trigger output.
const partialDiagnostics=['04','05','06','07','08','09'].flatMap(m=>evaluate('2026-'+m,snapshot.monthly.map(r=>({...r,missing_cards:0,missing_cost:0}))));
const freshness=rules.filter(r=>r.family==='T5').map(rule=>({rule_id:rule.rule_id,source:rule.metric,
  ...evaluateFreshness(rule,snapshot.freshness.find(f=>f.source===rule.metric)?.latest??null,asOf)}));

let certifiedEvidence;
const goldenIndex=process.argv.indexOf('--golden');
if(goldenIndex>=0){
  const path=process.argv[goldenIndex+1];if(!path)throw new Error('--golden requires local immutable artifact path');
  const artifact=JSON.parse(readFileSync(path,'utf8'));
  const expectedHash='0033ccb3d907a383e47e725c2a1b8f0e263e40f4b9279a451450f29edf5f213a';
  const contentRows=(view,rows)=>view==='SLIDE_READINESS'?rows.map(r=>r.filter((_,i)=>i!==rows[0].indexOf('run_id'))):view==='VIEW_RUN_MANIFEST'?rows.filter(r=>r[0]!=='run_id'):rows;
  const checks={content:hash({tabs_hash:artifact.tabs_hash,blueprint_hash:artifact.blueprint_hash,narrative_hash:artifact.narrative_hash,action_candidates:artifact.action_candidates.map(({run_id,...r})=>r)})===expectedHash&&artifact.content_hash===expectedHash,
    tabs:hash(Object.fromEntries(Object.entries(artifact.tabs).map(([v,rows])=>[v,contentRows(v,rows)])))===artifact.tabs_hash,
    narrative:hash(artifact.narratives)===artifact.narrative_hash,
    blueprints:hash(artifact.slide_blueprints.map(b=>[b.slide_instance_id,b.blueprint_hash]))===artifact.blueprint_hash};
  if(artifact.run_id!=='9bb55892-4b17-4f76-825a-0ac97c92b525'||Object.values(checks).some(v=>!v))throw new Error('Golden integrity check failed');
  const partners=[];
  for(const [view,rows] of Object.entries(artifact.tabs)){
    if(!/^VP_.*_RESULT$/.test(view))continue;
    const cols=rows[0],line=rows.slice(1).find(r=>r[cols.indexOf('metric')]==='cards');
    if(!line)continue;
    partners.push({view,partner:line[cols.indexOf('partner')],cards:String(line[cols.indexOf('current')]),state:line[cols.indexOf('state')]});
  }
  certifiedEvidence={run_id:artifact.run_id,content_hash:artifact.content_hash,period_start:artifact.period_start,period_end:artifact.period_end,
    artifact_path:`runs/${artifact.run_id}/blueprints/report-build.json`,checks,grain:'partner',partners,
    limitation:'Certified result tabs do not expose BU. No allocation to CRM operation; source chunks must be hydrated and validated for operation-level T6.'};
  write('certified-evidence.json',certifiedEvidence);
}else certifiedEvidence=read('certified-evidence.json');
const revisionRule=rules.find(r=>r.family==='T6');
const revisions=certifiedEvidence.partners.map(p=>{
  const rows=snapshot.monthly.filter(r=>r.partner===p.partner&&r.month===certifiedEvidence.period_start);
  // Card counts in these aggregated rows are integers; check before summing as BigInt.
  if(rows.some(r=>r.cards!==null&&!/^\d+$/.test(r.cards)))throw new Error('Non-integral card count requires revised metric contract');
  const complete=rows.length>0&&rows.every(r=>r.cards!==null&&r.missing_cards===0&&r.unproven_execution===0);
  const current=complete?rows.reduce((n,r)=>n+BigInt(r.cards),0n).toString():null;
  return {...p,current,...evaluateRevision(revisionRule,{certified:p.cards,current,
    hashVerified:Object.values(certifiedEvidence.checks).every(Boolean),comparableScope:p.state==='valor_observado'||p.state==='zero_observado',
    currentComplete:complete,snapshotId:certifiedEvidence.run_id,scopeKey:'partner:'+p.partner,period:certifiedEvidence.period_start.slice(0,7)})};
});
const metadata={engine_version:ENGINE_VERSION,evaluation_as_of:asOf,data_read_at:snapshot.data_read_at,
  timezone:snapshot.timezone,transaction_snapshot:snapshot.transaction_snapshot,
  operation_registry_hash:hash(operations),rules_hash:hash(rules),aggregate_hash:hash(snapshot),query_sha256:hash(readFileSync(base+'read-aggregates.sql','utf8')),
  engine_sha256:hash(readFileSync('supabase/functions/_shared/growth-trigger-engine.ts','utf8')),
  mode:'observacao',input_grain:'BU x segment x canonical partner x calendar month'};
write('backtest-results.json',{metadata,matrix,goldenComparisons,freshness,revisions,partialDiagnosticsLabel:'Ignoring missing flags is invalid for acceptance; diagnosis only',partialDiagnostics});
const fmt=x=>x===null?'—':Number(x).toLocaleString('pt-BR',{maximumFractionDigits:4});
const table=(headers,rows)=>'| '+headers.join(' | ')+' |\n|'+headers.map(()=> '---').join('|')+'|\n'+rows.map(r=>'| '+r.map(v=>String(v).replaceAll('|','/')).join(' | ')+' |').join('\n')+'\n';
const summarize=rs=>{const t=rs.filter(r=>r.state==='triggered');return [t.filter(r=>r.family==='T1').length,t.filter(r=>r.family==='T2').length,new Set(t.map(r=>r.operation_id)).size,new Set(t.filter(r=>r.assessment==='favorable').map(r=>r.operation_id)).size,new Set(t.map(r=>operations.find(o=>o.operation_id===r.operation_id).scope.partner)).size];};
const expected=[[4,1,4,3,2],[3,2,5,1,2],[4,3,6,4,3],[5,4,8,4,4],[5,2,6,3,4],[7,2,8,4,4]];
let md='# Release 8 — Backtest abr–set/2026\n\n';
md+='Status: observação, sem escrita em produção. **Não pronto para ativação**: faltas históricas bloqueiam quatro dos nove gatilhos reportados em setembro. Limiares não foram ajustados.\n\n';
md+='## Procedência e contrato\n\n```json\n'+JSON.stringify(metadata,null,2)+'\n```\n\n';
md+='Consulta única de agregados em `release8/read-aggregates.sql`; snapshot consistente da instrução SQL. Entradas em `observed-aggregates.json`, sem linha individual ou CPF. O backtest usa a base atual revisada, não o conhecimento disponível em cada mês histórico. `Realizado` e `Enviado` provam execução; resultado ausente permanece desconhecido. Custo = soma de `Custo Total Campanha`; CAC = soma de custo / soma de cartões. Nenhuma média de CAC de linha. Datas de disparo são convertidas para America/Sao_Paulo antes do mês.\n\n';
md+='O registro mantém os 33 escopos CRM do inventário de 03/10. Vigência inicial = primeiro mês observado no inventário, sem afirmar início comercial. N/A fica inventariado e não avaliável. Serasa tem corte em fevereiro/2026. T1/T2 usam somente os seis meses calendários anteriores e mínimo de quatro elegíveis. Cobertura histórica incompleta bloqueia veredito; sem atividade não é zero; zero explicitamente observado é elegível em T1.\n\n';
md+='## Comparação mensal\n\nCada célula usa a ordem **T1 / T2 / operações / operações favoráveis / parceiros**.\n\n';
md+=table(['Mês','Spec §5.1','Motor com cobertura','Diagnóstico ignorando faltas (não aceito)'],expected.map((e,i)=>{const m='2026-0'+(i+4);return [m,e.join(' / '),summarize(matrix.filter(r=>r.period===m)).join(' / '),summarize(partialDiagnostics.filter(r=>r.period===m)).join(' / ')];}));
md+='\nO diagnóstico mantém os valores dos subtotais, mas ignora os contadores de cartões ausentes. Não é um resultado válido: serve para distinguir mudança de limiar de mudança de completude. O JSON registra toda avaliação, meses elegíveis, exclusões, valores, faixas, materialidade e frações exatas. A spec fornece apenas totais para abr–ago; não há lista nominal original desses meses para atestar correspondência histórica individual.\n\n';
md+='## Setembro — comparação linha a linha\n\n';
md+=table(['Operação','Família','Valor / mediana na spec','Motor: estado; valor / mediana','Explicação'],goldenComparisons.map(g=>[Object.values(g.scope).join(' · '),g.family,`${g.expected} / ${g.expectedMedian}`,`${g.result.state}; ${fmt(g.result.current)} / ${fmt(g.result.median)}`,g.result.state==='triggered'?(g.expectedMedian!==g.result.median?'Mesmo sinal; mediana sem arredondamento de apresentação.':'Reproduzido.'):'Bloqueado por cobertura: '+g.missing_evidence.map(r=>`${r.month}: ${r.missing_cards} cartões ausentes, ${r.missing_cost} custos ausentes`).join('; ')]));
const extra=september.filter(r=>r.state==='triggered'&&!goldenComparisons.some(g=>g.operation_id===r.operation_id&&g.family===r.family));
md+='\nGatilhos adicionais fora dos nove: '+extra.length+'. Abaixo está a lista completa de sinais aceitos em observação:\n\n';
md+=table(['ID','Família','Valor','Faixa','Mediana','Caminho'],september.filter(r=>r.state==='triggered').map(r=>[r.operation_id,r.family,fmt(r.current),`${fmt(r.minimum)}–${fmt(r.maximum)}`,fmt(r.median),r.paths.join(', ')]));
md+='\n## Casos que não devem disparar\n\n';
for(const [partner,segment,family] of [['Dia','CRM','T1'],['Plurix','Aprovados_nao_convertidos','T2']]){
  const op=crm.find(o=>o.scope.partner===partner&&o.scope.segment===segment);
  const r=september.find(r=>r.operation_id===op.operation_id&&r.family===family);
  md+=`- ${partner} · ${segment} · ${family}: **${r.state}**; valor ${fmt(r.current)}, faixa ${fmt(r.minimum)}–${fmt(r.maximum)}, mediana ${fmt(r.median)}; elegíveis ${r.eligible_months.join(', ')}. ${r.reason}.\n`;
}
md+='\n## T5 — frescor em '+asOf+'\n\n';
md+=table(['Fonte/partição','Última data','Dias','Tolerância provisória','Estado'],freshness.map(r=>[r.source,r.latest??'desconhecida',r.days??'—',r.tolerance,r.state]));
md+='\nNão é um backtest de chegada histórica. Não há calendário governado de chegada nestas entradas; atraso observado não prova paralisação. Meta e Google são avaliados separadamente.\n\n';
md+='## T6 — snapshot certificado versus base atual\n\n';
md+='Golden validado por hashes de conteúdo, tabelas, narrativa e blueprints. Grão disponível nas abas congeladas: **parceiro**. O build referencia chunks CRM, mas não inclui linhas em `sources`; portanto não foi feita alocação por operação/BU. Operações individuais exigem hidratação e validação dos chunks em etapa posterior.\n\n';
md+=table(['Parceiro','Certificado','Atual','Δ cartões','Δ relativo absoluto','Estado'],revisions.map(r=>[r.partner,r.cards,r.current??'—',fmt(r.delta),r.relative===null?'—':fmt(r.relative*100)+'%',r.state]));
md+='\nO caso Serasa 988→941 é reproduzido no grão de parceiro; não é prova de revisão de uma operação individual.\n\n';
md+='## Entregas, limites e próximo gate\n\n';
md+='- Migration aditiva preparada; seed de metadados separado, não aplicado. Todas as operações são candidatas e todas as regras começam em observação.\n- Manifesto dá destino às 164 entidades; alias sem correspondência comprovada permanece pendente; DOC e réguas editoriais não viram operação.\n- Nenhuma alteração em resolvePartner, certificação, publicação, feed, candidatas ou apostas.\n- CI usa somente fixtures sintéticas. Os arquivos observados deste diretório são evidência documental; não são entrada dos testes.\n- O PR #33 é integração separada: há conflito textual em .gitignore; verificar regressões antes de integrar, sem merge/deploy nesta fatia.\n- Pendências para ativação: revisar os quatro bloqueios de setembro, confirmar operações, homologar regras, provar T6 por operação quando exigido e autorizar aplicação separadamente. Explicação do desvio não equivale a aceite/ativação.\n';
writeFileSync('docs/plans/learning-loop/RELEASE_8_BACKTEST_2026-04_a_09.md',md);
console.log(JSON.stringify({evaluations:matrix.length,september_triggers:september.filter(r=>r.state==='triggered').length,freshness:freshness.length,revision_scopes:revisions.length}));
