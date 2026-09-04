export const BEM_BARATO_CRM_DYNAMIC_TEMPLATE_ID = 'bem-barato-crm-dynamic-v1';
export const BEM_BARATO_CRM_DYNAMIC_TEMPLATE_NAME = 'Bem Barato CRM - Régua dinâmica v1';

/**
 * Renderer único da régua Topo de Funil (CRM) do Bem Barato — cartão Bem Mais
 * Afinz Visa. Os 8 e-mails saem deste mesmo HTML: o contrato de 36 campos do
 * briefing carrega assunto, pré-cabeçalho, header, copies, CTAs, banners, nota
 * legal e rodapé; só as grades de benefício (fixas da marca) e a estrutura que
 * muda de verdade entre as sequências ficam no template.
 *
 * Fonte de verdade: `REGUA NOVA BEM BARATO.rtf` (8 HTMLs originais).
 *
 * Divergências deliberadas em relação aos originais, todas reportadas:
 * - Personalização normalizada. Os originais usavam três sintaxes inválidas
 *   para este motor (`%%FIRST_NAME%%`, `%%first_name%%`, `%%PRI_NOME%%`), que
 *   vazam texto literal; aqui é sempre `%%=v(@FirstName)=%%` dentro de
 *   `TreatAsContent`.
 * - Header não clicável. Cinco originais linkavam a arte de topo para
 *   `http://onelink.to/jztxbk`, mas o contrato de 36 campos não tem slot
 *   governado para o link do header — criar um link fixo no template seria
 *   tracking não governado.
 */

const AFINZ_LOGO = 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/160b947b-93b3-49f8-9537-84245584e143.png';

// Grade de benefícios do cartão no Bem Barato — 4 artes estáveis na régua.
const BB_A = 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/dd5bd72f-fba0-4ed0-a6a4-e9fa78758810.png';
const BB_B = 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/3f2ff739-5b6d-4484-ba6a-d552390794ba.png';
const BB_C = 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/63c27266-d881-4e29-b256-fb6c3a2348ed.png';
const BB_D = 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/87c5c98f-c6dd-47e1-8522-7e4f67172d1b.png';

// Grade de benefícios Vibe — 5 artes usadas em composições diferentes por sequência.
const VIBE_1 = 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ba613caa-444d-4954-acd0-1b151dada6ec.png';
const VIBE_2 = 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c392c8ff-b97f-4a86-8c56-df49ea5b2374.png';
const VIBE_3 = 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/82ec3fce-c040-4f7a-b450-e96b9f062489.png';
const VIBE_4 = 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b3063d8e-942f-497d-bd51-ad7754b5abe7.png';
const VIBE_5 = 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/2f1fef6e-62d6-491a-8df1-fbea4eac2046.png';

const SOCIAL = [
  ['https://www.instagram.com/afinzoficial/', 'b07a3e46-7c00-409b-81fe-c1b5eceebf64.png', 'Instagram da Afinz', 31],
  ['https://web.facebook.com/Afinz', '8f2daf4e-a386-471d-bc7b-aea7a6c8c416.png', 'Facebook da Afinz', 30],
  ['https://www.tiktok.com/@afinzoficial', '31227d6c-28bc-41b4-8b27-c64795765698.png', 'TikTok da Afinz', 30],
  ['https://afinz.com.br/blog/', 'f37dd205-17fa-47d9-a98a-4f538ef8d637.png', 'Blog da Afinz', 30],
  ['https://afinz.com.br/', 'ef14c352-0006-411d-b873-9b35c7dffde9.png', 'Site da Afinz', 31],
] as const;

const socialRow = SOCIAL.map(([href, file, alt, w]) =>
  `<td align="center" style="padding:0 5px"><a href="${href}" target="_blank"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/${file}" width="${w}" alt="${alt}" style="display:block;border:0"></a></td>`,
).join('');

const cell = (url: string, width: number, pad: string) =>
  `<td valign="top" align="center" style="width:${width}%;padding:${pad}"><img class="asset" src="${url}" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td>`;

/** Grade em linhas de N colunas, com as imagens já em largura fluida. */
const grid = (rows: string[][]) => `<tr><td class="pad" style="padding:0 25px 10px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${rows.map((row) => {
  const width = Math.floor(100 / row.length);
  return `<tr class="grid-row">${row.map((url, index) => cell(url, width, index === 0 ? '3px 3px 3px 0' : '3px 0 3px 3px')).join('')}</tr>`;
}).join('')}</table></td></tr>`;

const seqIs = (...sequences: number[]) => sequences.map((n) => `@Sequencia == "E-mail ${n}"`).join(' OR ');

