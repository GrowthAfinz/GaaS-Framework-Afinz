---
tags: [estrategia, experimento, teste, holdout, mcc, vai-de-visa, rentabilizacao]
tipo: estrategia
camada: estrategia
aliases: [Teste SEG GEN, Teste A/B/C Vai de Visa, Afinidade MCC vs genérico, SEG-A SEG-B SEG-C]
atualizado: 2026-11-03
status: a-validar
fonte: aba "Estratégia de Ativação" da spec Vai de Visa (gestora, out/2026); decisões de 03/11/2026, operador
---

# Teste: afinidade por MCC × oferta genérica

**Definição e propósito:** desenho de [[Experimento|experimento]] do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Vai de Visa]] que responde duas perguntas ao mesmo tempo: (1) **escolher a oferta pela categoria em que o cliente compra vende mais do que mandar as mesmas ofertas para todos?** (2) **a campanha gera compra que não aconteceria de qualquer jeito?** O desenho pode ser reaproveitado por qualquer campanha de rentabilização com personalização.

> Status: desenho = `confirmado` pela spec; execução = `a-validar` (não iniciado).

## Hipótese

Clientes com afinidade de compra em uma categoria convertem mais quando recebem ofertas dessa categoria do que quando recebem ofertas genéricas (top Visa), e ambos convertem mais que um controle sem envio. Ver [[Hipótese]].

## Células

Separar a base em dois tipos de cliente:

| Tipo | Célula | % do grupo | Recebe | Pergunta |
|---|---|---:|---|---|
| **SEG** — tem afinidade (b1–b7) | **SEG-A** | 45% | 4 ofertas da sua categoria (filtradas pelo limite) | segmentar converte mais que o genérico? |
| | **SEG-B** | 45% | 4 ofertas genéricas | base de comparação da segmentação |
| | **SEG-C** | 10% | nada (controle) | a campanha gera venda incremental? |
| **GEN** — sem afinidade | **GEN-A** | 90% | 4 ofertas genéricas | o disparo genérico funciona para quem não tem perfil? |
| | **GEN-C** | 10% | nada (controle) | incrementalidade do genérico |

Exemplo sintético: a Maria compra muito em Moda (b1). Se cair em SEG-A, recebe Zattini, Hering, Puma, Riachuelo; em SEG-B, Nike, Movida, Decolar, oBoticário; em SEG-C, nada.

## Regras de entrada e desempate

- Moda, Saúde e Beleza, Pet (alta frequência): ≥ 2 compras em 6 meses. Eletrodomésticos, Eletrônicos, Brinquedos, Viagem (baixa): ≥ 2 compras em 12 meses.
- Mais de um grupo: mais compras na janela → maior gasto em 12 meses → prioridade (Moda 1, Saúde e Beleza 2, Viagem 3, Eletrodomésticos 4, Pet 5, Eletrônicos 6, Brinquedos 7).
- Sem grupo → Genérico. Casa, Presentes, Alimentos e Bebidas, Educação e Varejo não têm grupo próprio.

### Decisão `V1_12M_REC6M` (03/11/2026)

A [[DE-MAPA_MCC]] só tem quantidade em 12 meses. Regra aplicada para os grupos de alta frequência: **≥ 2 compras em 12 meses E última compra na categoria ≤ 6 meses**. Gravar `CD_REGRA_GRUPO = 'V1_12M_REC6M'` em cada cliente.

**Por que o teste continua válido:** a comparação SEG-A × SEG-B acontece **dentro do mesmo grupo**, com sorteio aleatório. Uma regra de entrada menos precisa afeta as duas células igualmente: o teste não fica viesado, só pode medir um lift menor (afinidade diluída). Erro conservador, aceitável no MVP.

### Primeiro teste (safra `VDV_2026_11_BF`, decisão de 03/11/2026)

Só três grupos, com 3 ofertas cada: **MODA**, **SAUDE_BELEZA** e **FAMILIA_PRESENTES** (afinidade de Brinquedos); o resto cai no **GENERICO**. Vitrines em [[DE-BRIEFING_OFERTAS_VISA]]. FAMILIA_PRESENTES tende a ser pequeno (5,9% das contas compram Brinquedos): ler como indício.

