# Índice — Evolução editorial do Report Live

Ponto de entrada do pacote. Ordem de leitura recomendada:

1. [ADR-004-dimensao-canonica-e-faixa-historica.md](ADR-004-dimensao-canonica-e-faixa-historica.md) — a decisão: por que o relatório não tem memória, os quatro achados com dado real, a regra canônica de parceiro e o que se decidiu materializar. Ler primeiro.
2. [SDD_REPORT_LIVE_EVOLUCAO_EDITORIAL.md](SDD_REPORT_LIVE_EVOLUCAO_EDITORIAL.md) — a spec de implementação: três fases sequenciais com contrato de fronteira entre elas, SQL da fundação, critérios de aceite e guardrails.
3. [CODEX_PROMPT_fundacao_dados_report_live.md](CODEX_PROMPT_fundacao_dados_report_live.md) — prompt autocontido para execução da Fase 1, com passo 0 bloqueante de verificação da regra canônica contra o código do engine.

## As três fases

| Fase | Escopo | Estado |
|---|---|---|
| 1 — Fundação de dados | Coluna canônica de parceiro, view de série mensal com faixa de 6 meses, correção do grão de canais, marcador de semântica de funil | Prompt pronto |
| 2 — Camada editorial | 10 arquétipos de slide, régua de comparação, dois perfis (12 / 31 slides), compactação de 57 | Contrato de fronteira declarado no SDD; prompt a gerar quando a Fase 1 fechar |
| 3 — Loop de outcome | Janela e verificação de recomendação, etapa de fechamento no build, slide C7 de prestação de contas | Idem |

A Fase 3 não depende da Fase 2 — podem correr em paralelo depois da 1. O que não pode é qualquer uma começar antes.

## Depende de / relacionado

- `SPEC_REPORT_LIVE_AGOSTO_2026_CLAUDE_CODE.md` e `REPORT_LIVE_TAKEOVER_CODEX_2026-09-10.md` — a entrega que produziu o run certificado `9bb55892`, base de toda a reconciliação deste pacote.
- `SPEC_REPORT_LIVE_MODULAR_AUTOMATICO_V1.md` — spec modular anterior; este pacote não a substitui, trata da camada de apresentação e memória acima dela.
- Vault — `05-Estrategia/Report-Live-Arquitetura-Editorial.md` (detalhe editorial da Fase 2) · `09-Inteligencia-IA/Report-Live-Loop-de-Outcome.md` (detalhe da Fase 3) · `02-Entidades-Dados/Dimensao-Canonica-de-Parceiro.md` e `06-Performance/Serie-Historica-Aquisicao-Mar-Ago-2026.md` (evidência da Fase 1).
- Vault — `09-Inteligencia-IA/Report-Live-V2-Loop-de-Aprendizado-e-Memoria.md`: a direção conceitual de memória, que a Fase 3 **antecede** em vez de substituir.

## Estado

Proposto em 2026-09-13, aguardando revisão do Codex. Nenhum código de produção alterado. O motor determinístico, a certificação e o contrato de imutabilidade estão fora de escopo nas três fases.
