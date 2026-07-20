/**
 * Golden set de regressão do matcher de reconciliação (aba Comunicações).
 *
 * Casos reais extraídos da tabela `activities` / `communication_templates`
 * (Supabase mipiwxadnpwtcgfcedym) em 2026-07-19. Mede a "eficiência" do parser:
 * público via crosswalk de colunas, segmento por igualdade exata, veto duro de
 * parceiro/canal e confiança por âncoras. Roda automaticamente em DEV (ver import
 * em useReconciliation) e loga qualquer regressão no console.
 */
import {
  parseActivity, publicoFromColumns, segmentoKey, matchTemplate, confidenceOf,
  type ParsedActivity, type TemplateDims,
} from './taxonomy';

interface FakeTpl { id: string; dims: TemplateDims }
const tpl = (id: string, dims: Partial<TemplateDims>): FakeTpl => ({
  id,
  dims: { publico: null, canal: null, campanha: null, segmento: null, seq: null, variante: null, ...dims },
});

// Catálogo mínimo espelhando os templates reais de "Topo de Funil Copa".
const DIA_S3D01 = tpl('dia_email_copa_crm_S3D01', { publico: 'dia', canal: 'email', campanha: 'copa', segmento: 'crm', seq: 'S3D01' });
const BB_S3D01 = tpl('bb_email_copa_crm_S3D01', { publico: 'bb', canal: 'email', campanha: 'copa', segmento: 'crm', seq: 'S3D01' });
const B2C_S3D01 = tpl('b2c_email_copa_bsp_S3D01', { publico: 'b2c', canal: 'email', campanha: 'copa', segmento: 'base_proprietaria', seq: 'S3D01' });
const PLX_S3D01 = tpl('plurix_email_copa_crm_S3D01', { publico: 'plurix', canal: 'email', campanha: 'copa', segmento: 'crm', seq: 'S3D01' });
const CATALOG = [DIA_S3D01, BB_S3D01, B2C_S3D01, PLX_S3D01];

const dia = (): ParsedActivity => parseActivity('afz_car_vis_aqs_email_dia_disp1s3copa_pontual', {
  canal: 'E-mail', parceiro: 'Dia', segmento: 'CRM', bu: 'B2B2C', jornada: 'JOR_AQUISICAO_B2B2C_DIA_CRM_AQUISICAO_COPA_PAD_SEM3',
});
const alvorada = (): ParsedActivity => parseActivity('afz_car_vis_aqs_email_alvorada_disp1s3copa_pontual', {
  canal: 'E-mail', parceiro: 'Alvorada', segmento: 'CRM', bu: 'B2B2C', jornada: 'JOR_AQUISICAO_B2B2C_ALVORADA_CRM_AQUISICAO_COPA_PAD_SEM3',
});

interface Check { name: string; pass: boolean; got: string }
function run(): Check[] {
  const checks: Check[] = [];
  const eq = (name: string, got: unknown, want: unknown) =>
    checks.push({ name, pass: JSON.stringify(got) === JSON.stringify(want), got: String(got) });

  // Crosswalk BU+Parceiro → público (o bug original: Dia virava Bem Barato).
  eq('publico Dia/B2B2C = dia', publicoFromColumns('B2B2C', 'Dia'), 'dia');
  eq('publico Bem Barato/B2B2C = bb', publicoFromColumns('B2B2C', 'Bem Barato'), 'bb');
  eq('publico Alvorada/B2B2C = alvorada', publicoFromColumns('B2B2C', 'Alvorada'), 'alvorada');
  eq('publico Serasa/B2C = b2c', publicoFromColumns('B2C', 'Serasa'), 'b2c');
  eq('publico Proprietaria/B2C = b2c', publicoFromColumns('B2C', 'Proprietaria'), 'b2c');
  eq('publico N/A/Plurix = plurix', publicoFromColumns('Plurix', 'N/A'), 'plurix');
  eq('publico Proprietaria/B2B2C = sentinela b2b2c', publicoFromColumns('B2B2C', 'Proprietaria'), 'b2b2c');

  // Segmento por igualdade exata (mesmo vocabulário nos dois lados).
  eq('segmento Base_Proprietaria', segmentoKey('Base_Proprietaria'), 'base_proprietaria');
  eq('segmento Aprovados_nao_convertidos', segmentoKey('Aprovados_nao_convertidos'), 'aprovados_nao_convertidos');
  eq('segmento token bsp = base_proprietaria', segmentoKey('bsp'), 'base_proprietaria');

  // Parse do disparo de Dia (o caso do print).
  const d = dia();
  eq('disparo Dia → publico dia', d.publico, 'dia');
  eq('disparo Dia → segmento crm', d.segmento, 'crm');
  eq('disparo Dia → seq S3D01', d.seq, 'S3D01');

  // Veto duro: Dia NÃO pode casar com template de Bem Barato.
  const soBB = matchTemplate(d, [BB_S3D01]);
  checks.push({ name: 'Dia vetado contra template bb', pass: soBB === null, got: soBB ? soBB.tpl.id : 'null' });

  // Match certo: Dia casa com o template dia e é FORTE.
  const best = matchTemplate(d, CATALOG);
  checks.push({ name: 'Dia casa com dia_* (não bb/b2c/plurix)', pass: best?.tpl.id === 'dia_email_copa_crm_S3D01', got: best?.tpl.id ?? 'null' });
  eq('Dia = confiança forte', confidenceOf(best), 'forte');

  // Alvorada (sem template próprio) → nenhum match → novo.
  const alv = matchTemplate(alvorada(), CATALOG);
  checks.push({ name: 'Alvorada sem template → novo', pass: alv === null, got: alv ? alv.tpl.id : 'null' });

  // Divergência jornada × coluna: coluna diz B2C/Base_Proprietaria, jornada diz B2B2C_BB_CRM.
  // Precedência C: a jornada corrige (bb/crm) e a linha fica marcada como divergente.
  const div = parseActivity('afz_car_bbt_aqs_email_bsp_disp1s2copa_pontual', {
    canal: 'E-mail', parceiro: 'Proprietaria', segmento: 'Base_Proprietaria', bu: 'B2C',
    jornada: 'JOR_AQUISICAO_B2B2C_BB_CRM_AQUISICAO_COPA_PAD_SEM2',
  });
  eq('divergência: jornada corrige público → bb', div.publico, 'bb');
  eq('divergência: jornada corrige segmento → crm', div.segmento, 'crm');
  checks.push({ name: 'divergência: linha marcada', pass: !!div.divergencias?.length, got: JSON.stringify(div.divergencias) });
  // B2C legítimo (carrinho): jornada e coluna concordam → SEM divergência falsa.
  const b2cOk = parseActivity('afz_car_vis_aqs_email_bsp_disp1s2copa_pontual', {
    canal: 'E-mail', parceiro: 'Proprietaria', segmento: 'Base_Proprietaria', bu: 'B2C',
    jornada: 'JOR_AQUISICAO_B2C_CARRINHO_AQUISICAO_VIBE_PAD_26',
  });
  checks.push({ name: 'B2C consistente: sem divergência falsa', pass: !b2cOk.divergencias, got: JSON.stringify(b2cOk.divergencias) });

  return checks;
}

export interface GoldenReport { total: number; passed: number; failed: number; failures: Check[] }
export function runReconciliationGoldenSet(): GoldenReport {
  const checks = run();
  const failures = checks.filter((c) => !c.pass);
  return { total: checks.length, passed: checks.length - failures.length, failed: failures.length, failures };
}
