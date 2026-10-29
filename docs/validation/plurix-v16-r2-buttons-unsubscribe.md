# Plurix V16 R2

Pedido: corrigir CTAs no Outlook, adicionar cancelamento de inscricao e usar supermercado antes da assinatura comercial.

Referencia: V16 R1, fonte MD5 c0afe49338e6816c835dba875853ffa8, regua Plurix V3 com 24 briefings lidos novamente da producao. Os quatro checks PNG do email 1 foram preservados.

## Mudancas

- As seis ramificacoes de CTA usam tabela de apresentacao, bgcolor e padding na celula. Os links continuam em anchors reais com RedirectTo(TreatAsContent(...)), com textos e destinos preservados. Nao ha href VML porque RedirectTo e tracking sao documentados para anchors HTML. No Outlook classico o arredondamento pode virar canto reto.
- O rodape preserva Gerenciar preferencias e adiciona o botao Cancelar inscricao com %%unsub_center_url%%. Nao implementa opt-out personalizado nem escrita em DE; o destino e o centro nativo configurado no SFMC.
- COPY_1_PRETO das 24 variantes passa a dizer do/no supermercado seguido de @NomeInvestida. A concordancia e com supermercado para todas as marcas.
- Compre Mais e Superpao exibem Amigao, inclusive assinatura visual BANNER_3_CORPO e seu link, conforme orientacao do usuario. As chaves internas COMPRE MAIS e SUPERPAO permanecem inalteradas. V15 historica preservada.

## Validacao

- 282 testes do modulo passaram.
- 72 comparacoes de desktop/mobile, 144 renderizacoes: 24 briefings em 1000, 390 e 320 px.
- Links dos CTAs e assets preservados, com excecao da adicao autorizada da assinatura Amigao nas oito variantes adquiridas e do botao de cancelamento.
- Sem overflow, imagens carregadas, celulas dos CTAs com padding e fundo azul, cancelamento presente uma vez.
- Fonte exportada igual a fixture e migration; dados sinteticos nos previews.
- Auditoria sem bloqueantes; TreatAsContent mantido apenas para briefing governado.

## Entrega SFMC

Pacote local em artifacts/plurix-v16-r2-2026-10-29 na raiz do projeto pai. Atualizar HTML do Content Builder, assunto, pre-cabecalho e CSV de briefing (24 linhas, 41 colunas, CRM). Nao importar o HTML de preview, que usa dados ficticios. Manter a audiencia e o estado da jornada.

Status: ready_for_test_send. GaaS/navegador nao certificam Outlook real. Conferir em novo Test Send o preenchimento dos CTAs, legibilidade, links rastreados, ambas as assinaturas adquiridas e a abertura do centro de cancelamento com contato de teste.

Fontes: https://developer.salesforce.com/docs/marketing/marketing-cloud-ampscript/references/mc-ampscript-http/mc-ampscript-reference-http-redirect-to.html e https://help.salesforce.com/s/articleView?id=mktg.mc_overview_headers_and_footers.htm&type=5
