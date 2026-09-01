import type { BriefingRow } from '../domain/briefing';

export interface SubscriberSample { CPF: string; PRI_NOME: string; LIMITE: string; PRODUTO: string; SEQUENCIA: string; TP_CAMPANHA: string }
export interface RenderResult { html: string; diagnostics: string[] }
export interface RenderOptions { pendingAssets?: 'observations' | 'hidden' }

type Vars = Record<string, string | number | boolean>;
const MAX_RECURSION = 8;

function readVars(source: string, row: BriefingRow, subscriber: SubscriberSample): Vars {
  const vars: Vars = { Today: new Date().toISOString(), RowCount: 1 };
  for (const match of source.matchAll(/SET\s+@(\w+)\s*=\s*\[([^\]]+)\]/gi)) vars[match[1]] = subscriber[match[2] as keyof SubscriberSample] ?? '';
  for (const match of source.matchAll(/SET\s+@(\w+)\s*=\s*Field\s*\(\s*@Row\s*,\s*"([^"]+)"\s*\)/gi)) vars[match[1]] = row[match[2] as keyof BriefingRow] ?? '';
  return vars;
}

function unsupported(source: string): string[] {
  const errors: string[] = [];
  const patterns = [
    [/\bFOR\b/i, 'FOR'], [/\bWHILE\b/i, 'WHILE'], [/ContentBlockByKey\s*\(/i, 'ContentBlockByKey'],
    [/HTTP(?:Get|Post)\s*\(/i, 'HTTP'], [/InsertDE\s*\(/i, 'InsertDE'], [/UpdateDE\s*\(/i, 'UpdateDE'],
  ] as const;
  patterns.forEach(([pattern, label]) => { if (pattern.test(source)) errors.push(`Sintaxe AMPscript não suportada: ${label}.`); });
  if (/<script\b/i.test(source) || /javascript\s*:/i.test(source) || /<meta[^>]+http-equiv\s*=\s*["']?refresh/i.test(source)) errors.push('O template contém construção HTML insegura para preview.');
  return errors;
}

function truthy(value: unknown): boolean { return value !== '' && value !== null && value !== undefined && value !== false && value !== 0; }

function evalAtom(expression: string, vars: Vars): boolean {
  const expr = expression.trim();
  const notEmpty = expr.match(/^NOT\s+EMPTY\s*\(\s*@(\w+)\s*\)$/i);
  if (notEmpty) return truthy(vars[notEmpty[1]]);
  const empty = expr.match(/^EMPTY\s*\(\s*@(\w+)\s*\)$/i);
  if (empty) return !truthy(vars[empty[1]]);
  const comparison = expr.match(/^@(\w+)\s*(>=|<=|==|=|>|<)\s*(.+)$/);
  if (comparison) {
    const left = vars[comparison[1]]; const rawRight = comparison[3].trim();
    const right = rawRight.startsWith('@') ? vars[rawRight.slice(1)] : rawRight.replace(/^['"]|['"]$/g, '');
    const lNum = Number(left); const rNum = Number(right); const numeric = Number.isFinite(lNum) && Number.isFinite(rNum);
    const a = numeric ? lNum : String(left ?? ''); const b = numeric ? rNum : String(right ?? '');
    if (comparison[2] === '>' ) return a > b; if (comparison[2] === '<') return a < b;
    if (comparison[2] === '>=') return a >= b; if (comparison[2] === '<=') return a <= b;
    return a === b;
  }
  const variable = expr.match(/^@(\w+)$/); if (variable) return truthy(vars[variable[1]]);
  return false;
}

function evalCondition(expression: string, vars: Vars): boolean {
  const orParts = expression.split(/\s+OR\s+/i);
  return orParts.some((orPart) => orPart.split(/\s+AND\s+/i).every((part) => evalAtom(part, vars)));
}

interface ConditionalToken { start: number; end: number; kind: 'if' | 'else' | 'endif'; condition?: string }
function tokens(source: string): ConditionalToken[] {
  const result: ConditionalToken[] = [];
  const re = /%%\[\s*(IF\s+([\s\S]*?)\s+THEN|ELSE|ENDIF)\s*\]%%/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) result.push({ start: match.index, end: re.lastIndex, kind: /^IF/i.test(match[1]) ? 'if' : /^ELSE/i.test(match[1]) ? 'else' : 'endif', condition: match[2] });
  return result;
}

function renderConditionals(source: string, vars: Vars): string {
  let output = source;
  for (let guard = 0; guard < 200; guard += 1) {
    const list = tokens(output); const stack: number[] = []; let target: { ifIndex: number; endIndex: number; elseIndex?: number } | null = null;
    list.forEach((token, index) => {
      if (target) return;
      if (token.kind === 'if') stack.push(index);
      else if (token.kind === 'endif') {
        const ifIndex = stack.pop();
        if (ifIndex != null) {
          const elseIndex = list.findIndex((candidate, candidateIndex) => candidateIndex > ifIndex && candidateIndex < index && candidate.kind === 'else' && !list.slice(ifIndex + 1, candidateIndex).some((nested) => nested.kind === 'if'));
          target = { ifIndex, endIndex: index, ...(elseIndex >= 0 ? { elseIndex } : {}) };
        }
      }
    });
    if (!target) break;
    const block = target as { ifIndex: number; endIndex: number; elseIndex?: number };
    const ifToken = list[block.ifIndex]; const endToken = list[block.endIndex]; const elseToken = block.elseIndex != null ? list[block.elseIndex] : undefined;
    const yes = output.slice(ifToken.end, elseToken?.start ?? endToken.start);
    const no = elseToken ? output.slice(elseToken.end, endToken.start) : '';
    const replacement = evalCondition(ifToken.condition ?? '', vars) ? yes : no;
    output = output.slice(0, ifToken.start) + replacement + output.slice(endToken.end);
  }
  return output;
}

function interpolate(value: string, vars: Vars, depth = 0): string {
  if (depth > MAX_RECURSION) return '[erro: limite de recursão TreatAsContent]';
  let output = value;
  output = output.replace(/%%=\s*v\s*\(\s*@(\w+)\s*\)\s*=%%/gi, (_, name) => String(vars[name] ?? ''));
  output = output.replace(/%%=\s*TreatAsContent\s*\(\s*@(\w+)\s*\)\s*=%%/gi, (_, name) => interpolate(String(vars[name] ?? ''), vars, depth + 1));
  output = output.replace(/%%=\s*RedirectTo\s*\(\s*TreatAsContent\s*\(\s*@(\w+)\s*\)\s*\)\s*=%%/gi, (_, name) => interpolate(String(vars[name] ?? ''), vars, depth + 1));
  return output;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderPendingAssetPlaceholders(html: string): string {
  return html.replace(/<img\b(?=[^>]*\bsrc="(\[PENDENTE MKT\][^"]*)")[^>]*>/gi, (_, description: string) => (
    `<div role="img" aria-label="${escapeHtml(description)}" style="box-sizing:border-box; width:100%; min-height:160px; display:flex; align-items:center; justify-content:center; padding:24px; border:2px dashed #A8AFBF; border-radius:10px; background:#E5E7EB; color:#4B5563; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.45; text-align:center;">${escapeHtml(description)}</div>`
  ));
}

export function renderDynamicEmail(source: string, row: BriefingRow, subscriber: SubscriberSample, options: RenderOptions = {}): RenderResult {
  const diagnostics = unsupported(source); if (diagnostics.length) return { html: '', diagnostics };
  const vars = readVars(source, row, subscriber);
  // The leading setup block contains lookup/SET business logic; assignments were read above. Inline content IFs remain evaluable.
  let html = source.replace(/%%\[(?=[\s\S]*?\bSET\b)[\s\S]*?\]%%/i, '');
  html = renderConditionals(html, vars);
  html = html.replace(/%%\[\s*(?:SET|RaiseError)[\s\S]*?\]%%/gi, '');
  html = interpolate(html, vars);
  html = options.pendingAssets === 'hidden'
    ? html.replace(/<img\b(?=[^>]*\bsrc="\[PENDENTE MKT\][^"]*")[^>]*>/gi, '')
    : renderPendingAssetPlaceholders(html);
  html = html.replace(/<custom\b[^>]*\/?\s*>/gi, '<!-- Bloco SFMC omitido no preview local -->');
  const unresolved = html.match(/%%(?:\[|=)[\s\S]*?%%/g) ?? [];
  if (unresolved.length) diagnostics.push(`Restaram ${unresolved.length} expressões AMPscript sem resolver.`);
  return { html, diagnostics };
}
