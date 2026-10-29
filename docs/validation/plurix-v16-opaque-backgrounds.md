# V16: preencher fundos sem redesenhar a V15

Pedido de 29/10/2026: inspirar-se somente no preenchimento branco do prototipo, mantendo maxima semelhanca com a V15. Corpo permanece HTML.

## Escopo implementado

- V16 deriva da V15 R3; preparo CRM, nome da investida, links, imagens, CTAs, vigencia e campanha permanecem.
- Fundos de blocos e tabelas recebem explicitamente a cor solida herdada do contexto. Areas brancas recebem branco; paragrafos dentro de cards mantem o tom do card e nao recebem retangulos brancos.
- Nos 24 briefings da V3, somente COPY_2_PRETO tem alteracao de markup para materializar os fundos. Nenhum texto ou link foi reescrito.
- O template da V3 e dos 24 briefings passa a builtin-plurix-v16. V15 fica preservada e V16 nao vira principal global.
- Foreground selectors da V16 distinguem color de background-color, evitando que preencher um fundo branco selecione acidentalmente texto branco na regra de modo escuro.
- As regras de preview e export reconhecem V15/V16 como header em imagem; NomeInvestida continua resolvido por PRODUTO.

## Verificacao

- Fonte V15 auditada: MD5 f53a3890fc3e18dcd469e6d05d420b50.
- Fonte V16: MD5 c0afe49338e6816c835dba875853ffa8; 63583 caracteres.
- 280 testes do modulo, incluindo heranca de fundo, cores de cards, idempotencia, preparo CRM e personalizacao.
- 72 comparacoes controladas: 24 variacoes x larguras 720/390/320, total de 144 renderizacoes.
- Texto, destinos, assets e geometria identicos em todas as comparacoes.
- Os quatro PNGs Amigao mobile de V15 e V16 sao identicos pixel a pixel.
- Elementos-alvo visiveis com background transparente: 15 a 16 antes, zero depois. Wrapper da faixa colorida nao integra esse contador por herdar a cor da ramificacao AMPscript.
- Perfil CSS prefers-color-scheme dark dos quatro e-mails: corpo principal branco e texto rgb(36,36,36). Nao e emulacao do Outlook.
- Auditoria da fonte sem bloqueios; revisao de TreatAsContent permanece restrita ao conteudo governado.
- Simulacao da migration com rollback antes de aplicar; a primeira simulacao foi bloqueada por codificacao Windows no transporte SQL, corrigida para UTF-8 antes de persistir.

## Entrega

Pacote V16 contem HTML, TXT, assunto, pre-cabecalho com o guard V16 e CSV com os fragmentos preenchidos. Substituir HTML/pre-cabecalho no SFMC e importar o CSV dos 24 briefings para que a mudanca dos fragmentos tambem entre no envio.

Fundo explicito elimina dependencia de transparencia no HTML testado. Nao garante que Outlook deixe de recolorir a mensagem. Test Send real permanece pendente.

Migration aplicada: 20261029141052_plurix_v16_opaque_backgrounds.sql. Banco confirmou V16 versao 1, os 24 vinculos e nenhum campo de briefing alterado fora de COPY_2_PRETO. V15 preservada com o MD5 original.
