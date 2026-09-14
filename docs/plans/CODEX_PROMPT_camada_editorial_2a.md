# Prompt para Codex — Camada editorial do Report Live (Fase 2a)

Cole este arquivo inteiro. **Começa com um passo 0 bloqueante que pode mudar todo o plano.** Se ele indicar que o caminho proposto é inviável ou mais arriscado do que parece, pare e me diga antes de codar — foi o que pegou os três problemas reais da Fase 1.

## Onde você está

**Raiz de trabalho:** `calendar-estrategico/`. Existem duas pastas `supabase` no projeto; a sua é `calendar-estrategico/supabase/`.

**Estado atual:** a Fase 1 está concluída e em produção. `report-sync` v45 ativa, colunas canônicas e `v_aquisicao_mensal_canonico` aplicadas, baseline v44 recuperada no repo. A fundação de dados existe; **nada dela chegou no deck ainda** — o PDF continua com 57 páginas no formato antigo. É isso que esta fase muda.

**Pacote em `docs/plans/`:** `SDD_REPORT_LIVE_EVOLUCAO_INDEX.md` · `ADR-004-dimensao-canonica-e-faixa-historica.md` · `SDD_REPORT_LIVE_EVOLUCAO_EDITORIAL.md` · este prompt.

**Detalhe editorial completo:** `../Afinz-CRM-Midia-Vault/05-Estrategia/Report-Live-Arquitetura-Editorial.md` — os 10 arquétipos, os dois perfis e o critério de permanência. Leia antes de começar.

**A Fase 2 é grande, então vai fatiada.** Você está na 2a:

| Fatia | Escopo |
|---|---|
| **2a — você, agora** | A régua como componente de renderer + os 3 arquétipos que dependem diretamente da faixa: série temporal (05), scorecard (04), funil (07) |
| 2b | Leitura executiva (02), router decisório (08), campanhas decodificadas (09), breakdown por dimensão (06) |
| 2c | Perfis executivo/deep dive, compactação 57→31, capa (01), quality gate como faixa (03), fila de ação (10) |

Não inicie 2b nem 2c nesta rodada.

## Passo 0 — Inventariar o renderer antes de tocar nele (BLOQUEANTE)

Antes de escrever qualquer código, leia como os slides são definidos e renderizados hoje na v45 e **me reporte**:

1. Como o blueprint descreve um slide (estrutura, de onde vêm título, tabela, gráfico e o bloco de leitura da direita).
2. Onde vive a política de gráfico — a Enciclopédia cita `_shared/report-live-chart-policy.ts`. Confirme o papel real dela.
3. **Se é possível introduzir um novo tipo de elemento visual (a régua: valor + delta + série + faixa) sem reescrever o renderer**, e se ele consegue desenhar uma linha de verdade no Google Slides, ou se depende de gráfico vinculado ao Sheets.
4. Se o blueprint suporta dois perfis derivados do mesmo artefato certificado, ou se isso exige mudança estrutural (informação que a 2c vai precisar).

Se o item 3 mostrar que a régua exige reescrita grande do renderer, **pare e me diga** — o plano muda para uma abordagem por Sheets, e é melhor decidir isso antes de escrever código.

## Contrato da view — nomes reais, já verificados

`v_aquisicao_mensal_canonico`, grão mês × parceiro canônico. Não invente nomes; estes são os que existem:

**Fatos:** `mes` · `parceiro` · `disparos` · `base_acionavel` · `propostas` · `aprovados` · `cartoes` · `custo`
**Taxas:** `cac` · `tx_finalizacao` · `tx_aprovacao` · `tx_proposta`
**Faixa de 6 meses anteriores:** `<metrica>_min_6m` / `<metrica>_max_6m` para disparos, base_acionavel, propostas, aprovados, cartoes, custo e cac; e `tx_final_min_6m` / `tx_final_max_6m`, `tx_aprovacao_min_6m` / `_max_6m`, `tx_proposta_min_6m` / `_max_6m`
**Qualidade da faixa:** `meses_observados` · `cac_meses_validos_6m` · `tx_final_meses_validos_6m` · `tx_aprovacao_meses_validos_6m` · `tx_proposta_meses_validos_6m` · `denominador_minimo_faixa_taxa`
**Cobertura:** `mes_fechado` · `dias_cobertos` · `ultima_data_observada`
**Semântica:** `funil_semantica` · `funil_nao_padrao_no_mes` · `funil_nao_padrao_persistente` · `funil_semantica_meses_observados`
**Regime:** `regime_serie` · `corte_regime` · `limitacao_medicao`

## Passo 1 — A régua, como componente

