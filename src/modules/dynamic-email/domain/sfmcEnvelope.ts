/** Derive envelope fields from the same Plurix V11+ source shown/exported by the editor. */
export function plurixEnvelope(source: string): { version: string; subject: string; preheader: string; error?: string } | null {
  const marker = source.match(/@PLXV(\d+)Inicializado/);
  if (!marker) return null;
  const version = `V${marker[1]}`;
  const subject = '%%=TreatAsContent(@Assunto)=%%';
  const setup = source.match(/^\s*(%%\[[\s\S]*?\]%%)/)?.[1];
  if (!setup || !setup.includes('SET @PreCabecalho = Field(@Row, "PRE_CABECALHO")')) {
    return { version, subject, preheader: '', error: 'O preparo do pré-cabeçalho não foi identificado. Revise o primeiro bloco AMPscript antes de copiar.' };
  }
  return { version, subject, preheader: `${setup}%%=TreatAsContent(@PreCabecalho)=%%` };
}

/** Nome mantido para compatibilidade com o envelope da V11. */
export const v11Envelope = plurixEnvelope;
