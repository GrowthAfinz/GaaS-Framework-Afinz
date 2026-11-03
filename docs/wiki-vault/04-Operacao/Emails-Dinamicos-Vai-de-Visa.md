---
tags: [operacao, sfmc, emails-dinamicos, ampscript, cloudpages, vai-de-visa, rentabilizacao]
tipo: operacao
camada: operacao
aliases: [E-mail dinâmico Vai de Visa, LP dinâmica Vai de Visa, LP Oferta Visa]
atualizado: 2026-11-03
status: a-validar
fonte: operador; desenho a partir de [[Emails-Dinamicos-SFMC]] e do Bloco 3 do Plurix V10
---

# E-mail e LP dinâmicos — Vai de Visa

**Definição e propósito:** como o e-mail e a landing page (CloudPage) do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Vai de Visa]] montam, **por CPF**, 4 ofertas escolhidas pela afinidade de compra, pelo limite disponível e pela célula do teste. Explica por que o motor de briefing atual não basta sozinho e qual padrão já existente reaproveitar.

> Status: desenho = `a-validar`; nada construído em 03/11/2026. Aguarda o KV de Black Friday do Marketing.

## Decisões de 03/11/2026 (vigentes)

- **Template-fonte novo** com o KV de Black Friday, usando o layout de referência com cards (logo, valor da oferta na cor da marca, descrição curta, CTA).
- **1º teste com 3 cards por e-mail**, sem reserva: o AMPscript busca as 3 linhas de [[DE-BRIEFING_OFERTAS_VISA]] por `ID_VERSAO` + `CD_GRUPO` (o grupo do cliente; células SEG-B e GEN-A usam `GENERICO`) em ordem de `NR_POSICAO`.
- O SQL **não grava ofertas por CPF**: a regra é fixa (grupo + versão + limite), então o que cada cliente viu é reconstruível pela `ID_VERSAO_OFERTAS` da [[DE-VDV_ENVIO]].
- A LP recebe o `ID_ENVIO` (aleatório) no link, nunca o CPF.

As seções abaixo registram o desenho inicial (6 slots, reservas); a mecânica de reserva volta quando o pool crescer.

## Por que o contrato de 36 colunas não resolve sozinho

O [[Emails-Dinamicos-SFMC|motor de e-mail dinâmico]] resolve o e-mail inteiro por `PRODUTO` × `TP_CAMPANHA` × `SEQUENCIA`: **todo mundo da campanha recebe o mesmo conteúdo**. No Vai de Visa, o conteúdo **muda por pessoa** — dois clientes da mesma campanha veem ofertas diferentes. O briefing não tem como guardar "a oferta de cada CPF".

## Padrão a reaproveitar: Bloco 3 do Plurix V10

O [[Emails-Dinamicos-Plurix|Plurix V10]] já resolveu um caso parecido: o Bloco 3 busca a oferta do dia em `DE_POOL_OFERTAS_PLURIX`, **separada do briefing**, e a regra é "sem oferta, o bloco some; o lookup nunca derruba o envio".

| Camada | De onde vem | Peça |
|---|---|---|
| Envelope (assunto, pré-cabeçalho, header com o KV, rodapé, nota legal, UTM) | briefing de 36 colunas, como hoje | `TB_BRIEFING_CAMPANHA_AQUISICAO` |
| Quem é e qual grupo/célula | audiência | [[DE-VDV_APTOS]] |
| As 4 ofertas | lookup por grupo + limite | [[DE-BRIEFING_OFERTAS_VISA]] |

## Lógica dos slots (AMPscript, esboço)

```
SET @grupo  = AttributeValue("CD_GRUPO_PRINCIPAL")
SET @celula = AttributeValue("DS_CELULA_TESTE")
SET @limite = AttributeValue("VL_LIMITE_DISPONIVEL")
IF @celula == "SEG-B" OR @celula == "GEN-A" THEN SET @grupo = "GENERICO" ENDIF
SET @rows = LookupOrderedRows("DE_VDV_OFERTAS", 0, "NR_PRIORIDADE ASC", "CD_GRUPO", @grupo)
/* percorrer @rows: manter só DT_INICIO <= hoje <= DT_FIM e VL_LIMITE_EXIGIDO <= @limite, até 4 */
/* se < 4: completar com LookupOrderedRows(..., "FL_TOP_VENDIDA", 1) aplicando o mesmo filtro */
/* nunca RaiseError por falta de oferta */
```

`LookupOrderedRows` só filtra por igualdade; vigência e limite são filtrados no loop. Células SEG-C e GEN-C ficam fora do envio pelo filtro da jornada, não pelo e-mail.

## LP dinâmica (CloudPage) para SMS e WhatsApp

- Mesma lógica dos slots, recebendo o CPF por parâmetro de URL **criptografado ou por ID opaco**, nunca CPF aberto no link.
- SMS/WhatsApp levam o link da LP; a mensagem segue a estrutura de briefing do [[Iniciativa-Pool-de-Ofertas-Parceiros|Pool de Ofertas - Parceiros]].
- Formatação de variáveis e espaçamento: [[Formatacao-WhatsApp-Variaveis-e-Espacamento]]; opt-out: [[WhatsApp-Respostas-de-Opt-out]].
- Precedente de LP com captura em DE: LPs de seguros no CloudPages (blocos HTML/AMPscript gravando em DE única).

## Checklist de QA (antes do Test Send)

- [ ] Um CPF de teste por grupo b1–b7 e um do Genérico, mais um com limite baixo (só ofertas de R$ 200).
- [ ] Cliente de Eletrônicos com limite < R$ 1.650 vê 1 oferta do grupo + 3 genéricas.
- [ ] Nenhum slot vazio, nenhum `RaiseError` por oferta.
- [ ] Oferta vencida não aparece (testar mudando a data de vigência).
- [ ] Cupom `NÃO POSSUI` não aparece como texto.
- [ ] Links `tidd.ly` abrem e mantêm o rastreio de afiliado.
- [ ] Personalização no formato `%%=v(@FirstName)=%%` (ver [[Emails-Dinamicos-SFMC]]).

## Ideia: Fábrica como fonte de verdade das ofertas

A [[Fabrica-de-Emails-GaaS|Fábrica]] já tem a aba "Header e ofertas" que alimenta o pool do Plurix V10. Usar a mesma aba para manter `DE_VDV_OFERTAS` daria versão, prévia e histórico ao catálogo, em vez de planilha solta. *Proposta, não decidida.*

## Lacunas e pendências

- Layout com KV de Black Friday não aprovado → bloqueia o HTML → Marketing.
- Limite de 4 ofertas no layout (informado por Pablo, 03/11/2026) → define o número de slots → confirmado.
- Forma de passar o cliente para a LP sem expor CPF → requisito LGPD → definir na construção → Pablo.

## Relacionado

[[Emails-Dinamicos-SFMC]] · [[Emails-Dinamicos-Plurix]] · [[Servico-Emails-Dinamicos]] · [[DE-BRIEFING_OFERTAS_VISA]] · [[DE-VDV_APTOS]] · [[Teste-Afinidade-MCC-vs-Generico]] · [[MOC-SFMC-DEs-e-Automations]]
