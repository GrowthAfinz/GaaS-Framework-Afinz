# Loop de aprendizado Growth — índice do planejamento

**Data:** 2026-09-22
**Status:** Release 2 implementada e schema publicado; apostas, outcomes novos e memória continuam fora do corte
**Produto:** GaaS Afinz
**Workspace:** `Relatórios > Aprendizado Growth`
**Output editorial:** Report Live

## Decisão central

O **Loop de aprendizado Growth** é a capacidade operacional que transforma sinais de CRM Aquisição, Mídia Paga e Originação B2C em apostas acompanháveis, outcomes verificáveis e memória reutilizável.

O **Report Live** preserva o nome e continua sendo a visualização editorial. Seus controles de geração, certificação e publicação deixam a área de downloads e passam para `Aprendizado Growth > Report Live`.

```text
Sinal → Interpretação → Aposta → Execução → Outcome → Aprendizado → Reutilização
```

## Ordem de leitura

1. [PRODUCT_SPEC_LOOP_APRENDIZADO_GROWTH.md](PRODUCT_SPEC_LOOP_APRENDIZADO_GROWTH.md) — objetivo, público, escopo, métricas e não objetivos.
2. [RESEARCH_LEARNING_LOOP_REFERENCES.md](RESEARCH_LEARNING_LOOP_REFERENCES.md) — referências e modelo composto adotado.
3. [UX_SPEC_GROWTH_FEED.md](UX_SPEC_GROWTH_FEED.md) — feed sistêmico e cinco áreas de trabalho.
4. [DOMAIN_MODEL_GROWTH_LEARNING.md](DOMAIN_MODEL_GROWTH_LEARNING.md) — objetos, estados e transições.
5. [DATA_MODEL_GROWTH_LEARNING.md](DATA_MODEL_GROWTH_LEARNING.md) — persistência planejada e relação com estruturas existentes.
6. [SDD_GROWTH_LEARNING_WORKSPACE.md](SDD_GROWTH_LEARNING_WORKSPACE.md) — arquitetura técnica e divisão de responsabilidades.
7. [REPORT_LIVE_RELOCATION_PLAN.md](REPORT_LIVE_RELOCATION_PLAN.md) — separação entre consumo e operação do Report Live.
8. [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) — releases verticais e dependências.
9. [ACCEPTANCE_AND_TEST_PLAN.md](ACCEPTANCE_AND_TEST_PLAN.md) — critérios verificáveis de aceite.
10. ADRs — decisões estruturais que não devem ser reabertas incidentalmente.
11. [RELEASE_1_IMPLEMENTATION.md](RELEASE_1_IMPLEMENTATION.md) — implementação e evidências da fundação de navegação.
12. [RELEASE_2_IMPLEMENTATION.md](RELEASE_2_IMPLEMENTATION.md) — feed sistêmico read-only, produtores, segurança e evidências de publicação.

## Decisões confirmadas com o product owner

- Nome do produto/capacidade: **Loop de aprendizado Growth**.
- Nome do submenu: **Aprendizado Growth**.
- A visualização editorial continua se chamando **Report Live**.
- Frentes iniciais: CRM Aquisição, Mídia Paga e Originação B2C.
- A Fila é um feed operacional e a entrada padrão do workspace.
- Apenas o sistema publica no feed.
- Ordenações: prioridade, recentes e relevância.
- O feed não possui curtidas, reações, comentários ou posts manuais na primeira versão.
- Apostas podem existir sem owner individual.
- Apostas possuem checklist, comentários internos, atualizações e histórico.
- O sistema calcula o outcome; o usuário pode confirmar ou contestar o veredito.
- Todo outcome materializa memória, inclusive fracasso, inconclusão ou premissa inválida.
- Toda memória possui vigência ou data obrigatória de revisão.
- Alterações de memória poderão ser feitas via LLM/Supabase e precisam manter revisões.
- Notificações ficam somente dentro do GaaS.
- Segurança e nova arquitetura de permissões não são uma frente deste plano.

## Norte de implementação

O primeiro marco de valor não é uma tela completa. É um loop vertical real:

```text
post sistêmico no feed
→ aposta assumida
→ execução registrada
→ outcome calculado
→ veredito revisado
→ aprendizado persistido
→ aprendizado reapresentado em um novo sinal compatível
```

Nenhuma sofisticação de IA, busca vetorial ou automação externa antecede essa prova.
