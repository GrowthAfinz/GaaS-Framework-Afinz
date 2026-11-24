import fs from 'node:fs/promises';
import path from 'node:path';
import { PROJECT } from './common.mjs';
export async function nextRequest(out) {
  let dir;
  try{dir=JSON.parse(await fs.readFile(path.join(out,'mcp-active.json'),'utf8')).directory;}catch(error){if(error.code==='ENOENT')return null;throw error;}
  if(!path.resolve(dir).startsWith(path.resolve(out)+path.sep))throw new Error('Invalid MCP mailbox directory');
  let files;
  try { files = await fs.readdir(dir); } catch (error) { if(error.code==='ENOENT') return null; throw error; }
  for (const name of files.filter(f => f.endsWith('.request.json')).sort()) {
    const response = name.replace('.request.json', '.response.json');
    if (files.includes(response)) continue;
    const request = JSON.parse(await fs.readFile(path.join(dir,name),'utf8'));
    if(request.projectId!==PROJECT) throw new Error('Unexpected Supabase project');
    return { ...request, responsePath: path.join(dir,response).replaceAll('\\','/') };
  }
  return null;
}
