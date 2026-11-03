---
tags: [gaas,pilar,automacao]
tipo: operacao
camada: operacao
atualizado: 2026-06-08
status: legado
fonte: gaas-supabase
status_original: confirmado
legado_desde: 2026-10-29
---

# Pilar — Automação por Histórico

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver o app atual e o [[00-Indice/MOC-Operacao|MOC de operação]].

**Definição:** o princípio fundador do GaaS — todo campo preenchível do [[Modal-de-Disparo]] deve ser **sugerido a partir do histórico** de [[activities]], não digitado do zero. O sistema aprende com o que já foi disparado.

## Contexto
É o pilar que o CLAUDE.md declara como "fundamental". Cada campo do modal de programação:
1. **Lê o histórico** de disparos (tabela [[activities]]).
2. **Oferece SELECT com opções do histórico** (padrão `SmartSelect`, **não** input+datalist).
3. **Sugere valores por contexto** (BU + Campanha + Jornada).
4. **Permite preenchimento rápido** sem digitação manual.

Campos auto-calculados: `ActivityName` ([[Taxonomia-Activity-Name]]), `Safra` (último disparo do segmento +1 mês), `Ordem` (calculada mas editável), custo por canal ([[Custos-e-Investimento]]), Total Campanha.

## Por que importa
É o que torna o [[Pipeline-ML]] e o [[Orientador]] úteis na prática: a inteligência por similaridade só tem valor se o operador a recebe **no momento de decidir**, dentro do formulário. Materializa a ponte entre histórico e ação — base do [[Orquestrador]].

## Relacionado
- [[Modal-de-Disparo]] · [[Pipeline-ML]] · [[Orientador]] · [[activities]] · [[Taxonomia-Activity-Name]]
