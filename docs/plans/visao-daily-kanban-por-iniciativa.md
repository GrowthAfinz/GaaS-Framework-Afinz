# Visão Daily: calendário mais legível, modo Resultados e kanban por iniciativa

Spec no padrão de [[Como-Trabalhar-SDD-no-GaaS]]. Implementada em 16/11/2026. Conferida contra `origin/main` em 16/11/2026
(commit `0b18200`) e contra o banco de produção na mesma data. Substitui o pedido original em texto
livre por um recorte em fases, cada uma entregável e verificável sozinha.

## 1. Problema e evidência

A Visão Daily (Planejamento > Operação, `?view=operacao&section=daily`) virou a tela de abertura do
GaaS e o lugar onde o time conta o que andou em cada projeto. Quatro atritos aparecem no uso:

1. **Destaque impreciso.** Passar o mouse num tópico da lista destaca o projeto no mês inteiro.
   Quando a conversa da daily é sobre um dia, o calendário acende vários.
2. **Barra contínua esconde o nome.** Projeto que aparece em dias seguidos vira uma barra única e
   o nome só sai no primeiro dia (`DailyCalendar.tsx`, `{!cl && <span>…}`). Em 10/11 e 11/11, por
   exemplo, o segundo dia mostra só uma faixa colorida sem texto.
3. **Número do dia mistura duas perguntas.** O alternador "Emissões B2C | Cartões CRM" troca só o
   número do canto, mas a tela continua cheia de tópicos. Quem quer ler resultado não precisa dos
   tópicos, e quem está na daily não precisa do número.
4. **Daily e Tarefas não conversam.** O registro diz o que andou, mas responsável formal, prazo e
   o restante do trabalho da frente ficam em Tarefas e atividades, numa tela separada.

## 2. O que já existe e muda o desenho

| Achado | Onde | Consequência |
|---|---|---|
| `daily_projects.initiative_id` já aponta para `growth_work_initiatives` | migration `20261112131506_daily_view` | A ponte projeto → iniciativa existe. O kanban de um tópico é o kanban da iniciativa do projeto. |
| Seguro Mulher, Celular, Residencial e "Seguros: bases e mídia" já ligados a **Cross-sell de seguros** | banco | Kanban de Seguros sai pronto. |
| Pool de Ofertas Visa e Pool Black Visa ligados a **Pool de Ofertas Vai de Visa** | banco | Kanban do Pool Visa sai pronto. |
| **Pool Parceiros (Star, Sipolatti)** sem iniciativa | banco | Criar a iniciativa "Pool de Ofertas Parceiros" em Rentabilização, com nota canônica [[Iniciativa-Pool-de-Ofertas-Parceiros]]. |
| Nenhum projeto de Aquisição ligado; **Evolução das jornadas de aquisição** tem 1 trabalho | banco | O kanban de Aquisição nasce quase vazio. Decidir se a iniciativa vira "Aquisição CRM" e recebe os projetos da frente. |
| Trabalho tem `status` (A planejar, Em planejamento, Pronta, Em execução, Bloqueada, Concluída, Cancelada), `owner_label`, `due_date`, `next_action`, `initiative_id` | `growth_development_tasks` | São as colunas e os campos do card. Nada novo a inventar. |
| Leitura e escrita de Tarefas exigem **admin** (`gaas_vault_is_admin`); a Daily aceita **membro aprovado** | RLS das duas migrations | Para quem não é admin o kanban apareceria vazio. Precisa de decisão (seção 6). |
| `gaas_daily_crm_cards` soma `activities` por `parceiro_canonico` e dia do disparo | banco | Em nov/26 há cartões de Plurix, Proprietária, Bem Barato e Serasa; Dia aparece zerado e Super Nosso ainda não aparece. |
| Registro da daily não tem prazo nem detalhe estruturado | `daily_entries` | Prazo e responsável formal vêm do trabalho ligado, não do registro. |

Princípio mantido da decisão de 12/11: **na Daily o projeto é a unidade e não existe check de
conclusão.** O status mora no trabalho de Tarefas. A Daily só mostra e liga.

## 3. Entregas em fases

### Fase 1: calendário legível e modo Resultados (só front, sem migration)

