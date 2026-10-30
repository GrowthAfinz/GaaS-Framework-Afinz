// Carrega um pacote SFMC na Fila de reconciliação do GaaS em nome de um usuário, anota e cruza com activities.
// Usa o MESMO parser do botão "Importar pacote SFMC" (src/modules/sfmc-package/parsePackage.ts do repo).
// Node 24+ roda .mts direto:  node fila_agente.mts <comando> ...
//
//   carregar <zip> --escopo B2C [--agente claude] [--saida <dir>] [--simular]
//   cruzar   <import_id> [--saida <dir>]
//   rascunho <cruzamento.json> [--saida <dir>]       -> notas.json (regras determinísticas, revisar antes de anotar)
//   anotar   <notas.json> [--agente claude]
//   sugerir  <cruzamento.json> [--saida <dir>]       -> propostas.json (IDs para peças SEM ID; revisar antes de propor)
//   propor   <propostas.json> [--agente claude]      -> grava ID proposto (status sempre 'Com pendências')
//
// Credenciais: arquivo calendar-estrategico/.env.agent (fora do git) com
//   SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  GAAS_ON_BEHALF_USER_ID=<uuid de quem responde pelo import>
// O script nunca imprime a chave.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspace = resolve(here, '../../../..'); // ACALENDARIO APP
const appRoot = join(workspace, 'calendar-estrategico');
const args = process.argv.slice(2);
const cmd = args[0];
const opt = (name: string, def?: string) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const flag = (name: string) => args.includes('--' + name);
const outDir = resolve(opt('saida', process.cwd())!);
const agent = opt('agente', 'claude')!;

function findRepo(): string {
  const wanted = (dir: string) => existsSync(join(dir, 'src/modules/sfmc-package/parsePackage.ts')) && existsSync(join(dir, 'node_modules/fflate'));
  const explicit = opt('repo') || process.env.GAAS_REPO;
  if (explicit) { if (!wanted(explicit)) throw new Error(`--repo sem parser ou sem node_modules: ${explicit}`); return explicit; }
  const candidates = [appRoot];
  const wt = join(appRoot, '.codex-worktrees');
  if (existsSync(wt)) for (const d of readdirSync(wt)) candidates.push(join(wt, d));
  const ok = candidates.filter(wanted).sort((a, b) =>
    statSync(join(b, 'src/modules/sfmc-package/parsePackage.ts')).mtimeMs - statSync(join(a, 'src/modules/sfmc-package/parsePackage.ts')).mtimeMs);
  if (!ok.length) throw new Error('Nenhum checkout do GaaS com parser + node_modules. Crie um: git -C calendar-estrategico worktree add .codex-worktrees/agent-queue origin/main && npm ci');
  return ok[0];
}

