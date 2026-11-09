import React from 'react';
import operation from '../fixtures/visaOperation.json';
import type {RulerStrategy} from '../domain/workspace';
const link=(path:string)=>'?view=learning&section=vault&wiki_path='+encodeURIComponent(path);
export function PoolOperationPlan({rulers}:{rulers:RulerStrategy[]}){
 const ruler=rulers.find(r=>r.partner==='Afinz Visa'&&r.businessFront==='monetization');
 return <details className="border border-slate-200 bg-white"><summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-800">Estratégia da régua e operação no SFMC</summary><div className="space-y-3 border-t p-3 text-xs leading-5 text-slate-600">
 <p>{ruler?.objective||'Comparar ofertas por afinidade com vitrine genérica e controles, acompanhando compras e custo.'}</p>
 <p>E-mail, WhatsApp e SMS com parcelas sem sobreposição por rodada. WhatsApp: até 5.000 mensagens; SMS: até 100.000 por rodada, sujeitos à elegibilidade e orçamento. Os dois canais móveis exigem uso do app nos últimos 60 dias. Pesos, cotas e pressão por pessoa a definir.</p>
 <p>SEG-C e GEN-C sem comunicação nos três canais. Mesma política de canal em SEG-A e SEG-B. VDV_SAFRA preserva grupo/célula; VDV_APTOS precisa do delta multicanal. MID a confirmar na BU Banco Afinz (inferência documental).</p>
 <p className="border-l-2 border-cyan-600 bg-cyan-50 p-2">Uma PREPARAÇÃO: MAPA → CRUZAMENTO → SAFRA → POOL → APTOS → FUNIL, sem envio automático. As SQLs abaixo são a referência de e-mail montada. Execução integral, deltas multicanal e Test Send ainda dependem de aplicação/validação no SFMC.</p>
 {operation.steps.map(step=><details key={step.id} className="border border-slate-200"><summary className="cursor-pointer px-3 py-2 font-semibold">{step.number} · {step.id} · {step.action}</summary><div className="space-y-2 border-t p-3"><p>Destino: {step.target}. {step.description}</p><details><summary className="cursor-pointer text-cyan-800">SQL de referência e-mail · montagem informada</summary>{step.currentSql.map((sql,i)=><pre key={i} className="mt-2 max-h-80 overflow-auto bg-slate-950 p-3 text-[10px] text-slate-100">{sql}</pre>)}</details>{step.proposalSql.length>0&&<details><summary className="cursor-pointer text-amber-800">Delta proposto · não testado no SFMC</summary>{step.proposalSql.map((sql,i)=><pre key={i} className="mt-2 max-h-80 overflow-auto bg-slate-950 p-3 text-[10px] text-slate-100">{sql}</pre>)}</details>}</div></details>)}
 <p>Três cards e até seis candidatas; POOL unifica seleção e histórico. Rodada e tema são versões distintas. WhatsApp/SMS levam à LP, com banner pendente; a prévia não publica a CloudPage.</p>
 <div className="flex flex-wrap gap-3"><a className="text-cyan-800 underline" href={link('05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md')}>Estratégia completa e contratos</a><a className="text-cyan-800 underline" href={link('07-Evolucao/Decisões-Abertas.md')}>Parâmetros e decisões abertas</a></div>
 <p className="text-[10px] text-slate-500">Revisão editorial {operation.sourceDate}. Nenhum SQL ou envio é executado pelo GaaS.</p>
 </div></details>;
}
