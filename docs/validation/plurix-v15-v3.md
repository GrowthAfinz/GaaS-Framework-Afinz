# Plurix V15 e V3 CRM

Publicado no banco em 28/10/2026 pela migration `20261028151825_dynamic_email_plurix_v15_v3.sql`.

- Template: `builtin-plurix-v15`, versao 1, ativo e nao principal global.
- Fonte exibida/exportada/persistida: MD5 `5df0e2d7a883963d45cd2cb36290826f`, 45442 caracteres.
- Regua: `V3 TOPO DE FUNIL DINÂMICO`, id `0fe0269c-b917-4500-a9f2-32613c91dc54`.
- Fonte: V2 `d2d20000-0000-4000-8000-000000000001`; fingerprint dos 24 briefings preservado: `8e96eb655888910a90eedcfaf0e94b1a`.
- Quatro e-mails, seis bandeiras, 24 briefings em draft. Semana 1: E1/E2. Semana 2: E3/E4.
- `TP_CAMPANHA=CRM`; inicio 28/10/2026 00:00; fim 30/11/2026 23:59.
- Novos IDs e grupos; sem herdar confirmacao de jornada ou Activity Names de envios antigos.

## Comportamento

O preparo deriva do HTML operacional CRM fornecido pelo usuario: audiencia `TB_CAMPANHA_AQUISICAO`, estado `ESTADO_SEQUENCIA_CRM`, briefing `TB_BRIEFING_CAMPANHA_AQUISICAO`. Preserva cardinalidade, vigencia, mapeamento de rede, sequencias 1 a 8, nome e limite numerico. Estado ausente usa E-mail 1; nao escreve em DE e nao consulta pool.

O header inteiro vem de `HEADER`, obrigatorio em HTTPS. `HEADER_TITULO` e `HEADER_SUBTITULO` sao equivalentes acessiveis na imagem; nao ativam o antigo header HTML no preview. A faixa superior duplicada de +amigo foi removida. Avenida conserva `HEADER_LOGO` como assinatura abaixo da arte, pois as quatro imagens aprovadas nao incorporam seu logo.

O corpo, mensagens de limite, links, CTAs e legal foram copiados sem edicao. Somente header, campanha, vigencia e metadados de nova regua mudam nos dados. A consulta posterior comparou 24 linhas com a origem e encontrou zero alteracoes de conteudo fora desses campos.

## Validacao

- Simulacao transacional completa com rollback antes da aplicacao.
- 271 testes do modulo, incluindo 32 combinacoes de sequencia/limite/logo para a V15.
- 96 renders Chromium: 24 briefings em 720/390/320 px com limite e em 390 px sem limite; sem overflow, imagens quebradas ou distorcao da arte.
- PNGs Amigao E1 a E4 e Avenida E1 para revisao; fonte de assinante ficticia.
- Auditoria AMPscript sem bloqueios; revisao de TreatAsContent herdado, restrito aos campos governados.
- Typecheck de release sem novos erros; build local concluido.
- CSV de 24 linhas em CRM, datas SFMC, HTML, assunto e preheader entregues em `artifacts/plurix-v15-v3-2026-10-28` na raiz ACALENDARIO APP.

## Limites

Status editorial: draft. GaaS e testes locais nao certificam SFMC. Nao houve alteracao de jornada ou DE no SFMC. Test Send em Outlook/iPhone continua pendente; o header rasterizado nao garante tema claro para o corpo inteiro.
