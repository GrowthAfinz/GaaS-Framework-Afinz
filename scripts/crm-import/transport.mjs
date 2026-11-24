import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { PROJECT, sqlRows } from './common.mjs';

// Connector credentials stay in the host. Only SQL requests/responses cross this mailbox.
export class McpTransport {
  constructor(out, { timeoutMs = 180000 } = {}) { this.out=out; this.directory = path.join(out, 'mcp',randomUUID()); this.sequence = 0; this.timeoutMs = timeoutMs; }
  async query(sql, purpose = 'query') {
    await fs.mkdir(this.directory, { recursive: true });
    if(!this.sequence)await fs.writeFile(path.join(this.out,'mcp-active.json'),JSON.stringify({directory:this.directory}));
    const id = String(++this.sequence).padStart(5, '0');
    const request = { id, projectId: PROJECT, purpose, sql };
    const base = path.join(this.directory, id);
    // Never consume responses from an earlier process accidentally.
    await fs.rm(base+'.response.json', { force: true });
    await fs.writeFile(base+'.request.json.tmp', JSON.stringify(request));
    await fs.rename(base+'.request.json.tmp', base+'.request.json');
    process.stderr.write(JSON.stringify({ waiting: id, purpose })+'\n');
    const started = Date.now();
    while (Date.now()-started < this.timeoutMs) {
      try { return sqlRows(JSON.parse(await fs.readFile(base+'.response.json', 'utf8'))); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Connector response timed out: ${id}. Check database persistence before resuming an apply.`);
  }
}
