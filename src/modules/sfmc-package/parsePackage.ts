import { unzipSync, strFromU8 } from 'fflate';
import { z } from 'zod';
import type { MessageContent, PackageMessage, ParsedPackage, JourneyGraph, JourneyNode } from './types';
import { materializeEmailHtml } from './emailPackageHtml';

// Package Manager entity shapes vary between exports. Only fields extracted below persist.
type Entity = Record<string, any>;
const channels: Record<string, string> = { WHATSAPPACTIVITY: 'WhatsApp', SMSSYNC: 'SMS', EMAILV2: 'E-mail', PUSHNOTIFICATIONACTIVITY: 'Push' };
export const PARSER_VERSION = '1.3.0';
// SMS e e-mail HTML não têm botão: o link rastreado mora no corpo do asset.
const TRACKED_URL = /https?:\/\/[^\s"'<>\\]+?af_sub3=[^\s"'<>\\]+/g;
const AMPSCRIPT = /%%\[|LookupRows?\(|LookupOrderedRows\(/;
const MAX_ZIP = 50 * 1024 * 1024, MAX_EXPANDED = 100 * 1024 * 1024;
const topSchema = z.object({ name: z.string().optional(), version: z.number().optional() }).passthrough();
const entitySchema = z.object({ data: z.record(z.string(), z.unknown()), originID: z.union([z.string(), z.number()]).optional() }).passthrough();

export async function sha256(bytes: ArrayBuffer): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(b => b.toString(16).padStart(2, '0')).join('');
}
export function normalizeJourney(value: string): string {
  return value.trim().toUpperCase().replace(/^JOR_AQUISICAO_/, 'JOR_AQS_');
}
export function parseLink(url: string | null): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  let query: URLSearchParams;
  try { query = new URL(url || '').searchParams; } catch { query = new URLSearchParams(); }
  for (const key of ['c', 'af_sub1', 'af_sub2', 'af_sub3']) result[key] = query.get(key);
  return result;
}
export function safeHttps(value: string | null | undefined): string | null {
  try { const u = new URL(value || ''); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; } catch { return null; }
}
/** Read-only graph projection. Keeps occurrences, outcome order and joins intact.
 * Timing remains configuration, never inferred execution timestamps. */
export function parseJourneyGraphs(entries: Record<string, Uint8Array>): JourneyGraph[] {
  const entities = new Map<string, Entity>();
  for (const [path, bytes] of Object.entries(entries)) {
    if (/^entities\/[^/]+\/[^/]+\.json$/.test(path)) entities.set(path.replace(/^entities\//, '').replace(/\.json$/, ''), entitySchema.parse(JSON.parse(strFromU8(bytes))) as Entity);
  }
  const dereference = (value: unknown): Entity => {
    const match = String(value || '').match(/entities\/([^/]+\/[^/]+)\/data/);
    return match ? entities.get(match[1])?.data || {} : {};
  };
  return [...entities.entries()].filter(([ref]) => ref.startsWith('journeys/')).map(([ref, entity]) => {
    const d = entity.data;
    if (!Array.isArray(d.activities)) throw new Error('Jornada sem atividades.');
    const trigger = d.triggers?.[0] || {};
    const event = dereference(trigger.metaData?.eventDefinitionId);
    const de = dereference(event.dataExtensionId);
    if (d.activities.length > 2000) throw new Error('Jornada excede 2.000 atividades.');
    const nodes: JourneyNode[] = d.activities.map((a: Entity) => ({ key: String(a.key), name: String(a.name || a.key), type: String(a.type), configuration: a.configurationArguments || {}, outcomes: (a.outcomes || []).map((o: Entity) => ({ key: String(o.key || ''), next: o.next ? String(o.next) : null, label: o.metaData?.label || o.key || '', metadata: o.metaData || {}, arguments: o.arguments || {} })) }));
    const incoming = new Map<string, number>();
    for (const a of nodes) for (const o of a.outcomes) if (o.next) incoming.set(o.next, (incoming.get(o.next) || 0) + 1);
    return { reference: ref, name: String(d.name).trim(), version: d.version || 1, entry: { trigger, event, de, entryMode: d.entryMode || null }, goals: d.goals || [], exitCriteria: d.exits || d.exitCriteria || [], nodes, roots: nodes.filter((a: {key: string}) => !incoming.has(a.key)).map((a: {key: string}) => a.key), joins: [...incoming].filter(([, count]) => count > 1).map(([key]) => key) };
  });
}
export function parseEntities(entries: Record<string, Uint8Array>, fileName: string): Omit<ParsedPackage, 'package_sha256'> {
  if (!entries['info.json'] || !Object.keys(entries).some(k => k.startsWith('entities/journeys/'))) throw new Error('Este ZIP não contém jornadas do Package Manager.');
  const info = topSchema.parse(JSON.parse(strFromU8(entries['info.json'])));
  const entities = new Map<string, Entity>();
  for (const [path, bytes] of Object.entries(entries)) {
    if (!/^entities\/[^/]+\/[^/]+\.json$/.test(path)) continue;
    const raw = entitySchema.parse(JSON.parse(strFromU8(bytes))) as Entity;
    entities.set(path.replace(/^entities\//, '').replace(/\.json$/, ''), raw);
  }
  const data = (ref: string): Entity => entities.get(ref)?.data || {};
  const name = (ref: string): string => data(ref).name || ref;
  const resolve = (value: string): string => value.replace(/\{\{mcpm#\/entities\/([^/]+)\/([^/]+)\/data\/([^}]*)\}\}/g,
    (_all, type, id, path: string) => { const field = path.match(/name:([^/]+)/)?.[1]; return '[' + name(type + '/' + id) + (field ? '.' + field : '') + ']'; })
    .replace(/\{\{mcpm:([^}|]+)[^}]*\}\}/g, '<campo de deploy: $1>');
  const criteriaText = (xml: string): string => {
    const matches = Array.from(resolve(xml || '').matchAll(/Key="([^"]+)" Operator="([^"]+)"[^>]*>(?:<Value><!\[CDATA\[(.*?)\]\]><\/Value>)?/g));
    return matches.map(m => m[1].split('.').pop() + ' ' + m[2] + (m[3] ? ' ' + m[3] : '')).join(' E ') || '?';
  };
  const strings = (value: unknown, path = '', depth = 0): [string, string][] => {
    if (depth > 60) throw new Error('Estrutura do pacote excede a profundidade suportada.');
    if (typeof value === 'string') return [[path, value]];
    if (!value || typeof value !== 'object') return [];
    return Object.entries(value).flatMap(([k, v]) => strings(v, path ? path + '.' + k : k, depth + 1));
  };
  const assetContent = (asset: Entity): { fields: Record<string, string>; subs: string[]; dynamic: boolean } => {
    const out: Record<string, string> = {};
    const wanted: Record<string, string> = { 'display:message': 'text', 'display:footer': 'footer', 'display:buttons.button1.value': 'link', 'display:buttons.button1.title': 'cta1', 'display:buttons.button2.title': 'cta2' };
    for (const [path, value] of strings(asset.views || {})) {
      if (path.includes('selectedTemplate') || path.includes('.template.') || path.includes('languages')) continue;
      const key = path.split('customBlockData.').pop() || '';
      if (wanted[key] && out[wanted[key]] === undefined) out[wanted[key]] = value;
      if (path.endsWith('displaymessage') && out.text === undefined) out.text = value;
    }
    const tracked: string[] = [];
    const raw = JSON.stringify(asset);
    const dynamic = AMPSCRIPT.test(raw);
    for (const m of raw.matchAll(TRACKED_URL)) { const url = m[0].replace(/&amp;/g, '&'); if (!tracked.includes(url)) tracked.push(url); }
    if (out.link === undefined && tracked.length) out.link = tracked[0];
    const subs = [...new Set(tracked.map(u => parseLink(u).af_sub3).filter((x): x is string => !!x))].sort();
    return { fields: out, subs, dynamic };
  };
  const messages: PackageMessage[] = [];
  const visualAssets=new Map<string,{key:string;mime:string;file:string}>(),visualMessages:{occurrence_key:string;html:string}[]=[];
  let previewBytes=0;
  const assets = new Map([...entities.entries()].filter(([ref]) => ref.startsWith('assets/')).map(([ref, e]) => [ref.slice(7), e.data]));
  const journeys = [...entities.entries()].filter(([ref]) => ref.startsWith('journeys/'));
  for (const [ref, entity] of journeys) {
    const d = entity.data;
    if (typeof d.name !== 'string' || !Array.isArray(d.activities)) throw new Error('Jornada sem nome ou atividades.');
    if (d.activities.length > 2000) throw new Error('Jornada excede 2.000 atividades.');
    const acts = new Map<string, Entity>(d.activities.map((a: Entity) => [a.key, a]));
    const nexts = new Set(d.activities.flatMap((a: Entity) => (a.outcomes || []).map((o: Entity) => o.next).filter(Boolean)));
    const roots = d.activities.filter((a: Entity) => !nexts.has(a.key));
    const paths = new Map<string, { labels: string[]; waits: string[] }[]>();
    let traversals = 0;
    const walk = (key: string, labels: string[], waits: string[], seen: Set<string>) => {
      if (seen.has(key) || !acts.has(key)) return;
      if (++traversals > 20000) throw new Error('Grafo da jornada excede o limite de caminhos.');
      const a = acts.get(key)!;
      const list = paths.get(key) || [];
      if (!list.some(p => JSON.stringify(p) === JSON.stringify({ labels, waits }))) list.push({ labels, waits });
      paths.set(key, list);
      const c = a.configurationArguments || {};
      const afterWait = a.type === 'WAIT' ? [...waits, String(c.waitDuration) + ' ' + String(c.waitUnit)] : waits;
      for (const outcome of a.outcomes || []) {
        let label: string | null = null;
        if ((a.outcomes || []).length > 1) {
          const md = outcome.metaData || {};
          if (a.type === 'MULTICRITERIADECISION') label = md.label || outcome.key;
          if (a.type === 'MULTICRITERIADECISION' && c.criteria?.[outcome.key]) label += ' (' + (md.criteriaDescription || criteriaText(c.criteria[outcome.key])) + ')';
          if (a.type === 'RANDOMSPLIT') label = 'split ' + outcome.arguments?.percentage + '%';
          if (a.type === 'ENGAGEMENTDECISION') label = a.name + ': ' + (md.label || outcome.key);
          if (a.type === 'WAITUNTILCHATRESPONSE') label = md.label || ({ EventFired: 'respondeu outra coisa', no_event: 'sem resposta' } as Record<string, string>)[outcome.key] || outcome.key;
        }
        if (outcome.next) walk(outcome.next, label ? [...labels, label] : labels, afterWait, new Set([...seen, key]));
      }
    };
    for (const root of roots) walk(root.key, [], [], new Set());
    const trigger = d.triggers?.[0] || {};
    const eventRef = String(trigger.metaData?.eventDefinitionId || '').match(/eventDefinitions\/([^/]+)\//)?.[1];
    const ev = eventRef ? data('eventDefinitions/' + eventRef) : {};
    const deRef = String(ev.dataExtensionId || '').match(/(dataExtensions|sharedDataExtensions)\/([^/]+)\//);
    const de = deRef ? data(deRef[1] + '/' + deRef[2]) : {};
    const fields = new Set((de.fields || []).map((f: Entity) => String(f.name).toLowerCase()));
    for (const a of d.activities) {
      if (!channels[a.type]) continue;
      const c = a.configurationArguments || {};
      const assetId = String(c.assetId || c.triggeredSend?.emailId || '').match(/assets\/([^/}]+)/)?.[1];
      const asset = assetId ? data('assets/' + assetId) : {};
      const { fields: extracted, subs: trackedSubs, dynamic: isDynamic } = assetContent(asset);
      const tpl = c.requestBody?.template || {};
      const params: string[] = (tpl.components || []).filter((x: Entity) => x.type === 'body').flatMap((x: Entity) => (x.parameters || []).map((p: Entity) => String(p.text || '')));
      const banner = (tpl.components || []).filter((x: Entity) => x.type === 'header').flatMap((x: Entity) => (x.parameters || []).map((p: Entity) => p.image?.link)).find(Boolean) || null;
      const body = extracted.text || (a.type === 'SMSSYNC' ? a.metaData?.store?.selectedContentBuilderMessage : null);
      const text = typeof body === 'string' ? body : null;
      const activityName = String(a.name || '').trim();
      const isOptout = /(?:^|_)(?:resposta_)?opt_?out(?:_|$)/i.test(activityName) || asset.assetType?.name === 'whatsAppSession';
      const alerts: string[] = [];
      if (!assetId || !Object.keys(asset).length) alerts.push('Conteúdo do asset não encontrado no pacote');
      if (!paths.has(a.key)) alerts.push('Atividade sem caminho acessível na estrutura exportada');
      const used = [...new Set(Array.from(((text || '') + ' ' + params.join(' ')).matchAll(/%%([A-Za-z0-9_]+)%%/g), m => m[1]))];
      const missing = used.filter(f => fields.size && !fields.has(f.toLowerCase()));
      if (missing.length) alerts.push('Campo não encontrado na DE de entrada: ' + missing.join(', '));
      const channelFromName = activityName.match(/_(wpp|sms|email|push)_/i)?.[1]?.toLowerCase();
      const nameChannels: Record<string, string> = { wpp: 'WhatsApp', sms: 'SMS', email: 'E-mail', push: 'Push' };
      if (channelFromName && nameChannels[channelFromName] !== channels[a.type]) alerts.push('Canal do nome difere do tipo da atividade');
      if (!/^[a-z0-9]+_[a-z0-9]+_/i.test(activityName)) alerts.push('Atividade sem nome de taxonomia');
      const link = extracted.link || null;
      const utm = parseLink(link);
      if (a.type === 'WHATSAPPACTIVITY' && link && !utm.af_sub3) alerts.push('Link sem af_sub3');
      if (trackedSubs.length > 1) alerts.push('Mais de um af_sub3 no conteúdo: ' + trackedSubs.join(', '));
      if (a.type === 'EMAILV2' && (isDynamic || !Object.keys(asset).length)) alerts.push('Conteúdo dinâmico depende do briefing');
      let emailHtml=a.type==='EMAILV2'?materializeEmailHtml(asset,assets):null;
      if(a.type==='EMAILV2'){const html=materializeEmailHtml(asset,assets,(key,mime,file)=>{visualAssets.set(key,{key,mime,file});return 'sfmc-asset:'+key;});if(html)visualMessages.push({occurrence_key:ref+':'+(d.version||1)+':'+a.key,html});}
      const bytes=emailHtml?new TextEncoder().encode(emailHtml).byteLength:0;
      if(previewBytes+bytes>6_000_000){emailHtml=null;alerts.push('Prévia HTML excede o limite de conteúdo do pacote');}else previewBytes+=bytes;
      if(a.type==='EMAILV2'&&!emailHtml&&!isDynamic&&Object.keys(asset).length)alerts.push('Prévia HTML não disponível no conteúdo exportado');
      if(emailHtml&&/<img\b[^>]*src=["']\s*["']/i.test(emailHtml))alerts.push('Imagem sem URL publicada ou acima do limite de imagem embutida');
      const content: MessageContent = {
        schema_version: 1, channel: channels[a.type], meta_template_name: tpl.name || null,
        body_text: text, body_params: params, footer: extracted.footer || null,
        buttons: [...(extracted.cta1 ? [{ title: extracted.cta1, type: 'url' as const }] : []), ...(extracted.cta2 ? [{ title: extracted.cta2, type: 'reply' as const }] : [])],
        banner_url: banner, sms_from: a.type === 'SMSSYNC' ? c.fromName || null : null,
        ...(a.type === 'EMAILV2' ? { email_html: emailHtml, email_subject: asset.views?.subjectline?.content || null, email_preheader: asset.views?.preheader?.content || null } : {}),
      };
      messages.push({
        occurrence_key: ref + ':' + (d.version || 1) + ':' + a.key,
        journey_name: d.name.trim(), journey_name_raw: d.name, journey_version: d.version || 1,
        journey_origin_id: String(entity.originID || ref), activity_key: a.key, activity_name: activityName,
        entry_de: de.name || null, entry_filter: trigger.description || criteriaText(trigger.configurationArguments?.criteria || ''),
        paths: paths.get(a.key) || [], asset_name: asset.name || null, asset_id: assetId || null, content,
        link_url: link, utm, is_optout: isOptout, alerts,
      });
    }
  }
  const trackingUses = new Map<string, Set<string>>();
  for (const message of messages) {
    const id = message.utm.af_sub3;
    if (id && !message.is_optout) trackingUses.set(id, new Set([...(trackingUses.get(id) || []), message.activity_name]));
  }
  for (const message of messages) if (message.utm.af_sub3 && (trackingUses.get(message.utm.af_sub3)?.size || 0) > 1) message.alerts.push('Mesmo af_sub3 observado em atividades diferentes');
  if (messages.length > 3000) throw new Error('Pacote excede 3.000 mensagens.');
  return { file_name: fileName, package_name: info.name || fileName, package_version: info.version || 1, parser_version: PARSER_VERSION, journeys_count: journeys.length, messages, graphs: parseJourneyGraphs(entries),visuals:{assets:[...visualAssets.values()],messages:visualMessages} };
}
export async function parsePackage(bytes: ArrayBuffer, fileName: string): Promise<ParsedPackage> {
  if (bytes.byteLength > MAX_ZIP) throw new Error('O ZIP deve ter até 50 MB.');
  let expanded = 0, count = 0;
  const entries = unzipSync(new Uint8Array(bytes), { filter: entry => {
    if (++count > 5000 || (expanded += entry.originalSize) > MAX_EXPANDED) throw new Error('Pacote excede o limite de expansão.');
    if (entry.name.includes('..') || entry.name.startsWith('/') || entry.name.includes('\\')) throw new Error('Caminho inválido no ZIP.');
    return entry.name === 'info.json' || /^entities\/[^/]+\/[^/]+\.json$/.test(entry.name);
  } });
  return { ...parseEntities(entries, fileName), package_sha256: await sha256(bytes) };
}

