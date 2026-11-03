---
title: "Cartonistas"
tipo: publico
camada: resultados
dominio: crm-aquisicao
codigo_dado: Cartonistas
aliases: [Cartonistas, Cartonista, Migração, Tombamento]
etapa_funil: Aquisicao
bus: [Plurix]
parceiros_ativos: [Plurix]
canais: [E-mail, SMS, WhatsApp]
status: ativo
atualizado: 2026-11-03
fonte: consolidacao-wiki-2026-10-28
tags: [publico, crm, resultados, growth]
growth_catalog: {"segmento": "Cartonistas"}
analytics: {"domain": "crm", "scope": {"segment": "Cartonistas"}}
variantes: [{"operation_id": "CRM-0104a32e90", "bu": "Plurix", "partner": "Plurix"}, {"operation_id": "CRM-bcaf001164", "bu": "Plurix", "partner": "N/A"}]
---

# Cartonistas

## Em uma frase

Falar com quem já tem o cartão do varejo parceiro (o cartonista), em jornadas de migração, tombamento ou venda do cartão Afinz.

Nos dados, é o segmento `Cartonistas`, só na Plurix, registrado na etapa `Aquisicao`.

## Principais números: últimos meses com disparo

> 📊 Consulta em `activities` de 28/10/2026, por mês da data de disparo, segmento `Cartonistas`. Setembro ainda pode amadurecer. O resultado do mês corrente fica no bloco ao vivo, mais abaixo. Taxas e CAC da média e do total são calculados sobre a soma do período (ponderados), não média de taxas.

**Sem disparo desde 13/02/2026.** Os três últimos meses com disparo:

| Mês | Disparos | Base acionável | Propostas | Aprovados | Cartões | Conversão (cartões/base) | Finalização (cartões/aprovados) | Custo | CAC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| set/2025 | 3 | 14.003 | 97 | 85 | 69 | 0,49% | 81,2% | R$ 922,18 | R$ 13,36 |
| out/2025 | 8 | 9.599 | 90 | 190 | 64 | 0,67% | 33,7% | R$ 1.837,91 | R$ 28,72 |
| fev/2026 | 3 | 23.683 | 65 | 58 | 45 | 0,19% | 77,6% | R$ 1.122,69 | R$ 24,95 |
| **Média dos 3 meses** | **5** | **15.762** | **84** | **111** | **59** | **0,38%** | **53,5%** | **R$ 1.294,26** | **R$ 21,81** |
| Total do período | 14 | 47.285 | 252 | 333 | 178 | 0,38% | 53,5% | R$ 3.882,78 | R$ 21,81 |

Antes disso, jun, jul e ago/2025 somaram 539 cartões (355, 152 e 32).

Em out/2026 apareceu um segmento novo, `Tombamento`, do parceiro Super Nosso (B2B2C): 12 linhas entre 20 e 22/10, base de 3.869, 10 propostas, 4 aprovados, 4 cartões e R$ 1.474,86 de custo.

Como ler:
- Nos três últimos meses com disparo, foram ~59 cartões por mês a CAC de R$ 21,81.
- O público teve o melhor mês em jun/2025 (355 cartões) e foi caindo até parar em fev/2026.
- Out/2025 tem mais aprovados (190) que propostas (90): dado inconsistente, conferir antes de usar a finalização desse mês.

## Por que esse público importa

Cartonista já é cliente do varejo e tem histórico de crédito com o parceiro: é a base mais quente para migração. Mas o mesmo público também é tratado como rentabilização em outras notas, e essa fronteira precisa de decisão.

## Pra quem é e quando entra

Quem já tem o cartão do varejo parceiro. As jornadas observadas misturam tombamento (migração do cartão) e venda, com a etapa registrada como `Aquisicao`.

## Régua

Não há régua documentada no vault para este público. Os disparos observados usam e-mail, SMS e WhatsApp.

## O que pode e não pode dizer

