---
name: gaas-estrutura-crm-board
description: Conhecimento do quadro da aba Estrutura CRM do GaaS (Board campanhas, Consumo SFMC e Mapeamento de jornadas) - arquivos, tabelas, RPCs, regras de cálculo, padrão visual e navegação, como atualizar dados e como testar e publicar. Usar antes de mexer em qualquer parte dessa aba ou ao carregar envios, contrato ou regras de vínculo de jornadas.
metadata:
  version: 1.0.0
  origin: claude-code
  agents: [claude-code, codex]
  process: [Produto, Dados, Engenharia]
  owner: Time GaaS Afinz
  last_validated: '2026-11-11'
  packaged_at: '2026-11-11'
  license: Uso no projeto Afinz/GaaS; dados operacionais (contrato, envios, regras) ficam no Supabase e não integram o pacote.
---

# Estrutura CRM: o quadro do GaaS

A aba **Estrutura CRM** do Loop de Aprendizado tem um botão no lugar do título com dois modos:

1. **Board campanhas**: o portfólio de campanhas do CRM em pilares, colunas e cards editáveis (estilo Trello), com sinal observado dos disparos.
2. **Consumo SFMC**: contrato de consumíveis do SFMC contra o envio real, com a troca **Consumo | Mapeamento**.
   - **Consumo**: tabela pilar → frente do contrato → campanha, caixa por canal e gráfico mês a mês.
   - **Mapeamento**: todas as jornadas do SFMC no lugar onde contam, com arrastar para mudar o vínculo.

Leia esta skill inteira antes de mudar código, dados ou regras dessa aba.

## Mapa de arquivos

Tudo em `src/components/growth-learning/structure/`:

| Arquivo | Papel |
|---|---|
| `EstruturaCrm.tsx` | Troca Board / Consumo (preferência em localStorage) |
| `StructureWorkspace.tsx`, `StructureCardView.tsx`, `StructureDrawer.tsx` | Board campanhas |
| `structureModel.ts` (+ teste) | Sinal observado, métricas do card, filtros, lentes |
| `structureService.ts` | Leitura do board e RPCs `crm_structure_save_*` |
| `useBoardViewport.ts` | Pan (arrastar o fundo), zoom no cursor, rolagem, auto-pan ao arrastar perto da borda |
| `BoardNav.tsx` | Comum aos dois quadros: altura do canvas, enquadramento inicial, barra de zoom e minimapa |
| `ConsumoWorkspace.tsx` | Consumo SFMC (filtros, caixa de canais, gráfico, tabela, jornadas, gaveta de meta) |
| `JourneyMap.tsx` | Mapeamento de jornadas no canvas do quadro |
| `consumoModel.ts` (+ teste) | Contrato, dedup, vínculo, agregação, métricas e situação |
| `consumoService.ts` | Leitura do consumo e RPCs de meta e mapeamento |
| `structure.css` / `consumo.css` | Prefixos `cs-` (quadro) e `cz-` (consumo) |

Botão global de feedback: `src/components/feedback/FeedbackLauncher.tsx` ("Declarar melhoria", pílula embaixo no centro, atalho Ctrl+Shift+F). Ele não pode cobrir a barra de zoom (canto inferior direito do canvas) nem o minimapa (canto inferior esquerdo).

## Dados no Supabase

Board (`*_crm_structure_board.sql`): `crm_structure_pillars`, `crm_structure_lanes`, `crm_structure_cards`, `crm_structure_events` (histórico append-only). Escrita só pelas RPCs `crm_structure_save_pillar|lane|card(p_id, p_revision, p_body)`, com revisão otimista (`crm_structure_revision_conflict`) e checagem `gaas_vault_is_admin()`.

Consumo (`*_crm_consumo_sfmc.sql`, `*_sfmc_journey_map.sql`):

| Tabela | Grão | Observação |
|---|---|---|
| `sfmc_contract_plan` | frente × canal (EMAIL, WPPM, WPPU, SMS) × mês | O contrato. WhatsApp no app = Mkt + Utility |
| `sfmc_dispatch_daily` | canal (EMAIL, PUSH, WPP, SMS) × activity × dia × jornada | Envio e entregue vindos da Dinâmica BI |
| `sfmc_pillar_fronts` | frente → pilar | Frente sem pilar = "Fora do board" |
| `sfmc_consumo_rules` | regex por prioridade | Liga jornada a card ou a grupo "sem card", com a frente |
| `sfmc_journey_map` | nome exato da jornada | Vínculo manual do Mapeamento; passa na frente das regras |
| `sfmc_card_goals` | card × canal | Meta mensal de volume (RPC `sfmc_save_card_goal`) |

RPCs de leitura e escrita:
- `sfmc_consumo_dispatches(p_from)`: devolve envios compactos (índices de jornada e activity), uma linha por activity, dia e canal. Quando a mesma activity aparece em várias jornadas, fica a de maior volume (empate pela ordem do nome).
- `sfmc_save_journey_map(p_items)`: lote de até 500, `clear: true` volta para a regra.
- Tudo é leitura só para autenticados e escrita só por RPC de admin.

**Não usar `gaas_dinamica_bi_metrics`**: o Atualizador Inteligente parou de escrever nela por causa do limite de espaço do Supabase.

## Regras de cálculo (Consumo)

- Tudo em **envios**. Esperado = contrato do período (fração de dias de cada mês). Realizado = envio no período. Uso = realizado ÷ esperado.
- Ritmo 30d = envio dos 30 dias até o último dado. Projeção = tudo desde o início do contrato + ritmo/30 × dias até o fim. Saldo = contrato 12m − projeção. **Período muda esperado, realizado e uso; ritmo, projeção e saldo olham o contrato inteiro.**
- Situação:

| Condição | Situação |
|---|---|
| Sem contrato e com envio | Sem linha no contrato |
| Saldo negativo e uso acima de 115% | Vai estourar |
| Saldo negativo | Estoura no ritmo |
| Uso acima de 115% | Acima do ritmo |
| Uso abaixo de 60% | Sobrando |
| Caso contrário | No ritmo |

- Ordem do vínculo de cada jornada:
  1. vínculo manual (`sfmc_journey_map`);
  2. primeira regra que casa, por prioridade, testada contra o nome da jornada, ou a activity quando não há jornada;
  3. a regra coringa `.`, que manda para "A classificar".
- Card arquivado vira o grupo "Campanha arquivada".
- Cada frente tem um balde "sem campanha": o grupo que as regras já usam para ela, ou um "Sem campanha · frente" criado na hora.
- Campanha sem meta mostra quanto pesa no pilar. Com meta em `sfmc_card_goals`, ela ganha uso, saldo e situação próprios.

## Padrão visual e navegação

- Fundo papel `#f4f1ea` com pontilhado de 20px, só nos quadros. Objetos do quadro são arredondados: pilar com 14px e barra de 4px na cor dele, coluna/frente com 14px, card com 12px. A barra de cima, os filtros e as barras de ferramenta ficam retos.
- Cabeçalho de pilar: quadradinho com ícone na cor do pilar, título, contagem numa bolinha da mesma cor e barra de composição.
- Cores de canal iguais no app todo:

| Canal | Cor |
|---|---|
| E-mail | `#0e7490` |
| WhatsApp | `#16a34a` |
| SMS | `#6366f1` |
| Push | `#f59e0b` |

- Canal aparece sempre como **mix**: barra com o peso de cada canal e ícones. Nunca uma célula "Canal: X", porque jornada é multicanal.
- Card do Board: três métricas fixas por pilar (Aquisição = cartões, conversão e CAC; demais = base, abertura e cliques) e a janela explícita ("Últimos 90 dias", "Último ciclo" ou "A medir").
- Os dois quadros usam a mesma navegação: arrastar o fundo move, Ctrl+roda ou pinça dá zoom no cursor, roda rola, `+`/`-`/`0`/`M` no teclado, barra de zoom com "Ajustar" e minimapa. Chips, cards e botões levam `data-nopan`. Blocos com `data-mini` entram no minimapa. Ao arrastar perto da borda, o quadro anda sozinho.
- O app aplica `zoom` CSS global (0,67 a 1). Posição de menu e popover em `position: fixed` usa `toLocalRect` e `getLocalViewport` do `UIScaleContext`. Nunca use `clientX` cru.
- Textos sem travessão e em tom simples. A página abre tudo recolhido no Consumo. O Mapeamento ordena sempre do disparo mais recente para o mais antigo, dentro do período.

## Atualizar dados

**Envios.** Exportar a Dinâmica BI completa (CSV `;`, latin-1, blocos paralelos achados por âncora: WhatsApp, e-mail, SMS, performance e push). Depois:
1. Gerar inserts para `sfmc_dispatch_daily`, a partir do primeiro mês do contrato, uma linha por canal, activity, dia e jornada (`sent`, `delivered`), com `on conflict (channel, activity_name, dispatch_date, journey) do update`.
2. Gerar o SQL fora do repositório, em lotes de cerca de 3.000 linhas.
3. Rodar com `supabase db query --linked -f arquivo.sql`. Esse comando não aceita `--read-only`.

**Contrato.** Recarregar `sfmc_contract_plan` (delete + insert) a partir da planilha de projeção de consumíveis. Confira a soma por canal contra a linha de total, que já veio com frente faltando.

**Regras.** Editar `sfmc_consumo_rules` direto (prioridade menor ganha). O padrão precisa funcionar igual em JavaScript (`new RegExp(p, 'i')`) e em Postgres. Armadilhas já vistas:
- `ATIVACAO_VIBE` casava `REATIVACAO_VIBE`: use `(^|_)ATIVACAO_VIBE`.
- O mesmo produto aparece com tokens invertidos (`CP_AQS` e `AQS_CP`).
- `_car_` em activity é o produto cartão, não carrinho.

**Vínculo de uma jornada específica.** Use o Mapeamento na própria tela (arrastar ou "Mover para…", depois "Salvar mapeamento"). Para voltar ao padrão, use "Voltar para a regra".

## Testar

- Modelo: `npx vitest run src/components/growth-learning/structure/` (`structureModel.test.ts`, `consumoModel.test.ts`).
- SQL com PGlite: `npm run test:crm-structure-sql` (`scripts/test-crm-structure.mjs` e `scripts/test-crm-consumo.mjs`). Já está no workflow `validate`.
- Tela sem login: harness local fora do git (`harness/` no worktree, em `.git/info/exclude`) que troca `supabase.from` e `supabase.rpc` por fixtures exportadas do banco. Servir com vite numa porta própria. Para print em largura grande, usar o Chrome headless (`--headless=new --window-size=1700,1150 --screenshot=...`).
- `npm run build` antes de publicar. O `tsc` do projeto tem erros antigos fora desta pasta; filtre por `structure/`.

## Publicar

1. Branch a partir de `origin/main`, depois PR e o check `validate` verde. A main é protegida e o repositório não permite auto-merge.
2. Squash merge. O deploy no GitHub Pages roda sozinho.
3. Migration é só estrutura. Aplicar em produção e renomear o arquivo para a versão que o Supabase gravou.
4. O repositório é **público**: contrato, envios, regras com números, prints e planilhas nunca entram no git.
