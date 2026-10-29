import {useState} from 'react';
import {LOOP_COMMAND} from './attentionService';

export function LoopOperatorGuide(){
 const [message,setMessage]=useState('');
 return <section className="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50/40 p-5" aria-label="Como atualizar a operação com IA">
  <h3 className="font-semibold text-slate-900">Da Fila às notas de resultado</h3>
  <p className="text-sm leading-6 text-slate-700">Codex e Claude usam a mesma skill versionada: <code>gaas-growth-loop-operator</code>. Conecte o agente ao repositório e ao Supabase e envie o comando abaixo. O aplicativo não inicia uma IA automaticamente.</p>
  <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
   <li>Conferir as fontes: última data disponível, cobertura e rotina esperada. Ausência de disparo não significa atraso.</li>
   <li>Atualizar os blocos da Fila e do Launch Planner, sem duplicar o mesmo problema.</li>
   <li>Reservar e analisar trabalhos com evidências congeladas. Separar fatos, hipóteses, limites e próxima verificação.</li>
   <li>Preparar uma contribuição para a nota de resultado, preservando o histórico. Você revisa e aprova o texto.</li>
   <li>Aplicar a contribuição aprovada no vault do repositório, recompilar e sincronizar a Wiki. Só concluir quando os hashes publicados corresponderem ao texto aprovado.</li>
  </ol>
  <p className="text-xs leading-5 text-slate-600">Os avisos abrangem todos os períodos abertos. Acompanhar mantém o aviso; adiar esconde até a data escolhida; fechar esconde até uma mudança relevante. Essas ações são pessoais e não encerram a tarefa. Apostas, orçamento, campanhas e correções de fonte continuam exigindo o fluxo próprio de decisão.</p>
  <pre className="whitespace-pre-wrap rounded-lg border border-cyan-100 bg-white p-3 text-xs leading-5">{LOOP_COMMAND}</pre>
  <button type="button" className="rounded-md border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-cyan-900" onClick={()=>void navigator.clipboard.writeText(LOOP_COMMAND).then(()=>setMessage('Comando copiado. Cole no agente conectado.')).catch(()=>setMessage('Selecione e copie o comando acima.'))}>Copiar comando para o agente</button>
  {message&&<p role="status" className="text-xs text-cyan-900">{message}</p>}
  <p className="text-xs text-slate-600">Instruções completas: <code>.claude/skills/gaas-growth-loop-operator/SKILL.md</code>. A Wiki contém a nota <strong>Operação da Fila, Notificações e Notas de Resultado</strong>.</p>
 </section>;
}