### Sorteio implementado: duas camadas

| Camada | Código | Pergunta |
|---|---|---|
| Controle 10% | fixo `VDV_CONTROLE` | o programa gera uso a mais? (permite controle perene) |
| A × B 50/50 | por safra (`VDV_2026_11_BF`) | personalizar funciona neste tema? |

Se a decisão for sortear o controle a cada safra, basta trocar o código fixo pelo da safra. Implementação em [[DE-VDV_APTOS]].

## Princípios de execução

1. **Sortear depois do filtro do canal principal** (e-mail). Se o sorteio incluir quem nunca poderia receber, o controle fica com gente inalcançável e o lift sai inflado.
2. **Semente fixa** sobre o CPF (ex.: `ABS(CHECKSUM(CPF)) % 100`), para a célula ser a mesma em toda execução.
3. **Congelar grupo e célula no envio.** A base é recalculada, a célula de quem já entrou no teste não.
4. SMS/WhatsApp entram como reforço **dentro das mesmas células**, nunca como célula nova.

## KPIs

| KPI | Definição | Fonte |
|---|---|---|
| Abertura e clique | aberturas e cliques ÷ envios (SEG-A, SEG-B, GEN-A) | Marketing Cloud |
| Conversão na oferta | % de clientes com compra no estabelecimento da oferta até 30 dias após o envio | `DE_VDV_RESPOSTA` |
| Conversão na categoria | % com compra em MCC da categoria até 30 dias | `DE_VDV_RESPOSTA` |
| Gasto incremental | gasto médio da célula − gasto médio do controle | `DE_VDV_RESPOSTA` |
| Lift da segmentação | conversão SEG-A − conversão SEG-B, por grupo | `DE_VDV_RESPOSTA` |
| Descadastro | opt-outs ÷ envios | Marketing Cloud |

Janela de conversão: 30 dias após o envio. Na Black Friday todo mundo compra mais, por isso o controle é obrigatório.

## Limites da medição

- **Nome do estabelecimento é frágil:** compra online pode vir como gateway (`PAGSEGURO*`, `MP*`), e a conversão na oferta sai subestimada justamente no canal das ofertas. A conversão na categoria (por [[MCC]]) é mais robusta.
- **Caminho melhor:** na [[Iniciativa-Copa-2026|Copa 2026]] a fonte da verdade foi o BI da Visa (`copa_visa_daily`). Pedir à Visa dado de resgate por oferta/cupom no mesmo formato resolveria a atribuição.
- **Grupos pequenos** (b3, b4, b5) podem não ter volume para ler incrementalidade com 10% de controle. Ler o lift desses grupos como indício.
- **Grupo b2 inflado por farmácia** (MCC misto): o lift de b2 mede mais farmácia que beleza.

## Safras e acompanhamento

- Campanha **perene**; cada tema é uma safra (`ID_SAFRA`, ex.: `VDV_2026_11_BF`). Grupo e célula congelados por safra em [[DE-VDV_ENVIO]].
- **Leituras:** D+7 e D+15 (acompanhamento) e **D+30 (oficial)**, sempre pela célula sorteada.
- **Saídas da IN:** relatório agregado (safra × grupo × célula) e, proposto, resultado por cliente de volta no MC (`VDV_RESULTADO`) para virar ação (repique, não repetir oferta, Viagem → seguro).
- **Safras sobrepostas (proposta):** leitura por safra atribui a compra à **última safra recebida**; leitura do programa compara recebeu × controle perene **por mês**.

## Regra de decisão (proposta)

Segmentar nas próximas ondas quando SEG-A > SEG-B com significância nos grupos com volume (b1, b2), e SEG-A/SEG-B > SEG-C. Sem lift: manter genérico e reavaliar o critério de afinidade. Usar o calculador de significância do Diário de Bordo (aba Experimentos do GaaS).

## Relacionado

[[Experimento]] · [[Hipótese]] · [[Sistema-de-Experimentacao-Referencias]] · [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]] · [[DE-VDV_APTOS]] · [[MCC]] · [[Incentivo-ao-Uso]]
