import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PLURIX_V13_TEMPLATE } from './plurixV13Template';
import { PLURIX_V14_TEMPLATE } from './plurixV14Template';
import { emptyBriefingRow, templateActiveColumns } from '../domain/briefing';
import { renderDynamicEmail } from '../ampscript/renderer';
import { plurixEnvelope } from '../domain/sfmcEnvelope';

describe('PLURIX V14 candidata', () => {
  it('preserva byte a byte o preparo operacional salvo da V13', () => {
    const setup = (s: string) => s.slice(0,s.indexOf(']%%') + 3).split('PLXV14Inicializado').join('PLXV13Inicializado').replace('/* PLURIX V14 (candidata):','/* PLURIX V13 (candidata):');
    expect(setup(PLURIX_V14_TEMPLATE)).toBe(setup(PLURIX_V13_TEMPLATE));
    expect(templateActiveColumns(PLURIX_V14_TEMPLATE)).toEqual(templateActiveColumns(PLURIX_V13_TEMPLATE));
    expect(plurixEnvelope(PLURIX_V14_TEMPLATE)?.version).toBe('V14');
  });

  it('renderiza todos os estados, preserva header, limite, CTAs e pool', () => {
    for (let seq=1; seq<=8; seq++) for (const mode of ['html','imagem']) for (const limit of ['', '3500']) for (const logo of ['', 'https://example.com/logo.png']) for (const pool of [false,true]) {
      const row = Object.assign(emptyBriefingRow('00000000-0000-4000-8000-0000000014a1'), {
        NM_PRODUTO_INTERNO:'AMIGAO', TP_CAMPANHA:'Topo de Funil', SEQUENCIA:`E-mail ${seq}`,
        HEADER_TITULO:mode === 'html' ? 'Use seu cartão dentro e fora do mercado!' : '', HEADER:'https://example.com/header.png',
        HEADER_SUBTITULO:'Mais flexibilidade para aproveitar as suas compras.', HEADER_IMAGEM_CARTAO:'https://example.com/card.png', HEADER_LOGO:logo,
        MENSAGEM_LIMITE:'Olá, {{nome}}: R$ {{limite}} de limite.', TITULO_CTA_1:'PEDIR CARTÃO', LINK_CTA_1:'https://example.com/pedir',
      });
      const rendered = renderDynamicEmail(PLURIX_V14_TEMPLATE,row,{CPF:'00000000000',PRI_NOME:'MARIA',LIMITE:limit,PRODUTO:'AMIGAO',SEQUENCIA:row.SEQUENCIA,TP_CAMPANHA:row.TP_CAMPANHA}, { vars:pool ? {OfertaProduto:'Produto de teste',OfertaPrecoTxt:'12,00',OfertaData:'27/10'} : {} });
      expect(rendered.diagnostics).toEqual([]);
      expect(rendered.html).not.toMatch(/%%(?:\[|=)/);
      expect(rendered.html.includes('class="hdr-title brand-text"')).toBe(mode==='html');
      expect(rendered.html.includes('3.500,00')).toBe(Boolean(limit));
      expect(rendered.html.includes('Produto de teste')).toBe(pool);
      expect(rendered.html.includes('src="https://example.com/logo.png"')).toBe(mode==='html' && Boolean(logo));
      expect(rendered.html).toContain('https://example.com/pedir');
    }
  });

  it('protege cores e elimina CSS mobile conflitante', () => {
    for (const color of ['#4A5BA6','#2C3490','#343B61']) expect(PLURIX_V14_TEMPLATE).toContain(`linear-gradient(${color},${color})`);
    for (const token of ['[data-ogsc]','[data-ogsb]','content="light only"','-webkit-text-fill-color:','<body class="body"']) expect(PLURIX_V14_TEMPLATE).toContain(token);
    expect(PLURIX_V14_TEMPLATE).not.toContain('mix-blend-mode:');
    for (const color of ['#ffffff','#F6F6FB','#f2f4f7']) expect(PLURIX_V14_TEMPLATE).toContain(`linear-gradient(${color},${color})`);
    expect(PLURIX_V14_TEMPLATE).not.toContain('#E6A813');
    for (const cls of ['hdr-copy','hdr-title','hdr-card']) expect(PLURIX_V14_TEMPLATE.match(new RegExp(`\\.${cls} \\{`, 'g'))).toHaveLength(1);
  });

  it('publica exatamente a fonte testada e mantém links e assets dinâmicos', () => {
    const migration=readFileSync('supabase/migrations/20261027184742_dynamic_email_plurix_v14_light_only.sql','utf8');
    expect(migration.split('$v14$')[1]).toBe(PLURIX_V14_TEMPLATE);
    const links=(s:string)=>[...s.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
    expect(links(PLURIX_V14_TEMPLATE)).toEqual(links(PLURIX_V13_TEMPLATE));
    expect(PLURIX_V14_TEMPLATE).toContain('%%=v(@HdrCartao)=%%');
    expect(PLURIX_V14_TEMPLATE).toContain('table-layout:fixed; overflow-wrap:anywhere;');
    expect(migration).not.toMatch(/update\s+(?:public\.)?dynamic_email_briefings/i);
  });

  it('protege também o HTML governado dentro do briefing sem editar o dado original', () => {
    const content='<td bgcolor="#F4F5FB" style="background-color:#F4F5FB;"><p style="color:#4A4F6A;">Texto <b style="color:#242424;">importante</b></p></td>';
    const row=Object.assign(emptyBriefingRow('00000000-0000-4000-8000-0000000014a1'),{SEQUENCIA:'E-mail 3',NM_PRODUTO_INTERNO:'AMIGAO',TP_CAMPANHA:'Topo de Funil',HEADER_TITULO:'Teste',COPY_2_PRETO:content});
    const result=renderDynamicEmail(PLURIX_V14_TEMPLATE,row,{CPF:'00000000000',PRI_NOME:'MARIA',LIMITE:'',PRODUTO:'AMIGAO',SEQUENCIA:row.SEQUENCIA,TP_CAMPANHA:row.TP_CAMPANHA});
    expect(result.diagnostics).toEqual([]);
    expect(result.html).toContain('background-image:linear-gradient(#F4F5FB,#F4F5FB)');
    expect(result.html).toContain('-webkit-text-fill-color:#4A4F6A;');
    expect(result.html).toContain('-webkit-text-fill-color:#242424;');
    expect(row.COPY_2_PRETO).toBe(content);
  });

  it('retorna diagnóstico para Replace visual malformado em vez de derrubar o editor', () => {
    const row=emptyBriefingRow('00000000-0000-4000-8000-0000000014a1');
    const result=renderDynamicEmail('%%=TreatAsContent(Replace(@Copy1Preto,"x"))=%%',row,{CPF:'00000000000',PRI_NOME:'MARIA',LIMITE:'',PRODUTO:'AMIGAO',SEQUENCIA:'E-mail 1',TP_CAMPANHA:'Topo de Funil'});
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toContain('sem resolver');
  });
});
