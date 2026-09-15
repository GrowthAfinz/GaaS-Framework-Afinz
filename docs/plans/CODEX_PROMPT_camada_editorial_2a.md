# Prompt para Codex — Camada editorial do Report Live (Fase 2a, v3 — Sheets-backed)

Cole este arquivo inteiro. O passo 0 já foi executado e respondido; esta versão incorpora o diagnóstico e fecha as lacunas de especificação que a v2 tinha. Se algo abaixo estiver errado ou mais arriscado do que parece, pare e me diga antes de codar.

## Onde você está

**Raiz de trabalho:** o worktree da `main` (`.codex-worktrees/report-live-foundation-main`). O `calendar-estrategico/` original está marcado como arquivo morto — não grave lá.

**Estado:** Fase 1 concluída, mergeada (PR #7) e protegida no CI; limpeza de dívida concluída (PR #8); `report-sync` v45 ativa. A fundação de dados existe e **nada dela chegou ao deck** — o PDF continua com 57 páginas no formato antigo.

**Fatias da Fase 2:** você está na **2a** — a régua como componente + arquétipos 05 (ritmo), 04 (scorecard) e 07 (funil). A 2b e a 2c têm prompt próprio. Não as inicie.

## Decisão do passo 0

Seu diagnóstico está aceito: o renderer só cria formas, texto e `createSheetsChart`; não há `createLine` nem tabela nativa; o blueprint é envelope de integridade, não schema de layout; dois perfis exigem camada de projeção sobre o `VIEW_REGISTRY` (escopo da 2c).

**Aprovado: Sheets-backed.** Série vinculada do Sheets; valor, delta e veredito como formas e texto.

## A régua — especificação completa

Componente único, implementado como **uma função** que recebe uma linha da view e devolve os elementos do slide. Os três arquétipos consomem a mesma função; se cada um montar do seu jeito, a 2b diverge.

### Anatomia

```
CAC · Proprietária                    ← rótulo
R$ 23,33   ▼ 39,9%                    ← valor + delta
[gráfico de linha vinculado]          ← série de 6 meses + bordas da faixa
faixa 14,87 – 62,14 · dentro          ← faixa textual + veredito
```

### O gráfico: três séries, sem truque

O gráfico carrega **três séries de linha** no mesmo `createSheetsChart`:

1. `<metrica>_min_6m` — linha fina, cinza.
2. `<metrica>_max_6m` — linha fina, cinza.
3. a métrica — linha forte, cor de destaque.

O leitor vê o canal entre as bordas e onde o valor está dentro dele. **Não use área empilhada** para simular banda — três linhas entregam a mesma leitura sem o truque de série transparente, e continuam sendo um único gráfico.

Quando a faixa não for válida (ver estados abaixo), **as duas séries de borda não são plotadas** — só a série de valor. Nunca desenhe uma faixa que a regra não sustenta.

### Estados da régua — todos explícitos

| Condição | Gráfico | Delta | Veredito |
|---|---|---|---|
| `meses_observados < 2` | **sem gráfico** — não se desenha linha de um ponto | se válido | `serie_insuficiente` |
| `meses_observados` 2–3 | série, **sem bordas** | se válido | `amostra_insuficiente` |
| `<metrica>_meses_validos_6m < 4` | série, **sem bordas** | se válido | `amostra_insuficiente` |
| `regime_serie` muda na janela | série **apenas do regime atual**, sem bordas | **suprimido** | `regime_incomparavel` + texto de `limitacao_medicao` |
| tudo válido | série + bordas | sim | `dentro_da_faixa` · `acima_da_faixa` · `abaixo_da_faixa` |

### Regras de leitura — não negociáveis

1. **Só mês fechado compara.** `mes_fechado = false` pode aparecer como ponto marcado no gráfico, nunca como base de delta ou veredito. Setembro está aberto — é o caso de teste.
2. **Delta exige mesmo regime.** Se o período atual e o equivalente estiverem em `regime_serie` diferentes, **não exiba delta** — exiba o valor e o corte. Isso vale mesmo quando a faixa é válida.
3. **Taxa varia em pontos percentuais; volume em percentual.** Nunca misture.
4. **Veredito é calculado, nunca escrito por IA.** Os sete estados da tabela acima são o conjunto fechado.
5. **A régua desenha o que a view entrega, não recalcula.** Todo número exibido existe no artefato certificado.

## Contrato da view mensal

`v_aquisicao_mensal_canonico`, grão mês × parceiro canônico:

**Fatos:** `mes` · `parceiro` · `disparos` · `base_acionavel` · `propostas` · `aprovados` · `cartoes` · `custo`
**Taxas:** `cac` · `tx_finalizacao` · `tx_aprovacao` · `tx_proposta`
**Faixa 6m:** `<metrica>_min_6m` / `_max_6m` para disparos, base_acionavel, propostas, aprovados, cartoes, custo, cac; e `tx_final_min_6m`/`_max_6m`, `tx_aprovacao_min_6m`/`_max_6m`, `tx_proposta_min_6m`/`_max_6m`
**Qualidade:** `meses_observados` · `cac_meses_validos_6m` · `tx_final_meses_validos_6m` · `tx_aprovacao_meses_validos_6m` · `tx_proposta_meses_validos_6m` · `denominador_minimo_faixa_taxa`
**Cobertura:** `mes_fechado` · `dias_cobertos` · `ultima_data_observada`
**Semântica:** `funil_semantica` · `funil_nao_padrao_no_mes` · `funil_nao_padrao_persistente` · `funil_semantica_meses_observados`
**Regime:** `regime_serie` · `corte_regime` · `limitacao_medicao`

## Passo 1 — Arquétipo 05: ritmo do mês

**Fonte diferente das demais.** Ritmo é diário dentro do mês; a régua é mensal. Este slide vem de `VIEW_PACING_ISODAYS` (`date`, `cumulative_cards` e demais colunas já existentes), **não** da view canônica mensal.

Hoje o slide rotulado `time series pacing` é renderizado como tabela de datas. Vira **linha acumulada vinculada, com o período equivalente sobreposto** — mesmos dias corridos do mês anterior, que é a comparação que o próprio slide já declara em texto. Meta entra como terceira série **só quando certificada**; sem certificação, o slide mostra apenas realizado e equivalente.

A régua mensal pode aparecer como complemento no mesmo slide (total do mês contra faixa mensal), mas **o gráfico é o diário acumulado**. Não misture os dois contratos no mesmo eixo.

Este é o slide que motivou a fase: em 57 páginas não existe um único gráfico de linha.

## Passo 2 — Arquétipo 04: scorecard

Float cru vira moeda e percentual formatados, com a régua completa. **Máximo 3 métricas por scorecard** — hierarquia acima de densidade.

Referência de teste: Proprietária em agosto — 912 cartões (faixa 133–997) e CAC R$ 23,33 (faixa 14,87–62,14, abaixo da mediana do semestre).

## Passo 3 — Arquétipo 07: funil, com dois desenhos

O desenho depende de `funil_semantica`. **São dois layouts distintos, não um com variação.**

### `padrao`

Etapas com taxa, não barras absolutas em escala linear. Cada etapa traz taxa, delta em p.p. e veredito; os absolutos vão para a linha de apoio.

Teste de sanidade: Proprietária, finalização de 58,6% em agosto contra faixa de 12,5%–59,6%. **É o topo da faixa, não gargalo.** Se o render sugerir gargalo ali, a régua está errada — foi esse o erro que originou toda esta fase.

### `lead_pre_qualificado`

**Não desenhe funil, e eis o que desenhar no lugar.** Na Serasa, propostas superam a base acionável (118% em agosto) e a aprovação fica em 99,8% em todos os meses: as etapas intermediárias não carregam informação e um funil ali cresce e mente.

O slide passa a ser **volume e conversão final**: cartões com régua, taxa `tx_finalizacao` com régua, e uma nota de rodapé declarando a semântica — base de lead pré-qualificado, etapas intermediárias não comparáveis com parceiros de funil padrão. Duas métricas com contexto, em vez de quatro etapas sem sentido.

Na Serasa, a régua de `tx_finalizacao` cai no estado `regime_incomparavel` para janelas que cruzam `corte_regime` (fev/2026); dentro do regime atual, a faixa é 2,41%–5,28%.

## Transição

Publicação por **geração isolada**, que já existe desde 13/09. A candidata só fica visível na ativação; o deck atual permanece apresentável. Não repita o episódio dos slides `v4_*`, que deixaram placeholder cru visível no link do stakeholder.

**Nenhuma publicação no Google nesta rodada sem eu autorizar** — construa, certifique, me mostre.

## Teto de gráficos e verificação de resíduo

Cada gráfico vinculado é uma aba e um elemento a manter, e este projeto já pagou por isso: a auditoria de setembro achou **121 abas com 82 vazias** e **12 gráficos órfãos com "Add a series"** visíveis no deck.

- **No máximo um gráfico por slide.** Mais de uma série vai no mesmo gráfico, nunca em gráficos irmãos.
- **Um range por família** (ex.: uma aba com a série dos cinco parceiros) em vez de uma aba por parceiro.
- **Todo gráfico criado entra na verificação de publicação existente** — a mesma que confere células e elementos obrigatórios. Gráfico não verificado vira órfão.
- `refreshSheetsChart` após qualquer correção de fórmula, conforme o aprendizado já registrado no vault.

## Critério de aceite

- Régua como função única, consumida pelos três arquétipos.
- Gráfico com três séries (bordas + valor), sem área empilhada; bordas ausentes quando a faixa não é válida.
- Os sete estados da tabela implementados, incluindo `serie_insuficiente`, `amostra_insuficiente` e `regime_incomparavel`.
- Delta suprimido quando os períodos estão em regimes diferentes.
- Setembro aparece no gráfico e não compara.
- Arquétipo 05 lendo `VIEW_PACING_ISODAYS`, com linha de verdade.
- Arquétipo 07 com dois layouts; Serasa em volume-e-conversão, não em funil.
- Teto de um gráfico por slide respeitado; nenhum gráfico fora da verificação de publicação.
- Candidata certificada gerada e **não publicada**, com evidência visual dos slides afetados.
- Gates: testes Node e Vitest verdes, deno check, build Vite, 57 diagnósticos TypeScript e zero novos, CI verde no PR.

## Guardrails

Não altere motor determinístico, máquina de estados, certificação, contrato de imutabilidade nem `resolvePartner()`. Não toque na view nem nas colunas da Fase 1 — se faltar campo, **pare e me diga**, não estenda por conta.

Ausência não é zero. CPA de plataforma ≠ CAC de CRM.

Nada de Fase 2b, 2c ou 3. Nenhuma publicação no Google sem autorização. Trabalhe no worktree da main.

## Ao terminar

Reporte: quantos gráficos vinculados foram criados e onde vivem, como a verificação de publicação os cobre, os vereditos da Serasa e de um parceiro com amostra fina, o que setembro fez na régua, como ficou o slide de funil da Serasa, e a evidência visual da candidata. Se decidir fazer diferente de algo aqui, diga o quê e por quê antes de eu revisar.