Valem as regras gerais de [[02-Entidades-Dados/Dicionario-de-Produtos/Pode-Dizer-Nao-Pode-Dizer|Pode dizer e não pode dizer]].

## Como medir sem cair em armadilha

- Separar migração/tombamento de nova aquisição antes de somar o resultado.
- Variante com parceiro `N/A` não é Plurix confirmado.
- Em mídia, cartonistas pertencem à Rentabilização ([[05-Estrategia/Ativacao-de-Audiencias-Diaria|ativação diária]]); no CRM, estão na aquisição. Não somar os dois sem decidir a fronteira.
- Regras gerais de leitura: [[09-Inteligencia-IA/Fontes-e-Proveniencia-Growth|Fontes e proveniência]] e [[07-Evolucao/Resultados-Qualidade-e-Cobertura|Qualidade e cobertura]].

## Próximas frentes com este público

- **Fase 2 do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Pool de Ofertas - Vai de Visa]]:** incluir Plurix/cartonistas na vitrine de ofertas Visa personalizada por [[MCC]]. Em 03/11/2026 a [[DE-CLIENTES_ATIVOS]] só tinha B2C e B2B2C; a fase 2 depende de a base Plurix entrar nela ou de outra fonte.
- A [[DE-CLIENTES_ATIVOS]] tem o campo `FL_TOMBAMENTO` (padrão `0`): candidato a marcar quem veio de migração/tombamento, útil para separar migração de nova aquisição. Significado dos valores *a-validar*.

## Resultado ao vivo

O bloco de resultado desta página (configurado no `analytics` do topo) consulta `activities` ao vivo, para o público inteiro.

Comece pela visão geral do mês, abra o assunto e suas variantes, e consulte a retrospectiva do mesmo recorte. O resumo pode agregar públicos diferentes; comparabilidade precisa de validação. A seleção de mês e o contexto de cada nota ficam no endereço compartilhável.

## Por parceiro

Registro do inventário de 03/10/2026 (linhas e período observados naquela data). Os números do trimestre estão em Principais números, acima.

| Variante | BU | Parceiro | Subgrupos | Canais | Linhas no inventário | Período observado | Situação |
|---|---|---|---|---|---:|---|---|
| Acionamento de cartonistas e migração candidata | Plurix | Plurix | Ativo, N/A | E-mail, SMS, WhatsApp | 14 | 18/09/2025 a 13/02/2026 | candidata |
| Acionamento de cartonistas e migração candidata | Plurix | N/A | Ativo, N/A | WhatsApp | 16 | 04/06/2025 a 05/08/2025 | candidata |

Resultado ao vivo de cada combinação, enquanto o filtro por parceiro dentro desta página não fica pronto: [[07-Evolucao/Assunto-CRM-0104a32e90|Plurix]] · [[07-Evolucao/Assunto-CRM-bcaf001164|N/A]].

Visão de cada parceiro: [[10-Resultados/Parceiros/Plurix|Plurix]]

## O que já aprendemos

- Ainda não há aprendizado validado para este público.

Para registrar uma decisão ou aposta: [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] e [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]].

## Perguntas em aberto

| Questão | Impacto | Evidência necessária | Dono |
|---|---|---|---|
| Cartonista é aquisição ou rentabilização? | o mesmo público em dois lugares | decisão de fronteira entre as áreas | Pablo |
| O segmento `Tombamento` (Super Nosso, out/2026) é este mesmo público? | público novo sem página | definição da jornada do Super Nosso | a confirmar |
| Por que o público parou em fev/2026? | base mais quente sem uso | decisão comercial ou de base | a confirmar |

## Onde mais este público aparece

Estas notas tratam de outros assuntos e também falam deste público. Elas continuam no lugar:

