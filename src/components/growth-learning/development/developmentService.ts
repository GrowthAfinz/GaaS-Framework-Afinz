import {supabase} from '../../../services/supabaseClient';
export const TASK_STATUS = {backlog:'Backlog',planejando:'Em planejamento',pronta:'Pronta para executar',em_execucao:'Em execução',bloqueada:'Bloqueada',concluida:'Concluída',cancelada:'Cancelada'} as const;
export type TaskStatus=keyof typeof TASK_STATUS;
export interface DevelopmentTask {
 id:string;task_key:string;title:string;description:string;area:string;priority:'P0'|'P1'|'P2'|'P3';status:TaskStatus;
 owner_label:string|null;due_date:string|null;dependencies:string[];acceptance_criteria:string[];completed_criteria:number[];
 blocked_reason:string|null;resolution:string|null;source_note:string|null;revision:number;created_at?:string;updated_at?:string;
}
export interface TaskEvent {id:string;revision:number;kind:string;created_at:string;before_data:DevelopmentTask|null;after_data:DevelopmentTask}
export async function listDevelopmentTasks():Promise<{tasks:DevelopmentTask[];canEdit:boolean}>{
 const [rows,access]=await Promise.all([supabase.from('growth_development_tasks').select('*').order('priority').order('created_at'),supabase.rpc('gaas_vault_is_admin')]);
 if(rows.error)throw rows.error;
 if(access.error)throw access.error;
 return {tasks:rows.data||[],canEdit:access.data===true};
}
export async function saveDevelopmentTask(task:DevelopmentTask):Promise<DevelopmentTask>{
 const {data,error}=await supabase.rpc('growth_save_development_task',{p_id:task.id||null,p_revision:task.id?task.revision:null,p_body:task});
 if(error)throw error;return data as DevelopmentTask;
}
export async function taskHistory(id:string):Promise<TaskEvent[]>{
 const {data,error}=await supabase.from('growth_development_task_events').select('*').eq('task_id',id).order('revision',{ascending:false});
 if(error)throw error;return data||[];
}
export function taskError(error:unknown):string {
 const message=error&&typeof error==='object'&&'message'in error?String(error.message):String(error);
 if(message.includes('revision_conflict'))return 'Esta tarefa mudou. Atualize a lista e reabra a tarefa antes de salvar.';
 if(message.includes('dependencies_pending'))return 'Conclua as dependências antes de iniciar a execução ou concluir esta tarefa.';
 if(message.includes('dependency_cycle')||message.includes('invalid_task_dependency'))return 'Revise as dependências: elas precisam existir e não podem formar um ciclo.';
 if(message.includes('completion_evidence'))return 'Para concluir, marque os critérios atendidos e registre a entrega ou evidência de conclusão.';
 if(message.includes('block_reason'))return 'Descreva o impedimento para marcar a tarefa como bloqueada.';
 if(message.includes('empty_acceptance'))return 'Remova as linhas vazias dos critérios de conclusão.';
 if(message.includes('access_denied'))return 'O backlog de desenvolvimento requer acesso administrativo.';
 return 'Não foi possível salvar ou carregar. Confira seu acesso e tente atualizar.';
}
export function newDevelopmentTask():DevelopmentTask{return {id:'',task_key:'',title:'',description:'',area:'Loop de Memória',priority:'P2',status:'backlog',owner_label:null,due_date:null,dependencies:[],acceptance_criteria:[],completed_criteria:[],blocked_reason:null,resolution:null,source_note:null,revision:0};}
