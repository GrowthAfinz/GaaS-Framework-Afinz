import { describe, expect, it } from 'vitest';
import { renderDynamicEmail } from './renderer';
import { emptyBriefingRow } from '../domain/briefing';
import { DEFAULT_DYNAMIC_EMAIL_TEMPLATE } from '../fixtures/defaultTemplate';
import { PLURIX_UX_V2_TEMPLATE } from '../fixtures/plurixUxV2Template';

const subscriber = { CPF: '1', PRI_NOME: 'VANIA', LIMITE: 'R$ 3.500', PRODUTO: 'INSTITUCIONAL', SEQUENCIA: 'E-mail 1', TP_CAMPANHA: 'Repescagem' };

const withLiveAudienceContext = (source: string) => source
  .replace('SET @FirstName = [PRI_NOME]', 'SET @Chave = Trim(AttributeValue("CPF"))\nSET @FirstName = Field(@AudRow, "PRI_NOME")')
  .replace('SET @LimiteNovo = [LIMITE]', 'SET @LimiteNovo = Field(@AudRow, "LIMITE")')
  .replace('SET @Produto = [PRODUTO]', 'SET @Produto = Trim(Field(@AudRow, "PRODUTO"))')
  .replace('SET @Sequencia = [SEQUENCIA]', 'SET @Sequencia = Trim(Field(@AudRow, "SEQUENCIA"))')
  .replace('SET @TpCampanha = [TP_CAMPANHA]', 'SET @TpCampanha = Trim(Field(@AudRow, "TP_CAMPANHA"))');

