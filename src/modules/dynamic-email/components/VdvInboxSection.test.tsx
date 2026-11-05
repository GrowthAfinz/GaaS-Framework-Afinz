import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { VdvInboxSection } from './VdvInboxSection';
import { VaiDeVisaWorkspace } from './VaiDeVisaWorkspace';

describe('Entradas VDV na caixa de e-mails', () => {
  it('oferece os dois toques sem depender de cadastros no Supabase', () => {
    const html = renderToStaticMarkup(<VdvInboxSection onOpen={() => {}}/>);
    expect(html).toContain('RENTABILIZAÇÃO');
    expect(html).toContain('Pool Vai de Visa');
    expect(html).toContain('E-mail 1 · persona (V1)');
    expect(html).toContain('E-mail 2 · cartão (V2)');
    expect(html).toContain('aria-expanded="true"');
  });
  it('respeita a busca e permite encontrar a campanha por Visa/VDV', () => {
    expect(renderToStaticMarkup(<VdvInboxSection query="Visa" onOpen={() => {}}/>)).toContain('Pool Vai de Visa');
    expect(renderToStaticMarkup(<VdvInboxSection query="VDV" onOpen={() => {}}/>)).toContain('Pool Vai de Visa');
    expect(renderToStaticMarkup(<VdvInboxSection query="Plurix" onOpen={() => {}}/>)).toBe('');
  });
  it('abre o toque escolhido e oferece retorno à caixa', () => {
    const html = renderToStaticMarkup(<VaiDeVisaWorkspace initialTouch="V2" onBack={()=>{}} data={{briefing:[],movimento:[]}} onChange={()=>{}} today="2026-11-05" onDateChange={()=>{}}/>);
    expect(html).toContain('Pool Vai de Visa · V2');
    expect(html).toContain('Voltar aos e-mails');
    expect(html).toContain('Exportar HTML V2');
  });
});
