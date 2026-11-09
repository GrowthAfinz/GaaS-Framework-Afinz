import React,{useMemo,useState} from 'react';
import type {VdvData} from './VaiDeVisaWorkspace';
import type {VdvSample,VdvMovimentoRow} from '../domain/vaiDeVisa';
import {parsePoolSelectionCsv,resolvePoolLanding} from '../domain/poolLanding';
export function PoolLandingPreview({data,sample,today,version}:{data:VdvData;sample:VdvSample;today:string;version:string}){
 const [imported,setImported]=useState<VdvMovimentoRow[]|null>(null),[round,setRound]=useState(''),[mobile,setMobile]=useState(false),[banner,setBanner]=useState(''),[error,setError]=useState('');
 const selection=imported||data.movimento;const rounds=[...new Set(selection.map(r=>r.VERSAO))];const selected=rounds.includes(round)?round:rounds.includes(version)?version:rounds[0]||'';
 const result=useMemo(()=>resolvePoolLanding({briefing:data.briefing,selection,sample,round:selected,today,banner}),[data.briefing,selection,sample,selected,today,banner]);
 return <details className="border border-slate-200 bg-white"><summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-800">LP dinâmica · WhatsApp e SMS</summary><div className="space-y-3 border-t p-3">
 <p className="text-xs text-slate-600">Prévia de conteúdo por grupo, célula, rodada e data da amostra acima. {imported?'Seleção do POOL importada apenas nesta prévia.':'Seleção de referência da Fábrica; importe o POOL para conferir uma rodada real.'} Banner e publicação da CloudPage pendentes.</p>
 <div className="flex flex-wrap gap-3 text-xs"><label>Rodada<select aria-label="Rodada da LP" value={selected} onChange={e=>setRound(e.target.value)} className="ml-2 border p-2">{rounds.map(r=><option key={r}>{r}</option>)}</select></label><label>POOL · CSV de nove colunas<input aria-label="Importar seleção do POOL para prévia LP" type="file" accept=".csv,text/csv" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{setImported(parsePoolSelectionCsv(await file.text()));setRound('');setError('');}catch(err){setError(String(err));}}}/></label><button type="button" className="border px-3 py-1" onClick={()=>setMobile(v=>!v)}>{mobile?'Ver desktop':'Ver mobile'}</button></div>
 <label className="block text-xs">URL do banner da LP · asset pendente<input aria-label="URL do banner da LP" type="url" value={banner} placeholder="https://…" className="mt-1 w-full border p-2" onChange={e=>setBanner(e.target.value)}/></label>
 {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}<ul className="list-inside list-disc text-xs text-slate-500">{result.diagnostics.map(s=><li key={s}>{s}</li>)}</ul>
 <div className="overflow-x-auto bg-slate-100 p-2"><iframe title="Prévia da LP Pool Visa" srcDoc={result.html} sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" style={{width:mobile?375:'100%',maxWidth:'100%',height:650,margin:'auto',display:'block',border:0}}/></div>
 <p className="text-xs text-slate-500">Sem CPF/token ou scripts de analytics nesta prévia. Na CloudPage, a participação deve ser resolvida pela SAFRA no servidor; parâmetros livres da URL não definem grupo ou célula.</p>
 </div></details>;
}
