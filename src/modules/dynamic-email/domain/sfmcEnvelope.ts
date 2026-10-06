/** Derive envelope fields from the same V11 source shown/exported by the editor. */
export function v11Envelope(source: string): { subject: string; preheader: string; error?: string } | null {
  if (!source.includes('@PLXV11Inicializado')) return null;
  const subject = '%%=TreatAsContent(@Assunto)=%%';
  const setup = source.match(/^\s*(%%\[[\s\S]*?\]%%)/)?.[1];
  if (!setup || !setup.includes('SET @PreCabecalho = Field(@Row, "PRE_CABECALHO")')) {
    return { subject, preheader: '', error: 'O preparo do pré-cabeçalho não foi identificado. Revise o primeiro bloco AMPscript antes de copiar.' };
  }
  return { subject, preheader: `${setup}%%=TreatAsContent(@PreCabecalho)=%%` };
}