// Blocos IF independentes e mutuamente exclusivos — ELSEIF é válido no SFMC mas
// não é interpretado pelo renderer de prévia do GaaS, e a fonte precisa ser a
// mesma nos dois ambientes.
// Cada condicional fica em sua própria linha: além de facilitar o diff, mantém a
// auditoria `\bIF\b[^\n]*\bTHEN\b` capaz de contar um IF por linha.
const variants = (entries: Array<{ sequences: number[]; rows: string[][] }>) => `\n${entries
  .map(({ sequences, rows }) => `%%[ IF ${seqIs(...sequences)} THEN ]%%${grid(rows)}%%[ ENDIF ]%%`)
  .join('\n')}\n`;

// Composição das grades por sequência, extraída um a um dos 8 HTMLs originais.
const BENEFIT_GRID = variants([
  { sequences: [1, 2, 3, 4], rows: [[BB_A, BB_B], [BB_C, BB_D]] },
  { sequences: [7], rows: [[BB_B, BB_C], [BB_D, BB_A]] },
  { sequences: [5], rows: [[BB_A, BB_C, BB_B]] },
  { sequences: [6], rows: [[BB_A, BB_D]] },
  { sequences: [8], rows: [[BB_C, BB_B]] },
]);

const VIBE_GRID = variants([
  { sequences: [1, 6], rows: [[VIBE_1, VIBE_2, VIBE_3]] },
  { sequences: [3], rows: [[VIBE_4, VIBE_5, VIBE_3]] },
  { sequences: [2], rows: [[VIBE_3, VIBE_2]] },
  { sequences: [4], rows: [[VIBE_4, VIBE_5]] },
  { sequences: [5, 7, 8], rows: [[VIBE_1, VIBE_2]] },
]);

const cta = (label: string, link: string) => `%%[ IF NOT EMPTY(${label}) AND NOT EMPTY(${link}) THEN ]%%
<tr><td class="pad" align="center" style="padding:0 30px 6px">
<table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr><td class="innertd buttonblock" bgcolor="#00C6CC" style="border-radius:5px;background-color:#00C6CC">
<a class="buttonstyles" href="%%=RedirectTo(TreatAsContent(${link}))=%%" target="_blank" style="font-size:18px;font-family:Tahoma,Geneva,sans-serif;color:#000000;text-align:center;text-decoration:none;display:block;background-color:#00C6CC;border:0;padding:11px 20px;border-radius:5px">%%=TreatAsContent(${label})=%%</a>
</td></tr></table></td></tr>
<tr><td align="center" style="padding:0 30px 18px"><span style="font-size:11px;font-family:Tahoma,Geneva,sans-serif;color:#000000">Sujeito à análise de crédito</span></td></tr>
%%[ ENDIF ]%%`;

const banner = (variable: string, link: string) => `%%[ IF NOT EMPTY(${variable}) THEN ]%%
<tr><td class="pad" align="center" style="padding:6px 25px 14px">
%%[ IF NOT EMPTY(${link}) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(${link}))=%%" target="_blank">%%[ ENDIF ]%%
<img class="asset" src="%%=v(${variable})=%%" width="550" alt="Vantagens do cartão Bem Mais Afinz Visa" style="display:block;width:100%;max-width:550px;height:auto;border:0">
%%[ IF NOT EMPTY(${link}) THEN ]%%</a>%%[ ENDIF ]%%
</td></tr>
%%[ ENDIF ]%%`;

