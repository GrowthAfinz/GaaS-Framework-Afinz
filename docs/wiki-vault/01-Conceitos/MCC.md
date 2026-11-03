---
tags: [conceito, mcc, transacao, afinidade, rentabilizacao]
tipo: conceito
camada: conceitos
aliases: [MCC, Merchant Category Code, Código de categoria do estabelecimento, Afinidade por MCC]
atualizado: 2026-11-03
status: confirmado
fonte: ISO 18245 (definição); spec Vai de Visa "Spec DE - IN" (de-para proposto); perfil da MAPA_MCC 03/11/2026
---

# MCC — Merchant Category Code

**Definição e propósito:** código de 4 dígitos (padrão ISO 18245) que o adquirente atribui ao **estabelecimento**, indicando o ramo de atividade dele. Toda autorização de compra carrega o MCC do lojista. Na Afinz, agrupar o gasto do cliente por MCC permite inferir **afinidade de consumo** (Moda, Pet, Viagem…) e personalizar comunicação de rentabilização, seguros e mídia.

> Status por seção: definição = `confirmado`; de-para Afinz = `a-validar` com a processadora; usos futuros = `inferência`.

## Contexto e conceitos próximos

- **MCC ≠ produto comprado.** Uma farmácia (5912) vende remédio e maquiagem; um marketplace (5399) vende tudo. O MCC diz *onde* o cliente comprou, não *o quê*.
- **MCC ≠ nome do estabelecimento.** O nome que aparece na autorização (ex.: `RIACHUELO`, `PAGSEGURO*LOJA`) é outro campo; é o que se usa para dizer se a compra foi **num parceiro específico**.
- **Categoria de campanha:** agrupamento de vários MCCs (ex.: Moda = 5611, 5621, 5631, 5651, 5655, 5661, 5691, 5699). Quem define é o de-para, não o código.
- **Afinidade:** regra sobre o histórico (ex.: ≥ 2 compras na categoria em 6 meses). É decisão de negócio, não propriedade do MCC.

## De-para usado no Vai de Visa (proposta inicial)

| Categoria | Grupo | MCCs | Observação |
|---|---|---|---|
| Moda | b1 | 5611, 5621, 5631, 5651, 5655, 5661, 5691, 5699 | |
| Saúde e Beleza | b2 | 5912, 5977, 7230, 7298 | **5912 farmácia é misto** — mantido no MVP |
| Eletrodomésticos | b3 | 5722 | |
| Eletrônicos | b4 | 5732, 5734, 5045, 5946, 4812 | |
| Brinquedos | b5 | 5945, 5641 | 5641 (vestuário infantil) é **proxy** de público com filhos |
| Viagem | b6 | 3000–3299 (aéreas), 3351–3441 (locadoras), 3501–3999 (hotéis), 4511, 4722, 7011, 7512, 4411, 4131 | faixas por companhia/rede |
| Pet | b7 | 5995, 0742 | |
| Fora do MVP | FORA | 5311, 5399, 5964, 5999 | lojas de departamento, marketplace, e-commerce genérico, varejo diverso |

Fonte: aba "Spec DE - IN" da spec Vai de Visa. A IN deve validar com a tabela da processadora; o arquivo [[DE-MAPA_MCC]] já chega agregado nessas categorias (mais `fora_mvp` e `nao_mapeado`).

## Regras, condições e limites

1. **MCC misto não prova afinidade.** Farmácia infla Saúde e Beleza: 44% das contas da MAPA compraram nessa categoria (📊 03/11/2026). Ler o grupo b2 sabendo disso.
2. **Marketplace esconde a categoria.** Compra de tênis num marketplace cai em 5399 (Fora do MVP), não em Moda.
3. **Gateway distorce o nome do estabelecimento**, não o MCC: compra online pode vir como `PAGSEGURO*`, `MP*`. Afeta a medição de conversão por parceiro, não a afinidade.
4. **"Não mapeado" é a maior parte do gasto.** Mediana de R$ 3,6 mil por conta em 12 meses, contra R$ 380–430 nas categorias MVP — provavelmente mercado e serviços do dia a dia. Não usar como afinidade.
5. **Janela importa.** Categorias de alta frequência (Moda, Saúde e Beleza, Pet) usam 6 meses; baixa frequência (Eletro, Eletrônicos, Brinquedos, Viagem) usam 12.
6. **Contagem de compras:** a regra pede parcelado = 1 compra e exclui estornos. Confirmar como a fonte conta antes de usar limiar de quantidade.

## Exemplo e validação

> 📊 Perfil da [[DE-MAPA_MCC]], 652.614 contas, janela 23/10/2025 a 22/10/2026.

| Categoria | Contas com compra | % | Mediana de valor (quem comprou) |
|---|---:|---:|---:|
| Saúde e Beleza | 289.167 | 44,3% | R$ 383,70 |
| Moda | 233.554 | 35,8% | R$ 425,38 |
| Eletrônicos | 103.290 | 15,8% | R$ 150,00 |
| Pet | 90.083 | 13,8% | R$ 120,36 |
| Viagem | 48.897 | 7,5% | R$ 288,39 |
| Eletrodomésticos | 43.574 | 6,7% | R$ 151,95 |
| Brinquedos | 38.412 | 5,9% | R$ 89,90 |
| Fora do MVP | 223.574 | 34,3% | R$ 337,88 |
| Não mapeado | 450.001 | 69,0% | R$ 3.613,11 |

47% dos CPFs não têm compra em nenhuma categoria MVP: para eles, personalização por MCC não existe e a comunicação é genérica.

## Usos na operação (atuais e potenciais)

| Uso | Como o MCC entra | Estado |
|---|---|---|
| Rentabilização por afinidade | grupo b1–b7 escolhe as ofertas | em uso: [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]] |
| Medição de conversão por categoria | compra em MCC da categoria após o envio | planejado: [[Teste-Afinidade-MCC-vs-Generico]] |
| Seguros | Viagem → seguro viagem (Assist Card e Allianz Travel já estão no catálogo VDV); Pet → seguro pet | `inferência` — ver [[10-Resultados/Mecanicas/Seguros\|Seguros]] |
| Vibe resgate | as 250+ marcas de resgate cobrem delivery, moda, beleza, pets — mesmas categorias | `inferência` — ver [[Vibe]] |
| Mídia paga | audiência por afinidade e lookalike de compradores de uma categoria | `inferência` — ver [[Ativacao-de-Audiencias-Diaria]] |
| Pressão de contato | evitar oferecer a mesma categoria em duas frentes na mesma semana | `inferência` — ver [[Anti-Overlap-Pressão-de-Contato]] |

## Fontes e evidências

ISO 18245 para a definição; spec Vai de Visa (out/2026) para o de-para; perfil do arquivo MAPA_MCC recebido em 03/11/2026 para os números.

## Lacunas e pendências

- De-para não validado com a processadora → grupo pode estar errado em MCCs de borda → tabela oficial da processadora → IN.
- Sem dado de canal (presencial × online) → afinidade não distingue loja física de site → campo de canal na transação → IN, a confirmar.

## Relacionado

[[DE-MAPA_MCC]] · [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]] · [[Teste-Afinidade-MCC-vs-Generico]] · [[Incentivo-ao-Uso]] · [[Segmentos]]
