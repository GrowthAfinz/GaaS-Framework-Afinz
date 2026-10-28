# V15 revisao 2: superficies claras explicitas

Pedido: manter a apresentacao clara da V15 no celular e publicar na main.

## Mudanca

A revisao 1 deixava diversas celulas transparentes, herdando branco da shell. A revisao 2 aplica fundo, atributo bgcolor e classe de superficie em body, table e td. As cores ja declaradas, inclusive faixas e CTAs azuis, permanecem.

Os gradientes usam tambem a propriedade shorthand background, evitando depender somente de background-image inline. As duas aparencias declaradas nos metadados recebem a mesma paleta clara via prefers-color-scheme. Os seletores Outlook cobrem tanto atributos no ancestral quanto no proprio elemento, com classes estaveis para cores dinamicas.

Preparo CRM identico por bytes ao da revisao 1. Todos os destinos href/src identicos. Sem alteracao de briefing, vigencia, campanha CRM, audiencias, jornada, DE, oferta ou personalizacao.

## Evidencia

- Template `builtin-plurix-v15`, revisao 2; MD5 `0e0e640d1f2e2496764744640a14aa0a`, 60346 caracteres.
- Revisao anterior: MD5 `5df0e2d7a883963d45cd2cb36290826f`.
- 272 testes do modulo; auditoria de fonte sem bloqueios. TreatAsContent permanece limitado aos campos governados.
- 96 renders claros e 96 com recoloracao simulada, remocao de gradientes inline e text-fill; 24 briefings, tres larguras e estados de limite.
- Todas as shells ficaram brancas e as copys principais em rgb(36,36,36) na simulacao. Sem overflow ou imagens quebradas.
- Os testes preservam preparo, links e imagens, alem das combinacoes de sequencia/limite/logo.
- Fingerprint V3 antes da revisao: `175e38392f17120ecfcfde145d1d233b` (24 linhas).

## Limite da validacao

A simulacao nao reproduz o mecanismo interno do Outlook nem prova que todas as versoes respeitam os seletores. Nao foi introduzida uma imagem de fundo branco com texto potencialmente recolorido sobre ela, nem rasterizado o corpo personalizado.

Status: candidata para novo Test Send. O deploy do GaaS nao altera HTML ja salvo no Content Builder e nao muda e-mails recebidos. Substituir o HTML pela revisao 2, manter o assunto/preheader do envelope e gerar novo envio de teste no Outlook do usuario.

Referencias consultadas em 28/10/2026:

- https://www.litmus.com/blog/coding-emails-for-dark-mode
- https://www.caniemail.com/features/css-linear-gradient/

Migration aplicada: 20261028202657_plurix_v15_light_surfaces.sql. Banco confirmou revisao 2 e MD5 acima; fingerprint dos 24 briefings V3 permaneceu identico. Typecheck sem erros novos e build local passaram.
