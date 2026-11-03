import {newDevelopmentTask, type DevelopmentTask} from './developmentService';
export const WORKSPACES = {sdd:'Spec Driven Development',acquisition:'Aquisição CRM',monetization:'Rentabilização CRM',cross_sell:'Cross-sell CRM'} as const;
export type Workspace=keyof typeof WORKSPACES;
export type WorkView=Workspace|'overview'|'investigations';
export const WORK_TYPES={task:'Tarefa',investigation:'Investigação',experiment:'Experimento',spec:'Especificação'} as const;
export interface WorkLink {label:string;url:string;kind:'note'|'execution'|'evidence'|'proposal'|'work';state:'suggested'|'confirmed'}
export interface WorkItem extends DevelopmentTask {workspace:Workspace;work_type:keyof typeof WORK_TYPES;initiative_id:string|null;related_workspaces:Workspace[];next_action:string;details:Record<string,string>;links:WorkLink[]}
export interface Initiative {id:string;title:string;workspace:Workspace;description:string;source_note:string|null;revision:number}
export const EXPERIMENT_PHASES={design:'Em desenho',ready:'Preparado',running:'Em execução',reading:'Em leitura',closed:'Encerrado',cancelled:'Cancelado'};
export const VERDICTS={pending:'Ainda sem conclusão',supported:'Hipótese sustentada neste teste',not_supported:'Hipótese não sustentada',inconclusive:'Inconclusivo'};
export const FIELDS:Record<WorkItem['work_type'],[string,string][]>={
 task:[],
 investigation:[['question','Pergunta da investigação'],['scope','Escopo e fontes'],['findings','Achados e conexões'],['hypotheses','Hipóteses a validar'],['limitations','Limitações'],['recommendation','Próxima verificação ou decisão sugerida']],
 spec:[['problem','Problema e contexto atual'],['expected','Comportamento esperado'],['scenarios','Cenários e critérios observáveis'],['out_of_scope','Fora desta entrega'],['alternatives','Alternativas e decisão técnica'],['plan','Plano de execução'],['verification','Verificação e recuperação']],
 experiment:[['hypothesis','Hipótese'],['population','População elegível'],['allocation','Unidade e regra de alocação'],['cells','Células e controle'],['configuration_version','Versão da configuração e conteúdo'],['cohort','Safra'],['exposure','Exposição e prevenção de contaminação'],['metric','Métrica principal e denominador'],['guardrails','Métricas de proteção'],['window','Janela e leituras previstas'],['source','Fonte de resultado e cobertura'],['decision_rule','Critério de decisão'],['reading','Resultado, limitações e decisão']]
};
export function normalizeWork(t:DevelopmentTask):WorkItem {return {workspace:'sdd',work_type:'task',initiative_id:null,related_workspaces:[],next_action:'',details:{},links:[],...t} as WorkItem;}
export function newWork(workspace:Workspace='sdd',type:WorkItem['work_type']='task'):WorkItem {return {...normalizeWork(newDevelopmentTask()),workspace,work_type:type,area:WORKSPACES[workspace]};}
export function readWorkView(search:string):WorkView {const p=new URLSearchParams(search),v=p.get('task_space');if(p.has('item')||p.get('task_view')==='investigations')return 'investigations';if(v==='overview'||v&&Object.prototype.hasOwnProperty.call(WORKSPACES,v))return v as WorkView;if(p.has('dev_task')||p.get('task_view')==='development')return 'sdd';return 'overview';}
export function matchesWorkspace(t:WorkItem,v:WorkView){return v==='overview'||t.workspace===v||t.related_workspaces.includes(v as Workspace);}
export function safeWorkUrl(value:string):string|null {if(/^https:\/\//i.test(value))return value;if(value.startsWith('?view=learning&'))return value;if(/^\d{2}-[^:]+\/.+\.md$/.test(value)){return '?view=learning&section=vault&wiki_path='+encodeURIComponent(value);}return null;}
