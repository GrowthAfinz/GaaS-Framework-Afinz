---
tags: [entidade, sfmc, data-extension, seguros, cross-sell, athena]
tipo: entidade
camada: entidades
aliases: [MAPA_SEGUROS, MAPA SEGUROS, mapa_seguro.csv, Mapa de Seguros]
atualizado: 2026-11-04
status: confirmado
status_detalhe: estrutura e volumes confirmados; significado de algumas flags e canal de venda a-validar
fonte: import da processos_seguros (print do operador, 23/10/2026); Query Studio 04/11/2026; operador (canal de venda, Você Bem); loja.afinzseguros.com.br e Reclame Aqui (04/11/2026)
---

# DE `MAPA_SEGUROS` (SFMC)

**Definição e propósito:** foto diária, por CPF, de **quais seguros e assistências cada cliente tem hoje**, com cadastro básico (nome, nascimento, idade, gênero). Gerada no Athena e devolvida ao Marketing Cloud pelo passo de import da [[Automacao-Processos-Seguros|processos_seguros]]. É a fonte de **posse** para segmentar, excluir quem já tem e, com o diff diário, medir venda por CPF.

> Status: grão, colunas e volumes = `confirmado` (04/11/2026). O que cada flag significa (posse vigente × inclui cancelada) = `a-validar` com quem gera o `mapa_seguro.csv`.

## Grão, chave e origem

- **Grão:** uma linha por CPF. 644.666 linhas = 644.666 CPFs (📊 04/11/2026).
- **Chave:** `CPF` (Text). Pode vir sem zero à esquerda: no join usar `RIGHT('00000000000' + CPF, 11)`.
- **Origem:** Athena → S3 `mapa_seguro.csv` (nome fixo) → Import com ação **Sobrescrever**.
- **Atualização:** diária, dentro da `processos_seguros` (~05h).
- **Universo:** maior que a [[DE-CLIENTES_ATIVOS]]: 515.216 CPFs (80%) cruzam com ela. Parece ser a carteira toda, incluindo contas fora da Ativos.

## Campos

Cadastro: `CPF`, `FIRST_NAME`, `DT_NASC`, `IDADE`, `GENERO_FISERV`, `SUPOSTO_GENERO`. Mais 18 colunas de produto (Number, 0/1).

| Coluna | CPFs com 1 | Canal de venda | Uso na segmentação |
|---|---:|---|---|
| `voce_bem_saude_super` | 178.564 | automático: plano pago após o período grátis | não é escolha ativa; usar só como contexto |
| `vbs_ate_6meses` | 110.315 | automático: Você Bem grátis nos 6 primeiros meses | janela de risco no início da cobrança |
| `seguro_combo_protecao_completa` | 46.459 | call / recuperação, em lançamento gradual | exclusão e contexto |
| `afinz_sos_dental_dia_e_noite` | 18.654 | call / recuperação | exclusão e contexto |
| `afinz_assit_residencial_24h` | 8.830 | **digital (CRM + LP)** | **único modelo de comprador da oferta digital** |
| `acidente_pessoal_completo` | 6.914 | call / recuperação | exclusão e contexto |
| `acidentes_pessoais_assistencias` | 600 | call / recuperação | idem |
| `voce_bem_saude_degustacao` | 300 | — | irrelevante |
| `seguro_diaria_internacao_hospitalar` | 89 | — | irrelevante |
| `seguro_residencial_plano_2` | 1 | — | descontinuado |
| `seguro_vida_mulher`, `seguro_residencial`, `seguro_residencial_plano_1`, `sorria_seguro`, `odontologico`, `dih_diaria_internacao_hospitalar`, `seguro_tranquilidade_premiada`, `seguro_renda_premiada_dih` | 0 | — | zeradas |

- **O Seguro Bem-estar Mulher não está na MAPA.** `seguro_vida_mulher` é zero para toda a base, embora o produto rode régua desde mar/2026. Tarefa `SEG-MAPA-MULHER` na Fila do GaaS.
- **Seguro Celular também não tem coluna.** O único dado de comprador de Celular são os leads da `LP_SEGUROS_GERAL`.
- **Você Bem:** o operador informa que entra grátis e passa a ser cobrado depois de 6 meses (`a-validar` com a área de seguros). A loja vende os planos Básico, Essencial, Super e Máximo. No Reclame Aqui há reclamações com o título "Cobrança indevida 'Você Bem Saúde Super', seguro não solicitado".
- **Canal de venda** de Dental, AP e Proteção Completa: call / recuperação, fora do digital (operador, 04/11/2026). Por isso a alta concentração em contas novas não indica perfil de comprador: indica passagem pelo canal.

## Gênero

| Campo | F | M | O / nulo |
|---|---:|---:|---:|
| `GENERO_FISERV` | 146.066 | 194.282 | **304.318 `O`** |
| `SUPOSTO_GENERO` | 409.347 | 217.617 | 17.702 nulos |

O `GENERO_FISERV` não serve: 47% vêm como `O`. Usar `SUPOSTO_GENERO`, que é inferido e cobre 97%. Validar gênero na LP do Mulher pelo cadastro **não funciona** com o dado da Fiserv.

## Regras de uso

1. Posse de um produto = coluna `> 0`. Usar `ISNULL(col,0)` antes de somar colunas.
2. Para perfil de comprador da **oferta digital**, usar só o Residencial (e o Mulher, quando entrar). Dental, AP e Proteção Completa medem o canal de call.
3. O `QUALQUER_SEGURO` ingênuo (soma de tudo) dá 315.608 CPFs (49%), quase todos do Você Bem. Não usar como indicador de comprador.
4. A MAPA é uma foto. Não diz quando o cliente comprou nem distingue "nunca teve" de "cancelou". O log de movimentos da [[Automacao-Processos-Seguros]] resolve isso daqui para frente.
5. O nome do arquivo no S3 é fixo. Se o Athena não gerar arquivo novo, o import repete o de ontem sem erro. Se o arquivo vier vazio ou truncado, a DE fica vazia: a verificação de contagem na automação existe para isso.

## Exemplo e validação

Diagnóstico (📊 Query Studio, 04/11/2026): `COUNT(*) = COUNT(DISTINCT CPF) = 644.666`; `MAX(seguro_vida_mulher) = 0`; Residencial 24h = 8.830; cruzamento com a CLIENTES_ATIVOS = 515.216. Perfil completo em [[Segmentacao-Seguros-Celular]].

## Lacunas e pendências

- Significado exato das flags (vigente × inclui cancelada × elegível) → impede medir cancelamento com segurança → quem gera a query do Athena → time de dados.
- Seguro Mulher fora da MAPA → sem perfil nem medição do Mulher → `SEG-MAPA-MULHER` → time de dados.
- Seguro Celular sem coluna → sem medição de venda do Celular → incluir junto com o Mulher → time de dados.
- Regra de cobrança do Você Bem e da Proteção Completa → janela de risco e classificação → área de seguros.

## Relacionado

[[Automacao-Processos-Seguros]] · [[Segmentacao-Seguros-Celular]] · [[10-Resultados/Mecanicas/Seguros|Seguros]] · [[DE-CLIENTES_ATIVOS]] · [[DE-MAPA_MCC]] · [[MOC-SFMC-DEs-e-Automations]]
