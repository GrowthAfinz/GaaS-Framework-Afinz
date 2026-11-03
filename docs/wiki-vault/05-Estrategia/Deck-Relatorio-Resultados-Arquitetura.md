---
tags: [estrategia,midia,deck,apresentacao,relatorio,financeiro]
tipo: estrategia
camada: estrategia
atualizado: 2026-08-21
status: confirmado
fonte: deck-aprovado
---

# Deck de Relatório de Resultados — Arquitetura de Referência

**Definição:** a arquitetura narrativa e de layout do deck de prestação de contas de mídia paga
por período (trimestre, mês) da Afinz — segunda arquitetura da skill `afinz-pptx`, distinta da do
Plano de Mídias. Referência aprovada: `Relatorio_Gastos_Trimestral_Midia_Paga_Mai-Jul26.pptx`,
7 slides, período maio–julho de 2026.

**Skill que executa:** `afinz-pptx`, seção "Relatório de Resultados — arquitetura alternativa".

## Quando usar esta arquitetura em vez do Plano de Mídias

| Situação | Arquitetura |
|---|---|
| Planejar o próximo ciclo, briefar criação | [Deck-Plano-de-Midias-Arquitetura](#deck-plano-de-midias-arquitetura) |
| Prestar contas de um período fechado a um diretor | Esta nota |
| Público quer só "quanto custou e o que trouxe" | Esta nota |

## A virada de tom

A primeira tentativa abriu com um número-herói de alerta — "metade da verba do trimestre não tem
leitura de retorno". Rejeitada: não por estar errada, mas porque diretor "só quer saber mais de
financeiro e o que é feito com a verba". A virada foi trocar diagnóstico por prestação de contas:
tabela limpa, sem alarme. **Regra derivada:** para público de diretoria, o corpo do slide é fato
financeiro; incerteza e diagnóstico de causa vivem no rodapé ou nas notas do apresentador, nunca
competindo com o número principal.

## Os 7 slides

1. Capa — "Mídia paga · Relatório de gastos trimestral"
2. Visão de investimento total — frente × objetivo × mês a mês × total × % da verba
3 a 6. Um slide por frente — tabela mês a mês: custo, impressões, CPM, cliques, CPC, resultado
principal, custo por resultado, mais linha de trimestre
7. A verba do próximo ciclo — frente × o que muda × verba anterior × verba nova

Sem divisórias, sem apêndice — é prestação de contas, não storytelling.

## Colunas de resultado mudam por objetivo da frente

| Frente | Colunas de resultado |
|---|---|
| Aquisição | Instalações · Custo por instalação · Inícios de proposta · Custo por início |
| Rentabilização | CTR — o clique já é o resultado, não force uma coluna extra |
| Seguros | Leads · Custo por lead |
| Plurix | Instalações — ou "(sem leitura)" se não confirmado, ver regra abaixo |

Todo valor monetário leva `R$`, incluindo CPM, CPC e custo por resultado — não só a linha de
custo total.

## Regra inegociável: nunca rotular um número sem confirmar a fonte

Lição mais cara desta arquitetura. O deck trazia "980 instalações" de Plurix em maio, puxado de
`paid_media_metrics.conversions`. Ao investigar direto no Meta Ads (MCP, `ads_get_ad_entities`
nível campanha), o indicador de instalação retornou **"Not available" para os três meses,
inclusive maio** — o 980 nunca foi confirmado como instalação. Nenhum campo testado (`app_install`,
`mobile_app_install`, `omni_app_install`, `landing_page_view`, `lead`, `post_engagement`) batia
com o número. O app +amigo do Plurix nunca foi cadastrado no AppsFlyer.

**Decisão:** remover o número e usar "(sem leitura)" nas três colunas, mesmo tendo valor
disponível no banco. Número sem fonte confirmada é pior que nenhum número.

**Rotina antes de rotular qualquer coluna de resultado:**

1. Nome de coluna no banco não é a verdade — confirme direto na plataforma (MCP Meta Ads,
   `results`/`cost_per_result` no nível de campanha).
2. Se a plataforma responder "Not available", o slide não pode levar esse rótulo.
3. Para evento de app, confira `appsflyer_governed_apps` — sem app cadastrado, não existe MMP.
4. Documente a causa raiz, não só "sem leitura".

## Risco de pipeline: dias inteiros podem faltar sem aviso

Comparando o gasto total do Meta (MCP) com `paid_media_metrics`, apareceu divergência de ~4,7%
no trimestre — em todas as frentes ao mesmo tempo, não uma campanha isolada. Causa: quatro datas
(28/06, 24/07, 25/07, 26/07) com só 2-3 campanhas registradas em vez de 5. Buraco de
sincronização, não erro de campanha. Detalhe completo em
[Falha-Sincronizacao-Meta-Supabase-4Dias-Ago26](#falha-de-sincronização-meta→supabase—quatro-dias-do-trimestre-mai–jul26).

**Checagem obrigatória antes de fechar qualquer relatório de período:** comparar calendário
completo de datas esperadas contra `paid_media_metrics` por frente, e cruzar qualquer buraco
com o gasto real do Meta antes de decidir corrigir ou registrar como pendência.

**Nesta ocorrência:** decisão do usuário foi não recalcular o deck já pronto em cima da hora —
registrar a pendência e corrigir no próximo fechamento. Escolha válida sob prazo, desde que
consciente.

## Referência

`Relatorio_Gastos_Trimestral_Midia_Paga_Mai-Jul26.pptx`, na raiz do repositório — versão final
aprovada, com edições manuais do usuário por cima da versão gerada. Comece um relatório novo
lendo esse arquivo para herdar geometria de tabela, espaçamento e rodapé.

## Relacionado

- [Deck-Plano-de-Midias-Arquitetura](#deck-plano-de-midias-arquitetura) ·
  [Quebra-de-Medicao-Aquisicao-B2C-Jun26](#quebra-de-medição-aquisição-b2c-junho-de-2026) ·
  [Falha-Sincronizacao-Meta-Supabase-4Dias-Ago26](#falha-de-sincronização-meta→supabase—quatro-dias-do-trimestre-mai–jul26) ·
  [Mídia-Paga](#mídia-paga)