function env() {
  const file = opt('env', join(appRoot, '.env.agent'))!;
  if (!existsSync(file)) throw new Error(`Falta ${file} com SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e GAAS_ON_BEHALF_USER_ID.`);
  const vars: Record<string, string> = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  for (const k of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GAAS_ON_BEHALF_USER_ID']) if (!vars[k] || vars[k] === 'COLE_AQUI') throw new Error(`${k} não preenchido em ${file}`);
  return vars;
}

async function rpc<T>(name: string, body: unknown): Promise<T> {
  const e = env();
  const res = await fetch(`${e.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/${name}`, {
    method: 'POST',
    // Chave nova (sb_secret_) vai só no apikey; a legada (JWT service_role) também no Authorization.
    headers: { apikey: e.SUPABASE_SERVICE_ROLE_KEY, ...(e.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_') ? {} : { Authorization: `Bearer ${e.SUPABASE_SERVICE_ROLE_KEY}` }), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${name} falhou (${res.status}): ${text.slice(0, 500)}`);
  return JSON.parse(text) as T;
}

async function catalogIds(): Promise<Set<string>> {
  const e = env(), ids = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${e.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/communication_templates?select=template_id&order=template_id`, {
      headers: { apikey: e.SUPABASE_SERVICE_ROLE_KEY, ...(e.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_') ? {} : { Authorization: `Bearer ${e.SUPABASE_SERVICE_ROLE_KEY}` }), Range: `${from}-${from + 999}` },
    });
    if (!res.ok) throw new Error(`catálogo falhou (${res.status})`);
    const rows = await res.json() as { template_id: string }[];
    rows.forEach(r => ids.add(r.template_id)); if (rows.length < 1000) return ids;
  }
}
const save = (name: string, data: unknown) => { mkdirSync(outDir, { recursive: true }); const p = join(outDir, name); writeFileSync(p, JSON.stringify(data, null, 2)); return p; };

async function cruzar(importId: string) {
  const rows = await rpc<CrossRow[]>('sfmc_agent_cross', { p_import_id: importId });
  console.log(`cruzamento: ${rows.length} peças governadas -> ${save('cruzamento.json', rows)}`);
  return rows;
}

interface CrossRow {
  proposal_id: string; status: string; proposed: string; observed: string | null; activity: string; journey: string; channel: string;
  utm: Record<string, string | null>; alerts: string[]; catalog: { status: string; has_asset: boolean; title: string } | null;
  exec_same_journey: number; exec_any_journey: number; other_journeys: string[] | null; dates: [string | null, string | null];
  linked_templates: string[] | null; columns: { bu: string; segmento: string; oferta: string; promocional: string; canal: string }[] | null;
}
type Note = { kind: 'erro' | 'hipotese' | 'pergunta' | 'info'; text: string };

// Regras determinísticas. Inconsistência não é erro por padrão: só vira "erro" o que quebra a taxonomia.
function rascunho(rows: CrossRow[]) {
  const low = (s: unknown) => String(s ?? '').toLowerCase();
  return rows.map(r => {
    const n: Note[] = [], cols = r.columns || [], id = r.proposed || '';
    if (!/^afz_/.test(r.activity)) n.push({ kind: 'erro', text: `Activity sem taxonomia ("${r.activity}"): não liga a nenhum disparo.` });
    const other = (r.linked_templates || []).filter(t => t !== id);
    if (!id) n.push(other.length
      ? { kind: 'pergunta', text: `Link sem af_sub3, mas activities já usa ${other.join(', ')} nesse disparo. Quer propor esse ID?` }
      : { kind: 'info', text: `Sem ID proposto: o link ${r.channel === 'SMS' ? 'do SMS ' : ''}não traz af_sub3 e activities também não tem template gravado.` });
    else if (other.length) n.push({ kind: 'pergunta', text: `Activities já tem ${other.join(', ')} gravado e o link diz ${id}. Não sobrescrevo: qual vale?` });
    if (id && !r.catalog) n.push({ kind: 'info', text: `${id} não existe no catálogo; precisa ser cadastrado antes de enviar.` });
    else if (id && r.catalog && !r.catalog.has_asset) n.push({ kind: 'info', text: `${id} está no catálogo como ${r.catalog.status}, sem peça.` });
    if (!r.exec_any_journey) n.push({ kind: 'info', text: 'Ainda sem disparo em activities com esse Activity Name.' });
    else if (!r.exec_same_journey) n.push({ kind: 'hipotese', text: `Rodou só em outra jornada (${(r.other_journeys || []).join(', ')}). Se a peça é a mesma, a sugestão vale para esses disparos.` });
    const sub1 = low(r.utm?.af_sub1), segs = [...new Set(cols.map(c => low(c.segmento)))];
    if (sub1 && segs.length && !segs.includes(sub1)) n.push({ kind: 'hipotese', text: `Link manda af_sub1=${r.utm.af_sub1}, mas Segmento em activities é ${segs.join('/')}.` });
    const c = low(r.utm?.c), promo = cols.map(x => low(x.promocional) + ' ' + low(x.oferta)).join(' ');
    // Só sinaliza troca real: o c diz uma campanha e as colunas citam a outra.
    for (const [camp, other] of [['copa', 'vibe'], ['vibe', 'copa']]) if (c.includes(camp) && !promo.includes(camp) && promo.includes(other))
      n.push({ kind: 'hipotese', text: `c=${r.utm.c}, mas Oferta/Promocional em activities diz ${other} (${[...new Set(cols.map(x => x.oferta + '/' + x.promocional))].join(', ')}). Copa e Vibe trocados nas colunas?` });
    const act = low(r.activity);
    if (/ecred|serasa|srsa/.test(act) && /_inst_/i.test(id)) n.push({ kind: 'hipotese', text: `Activity de Serasa/eCred com link institucional (${id}).` });
    if (/institucional|_inst/.test(act) && /_srsa_/i.test(id)) n.push({ kind: 'hipotese', text: `Activity institucional com link de Serasa (${id}).` });
    const sName = act.match(/disp\d+s(\d)/)?.[1], sId = id.match(/_S(\d)D\d+$/i)?.[1];
    if (sName && sId && sName !== sId) n.push({ kind: 'hipotese', text: `Nome diz semana ${sName}, o ID diz semana ${sId} (${id}).` });
    const d2 = low(r.utm?.af_sub2).match(/^d(\d+)$/)?.[1], dId = id.match(/_D(\d+)$/)?.[1];
    if (d2 && dId && d2 !== dId) n.push({ kind: 'hipotese', text: `af_sub2=${r.utm.af_sub2} não bate com o sufixo do ID (${id}).` });
    const bus = [...new Set(cols.map(x => x.bu))];
    if (/^bb_/i.test(id) && bus.length && !bus.includes('B2B2C')) n.push({ kind: 'hipotese', text: `ID de Bem Barato (bb_) em disparo de BU ${bus.join('/')}.` });
    if (/^b2c_/i.test(id) && bus.length && !bus.includes('B2C')) n.push({ kind: 'hipotese', text: `ID B2C em disparo de BU ${bus.join('/')}.` });
    const multi = (r.alerts || []).find(a => a.startsWith('Mais de um af_sub3'));
    if (multi) n.push({ kind: 'pergunta', text: `${multi}. Um dos links da peça parece ter ficado de outra semana; qual vale?` });
    const rest = (r.alerts || []).filter(a => a !== multi);
    if (rest.length) n.push({ kind: 'info', text: `Alertas do parser: ${rest.join('; ')}.` });
    if (!n.length) n.push({ kind: 'info', text: `Bate com activities (${r.exec_any_journey} disparo(s), ${r.dates?.[0]} a ${r.dates?.[1]}) e o ID existe no catálogo com peça.` });
    return { proposal_id: r.proposal_id, activity: r.activity, proposed: id, notes: n };
  });
}

// ID de topo CRM (e-mail/SMS dinâmico, sem af_sub3 no pacote). Regra confirmada pelo Pablo em 08/10/2026:
// {publico}_{canal}_{campanha}_{seg}_S{semana}D{disparo}; D = ordem do disparo na régua, disp4 repete o D02;
// seg = bsp só no B2C, crm nos parceiros (bb, dia, plurix). SMS de topo só tem D01 (clicked).
// Fora por enquanto (ainda serão criados): D03 da Vibe e toda a semana 4 da Vibe.
const PUB: Record<string, string> = { vis: 'b2c', b2c: 'b2c', bbt: 'bb', dia: 'dia', plx: 'plurix' };
function topoCrmId(activity: string): { id: string | null; why: string } {
  const m = activity.match(/^[a-z]+_car_([a-z]+)_aqs_(email|sms)_([a-z]+)_disp(\d)s(\d)(copa|vibe)/i);
  if (!m) return { id: null, why: '' };
  const [, pubTok, canal, segTok, disp, sem, camp] = m.map(x => x?.toLowerCase());
  const pub = segTok === 'dia' ? 'dia' : PUB[pubTok];
  if (!pub) return { id: null, why: `público "${pubTok}" sem regra` };
  const d = canal === 'sms' ? 1 : disp === '4' ? 2 : Number(disp);
  if (camp === 'vibe' && (d === 3 || sem === '4')) return { id: null, why: 'Vibe D03/S4 ainda serão criados' };
  const seg = pub === 'b2c' ? 'bsp' : 'crm';
  return { id: `${pub}_${canal}_${camp}_${seg}_S${sem}D0${d}`, why: `regra topo CRM: disp${disp} s${sem} -> D0${d}${disp === '4' ? ' (disp4 repete o D02)' : ''}` };
}
function sugerir(rows: CrossRow[], catalog: Set<string>) {
  const out: { proposal_id: string; activity: string; proposed_template_id: string; reasons: string[]; conflicts: string[] }[] = [];
  for (const r of rows) {
    // B2B2C (BB, Dia) não tem base proprietária: ID usa crm. Links com bsp no SFMC foram erro pontual.
    const b2b2cBsp = r.proposed?.match(/^(bb|dia)_(email|sms)_([a-z]+)_bsp_(S\d+D\d+)$/i);
    if (b2b2cBsp) {
      const id = r.proposed.replace(/_bsp_/i, '_crm_');
      out.push({ proposal_id: r.proposal_id, activity: r.activity, proposed_template_id: id,
        reasons: [`Agente: B2B2C não tem base proprietária, o ID usa crm (regra do Pablo, 08/10/2026).`, ...(catalog.has(id) ? [] : [`${id} ainda não está no catálogo; será criado ao enviar.`])],
        conflicts: [`O link no ar no SFMC ainda manda af_sub3=${r.proposed}. Corrigir o link para ${id}, senão o AppsFlyer não casa com este template.`] });
      continue;
    }
    if (r.proposed) continue;
    const linked = r.linked_templates || [];
    const rule = topoCrmId(r.activity);
    if (!rule.id && rule.why) continue; // regra conhece o caso e manda não propor agora
    let id = rule.id, reasons: string[] = [], conflicts: string[] = [];
    if (id) reasons.push(`Agente: ${rule.why}.`);
    else if (linked.length === 1) { id = linked[0]; reasons.push('Agente: ID já usado em activities para este Activity Name.'); }
    if (!id) continue;
    const other = linked.filter(t => t !== id);
    if (other.length) conflicts.push(`Activities já tem ${other.join(', ')} para este Activity Name; não será sobrescrito.`);
    if (!catalog.has(id)) reasons.push(`${id} ainda não está no catálogo; será criado ao enviar.`);
    out.push({ proposal_id: r.proposal_id, activity: r.activity, proposed_template_id: id, reasons, conflicts });
  }
  return out;
}

async function main() {
  if (cmd === 'carregar') {
    const zip = args[1]; const scope = opt('escopo');
    if (!zip || !scope) throw new Error('uso: carregar <zip> --escopo <BU/conta>');
    const repo = findRepo();
    const { parsePackage } = await import(pathToFileURL(join(repo, 'src/modules/sfmc-package/parsePackage.ts')).href);
    const raw = readFileSync(zip);
    const pkg = await parsePackage(Uint8Array.from(raw).buffer, basename(zip));
    const gov = pkg.messages.filter((m: { is_optout: boolean }) => !m.is_optout).length;
    console.log(`parser ${pkg.parser_version} (${repo}): ${pkg.messages.length} mensagens, ${gov} governadas, ${pkg.journeys_count} jornadas, sha ${pkg.package_sha256.slice(0, 12)}`);
    save('pacote.json', pkg);
    if (flag('simular')) return;
    const e = env();
    const importId = await rpc<string>('stage_sfmc_package_as_agent', { p_package: pkg, p_scope: scope, p_on_behalf: e.GAAS_ON_BEHALF_USER_ID, p_agent: agent });
    console.log(`import_id: ${importId}`);
    const rows = await cruzar(importId);
    console.log(`rascunho de notas -> ${save('notas.json', rascunho(rows))}  (revise e rode: anotar notas.json)`);
  } else if (cmd === 'cruzar') {
    await cruzar(args[1]);
  } else if (cmd === 'rascunho') {
    const rows = JSON.parse(readFileSync(args[1], 'utf8')) as CrossRow[];
    console.log(`-> ${save('notas.json', rascunho(rows))}`);
  } else if (cmd === 'sugerir') {
    const rows = JSON.parse(readFileSync(args[1], 'utf8')) as CrossRow[];
    const list = sugerir(rows, await catalogIds());
    console.log(`${list.length} sugestões -> ${save('propostas.json', list)}  (revise e rode: propor propostas.json)`);
  } else if (cmd === 'propor') {
    const list = JSON.parse(readFileSync(args[1], 'utf8')).map((x: { proposal_id: string; proposed_template_id: string; reasons: string[]; conflicts: string[] }) =>
      ({ proposal_id: x.proposal_id, proposed_template_id: x.proposed_template_id, reasons: x.reasons, conflicts: x.conflicts }));
    const n = await rpc<number>('propose_templates_as_agent', { p_proposals: list, p_agent: agent, p_rule: opt('regra', 'topo-crm-v1+activities') });
    console.log(`${n} propostas com ID gravado (status: Com pendências)`);
  } else if (cmd === 'anotar') {
    const notes = JSON.parse(readFileSync(args[1], 'utf8')).map((x: { proposal_id: string; notes: Note[] }) => ({ proposal_id: x.proposal_id, notes: x.notes }));
    const n = await rpc<number>('annotate_proposals_as_agent', { p_notes: notes, p_agent: agent });
    console.log(`${n} propostas anotadas`);
  } else {
    console.log('comandos: carregar <zip> --escopo B2C | cruzar <import_id> | rascunho <cruzamento.json> | anotar <notas.json>');
  }
}
main().catch(err => { console.error(String(err?.message || err)); process.exit(1); });