- [[05-Estrategia/Ativacao-de-Audiencias-Diaria|Ativação diária de audiências]], [[05-Estrategia/Estrategia-Multicanal-Vibe-Mar-Fechado|Estratégia multicanal Vibe]] e [[05-Estrategia/Plano-de-Midias-Afinz-Vibe-Handoff|Plano de mídias]]: cartonistas como rentabilização.
- [[98-Legado/03-Dimensoes/Ofertas|Ofertas]] (Seguro Cartonistas) e [[01-Conceitos/Lead|Lead]].

## Relacionado

[[98-Legado/03-Dimensoes/Parceiros]] · [[98-Legado/03-Dimensoes/Segmentos]] · [[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]]

---

## Snapshots anteriores

Números de antes, preservados com a data e a fonte de cada um. Eles não batem entre si porque usam bases e métodos diferentes.

### Dimensão Segmentos, 10/06/2026

> 📊 Snapshot 2026-06-10. Também: Rentabilizacao (65), Cartonistas (30), Recencia de Compra (26), Instabilidade (8). ⚠️ Base re-ingerida vs 06-08 — taxas de conversão recuaram em bloco; a hierarquia entre segmentos se mantém.

## Registro histórico: série e retrospectivas (consulta de 03/10/2026)

Conteúdo integral da antiga nota `Resultados-CRM-Cartonistas`, gerada em 03/10/2026. Os números são daquela data; o resultado atual vem do bloco ao vivo.

**Snapshot consultado em 03/10/2026.** Dias de negócio anteriores a 03/10/2026. Esta nota é uma leitura descritiva revisável; hipótese, decisão e aprendizado validado permanecem identificados separadamente. Atualizações futuras devem preservar o corte e a revisão anterior.

### Contexto do segmento

Filtro exato: `Segmento = Cartonistas`; parceiro usa `parceiro_canonico`. Abrange todas as BUs e canais registrados neste segmento; não representa pessoas únicas nem um experimento. Consulte [[Segmentos]] e [[Parceiros]].

**Valores observados, sem deduplicação automática.** Cartões e propostas somam apenas valores presentes. A cobertura por campo e as chaves repetidas condicionam qualquer comparação. Não calcular CAC ou funil com subconjuntos diferentes.

### Evolução do segmento geral