describe('AMPscript-lite', () => {
  it('renderiza o caso real Visa com TreatAsContent recursivo', () => {
    const row = emptyBriefingRow('visa');
    Object.assign(row, { NM_PRODUTO_INTERNO: 'INSTITUCIONAL', TITULO_COPY_1_AZUL: 'Sua aprovação chegou!', COR_COPY_1: '#00C6CC', TAMANHO_DA_FONTE_TITULO_COPY_1: '24', COPY_1_PRETO: 'Olá, %%=v(@FirstName)=%%! Limite de %%=v(@LimiteNovo)=%%.', COR_COPY_PRETO_1: '#222222', TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '16' });
    const result = renderDynamicEmail(DEFAULT_DYNAMIC_EMAIL_TEMPLATE, row, subscriber);
    expect(result.diagnostics).toEqual([]);
    expect(result.html).toContain('Olá, VANIA! Limite de R$ 3.500.');
    expect(result.html).toContain('color:#00C6CC');
  });

  it('omite H1 vazio e renderiza o caso Plurix', () => {
    const row = emptyBriefingRow('plurix');
    Object.assign(row, { NM_PRODUTO_INTERNO: 'PLURIX', COPY_1_PRETO: '%%=v(@FirstName)=%%, o Clube Amigão agora é +amigo!', COR_COPY_PRETO_1: '#222222', TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '16', TITULO_COPY_2: 'E as novidades <br>não param por aí!', COR_TITULO_COPY_2: '#2C3490', TAMANHO_DA_FONTE_TITULO_COPY_2: '22' });
    const result = renderDynamicEmail(DEFAULT_DYNAMIC_EMAIL_TEMPLATE, row, { ...subscriber, PRI_NOME: 'PABLO' });
    expect(result.html).not.toContain('<h1');
    expect(result.html).toContain('PABLO, o Clube Amigão agora é +amigo!');
    expect(result.html).toContain('E as novidades <br>não param por aí!');
    expect(result.html).toContain('color:#2C3490');
  });

  it('falha visivelmente para sintaxe fora do escopo', () => {
    const result = renderDynamicEmail('%%[ FOR @i = 1 TO 3 DO ]%%x%%[ NEXT @i ]%%', emptyBriefingRow(), subscriber);
    expect(result.diagnostics[0]).toContain('FOR');
    expect(result.html).toBe('');
  });

  it('renderiza o layout do E-mail 1 sem repetir título e CTA da arte', () => {
    const row = emptyBriefingRow('plurix-v2-email-1');
    Object.assign(row, {
      NM_PRODUTO_INTERNO: 'AMIGAO',
      TITULO_COPY_1_AZUL: 'Conheça os benefícios do cartão +amigo',
      COR_COPY_1: '#2C3490',
      TAMANHO_DA_FONTE_TITULO_COPY_1: '24',
      COPY_1_PRETO: 'Olá, %%=v(@FirstName)=%%!',
      COR_COPY_PRETO_1: '#242424',
      TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '18',
      BANNER_1_CORPO: 'https://example.com/beneficios.png',
      TITULO_CTA_1: 'QUERO MEU CARTÃO +AMIGO',
      LINK_CTA_1: 'https://example.com/cartao',
      TITULO_COPY_2: 'Saiba como solicitar seu cartão +amigo',
      COR_TITULO_COPY_2: '#2C3490',
      TAMANHO_DA_FONTE_TITULO_COPY_2: '26',
      COPY_2_PRETO: 'Viu como é fácil?',
      COR_COPY_2: '#2C3490',
      TAMANHO_DA_FONTE_COPY_2: '16',
      BANNER_2_CORPO: 'https://example.com/passos.png',
      TITULO_CTA_2: 'PEDIR CARTÃO +AMIGO',
      LINK_CTA_2: 'https://example.com/pedir',
    });
    const result = renderDynamicEmail(PLURIX_UX_V2_TEMPLATE, row, { ...subscriber, PRI_NOME: 'VANIA' });
    expect(result.diagnostics).toEqual([]);
    expect(result.html).toContain('logo-mais-amigo.png');
    expect(result.html).toContain('Olá, VANIA!');
    expect(result.html).not.toContain('Conheça os benefícios do cartão +amigo');
    expect(result.html).not.toContain('QUERO MEU CARTÃO +AMIGO');
    expect(result.html.indexOf('passos.png')).toBeLessThan(result.html.indexOf('Viu como é fácil?'));
    expect(result.html.indexOf('Viu como é fácil?')).toBeLessThan(result.html.indexOf('PEDIR CARTÃO +AMIGO'));
    expect(result.html).toContain('background-color:#2C3490');
    expect(result.html).toContain('text-align:center');
    expect(result.html).toContain('<!-- Bloco SFMC omitido no preview local -->');
    expect(PLURIX_UX_V2_TEMPLATE).toContain('<custom name="opencounter" type="tracking"/>');
  });

  it('renderiza o E-mail 2 com um único bloco secundário alimentado pelo briefing', () => {
    const row = emptyBriefingRow('plurix-v2-email-2');
    Object.assign(row, {
      NM_PRODUTO_INTERNO: 'BOA',
      TITULO_COPY_1_AZUL: 'Economize ainda mais',
      COR_COPY_1: '#2C3490',
      TAMANHO_DA_FONTE_TITULO_COPY_1: '24',
      TITULO_COPY_2: 'Só quem tem o cartão +amigo aproveita mais',
      COR_TITULO_COPY_2: '#2C3490',
      TAMANHO_DA_FONTE_TITULO_COPY_2: '26',
      COPY_2_PRETO: '<b>+5% de desconto</b> em produtos selecionados',
      COR_COPY_2: '#242424',
      TAMANHO_DA_FONTE_COPY_2: '17',
      BANNER_2_CORPO: 'https://example.com/cartoes.png',
      TITULO_CTA_2: 'PEDIR AGORA MEU CARTÃO +AMIGO',
      LINK_CTA_2: 'https://example.com/pedir',
    });
    const result = renderDynamicEmail(PLURIX_UX_V2_TEMPLATE, row, { ...subscriber, SEQUENCIA: 'E-mail 2' });
    expect(result.diagnostics).toEqual([]);
    expect(result.html).not.toContain('Benefícios do cartão +amigo');
    expect(result.html).toContain('<h1 class="headline"');
    expect(result.html).toContain('Economize ainda mais');
    expect(result.html).toContain('+5% de desconto');
    expect(result.html.match(/Só quem tem o cartão \+amigo aproveita mais/g)).toHaveLength(1);
    expect(result.html).not.toContain('Peça agora seu cartão +amigo');
    expect(result.html).not.toContain('Comece a aproveitar os benefícios nas suas compras do dia a dia.');
    expect(result.html).toContain('max-width:220px');
    expect(result.html).toContain('PEDIR AGORA MEU CARTÃO +AMIGO');
    expect(result.html).not.toContain('Saiba como solicitar');
  });

  it('reproduz no preview o contexto vivo de audiência usado pelo PLURIX V6', () => {
    const row = emptyBriefingRow('plurix-v6-email-1');
    Object.assign(row, {
      NM_PRODUTO_INTERNO: 'AMIGAO',
      TP_CAMPANHA: 'CRM',
      SEQUENCIA: 'E-mail 1',
      TITULO_COPY_1_AZUL: 'Título que só existe no ramo genérico',
      COPY_1_PRETO: 'Olá, %%=v(@FirstName)=%%!',
      COR_COPY_PRETO_1: '#242424',
      TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '18',
      BANNER_1_CORPO: 'https://example.com/beneficios-email-1.png',
    });

    const result = renderDynamicEmail(withLiveAudienceContext(PLURIX_UX_V2_TEMPLATE), row, {
      ...subscriber,
      CPF: '00000000001',
      PRI_NOME: 'VANIA',
      PRODUTO: 'AMIGAO',
      SEQUENCIA: 'E-mail 1',
      TP_CAMPANHA: 'CRM',
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.html).toContain('Olá, VANIA!');
    expect(result.html).toContain('beneficios-email-1.png');
    expect(result.html).not.toContain('Título que só existe no ramo genérico');
  });

  it('mantém a sequência viva correta para os oito e-mails da régua', () => {
    const template = withLiveAudienceContext(PLURIX_UX_V2_TEMPLATE);

    for (let email = 1; email <= 8; email += 1) {
      const sequence = `E-mail ${email}`;
      const row = emptyBriefingRow(`plurix-v6-${email}`);
      Object.assign(row, {
        NM_PRODUTO_INTERNO: 'AMIGAO',
        TP_CAMPANHA: 'CRM',
        SEQUENCIA: sequence,
        TITULO_COPY_1_AZUL: `Título genérico ${email}`,
        COR_COPY_1: '#2C3490',
        TAMANHO_DA_FONTE_TITULO_COPY_1: '24',
        COPY_1_PRETO: `%%=v(@FirstName)=%% · ${sequence}`,
        COR_COPY_PRETO_1: '#242424',
        TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '18',
        BANNER_1_CORPO: `https://example.com/banner-${email}.png`,
      });

      const result = renderDynamicEmail(template, row, { ...subscriber, PRODUTO: 'AMIGAO', SEQUENCIA: sequence, TP_CAMPANHA: 'CRM' });
      expect(result.diagnostics, sequence).toEqual([]);
      expect(result.html, sequence).toContain(`VANIA · ${sequence}`);
      expect(result.html, sequence).toContain(`banner-${email}.png`);
      if (email === 1) expect(result.html, sequence).not.toContain(`Título genérico ${email}`);
      else expect(result.html, sequence).toContain(`Título genérico ${email}`);
    }
  });

  it('troca assets pendentes por placeholders cinza apenas no preview local', () => {
    const row = emptyBriefingRow('plurix-pending-asset');
    Object.assign(row, {
      HEADER: '[PENDENTE MKT] HEADER 600 px: criar peça de teste.',
      COPY_1_PRETO: 'Conteúdo principal',
      COR_COPY_PRETO_1: '#242424',
      TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '18',
    });
    const result = renderDynamicEmail(PLURIX_UX_V2_TEMPLATE, row, { ...subscriber, SEQUENCIA: 'E-mail 3' });
    expect(result.diagnostics).toEqual([]);
    expect(result.html).toContain('background:#E5E7EB');
    expect(result.html).toContain('HEADER 600 px: criar peça de teste.');
    expect(result.html).not.toContain('src="[PENDENTE MKT]');
    expect(PLURIX_UX_V2_TEMPLATE).not.toContain('background:#E5E7EB');
  });

  it('oculta instruções de asset ainda não projetadas no modo e-mail', () => {
    const row = emptyBriefingRow('plurix-projected-preview');
    Object.assign(row, {
      HEADER: '[PENDENTE MKT] HEADER 600 px: criar peça de teste.',
      COPY_1_PRETO: 'Conteúdo principal',
      COR_COPY_PRETO_1: '#242424',
      TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '18',
    });
    const result = renderDynamicEmail(PLURIX_UX_V2_TEMPLATE, row, { ...subscriber, SEQUENCIA: 'E-mail 3' }, { pendingAssets: 'hidden' });
    expect(result.html).not.toContain('[PENDENTE MKT]');
    expect(result.html).not.toContain('background:#E5E7EB');
    expect(result.html).toContain('Conteúdo principal');
  });
});