Elemento reutilizável com quatro partes: **valor atual · delta contra o período equivalente · série de 6 meses · faixa como fundo**. É o que todos os arquétipos desta fatia consomem.

Cinco regras de leitura, todas não negociáveis:

1. **Só mês fechado entra na série e no veredito.** `mes_fechado = false` pode aparecer como ponto marcado, nunca como base de comparação. Setembro está aberto agora (`dias_cobertos` parcial) — é o caso de teste.
2. **Veredito exige amostra.** Use o `<metrica>_meses_validos_6m` da métrica em questão: abaixo de 4, mostre a série e **retenha o veredito** com o rótulo `amostra_insuficiente`. Não invente limiar próprio; o denominador mínimo já está em `denominador_minimo_faixa_taxa`.
3. **A faixa não atravessa regime.** Quando `regime_serie` muda dentro da janela, a comparação é inválida: mostre o corte (`corte_regime`) e o texto de `limitacao_medicao` em vez de um veredito. A Serasa é o caso vivo — `serasa_pos_2026_02`.
4. **Taxa varia em pontos percentuais**, volume em percentual. Nunca misture.
5. **Veredito é calculado, nunca escrito por IA:** `dentro_da_faixa` · `acima_da_faixa` · `abaixo_da_faixa` · `amostra_insuficiente` · `regime_incomparavel`.

## Passo 2 — Arquétipo 05: série temporal / pacing

Hoje o slide rotulado `time series pacing` é renderizado como tabela de datas. Vira **linha acumulada com o período equivalente sobreposto**. A comparação primária é a que o próprio slide já declara em texto: mesmos dias corridos do mês anterior. Meta entra como terceira linha **só quando certificada**.

## Passo 3 — Arquétipo 04: scorecard

Float cru vira moeda e percentual formatados, com a régua. **Máximo 3 métricas por scorecard.** Caso de referência: Proprietária em agosto — 912 cartões (faixa 133–997, dentro), CAC R$ 23,33 (faixa 14,87–62,14, abaixo da mediana).

## Passo 4 — Arquétipo 07: funil

Barras absolutas em escala linear viram **taxa por etapa com série e faixa**; os absolutos vão para a linha de apoio. E o desenho passa a depender de `funil_semantica`:

- `padrao` → funil de etapas com taxa.
- `lead_pre_qualificado` → **não desenhe um funil.** A Serasa tem propostas maiores que base acionável e aprovação de 99,8%; um funil ali cresce e mente. Use o formato que o vault descreve para esse caso e sinalize a semântica no slide.

Caso de referência: Proprietária, finalização de 58,6% em agosto contra faixa de 12,5%–59,6% — **é o topo da faixa, não um gargalo**. Se o seu render sugerir gargalo aí, a régua está errada.

## Transição — como isso chega ao deck

Use a **publicação por geração isolada** que já existe desde 13/09. A candidata nova só fica visível na ativação; o deck atual permanece apresentável até lá. Não repita o episódio dos slides `v4_*`, que deixaram placeholder cru visível no link que o stakeholder acessa.

Nenhuma publicação no Google nesta rodada sem eu autorizar — construa, certifique, me mostre.

## Critério de aceite

- Passo 0 reportado com as quatro respostas antes de qualquer código.
- Régua implementada como componente único, consumida pelos três arquétipos.
- Os cinco vereditos calculados por regra, incluindo `regime_incomparavel` na Serasa e `amostra_insuficiente` onde a amostra não sustenta.
- Setembro tratado como mês aberto: aparece, não compara.
- Arquétipo 05 renderizando linha de verdade, não tabela.
- Arquétipo 07 escolhendo o desenho por `funil_semantica`, com a Serasa fora do formato de funil.
- Candidata certificada gerada e **não publicada**, com evidência visual dos slides afetados.
- Gates: testes Node e Vitest verdes, deno check, build Vite, e **57 diagnósticos TypeScript, zero novos**.

## Guardrails (não negociável)

Não altere motor determinístico, máquina de estados, certificação, contrato de imutabilidade nem `resolvePartner()`. Não toque na view nem nas colunas da Fase 1 — se faltar campo, **pare e me diga**, não estenda por conta.

Ausência não é zero. CPA de plataforma ≠ CAC de CRM. Número publicado tem que existir no artefato certificado — a régua desenha o que a view entrega, não recalcula.

Nada de Fase 2b, 2c ou 3. Nenhuma publicação no Google sem autorização.

## Ao terminar

Reporte: as quatro respostas do passo 0, quais arquivos mudou, como o veredito ficou para Serasa (regime) e para os parceiros de amostra fina, o que setembro fez na régua, e a evidência visual da candidata. Se decidir fazer diferente de algo aqui, diga o quê e por quê antes de eu revisar.
