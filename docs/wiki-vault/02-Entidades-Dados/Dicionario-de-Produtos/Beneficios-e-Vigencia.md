---
tags: [entidade,produto,beneficio,vigencia,guardrail,copy]
tipo: entidade
camada: dados
atualizado: 2026-10-02
status: confirmado
fonte: pesquisa-externa
---

# Benefícios e Vigência

**Definição:** o registro de todo benefício citável em copy, com valor exato, **janela de vigência**, fonte, dono da confirmação e permissão de uso. É o guardrail que impede a IA de prometer benefício morto.

## Por que esta nota existe

Em 20/08/2026 quase escrevemos uma régua do `+amigo` prometendo o programa de pontos. Ele **encerrou em 01/07/2026** e o prazo de resgate **expirou em 31/07/2026**. Nada na nossa base sabia — porque nenhum benefício tinha campo de validade.

**O que faltava não era o dado. Era o campo `vigente_ate`.**

## A regra

> Nenhum benefício entra na copy se não tiver linha aqui com **`STATUS = VIGENTE`** (ou `SEM DATA FIM`) **e `PODE CITAR = Sim`**. Sem linha, não existe.

## Esquema da tabela

| Coluna | Para que serve |
|---|---|
| `PRODUTO` | qual dos quatro cartões |
| `CATEGORIA` | Desconto · Prazo · Saúde · Vibe · Cartão virtual · Sorteio · Pontos… |
| `BENEFÍCIO` | a frase do benefício |
| `VALOR EXATO` | o número, literal como a fonte publica |
| `VIGENTE DE` / `VIGENTE ATÉ` | janela. **Vazio em `VIGENTE ATÉ` = sem data de fim conhecida** |
| `STATUS` | **fórmula** — compara `VIGENTE ATÉ` com `=TODAY()`. Vira `EXPIRADO` sozinho |
| `PODE CITAR?` | `Sim` · `NÃO` · `Cuidado` · `Checar` |
| `TIPO FONTE` | OFICIAL · TERCEIRA · INTERNO |
| `DONO DA CONFIRMAÇÃO` | quem revalida essa linha |
| `FONTE (URL)` | rastro |
| `OBSERVAÇÃO` | condição, ressalva, conflito |

A planilha `Dicionario_Produtos_Afinz_v3.xlsx`, aba **`Beneficios`**, é a versão viva. 34+ linhas.

## O que torna isso um guardrail e não uma lista

A coluna `STATUS` é **fórmula**, não texto:

```
=IF(VIGENTE_ATE="","SEM DATA FIM",IF(VIGENTE_ATE<HOJE,"EXPIRADO","VIGENTE"))
```

Ninguém precisa lembrar de revisar. Abriu a planilha, a linha de pontos do +amigo já está vermelha e marcada `EXPIRADO`. **Benefício de campanha nasce com `VIGENTE ATÉ` preenchido** — sem isso ele nunca expira sozinho e vira informação morta.

## Estado atual por produto (resumo)

### 🔴 Bloqueados
| Produto | Benefício | Motivo |
|---|---|---|
| +amigo | Programa de pontos (1 pt / R$10) | **EXPIRADO** — encerrou 01/07/2026, resgate até 31/07/2026 |
| +amigo | Créditos Vibe | Plurix é o único dos quatro que não usa Vibe |
| Bem Mais | % de desconto nas lojas | não existe percentual publicado |

### ⚠️ Cuidado / Checar
| Produto | Benefício | Ressalva |
|---|---|---|
| Afinz Visa | Cartão virtual | **validade de 1h e só online** — não é o virtual dos co-branded |
| Afinz Visa | Farmácia até 70% | blog da própria Afinz diz "até 35%" |
| Afinz Visa | Educação a partir de 40% | Bem Barato diz "até 80%" no mesmo programa |
| Afinz Visa | Sorteio R$100 mil | app Vibe diz "até R$10.000"; regulamento expirado |
| Bem Mais | R$30/mês Vibe | condicional a **fatura paga + anuidade ativa** |
| Bem Mais | Educação até 80% | conflita com a Afinz |
| +amigo | Frete grátis | exige compra mínima e lojas participantes |
| +amigo | Sorteios | citados **sem valor** — nunca inventar número |
| DIA | **todos os 7 benefícios de loja** | release de nov/2024, não reconfirmado |
| Todos os produtos | "Até 40 dias para pagar" | **BLOQUEADO** — fonte oficial vigente e URL rastreável não recuperadas |

### ✅ Liberados sem ressalva
Cartão virtual pleno (+amigo, Bem Mais) · Você Bem até 70% saúde · aceitação Visa · adicionais · Vibe missões 1 e 2 (B2C, Bem Mais, DIA) · desconto "a partir de 5% em produtos selecionados" (+amigo, com a ressalva de categoria).

## Manutenção

Cada linha tem **dono**. Quem é dono revalida. Donos atuais: Produto/Afinz · Plurix · Bem Barato · DIA · Jurídico · Vertem · Visa.

As linhas com dono **Jurídico** são as que têm duas fontes oficiais em conflito — ver [[Conflitos-de-Fonte-Produtos-2026-08]]. Nenhuma delas deveria ir ao ar antes de alguém escolher o número canônico.

## Relacionado

- [[Dicionario-de-Produtos]] · [[Pode-Dizer-Nao-Pode-Dizer]] · [[Conflitos-de-Fonte-Produtos-2026-08]]
- [[Motor-de-Briefing-Automatico]] — esta nota é a **camada 2** do motor
- [[Vibe]] · [[Ofertas]]

## Aplicação operacional — revisão editorial 02/10/2026

### Validade não é sinônimo de autorização

Um benefício sem fim conhecido não é permanente. Data aberta apenas descreve o que a fonte informa. Para comunicar, precisam coincidir produto/rede/praça, condição, vigência e permissão; a evidência também precisa ser adequada. A fórmula da planilha sinaliza expiração conhecida, mas não detecta mudança contratual não registrada.

### Procedimento de revisão

1. Recuperar a fonte aplicável e registrar a data da consulta.
2. Transcrever o valor exato e suas condições, sem generalizar entre redes.
3. Classificar como permitido, condicional, bloqueado ou a conferir.
4. Confrontar guardrails ativos no GaaS e registrar divergência.
5. Identificar o dono de validação e atualizar a evidência antes de liberar o claim.

### Mapeamento para o GaaS

`value_exact` preserva o número literal; `valid_from`/`valid_to` preservam janela; `citation_status` descreve citação; `allowed_status` indica gate; `evidence`/`source_url` registram suporte; `applies_to` limita escopo. `source='gaas'` identifica edição operacional. Campo existente não demonstra sincronização automática da planilha.

Na leitura de 02/10, os sete guardrails ativos de +amigo não tinham URL. Cobertura familiar do Você Bem estava `allowed` com origem em peça antiga, e o percentual/cobertura possuía revisão obrigatória. Tratar a suficiência da evidência como pendência, sem reescrever autorização operacional nesta revisão do vault. Ver [[Ficha-de-Produto-Guia]] e [[Fontes-e-Proveniencia-Growth]].
