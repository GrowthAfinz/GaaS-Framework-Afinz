# Roadmap de implementação — Loop de aprendizado Growth

**Estratégia:** releases verticais pequenas; um monólito modular; primeira prova é fechar um loop real.

## Release 0 — contrato

Entregáveis:

- pacote de planejamento;
- ADRs;
- nota consolidada no vault;
- vocabulário e estados;
- modelo lógico de dados;
- critérios de aceite.

Gate: nenhuma contradição entre produto, UX, domínio, dados e Report Live.

## Release 1 — workspace e relocação

### Escopo

- modo `learning` em Relatórios;
- navegação `Fila | Apostas | Outcomes | Memória | Report Live`;
- query string/deep-link;
- separação do `ReportLiveCard`;
- operação no novo workspace;
- consumo na aba Relatórios.

### Não inclui

- migrations de feed/apostas;
- novo outcome;
- memória.

### Gate

Paridade funcional do Report Live e nenhum efeito externo acionado pela navegação.

## Release 2 — feed sistêmico read-only

**Estado em 22/09/2026:** implementada; schema publicado; integração na `main` depende do PR e do pipeline.

### Escopo

- `growth_feed_events`;
- produtores para candidatos e eventos do Report Live;
- três ordenações;
- filtros;
- registry de cards;
- agrupamento;
- drawers de evidência;
- badges internos.

Originação B2C permanece como frente visível sem eventos até existir um produtor governado; nenhum card é simulado para preencher a fila.

### Gate

Todos os cards mostram procedência e ação. Nenhum número nasce na prosa do feed.

## Release 3 — sinal para aposta

**Estado em 22/09/2026:** Release 3A implementada em branch; migration e teste PostgreSQL 17 aguardam PR. A interface de aceite e o workspace operacional permanecem na 3B.

### Escopo

- `growth_bets`;
- evidence snapshot;
- aceitar/rejeitar/mesclar sinal;
- hipótese, baseline, expectativa, janela e critério;
- time obrigatório, owner opcional;
- checklist, updates, comentários e histórico;
- feed de mudanças materiais.

### Gate

Uma recomendação vira aposta contratada em menos de um minuto, sem copiar manualmente filtros ou números.

### Corte 3A — contrato e persistência

- `growth_bets`, `growth_evidence_snapshots` e timeline append-only;
- RPC transacional `growth_accept_signal_as_bet`;
- snapshot imutável da crença, evidência, qualidade e regime;
- evento `bet_created` na mesma transação;
- leitura por `growth_bets_operational_v`;
- sem botão, drawer, checklist ou tela de Apostas.

### Corte 3B — interação e operação

- ação `Assumir aposta` no drawer da Fila;
- formulário pré-preenchido e validação do contrato;
- workspace Apostas, checklist, updates, comentários e histórico;
- rejeitar/mesclar sinal e mudanças materiais no feed.

## Release 4 — outcome

### Escopo

- extensão de `report_action_outcomes`;
- registro de execução;
- agenda de verificação;
- avaliador determinístico;
- confirmação/contestação;
- estados de missing, mudança de regime e execução divergente;
- feed de outcome.

### Gate

Aposta vencida aparece automaticamente e nenhum resultado é classificado como falha quando a execução não ocorreu.

## Release 5 — memória versionada

### Escopo

- `growth_learnings`;
- revisões;
- links;
- materialização automática de todo outcome resolvido;
- validade/revisão;
- estados confirmado/direcional/contraditório/inconclusivo/invalidado;
- busca/filtros;
- alteração via Supabase/LLM com histórico.

### Gate

Sucesso, fracasso e inconclusão produzem memória distinta, rastreável e vigente.

## Release 6 — reutilização

### Escopo

- recuperar memórias aplicáveis;
- exibir caso semelhante em sinal/aposta;
- registrar memória usada;
- detectar contradição e expiração;
- impedir aplicação silenciosa fora de escopo;
- taxa de reuso.

### Gate

Uma nova aposta cita aprendizado anterior e registra se o reutilizou ou descartou.

## Release 7 — integração transversal e editorial

### Escopo

- criar aposta a partir de Overview/Diário/Mensal/funis;
- exibir aposta relacionada nas telas de origem;
- projetar apostas/outcomes/aprendizados no Report Live;
- retrospectiva semanal/mensal;
- calibração inicial por tipo de sinal.

### Gate

O ciclo começa em uma tela analítica e termina em aprendizado reapresentado sem reconstrução manual de contexto.

## Ordem de grandeza

Para uma pessoa sênior com apoio de IA:

| Etapa | Estimativa orientativa |
|---|---:|
| R0 | 2–3 dias |
| R1 | 5–7 dias |
| R2 | 5–8 dias |
| R3 | 7–10 dias |
| R4 | 7–10 dias |
| R5 | 5–8 dias |
| R6 | 5–8 dias |
| R7 | 5–8 dias |

As estimativas são de sequenciamento, não promessa. Releases 1–5 compõem o primeiro produto operacional; 6–7 provam aprendizado reutilizado.

## Corte recomendado para o primeiro PR

Apenas Release 1:

- estrutura de navegação;
- URLs;
- split do Report Live;
- testes de paridade;
- nenhum schema novo.

Isso reduz risco e estabelece o lugar correto antes de adicionar domínio.
