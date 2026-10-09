/** Session-scoped promise cache with byte/entry budgets and rejection recovery. */
export class JourneyReadCache {
 private entries=new Map<string,{expires:number;bytes:number;promise:Promise<unknown>}>();
 constructor(private maxBytes=20_000_000,private maxEntries=30){}
 clear(){this.entries.clear();}
 async read<T>(key:string,ttl:number,load:()=>Promise<T>):Promise<T>{
  const hit=this.entries.get(key);if(hit&&hit.expires>Date.now()){this.entries.delete(key);this.entries.set(key,hit);return hit.promise as Promise<T>;}
  const entry={expires:Date.now()+ttl,bytes:0,promise:Promise.resolve() as Promise<unknown>};
  entry.promise=Promise.resolve().then(load).then(value=>{if(this.entries.get(key)!==entry)return value;entry.bytes=JSON.stringify(value)?.length*2||0;if(entry.bytes>this.maxBytes){this.entries.delete(key);return value;}this.trim();return value;}).catch(e=>{if(this.entries.get(key)===entry)this.entries.delete(key);throw e;});
  this.entries.set(key,entry);this.trim();return entry.promise as Promise<T>;
 }
 private trim(){while(this.entries.size>this.maxEntries||[...this.entries.values()].reduce((n,e)=>n+e.bytes,0)>this.maxBytes)this.entries.delete(this.entries.keys().next().value!);}
}
