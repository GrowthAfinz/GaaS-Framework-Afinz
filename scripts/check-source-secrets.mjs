import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const files = execFileSync('git', ['ls-files', '-z'], {encoding:'utf8'}).split('\0').filter(Boolean);
let count=0;
const findings=[];
const patterns = [
 ['provider secret',/\b(?:sb_secret_[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{40,}|AKIA[A-Z0-9]{16})/],
 ['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\s+[A-Za-z0-9+/=\s]{64,}-----END/],
 ['database password URL',/postgres(?:ql)?:\/\/[^\s:@/]+:[^\s@]{8,}@/],
];
for(const file of files){
 if(!/\.(?:ts|tsx|js|mjs|cjs|py|md|json|sql|ya?ml|toml|ps1|txt|sh|env)$/i.test(file)&&!path.basename(file).startsWith('.env'))continue;
 const text=await readFile(file,'utf8');count++;
 for(const [kind,pattern] of patterns)if(pattern.test(text))findings.push({file,kind});
 for(const token of text.matchAll(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)){
  try{if(JSON.parse(Buffer.from(token[1],'base64url')).role==='service_role')findings.push({file,kind:'privileged Supabase JWT'});}catch{}
 }
}
if(findings.length){console.error('Potential credentials detected (values omitted):',findings);process.exitCode=1;}
else console.log('Secret pattern scan passed:',count,'tracked text files. This is not proof of absence.');
