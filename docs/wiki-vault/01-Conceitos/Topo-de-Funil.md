---
tags: [conceito,campanha-tipo,aquisicao]
tipo: conceito
camada: negocio
atualizado: 2026-08-20
status: confirmado
fonte: gaas-supabase
---

# Topo de Funil (campanha-tipo)

**Definição:** a **campanha-tipo de aquisição fria** — primeiro contato com a base própria/parceira que ainda não pediu cartão.

## Público das réguas de topo dos parceiros varejo

> **Regra (Pablo, 02/10/2026):** as réguas de topo de funil de **Plurix (+amigo), Dia e Bem Barato** são **exclusivamente para membros do clube** do varejo (Clube +amigo, Clube DIA, Clube Bem Mais).

Consequências para copy e briefing:
- Falar com a pessoa **como membro**: o clube é algo que ela já tem, nunca uma novidade ou oferta ("O Clube agora é +amigo" não serve para esse público).
- A diferenciação "Clube × Cartão" vira o argumento central: *você já economiza no clube; o cartão soma em cima*.
- Isso é regra de **audiência da régua**, não do produto: estar no clube continua **não sendo requisito para pedir o cartão** (ver correções de 20/08/2026 nas fichas de produto).

## Regra de proposta de valor

No topo de funil B2C, **Vibe é a âncora e o diferencial do produto**. A comunicação deve apresentar o cartão Afinz Visa a partir dessa proposta de valor, usando outros benefícios apenas como sustentação. Não reduzir Vibe a benefício secundário nem tratá-lo como promoção sazonal.

**Bloqueio de copy:** excluir a alegação **"até 40 dias para pagar"**. A fonte oficial vigente não foi recuperada; portanto, a frase não pode entrar em SMS, Push ou outro canal até nova validação documental.

## Régua de SMS

- **Quantidade:** 4 SMS.
- **Cadência:** 1 disparo por semana, durante 4 semanas.
- **Progressão:** os quatro textos devem evoluir o argumento sem repetir a mesma mensagem; Vibe permanece como âncora da proposta de valor ao longo da régua.
- **Fonte da decisão:** definição operacional de Pablo em 20/08/2026.

## A chave (como aparece em cada camada)
| Camada | Valor |
|---|---|
| CRM B2C | Segmento `Base_Proprietaria` + Etapa `Aquisicao` (Parceiro Proprietaria) |
| CRM Plurix | Segmento `CRM` + Etapa `Aquisicao` |
| Relatório diarizado | bloco `TOPO DE FUNIL B2C/PLURIX` |
| Meta hoje | `CRM_PLURIX_202603_GC1/GC2` (257–303k), `Tudao_B2C_202603` (155–182k) — **congeladas desde mar/26** |
| Audiência proposta | `crm_b2c_topo_daily` · `crm_plurix_topo_daily` |
| AppsFlyer | `af_adset=base_proprietaria` / `crm` |

## Performance e canais
> 📊 Snapshot 2026-06-10. Canal núcleo: **E-mail** (CRM Plurix 594 disparos/3.806 cartões; Base_Proprietaria 500/638). Conversão 2,6–3,3%, CAC R$ 10–14 — é o motor de **volume**, não de eficiência; meio de funil converte ~5x mais.

## Papel na rede
Alimenta os demais blocos: quem não converte aqui vira [[Repescagem]] (negado), [[Upgrade]] (aprovado sem conversão) ou [[Carrinho-Abandonado]] (abandono no fluxo). Em mídia, é o público de prospecção + fonte dos lookalikes.

## Relacionado
- [[Plataformas-de-Comunicação]] · [[Segmentos]] · [[Etapa-de-Aquisição]] · [[Repescagem]] · [[Upgrade]] · [[Carrinho-Abandonado]] · [[Ativacao-de-Audiencias-Diaria]]
