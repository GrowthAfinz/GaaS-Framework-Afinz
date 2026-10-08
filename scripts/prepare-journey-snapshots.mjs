/** Offline only: prepare an additive SQL backfill from the exact bytes of a previously imported ZIP.
 * Does not connect to Supabase, stage packages, approve content or link executions.
 * Usage: node scripts/prepare-journey-snapshots.mjs <pack.zip> <output.sql>
 */
import {build} from 'esbuild';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,existsSync,unlinkSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const [file,out,mode]=process.argv.slice(2);
if(!file||!out)throw Error('Informe ZIP e caminho SQL de saída.');
const dir=mkdtempSync(path.join(tmpdir(),'gaas-flow-')),bridge=path.join(dir,'parser.cjs');
try{
 await build({stdin:{contents:`export {parsePackage as parse} from './src/modules/sfmc-package/parsePackage';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:bridge});
 const bytes=readFileSync(file);if(bytes.length>50*1024*1024)throw Error('ZIP acima do limite.');
 const sha=createHash('sha256').update(bytes).digest('hex');
 const parsed=await createRequire(import.meta.url)(bridge).parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),path.basename(file));
 const quote=v=>"'"+String(v).replace(/'/g,"''")+"'";
 const statements=parsed.graphs.map(g=>{
  const messages=parsed.messages.filter(m=>m.occurrence_key.startsWith(g.reference+':'+g.version+':'));
  return `insert into public.sfmc_journey_snapshots(import_id,reference,journey_name,journey_version,graph,messages)\nselect id,${quote(g.reference)},${quote(g.name)},${g.version},${quote(JSON.stringify(g))}::jsonb,${quote(JSON.stringify(messages))}::jsonb\nfrom public.sfmc_package_imports where package_sha256=${quote(sha)} on conflict do nothing;`;
 });
 const guard=`do $$ begin if not exists(select 1 from public.sfmc_package_imports where package_sha256=${quote(sha)}) then raise exception 'ZIP não corresponde a importação existente'; end if; end $$;`;
 const wrap=body=>`-- Backfill somente de snapshots. SHA-256 ${sha}\n-- Preserva propostas, conteúdos atuais e vínculos existentes.\nbegin;\n${guard}\n${body}\ncommit;\n`;
 if(mode==='--split'){mkdirSync(out,{recursive:true});statements.forEach((s,i)=>writeFileSync(path.join(out,`journey-${String(i+1).padStart(3,'0')}.sql`),wrap(s),'utf8'));}
 else writeFileSync(out,wrap(statements.join('\n')),'utf8');
 console.log(JSON.stringify({file:path.basename(file),sha,journeys:parsed.graphs.length,messages:parsed.messages.length,output:path.resolve(out),applied:false}));
}finally{if(existsSync(bridge))unlinkSync(bridge);rmdirSync(dir);}
