import type {FrameworkActivity} from './communicationOrchestrator';
export function deliveryRate(row:FrameworkActivity):number|null{
 const raw=row['Taxa de Entrega'];if(raw===null||raw===undefined||raw==='')return null;
 const n=Number(raw);if(!Number.isFinite(n)||n<0||n>100)return null;return n>1?n/100:n;
}
export function deliveryCoverage(rows:FrameworkActivity[]){
 let base=0,weighted=0,covered=0;
 for(const row of rows){const rate=deliveryRate(row),b=Number(row['Base Total']);if(rate!==null&&b>0&&Number.isFinite(b)){base+=b;weighted+=b*rate;covered++;}}
 return {value:rows.length>0&&covered===rows.length&&base>0?weighted/base:null,covered,total:rows.length};
}
