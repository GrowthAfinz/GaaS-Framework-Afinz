import {supabase} from '../../../services/supabaseClient';
import {listDevelopmentTasks,saveDevelopmentTask} from './developmentService';
import {normalizeWork,type WorkItem,type Initiative} from './workModel';
export async function loadWorkspace(){const [work,initiatives]=await Promise.all([listDevelopmentTasks(),supabase.from('growth_work_initiatives').select('*').order('title')]);if(initiatives.error)throw initiatives.error;return {tasks:work.tasks.map(normalizeWork),canEdit:work.canEdit,initiatives:(initiatives.data||[]) as Initiative[]};}
export async function saveWork(item:WorkItem){return normalizeWork(await saveDevelopmentTask(item));}
export async function saveInitiative(item:Initiative){const {data,error}=await supabase.rpc('growth_save_work_initiative',{p_id:item.id||null,p_revision:item.id?item.revision:null,p_body:item});if(error)throw error;return data as Initiative;}