| Mês | Linhas | Dias com registros | Cartões observados | Cobertura de cartões | Propostas observadas | Cobertura de propostas | Linhas com chave repetida | Retrospectiva |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 2025-06 | 5 | 3 | 355 | 5/5 | 538 | 5/5 | 0 | [[#Retrospectiva 2025-06|ler junto]] |
| 2025-07 | 10 | 8 | 152 | 10/10 | 240 | 10/10 | 0 | [[#Retrospectiva 2025-07|ler junto]] |
| 2025-08 | 1 | 1 | 32 | 1/1 | 45 | 1/1 | 0 | [[#Retrospectiva 2025-08|ler junto]] |
| 2025-09 | 3 | 3 | 69 | 3/3 | 97 | 3/3 | 0 | [[#Retrospectiva 2025-09|ler junto]] |
| 2025-10 | 8 | 8 | 64 | 8/8 | 90 | 8/8 | 0 | [[#Retrospectiva 2025-10|ler junto]] |
| 2026-02 | 3 | 3 | 45 | 3/3 | 65 | 3/3 | 0 | [[#Retrospectiva 2026-02|ler junto]] |

### Segmento por parceiro e mês

Leia cada parceiro junto da retrospectiva do mesmo mês abaixo. Uma combinação ausente na tabela não equivale a zero. N/A indica classificação registrada, não um parceiro confirmado.

| Mês | Parceiro canônico | Linhas | Dias | Cartões observados | Cobertura de cartões | Chaves repetidas: linhas | Retrospectiva |
|---|---|---:|---:|---:|---:|---:|---|
| 2025-06 | N/A | 5 | 3 | 355 | 5/5 | 0 | [[#Retrospectiva 2025-06|ler junto]] |
| 2025-07 | N/A | 10 | 8 | 152 | 10/10 | 0 | [[#Retrospectiva 2025-07|ler junto]] |
| 2025-08 | N/A | 1 | 1 | 32 | 1/1 | 0 | [[#Retrospectiva 2025-08|ler junto]] |
| 2025-09 | Plurix | 3 | 3 | 69 | 3/3 | 0 | [[#Retrospectiva 2025-09|ler junto]] |
| 2025-10 | Plurix | 8 | 8 | 64 | 8/8 | 0 | [[#Retrospectiva 2025-10|ler junto]] |
| 2026-02 | Plurix | 3 | 3 | 45 | 3/3 | 0 | [[#Retrospectiva 2026-02|ler junto]] |

### Retrospectivas integradas

#### Retrospectiva 2025-06

- **Observação:** segmento geral com 355 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-06-04 e 2025-06-25, em 3 dias distintos.
- **Cobertura:** 5 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **N/A:** 355 cartões em 5/5 linhas; 3 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-07

- **Observação:** segmento geral com 152 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-07-11 e 2025-07-25, em 8 dias distintos.
- **Cobertura:** 10 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **N/A:** 152 cartões em 10/10 linhas; 8 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-08

- **Observação:** segmento geral com 32 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-08-05 e 2025-08-05, em 1 dias distintos.
- **Cobertura:** 1 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **N/A:** 32 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-09

- **Observação:** segmento geral com 69 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-09-18 e 2025-09-30, em 3 dias distintos.
- **Cobertura:** 3 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 69 cartões em 3/3 linhas; 3 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-10

- **Observação:** segmento geral com 64 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-10-01 e 2025-10-09, em 8 dias distintos.
- **Cobertura:** 8 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 64 cartões em 8/8 linhas; 8 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-02

- **Observação:** segmento geral com 45 cartões observados; 1 classificações de parceiro registradas; registros entre 2026-02-03 e 2026-02-13, em 3 dias distintos.
- **Cobertura:** 3 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 45 cartões em 3/3 linhas; 3 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

### Conexões

[[Historico-Resultados-CRM|Voltar ao histórico geral]] · [[Resultados-CRM]] · [[Resultados-Qualidade-e-Cobertura]] · [[Retrospectiva-Mensal-Growth]].

## Detalhe das variantes por parceiro

Registro do inventário de 03/10/2026: conteúdo integral das notas de assunto, uma por variante, mais a lista do antigo hub.

### Assuntos relacionados

| Assunto | Tipo | Fonte |
|---|---|---|
| [[07-Evolucao/Assunto-CRM-bcaf001164]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-0104a32e90]] | Escopo candidato de operação | activities |

### Plurix (Plurix), CRM-0104a32e90

#### O que este assunto representa

Contatos a cartonistas; jornadas incluem tombamento e vendas, com etapa física Aquisicao.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | Plurix |
| partner | Plurix |
| segment | Cartonistas |
| stages | ["Aquisicao"] |
| subgroups | ["Ativo", "N/A"] |
| channels | ["E-mail", "SMS", "WhatsApp"] |
| products | ["Classic"] |
| offers | ["Padrao", "Vibe"] |
| promotions | ["N/A", "Padrao"] |

**O que precisa ser validado:** Separar migração/tombamento de nova aquisição. N/A não é Plurix confirmado.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-86232546c1 | JOR_AQUISICAO_PLURIX_CARTONISTAS_CRM_PADRAO_NA_FEV26 | 2026-02 | Aquisicao | Ativo | 3 |
| CAMP-91b2e2b730 | JOR_VC_AQUISICAO_PLURIX_CARTONISTAS_SENF_SMS | 2025-09 | Aquisicao | N/A | 2 |
| CAMP-3a4b8a2b60 | JOR_VC_AQUISICAO_PLURIX_CARTONISTAS_SENF_WPP | 2025-09 | Aquisicao | N/A | 1 |
| CAMP-1753e76009 | JOR_VC_AQUISICAO_PLURIX_CARTONISTAS_SENF_WPP | 2025-10 | Aquisicao | N/A | 6 |
| CAMP-867eee8169 | JOR_VC_AQUISICAO_PLURIX_CARTONISTAS_SIGACRED_SMS | 2025-10 | Aquisicao | N/A | 2 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Pendências específicas

- Cartonistas registrados como Aquisicao
- Vibe em Plurix: confrontar vigência e produto; +amigo não é elegível por analogia
- Há nomes com teste/seedlist, sem exclusão automática

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-0104a32e90 |
| Fonte | activities |
| Linhas no corte do inventário | 14 |
| Primeira data observada | 2025-09-18 |
| Última data observada | 2026-02-13 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[98-Legado/03-Dimensoes/Segmentos|Definição relacionada]] · [[07-Evolucao/Parceiro-Plurix|Visão do parceiro]] · [[07-Evolucao/Segmento-Cartonistas|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-0104a32e90",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Acionamento de cartonistas e migração candidata — Plurix — Plurix",
  "family": "Acionamento de cartonistas e migração candidata",
  "bu": "Plurix",
  "partner": "Plurix",
  "segment": "Cartonistas",
  "stages": [
    "Aquisicao"
  ],
  "subgroups": [
    "Ativo",
    "N/A"
  ],
  "channels": [
    "E-mail",
    "SMS",
    "WhatsApp"
  ],
  "products": [
    "Classic"
  ],
  "credit_profiles": [
    "Mar_aberto",
    "Pre_analisado"
  ],
  "offers": [
    "Padrao",
    "Vibe"
  ],
  "promotions": [
    "N/A",
    "Padrao"
  ],
  "records": 14,
  "first_date": "2025-09-18",
  "last_date": "2026-02-13",
  "observed_months": [
    "2025-09",
    "2025-10",
    "2026-02"
  ],
  "physical_combinations": 2,
  "journey_count": 4,
  "activity_name_count": 8,
  "definition": "Contatos a cartonistas; jornadas incluem tombamento e vendas, com etapa física Aquisicao.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "03-Dimensoes/Segmentos.md",
  "validation": "Separar migração/tombamento de nova aquisição. N/A não é Plurix confirmado.",
  "flags": [
    "Cartonistas registrados como Aquisicao",
    "Vibe em Plurix: confrontar vigência e produto; +amigo não é elegível por analogia",
    "Há nomes com teste/seedlist, sem exclusão automática"
  ],
  "name_signals": [],
  "scope_key": {
    "bu": "Plurix",
    "segment": "Cartonistas",
    "partner": "Plurix"
  }
}
```

### N/A (Plurix), CRM-bcaf001164

#### O que este assunto representa

Contatos a cartonistas; jornadas incluem tombamento e vendas, com etapa física Aquisicao.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | Plurix |
| partner | N/A |
| segment | Cartonistas |
| stages | ["Aquisicao"] |
| subgroups | ["Ativo", "N/A"] |
| channels | ["WhatsApp"] |
| products | ["Classic"] |
| offers | ["Padrao"] |
| promotions | ["N/A"] |

**O que precisa ser validado:** Separar migração/tombamento de nova aquisição. N/A não é Plurix confirmado.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-57920f6ee9 | JOR_VC_AQUISICAO_MAISAMIGO_TOMABAMENTO_DM_AINDA_N_ACIONADOS | 2025-06 | Aquisicao | Ativo | 1 |
| CAMP-759bf76e3a | JOR_VC_AQUISICAO_MAISAMIGO_TOMABAMENTO_DM_N_ACIONADOS_JULHO_1 | 2025-07 | Aquisicao | Ativo | 1 |
| CAMP-9292045e68 | JOR_VC_AQUISICAO_MAISAMIGO_TOMABAMENTO_DM_N_ACIONADOS_JULHO_2 | 2025-07 | Aquisicao | Ativo | 1 |
| CAMP-f276c56f00 | JOR_VC_AQUISICAO_MAISAMIGO_TOMABAMENTO_DM_N_ACIONADOS_JULHO_3 | 2025-07 | Aquisicao | Ativo | 1 |
| CAMP-a323995490 | JOR_VC_AQUISICAO_MAISAMIGO_TOMABAMENTO_DM_N_ACIONADOS_JULHO_4 | 2025-07 | Aquisicao | Ativo | 1 |
| CAMP-cad5b9449f | JOR_VC_AQUISICAO_MAISAMIGO_TOMABAMENTO_DM_N_ACIONADOS_JULHO_5 | 2025-07 | Aquisicao | Ativo | 1 |
| CAMP-a5fedbccd2 | JOR_VC_AQUISICAO_MAISAMIGO_TOMABAMENTO_DM_N_ACIONADOS_JULHO_6 | 2025-07 | Aquisicao | Ativo | 2 |
| CAMP-656a7adfee | JOR_VC_AQUISICAO_MAISAMIGO_TOMABAMENTO_DM_N_ACIONADOS_JULHO_7 | 2025-07 | Aquisicao | Ativo | 2 |
| CAMP-fb4946622d | JOR_VC_AQUISICAO_MAISAMIGO_TOMBAMENTO_DM_BOA_AVENIDA_A_ONDA1 | 2025-06 | Aquisicao | Ativo | 2 |
| CAMP-0c4f7f6a80 | JOR_VC_AQUISICAO_MAISAMIGO_TOMBAMENTO_DM_BOA_AVENIDA_A_ONDA1_RPK | 2025-06 | Aquisicao | Ativo | 2 |
| CAMP-0abcbd5c6e | JOR_VC_AQUISICAO_MAISAMIGO_TOMBAMENTO_VENDA_PARANA | 2025-07 | Aquisicao | Ativo | 1 |
| CAMP-1cc3f53f8d | JOR_VC_AQUISICAO_MAISAMIGO_TOMBAMENTO_VENDA_PARANA_2 | 2025-08 | Aquisicao | N/A | 1 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Pendências específicas

- Parceiro não resolvido
- Cartonistas registrados como Aquisicao

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-bcaf001164 |
| Fonte | activities |
| Linhas no corte do inventário | 16 |
| Primeira data observada | 2025-06-04 |
| Última data observada | 2025-08-05 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[98-Legado/03-Dimensoes/Segmentos|Definição relacionada]] · [[07-Evolucao/Segmento-Cartonistas|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-bcaf001164",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Acionamento de cartonistas e migração candidata — N/A — Plurix",
  "family": "Acionamento de cartonistas e migração candidata",
  "bu": "Plurix",
  "partner": "N/A",
  "segment": "Cartonistas",
  "stages": [
    "Aquisicao"
  ],
  "subgroups": [
    "Ativo",
    "N/A"
  ],
  "channels": [
    "WhatsApp"
  ],
  "products": [
    "Classic"
  ],
  "credit_profiles": [
    "Pre_analisado"
  ],
  "offers": [
    "Padrao"
  ],
  "promotions": [
    "N/A"
  ],
  "records": 16,
  "first_date": "2025-06-04",
  "last_date": "2025-08-05",
  "observed_months": [
    "2025-06",
    "2025-07",
    "2025-08"
  ],
  "physical_combinations": 2,
  "journey_count": 12,
  "activity_name_count": 14,
  "definition": "Contatos a cartonistas; jornadas incluem tombamento e vendas, com etapa física Aquisicao.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "03-Dimensoes/Segmentos.md",
  "validation": "Separar migração/tombamento de nova aquisição. N/A não é Plurix confirmado.",
  "flags": [
    "Parceiro não resolvido",
    "Cartonistas registrados como Aquisicao"
  ],
  "name_signals": [
    "Tombamento/migração",
    "Tombamento grafia legada"
  ],
  "scope_key": {
    "bu": "Plurix",
    "segment": "Cartonistas",
    "partner": "N/A"
  }
}
```