export const BEM_BARATO_CRM_DYNAMIC_TEMPLATE = `%%[
SET @FirstName = [PRI_NOME]
SET @LimiteNovo = [LIMITE]
SET @Produto = [PRODUTO]
SET @Sequencia = [SEQUENCIA]
SET @TpCampanha = [TP_CAMPANHA]
SET @Today = NOW()
SET @BriefingRows = LookupOrderedRows("TB_BRIEFING_CAMPANHA_AQUISICAO",1,"DT_INICIO DESC","NM_PRODUTO_INTERNO",@Produto,"SEQUENCIA",@Sequencia,"TP_CAMPANHA",@TpCampanha)
SET @RowCount = RowCount(@BriefingRows)
IF @RowCount > 0 THEN
SET @Row = Row(@BriefingRows, 1)
SET @Assunto = Field(@Row, "ASSUNTO")
SET @PreCabecalho = Field(@Row, "PRE_CABECALHO")
SET @Header = Field(@Row, "HEADER")
SET @CartaoNmComercial = Field(@Row, "CARTAO_NM_COMERCIAL")
SET @TituloCopy1 = Field(@Row, "TITULO_COPY_1_AZUL")
SET @CorCopy1 = Field(@Row, "COR_COPY_1")
SET @TamanhoFonteTituloCopy1 = Field(@Row, "TAMANHO_DA_FONTE_TITULO_COPY_1")
SET @Copy1Preto = Field(@Row, "COPY_1_PRETO")
SET @CorCopyPreto1 = Field(@Row, "COR_COPY_PRETO_1")
SET @TamanhoFonteCopyPreto1 = Field(@Row, "TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1")
SET @TituloCTA1 = Field(@Row, "TITULO_CTA_1")
SET @LinkCTA1 = Field(@Row, "LINK_CTA_1")
SET @TituloCopy2 = Field(@Row, "TITULO_COPY_2")
SET @CorTituloCopy2 = Field(@Row, "COR_TITULO_COPY_2")
SET @TamanhoFonteTituloCopy2 = Field(@Row, "TAMANHO_DA_FONTE_TITULO_COPY_2")
SET @Copy2Preto = Field(@Row, "COPY_2_PRETO")
SET @CorCopy2 = Field(@Row, "COR_COPY_2")
SET @TamanhoFonteCopy2 = Field(@Row, "TAMANHO_DA_FONTE_COPY_2")
SET @TituloCTA2 = Field(@Row, "TITULO_CTA_2")
SET @LinkCTA2 = Field(@Row, "LINK_CTA_2")
SET @Banner1Corpo = Field(@Row, "BANNER_1_CORPO")
SET @LinkBanner1 = Field(@Row, "LINK_BANNER_1_CORPO")
SET @Banner2Corpo = Field(@Row, "BANNER_2_CORPO")
SET @LinkBanner2 = Field(@Row, "LINK_BANNER_2_CORPO")
SET @Banner3Corpo = Field(@Row, "BANNER_3_CORPO")
SET @LinkBanner3 = Field(@Row, "LINK_BANNER_3_CORPO")
SET @NotaLegal = Field(@Row, "NOTA_LEGAL")
SET @CorNotaLegal = Field(@Row, "COR_NOTA_LEGAL")
SET @TamanhoFonteNotaLegal = Field(@Row, "TAMANHO_DA_FONTE_NOTA_LEGAL")
SET @Rodape = Field(@Row, "RODAPE")
ELSE RaiseError("Dados de briefing da campanha não encontrados.", true)
ENDIF
]%%
<!doctype html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>%%=TreatAsContent(@Assunto)=%%</title>
<style>
@media only screen and (max-width:620px){
.shell{width:100%!important}
.pad{padding-left:18px!important;padding-right:18px!important}
.buttonstyles{display:block!important}
.body-copy{font-size:16px!important}
.asset{width:100%!important;height:auto!important}
.grid-row td{display:block!important;width:100%!important;padding:4px 0!important}
}
</style></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Tahoma,Geneva,sans-serif;color:#000000">
%%[ IF NOT EMPTY(@PreCabecalho) THEN ]%%<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">%%=TreatAsContent(@PreCabecalho)=%%&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>%%[ ENDIF ]%%
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:0">
<table role="presentation" class="shell" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background:#ffffff">

<tr><td align="center"><a href="https://afinz.com.br/" target="_blank"><img src="${AFINZ_LOGO}" width="600" alt="Afinz" style="display:block;width:100%;height:auto;border:0"></a></td></tr>

%%[ IF NOT EMPTY(@Header) THEN ]%%<tr><td><img class="asset" src="%%=v(@Header)=%%" width="600" alt="Cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td></tr>%%[ ENDIF ]%%

%%[ IF NOT EMPTY(@Copy1Preto) THEN ]%%<tr><td class="pad" align="center" style="padding:30px 30px 10px;text-align:center"><div class="body-copy" style="color:%%=v(@CorCopyPreto1)=%%;font-size:%%=v(@TamanhoFonteCopyPreto1)=%%px;font-family:Tahoma,Geneva,sans-serif;line-height:1.5">%%=TreatAsContent(@Copy1Preto)=%%</div></td></tr>%%[ ENDIF ]%%

%%[ IF ${seqIs(6, 8)} THEN ]%%
${cta('@TituloCTA1', '@LinkCTA1')}
%%[ ENDIF ]%%

%%[ IF NOT EMPTY(@TituloCopy1) THEN ]%%<tr><td class="pad" align="center" style="padding:15px 40px 20px;text-align:center"><div style="color:%%=v(@CorCopy1)=%%;font-size:%%=v(@TamanhoFonteTituloCopy1)=%%px;font-family:Tahoma,Geneva,sans-serif;font-weight:bold;line-height:1.3">%%=TreatAsContent(@TituloCopy1)=%%</div></td></tr>%%[ ENDIF ]%%
${BENEFIT_GRID}
%%[ IF ${seqIs(1, 2, 3, 4, 5, 7)} THEN ]%%
${cta('@TituloCTA1', '@LinkCTA1')}
%%[ ENDIF ]%%

%%[ IF NOT EMPTY(@TituloCopy2) OR NOT EMPTY(@Copy2Preto) THEN ]%%
<tr><td class="pad" align="center" style="padding:10px 30px 12px;text-align:center">
%%[ IF NOT EMPTY(@TituloCopy2) THEN ]%%<div style="color:%%=v(@CorTituloCopy2)=%%;font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px;font-family:Tahoma,Geneva,sans-serif;font-weight:bold;line-height:1.3;padding-bottom:8px">%%=TreatAsContent(@TituloCopy2)=%%</div>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%<div class="body-copy" style="color:%%=v(@CorCopy2)=%%;font-size:%%=v(@TamanhoFonteCopy2)=%%px;font-family:Tahoma,Geneva,sans-serif;line-height:1.5">%%=TreatAsContent(@Copy2Preto)=%%</div>%%[ ENDIF ]%%
</td></tr>
%%[ ENDIF ]%%
${VIBE_GRID}
%%[ IF ${seqIs(1, 2, 3, 5)} THEN ]%%
${cta('@TituloCTA1', '@LinkCTA1')}
%%[ ENDIF ]%%
${banner('@Banner1Corpo', '@LinkBanner1')}
${banner('@Banner2Corpo', '@LinkBanner2')}
${banner('@Banner3Corpo', '@LinkBanner3')}
${cta('@TituloCTA2', '@LinkCTA2')}

%%[ IF NOT EMPTY(@NotaLegal) THEN ]%%<tr><td class="pad" style="padding:18px 30px;color:%%=v(@CorNotaLegal)=%%;font-size:%%=v(@TamanhoFonteNotaLegal)=%%px;font-family:Tahoma,Geneva,sans-serif;line-height:1.45;text-align:justify">%%=TreatAsContent(@NotaLegal)=%%</td></tr>%%[ ENDIF ]%%

<tr><td align="center" style="padding:22px 20px 6px"><div style="color:#00c6cc;font-size:28px;font-family:Tahoma,Geneva,sans-serif;font-weight:bold">Afinz, juntos fazemos mais!</div></td></tr>
<tr><td align="center" style="padding:6px 30px 12px"><div style="color:#000000;font-size:11px;font-family:Tahoma,Geneva,sans-serif"><b>Curta a Afinz</b> nas redes sociais e fique por dentro de tudo que acontece por aqui</div></td></tr>
<tr><td align="center" style="padding:0 20px 16px"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>${socialRow}</tr></table></td></tr>
<tr><td align="center" style="padding:0 20px 18px"><a href="https://afinz.com.br/" target="_blank"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/787eb5c7-39ee-4b30-987a-0a81a38241a3.png" width="90" alt="Afinz" style="display:block;border:0"></a></td></tr>

<tr><td align="center" style="padding:14px 30px;background:#000000"><div style="color:#ffffff;font-size:12px;font-family:Tahoma,Geneva,sans-serif;line-height:1.55">Por favor, não responda esse e-mail.<br>Essa é uma mensagem automática e não conseguimos te atender por aqui.</div></td></tr>
<tr><td align="center" style="padding:10px 30px;background:#000000"><div style="color:#ffffff;font-size:12px;font-family:Tahoma,Geneva,sans-serif;line-height:1.55"><b>Canal de atendimento:</b><br><br><b>Ouvidoria</b><br>0800 772 0602</div></td></tr>
%%[ IF NOT EMPTY(@Rodape) THEN ]%%<tr><td align="center" style="padding:0 30px 10px;background:#000000"><div style="color:#d1d5db;font-size:11px;font-family:Tahoma,Geneva,sans-serif;line-height:1.45">%%=TreatAsContent(@Rodape)=%%</div></td></tr>%%[ ENDIF ]%%
<tr><td align="center" style="padding:15px 30px;background:#000000"><div style="color:#ffffff;font-size:12px;font-family:Tahoma,Geneva,sans-serif;line-height:1.55">Enviado por <b>Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74 | Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00</b><br>Rua XV de novembro, 45 - Sorocaba, SP</div></td></tr>

</table></td></tr></table></body></html>`;
