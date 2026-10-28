/** Display names for the V15 CRM request; internal product keys remain unchanged. */
export const PLURIX_INVESTIDA_NAMES:Record<string,string>={AMIGAO:'Amigão',BOA:'Boa',AVENIDA:'Avenida','COMPRE MAIS':'Compre Mais',PARANA:'Paraná',SUPERPAO:'Superpão'};
export function plurixInvestidaName(product:string):string {
 const key=product.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/\s+/g,' ');
 return PLURIX_INVESTIDA_NAMES[key]??'';
}

/** Only the existing network reference in COPY_1_PRETO; no broad edits to HTML or assets. */
export function personalizeInvestidaCopy(copy:string,product:string):string {
 const name=plurixInvestidaName(product);if(!name)throw new Error('Investida sem nome aprovado: '+product);
 if(copy.includes('%%=v(@NomeInvestida)=%%'))return copy;
 const token='%%=v(@NomeInvestida)=%%';
 let output=copy.replace(/\b(no seu supermercado|no supermercado)\b/gi,'no '+token)
  .replace(/\bdo supermercado\b/gi,'do '+token);
 for(const prefix of ['no ','do '])output=output.split(prefix+name).join(prefix+token);
 return output;
}
