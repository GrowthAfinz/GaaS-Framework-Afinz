import { describe, expect, it } from 'vitest';
import type { Activity } from '../types/framework';
import { activityCommunicationContext, communicationContextKey, rowCommunicationContext, toActivityRow } from './activityCommunicationContext';

const activity = (execution: string, date: string, templateId?: string): Activity => ({
  id: 'mesma_activity', dataDisparo: new Date(`${date}T12:00:00`),
  canal: 'WhatsApp', bu: 'B2C', segmento: 'Negados', parceiro: '', jornada: 'JOR_AQS_TESTE',
  templateId, kpis: { cartoes: 12 },
  raw: { id: execution, 'Activity name / Taxonomia': 'mesma_activity', template_id: templateId },
} as unknown as Activity);

describe('identidade da comunicação por execução', () => {
  it('preserva UUID, data e template distintos quando o nome se repete', () => {
    const first = activity('uuid-1', '2026-10-05', 'Template_A');
    const second = activity('uuid-2', '2026-10-06', 'Template_B');
    expect(toActivityRow(second)).toMatchObject({ id: 'uuid-2', template_id: 'Template_B', 'Data de Disparo': '2026-10-06' });
    expect(communicationContextKey(activityCommunicationContext(first))).not.toEqual(communicationContextKey(activityCommunicationContext(second)));
    expect(rowCommunicationContext(toActivityRow(second))).toEqual(activityCommunicationContext(second));
  });
  it('recupera o template do raw quando o mapeador não preenche templateId', () => {
    const a = activity('uuid-1', '2026-10-05');
    a.raw.template_id = 'Case_Sensitive_ID';
    expect(activityCommunicationContext(a).templateId).toBe('Case_Sensitive_ID');
    expect(toActivityRow(a).template_id).toBe('Case_Sensitive_ID');
  });
  it('não empresta vínculo de outra execução nem inventa um UUID para dados CSV', () => {
    const a = activity('', '2026-10-05');
    expect(activityCommunicationContext(a)).toMatchObject({ executionId: '', templateId: null });
  });
  it('preserva o nome de taxonomia quando Activity.id é o UUID', () => {
    const a = activity('uuid-1', '2026-10-05', 'Template_A');
    a.id = 'uuid-1';
    expect(toActivityRow(a)['Activity name / Taxonomia']).toBe('mesma_activity');
  });
});
