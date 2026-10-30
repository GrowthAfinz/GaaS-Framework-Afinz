import { unzipSync, strFromU8 } from 'fflate';
import { load, dump } from 'js-yaml';

const api = 'https://api.github.com/repos/growthafinz/GaaS-Framework-Afinz';
export type RepositoryFile = { path: string; bytes: Uint8Array };
const encode = (bytes: Uint8Array) => {
  let binary = ''; for (let i = 0; i < bytes.length; i += 16384) binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(binary);
};
export function readSkillZip(bytes: Uint8Array, process: string, version: string): { name: string; files: RepositoryFile[] } {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Use uma versão como 1.0.0.');
  if (!process.trim()) throw new Error('Informe o processo da skill.');
  // Inspect central-directory sizes before decompression, including nested folders.
  let expanded = 0, count = 0;
  const entries = unzipSync(bytes, { filter: file => {
    expanded += file.originalSize; count++;
    if (expanded > 150 * 1024 * 1024 || count > 2000 || file.originalSize > 95 * 1024 * 1024) throw new Error('ZIP excede o limite de 150 MB, 2.000 arquivos ou 95 MB por arquivo.');
    return true;
  } });
  const paths = Object.keys(entries).filter(p => !p.endsWith('/'));
  if (paths.some(p => p.includes('\\') || p.startsWith('/') || p.split('/').some(s => s === '..' || s === '.' || s.startsWith('.env') || ['.git','node_modules','__pycache__'].includes(s)) || /\.py[co]$/.test(p))) throw new Error('ZIP contém caminho ou arquivo não permitido.');
  const entrypoints = paths.filter(p => p === 'SKILL.md' || /^[^/]+\/SKILL\.md$/.test(p));
  if (entrypoints.length !== 1) throw new Error('O ZIP precisa conter exatamente uma skill, com SKILL.md na raiz ou dentro de uma pasta.');
  const entrypoint = entrypoints[0], prefix = entrypoint.slice(0, -'SKILL.md'.length);
  if (paths.some(p => !p.startsWith(prefix))) throw new Error('Há arquivos fora da pasta da skill.');
  const source = strFromU8(entries[entrypoint]); const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) throw new Error('SKILL.md precisa de cabeçalho YAML com name e description.');
  const fm = load(match[1]) as Record<string, unknown>;
  if (!fm || typeof fm.name !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fm.name) || typeof fm.description !== 'string' || !fm.description.trim()) throw new Error('Informe name em minúsculas com hífens e description no cabeçalho.');
  const name = fm.name;
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date());
  const metadata = typeof fm.metadata === 'object' && fm.metadata ? fm.metadata : {};
  fm.metadata = { ...metadata, version, process: [process.trim()], origin: 'time-gaas', owner: 'Time GaaS Afinz', agents: ['claude-code','codex','cowork','chatgpt'], packaged_at: day, last_validated: null, license: typeof fm.license === 'string' ? fm.license : 'Publicação autorizada pelo colaborador; conferir direitos na origem' };
  entries[entrypoint] = new TextEncoder().encode(`---\n${dump(fm)}---\n\n${source.slice(match[0].length)}`);
  const historyPath = `${prefix}CHANGELOG.md`;
  const history = entries[historyPath] ? strFromU8(entries[historyPath]) : '';
  entries[historyPath] = new TextEncoder().encode(`# Histórico\n\n## ${version} (${day})\n\n- Publicação pela biblioteca Skills do GaaS.\n\n${history}`);
  const files = Object.entries(entries).filter(([p]) => !p.endsWith('/')).map(([p, data]) => ({ path: `.claude/skills/${name}/${p.slice(prefix.length)}`, bytes: data }));
  function scan(data: Uint8Array) {
    const text = strFromU8(data);
    if (/sb_secret_[A-Za-z0-9_-]{12,}|(?:sk-(?:proj-|svcacct-)?|gh[pousr]_|github_pat_|xox[baprs]-)[A-Za-z0-9_-]{20,}|\bAKIA[0-9A-Z]{16}\b|\bAIza[0-9A-Za-z_-]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) throw new Error('Credencial detectada no pacote. Remova os valores antes de publicar.');
    for (const token of text.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
      try { if (JSON.parse(atob(token[0].split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role') throw new Error('Credencial privilegiada detectada.'); }
      catch(e) { if (e instanceof Error && e.message.startsWith('Credencial')) throw e; }
    }
  }
  for (const file of files) {
    scan(file.bytes);
    if (/\.(pptx|xlsx|docx|zip)$/i.test(file.path)) {
      const nested = unzipSync(file.bytes, { filter: entry => {
        expanded += entry.originalSize;
        if (expanded > 300 * 1024 * 1024) throw new Error('Conteúdo interno excede o limite de inspeção.');
        return true;
      } });
      Object.values(nested).forEach(scan);
    }
  }
  return { name, files };
}

export async function changeSkillRepository(token: string, operation: { add: ReturnType<typeof readSkillZip> } | { remove: string }, onProgress: (message: string) => void) {
  if (!token.trim()) throw new Error('Conecte sua credencial do GitHub para editar o repositório.');
  async function request(endpoint: string, method = 'GET', body?: unknown): Promise<any> {
    const response = await fetch(`${api}${endpoint}`, { method, headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token.trim()}`, 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'O GitHub não autorizou a escrita. Confira a credencial e a permissão Contents: read/write neste repositório.' : `O GitHub recusou a operação (${response.status}). Nenhuma publicação foi confirmada.`);
    return response.json();
  }
  onProgress('Conferindo a versão atual da main…');
  const ref = await request('/git/ref/heads/main');
  const commit = await request(`/git/commits/${ref.object.sha}`);
  const tree = await request(`/git/trees/${commit.tree.sha}?recursive=1`);
  if (tree.truncated) throw new Error('Inventário do GitHub incompleto. Operação cancelada.');
  const name = 'add' in operation ? operation.add.name : operation.remove;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) throw new Error('Nome de skill inválido.');
  if ('remove' in operation && ['gaas-growth-loop-operator','gaas-growth-investigation'].includes(name)) throw new Error('Esta skill integra o contrato do loop. Remova suas dependências em uma alteração de código antes de excluir o pacote.');
  const prefix = `.claude/skills/${name}/`;
  const existing = tree.tree.filter((f: {path: string; type: string}) => f.type === 'blob' && f.path.startsWith(prefix));
  if ('add' in operation && existing.length) throw new Error('Já existe uma skill com esse nome. Use outro nome para adicionar.');
  const changes: {path:string;mode:string;type:string;sha:string|null}[] = [];
  if ('add' in operation) {
    let i = 0;
    for (const file of operation.add.files) {
      onProgress(`Enviando arquivo ${++i} de ${operation.add.files.length}…`);
      const blob = await request('/git/blobs', 'POST', { content: encode(file.bytes), encoding: 'base64' });
      changes.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
  } else {
    if (!existing.length) throw new Error('A skill já não existe na main. Recarregue o catálogo.');
    changes.push(...existing.map((f: {path:string}) => ({ path:f.path, mode:'100644',type:'blob',sha:null })));
  }
  const newTree = await request('/git/trees', 'POST', { base_tree: commit.tree.sha, tree: changes });
  const next = await request('/git/commits', 'POST', { message: `${'add' in operation ? 'Adiciona' : 'Remove'} skill ${name} pelo GaaS`, tree: newTree.sha, parents: [ref.object.sha] });
  // Non-forced ref update rejects concurrent edits rather than overwriting them.
  await request('/git/refs/heads/main', 'PATCH', { sha: next.sha, force: false });
  return { sha: next.sha as string, url: next.html_url as string };
}