**1a. Destaque de um dia só.** Clicar num tópico (chip do dia recolhido ou chip de projeto da
linha) fixa o destaque na célula daquele dia × projeto, com anel na cor da frente e o resto do mês
esmaecido. Clicar de novo, clicar fora ou Esc limpa. O hover continua destacando o projeto no mês
inteiro, porque é útil para ver recorrência; o clique é a leitura "deste dia".

Critério: com Seguro Mulher em 10, 13, 16 e 20/11, clicar no chip de 13/11 deixa aceso só o 13.

**1b. Cada dia com o próprio rótulo.** A barra de cada dia sempre mostra o nome do projeto
(com reticências se faltar espaço). A continuidade entre dias vira um detalhe discreto: cantos
retos e um conector fino de 2px na borda, sem o texto atravessar a célula. O empacotamento por
linha (`packWeek`) continua, para o mesmo projeto ficar na mesma altura ao longo da semana.

Critério: em 10/11 e 11/11, os dois dias exibem "Pool Parceiros (Star…" legível.

**1c. Alternador "Visualização: Tópicos | Resultados".** Substitui "Número do dia".
- **Tópicos:** barras de projeto, sem número de resultado no canto.
- **Resultados:** sem barras. Cada dia mostra uma pilha compacta, nesta ordem:
  CRM Plurix, CRM Dia, CRM Bem Barato, CRM B2C (Proprietária + Serasa), e **Total B2C** em
  destaque (emissões de `b2c_daily_metrics`, tipo total). Linha zerada some; dia sem dado mostra
  "sem dado", não zero. Rodapé do calendário com o total do mês por linha.
- Total B2C já **contém** o CRM B2C. A tela não soma as linhas para fazer um total geral, e o
  tooltip explica isso. O "total de todas as unidades de aquisição" fica para quando Plurix e
  B2B2C tiverem fonte própria de emissão.
- CRM conta pelo dia do disparo (regra atual), dito na legenda.
- A configuração das linhas sai de `daily_partners.crm_key`, então incluir Super Nosso depois é
  cadastro, não código.

**1d. Projetos do mês por último registro, mais antigo em cima.** A lista à esquerda ordena por
data do último registro crescente; empate por nome. Cada item ganha "parado há N dias úteis"
quando passar de 3, para a daily começar pelo que esfriou.

### Fase 2: modal do tópico (só leitura do que já existe)

Clicar numa barra do calendário (modo Tópicos) abre um modal claro e compacto do **dia**:
- Cabeçalho: dia da semana e data, total de projetos, número de resultado do dia em uma linha.
- O projeto clicado vem primeiro e aberto; os demais do dia ficam em linhas recolhidas.
- Por registro: texto, responsável (avatar e nome), tags e, quando houver trabalho ligado
  (Fase 3), status e prazo do trabalho.
- Ações: "Abrir kanban da frente", "Abrir projeto" (drawer atual), setas para dia anterior e
  seguinte, Esc fecha.
- Visual: fundo branco, sombra suave, tipografia do app, largura ~560px, nada de scroll
  horizontal. Segue o light mode do GaaS.

### Fase 3: kanban por iniciativa, ligado à Daily (migration)

**Banco**
- `daily_entries.work_ids uuid[] default '{}'`: um registro pode citar zero ou mais trabalhos.
  Salvo pelo `gaas_daily_save_entry` existente, que passa a validar que os ids existem.
- Iniciativa nova "Pool de Ofertas Parceiros" (Rentabilização) e ligação do projeto Pool Parceiros.
- Função de leitura `gaas_daily_initiative_board(p_initiative uuid)` que devolve os trabalhos da
  iniciativa com os campos do card e, para cada um, a última menção na Daily (dia e texto).

**Tela**
- Modal "Kanban · <iniciativa>" aberto pelo modal do dia ou pelo drawer do projeto.
- Colunas = status do trabalho: A planejar, Em planejamento, Pronta, Em execução, Bloqueada,
  Concluída (Cancelada recolhida). Fases da iniciativa (Contexto → Aprendizado) aparecem como
  trilha no topo, não como colunas, porque são da iniciativa e não do trabalho.
