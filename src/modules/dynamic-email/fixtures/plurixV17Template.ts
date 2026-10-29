import {PLURIX_V16_TEMPLATE} from './plurixV16Template';

export const PLURIX_V17_TEMPLATE_ID='builtin-plurix-v17';
export const PLURIX_V17_TEMPLATE_NAME='PLURIX V17 CRM · audiência COMUNICACAO_PLX';

function replaceOnce(source:string,old:string,next:string):string {
 if(source.split(old).length!==2)throw new Error('V17 audience anchor changed: '+old);
 return source.replace(old,next);
}

let source=PLURIX_V16_TEMPLATE.split('@PLXV16Inicializado').join('@PLXV17Inicializado');
for(const [old,next] of [
 ['/* PLURIX V16 CRM:','/* PLURIX V17 CRM:'],
 ['Audiencia: TB_CAMPANHA_AQUISICAO (PRI_NOME, LIMITE, PRODUTO).','Audiencia: COMUNICACAO_PLX (FIRST_NAME, LIMITE_CRD, INVESTIDA).'],
 ['SET @DE_AUDIENCIA = "TB_CAMPANHA_AQUISICAO"','SET @DE_AUDIENCIA = "COMUNICACAO_PLX"'],
 ['Field(@AudRow, "PRI_NOME")','Field(@AudRow, "FIRST_NAME")'],
 ['Field(@AudRow, "LIMITE")','Field(@AudRow, "LIMITE_CRD")'],
 ['Field(@AudRow, "PRODUTO")','Field(@AudRow, "INVESTIDA")'],
])source=replaceOnce(source,old,next);

export const PLURIX_V17_TEMPLATE=source;
