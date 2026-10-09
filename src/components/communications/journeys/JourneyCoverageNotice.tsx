import React,{useEffect,useState} from 'react';
import {format,startOfMonth,endOfMonth,parseISO} from 'date-fns';
import {saoPauloDay} from '../../../utils/saoPauloPeriod';
import {usePeriod} from '../../../contexts/PeriodContext';
import {readJourneyCoverage,type JourneyCoverage} from '../../../services/journeyReadService';
import {useAppStore} from '../../../store/useAppStore';
export function JourneyCoverageNotice({snapshot,occurrence,visibleRows}:{snapshot:string;occurrence:string;visibleRows:number}){
 const {startDate,endDate,setPeriod}=usePeriod(),[info,setInfo]=useState<JourneyCoverage|null>(null),[error,setError]=useState('');
 const openCadastro=useAppStore(s=>s.setTab);
 const start=format(startDate,'yyyy-MM-dd'),end=format(endDate,'yyyy-MM-dd');
 useEffect(()=>{let alive=true;setInfo(null);setError('');readJourneyCoverage(snapshot,occurrence,start,end).then(c=>{if(alive)setInfo(c);}).catch(()=>{if(alive)setError('Não foi possível consultar a cobertura histórica.');});return()=>{alive=false;};},[snapshot,occurrence,start,end]);
 if(error)return <p className="text-xs text-amber-800">{error}</p>;
 if(!info)return null;
 return <div className="rounded-lg border bg-slate-50 p-3 text-xs text-slate-600">
 {info.period_records===0?info.historical_records?<><p>Nenhum registro desta atividade no período. Há {info.historical_records} registros históricos; último em {info.last?format(parseISO(saoPauloDay(info.last)),'dd/MM/yyyy'):'data não informada'}.</p>{info.last&&<button className="mt-2 text-cyan-800 underline" onClick={()=>{const date=parseISO(saoPauloDay(info.last!));setPeriod(startOfMonth(date),endOfMonth(date),'custom');}}>Ver último mês com registros</button>}</>:<p>Nenhum registro histórico para esta jornada + atividade + canal.</p>:info.unlinked_records>0?<p>{info.unlinked_records} registro(s) no período aguardam vínculo de template. Revise em Cadastro e templates → Disparos sem template.</p>:visibleRows===0?<p>Há registros no período; verifique os filtros e a atribuição desta ocorrência.</p>:<p>Cobertura consultada pela jornada + atividade + canal.</p>}
 <p className="mt-2 text-[10px]">Registros de origem, antes da revisão de duplicidades. Histórico não entra nas métricas do período.</p>
 {info.unlinked_records>0&&<button className="mt-2 text-cyan-800 underline" onClick={()=>openCadastro('comunicacoes-cadastro')}>Revisar vínculos no cadastro</button>}
 </div>;
}