- O card ligado ao registro de origem vem destacado e rolado para a vista.
- Card: título, responsável, prazo (vermelho se vencido), próxima ação, contador de menções
  na Daily e data da última.
- Arrastar card entre colunas salva o status pelo `growth_save_development_task` (regras de
  critério, bloqueio e evidência continuam valendo; erro aparece com a mensagem de `taskError`).
- Abas no topo para trocar entre os quatro boards: **Seguros**, **Aquisição**, **Pool Visa**,
  **Pool Parceiros**.
- "Abrir em Tarefas e atividades" leva à iniciativa na tela completa.

**Na Daily**
- No registro, botão "Ligar a trabalho" com busca nos trabalhos da iniciativa do projeto.
- "Criar trabalho a partir deste registro": título vem do texto, iniciativa do projeto,
  responsável do registro; o registro já fica ligado.

## 4. Ideias escolhidas pelo Pablo (16/11/2026)

Das seis ideias propostas, entraram três:

1. **Projeto parado.** Projeto com trabalho Em execução e sem registro na Daily há 5 dias úteis
   ganha o selo "parado há N dias úteis" na lista do mês e no modal do dia. Trabalho citado por
   registros vale só para os projetos que o citaram; trabalho nunca citado vale para todos os
   projetos da iniciativa. Projeto sem registro nos últimos 90 dias é dormente, não parado.
2. **Comparação com o mesmo dia da semana.** No modo Resultados, cada linha compara o dia com a
   média do mesmo dia da semana nas 4 semanas anteriores (só semanas com dado). Marca ▲/▼ a partir
   de 15%, ignora média abaixo de 5, não compara o dia de hoje (parcial) e não compara CRM dos
   últimos 7 dias (cartões ainda entrando pelo dia do disparo).
3. **Disparos CRM do dia ao lado dos registros.** O modal do dia lista os disparos (`activities`)
   daquele dia com parceiro, jornada, canal, base acionável e cartões; os parceiros do projeto
   clicado vêm primeiro.

Ficaram de fora: rascunho automático ao mudar status, prazos no calendário e ponto de disparo na barra.

## 5. Fora deste recorte

Status de conclusão na Daily; edição completa do trabalho dentro do modal (continua em Tarefas,
inclusive concluir, que exige critérios e evidência); total de emissões de todas as BUs;
notificações na Fila geradas pelo kanban.

## 6. Decisões tomadas (16/11/2026)

| Decisão | Resposta do Pablo | Como ficou |
|---|---|---|
| Quem vê e mexe no kanban | Todos | Membro aprovado lê trabalhos e iniciativas e salva trabalho (`growth_save_development_task` aceita membro). Editar iniciativa continua admin. |
| Iniciativa de Aquisição | Pode renomear | "Evolução das jornadas de aquisição" virou "Aquisição CRM" (id e histórico preservados, nome antigo em `aliases`) e recebeu os projetos de Aquisição e Meio de funil. |
| Serasa no CRM B2C | Depende do contexto | Linha própria "CRM Serasa": como canal (marketplace por API) é lido à parte. Só se lê junto do B2C em contextos como carrinho abandonado, que respinga do funil. |
| Registro cita vários trabalhos | Sim | `daily_entries.work_ids uuid[]`. |

Projetos de Rentabilização fora dos pools (Recência Plurix, Parcelamento, Ativação, Copa) e os de
Operação continuam sem iniciativa: o kanban deles aparece quando forem ligados na página do projeto.

## 7. Verificação

- `dailyModel.test.ts`: ordenação 1d, empacotamento com rótulo por dia 1b, agregação de
  resultados 1c (linhas por `crm_key`, dia sem dado, não somar Total B2C com CRM B2C).
- Harness local com Supabase mockado para print das três
  visualizações, modal e kanban; produção conferida no Chrome do Pablo depois do deploy.
- Migration da Fase 3 com teste SQL de permissão (membro aprovado lê, anônimo não lê, id de
  trabalho inexistente rejeitado).
- Publicação por PR com check `validate` verde. As fases saíram juntas num PR só, a pedido do Pablo.
- Migration aplicada em produção em 16/11/2026 como `20261116215530_daily_kanban`.
