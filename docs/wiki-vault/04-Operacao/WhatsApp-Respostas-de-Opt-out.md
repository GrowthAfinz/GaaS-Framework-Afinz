---
tags: [crm, whatsapp, opt-out, jornada, governanca, aprendizado]
tipo: contrato
camada: operacao
atualizado: 2026-10-26
status: confirmado
fonte: confirmacao-direta-do-responsavel
---

# WhatsApp — respostas de opt-out

## Significado confirmado em 26/10/2026

Nas activities de WhatsApp, o sufixo `_resposta_optout_pontual` identifica a
**mensagem de resposta enviada após a pessoa clicar em “Não tenho interesse agora”
nos templates**. A regra é geral para WhatsApp: não se limita aos nomes
`afz_car_vis_*` e `afz_car_bbt_*`, nem ao segmento ANC.

O termo `pontual` faz parte do nome operacional da resposta. Ele não define
o subgrupo do público; tampouco autoriza sugerir `Diario`, `Abandonados D-7`
ou `Abandonados D-21 A D>7`.

É uma resposta operacional ao interesse negativo. A mensagem principal do
template, o clique no botão e a resposta de opt-out são eventos distintos.
O nome da activity, sozinho, não comprova a configuração técnica de supressão
global nem substitui o evento original do clique.

## Classificação e identidade

- A resposta herda o contexto da sua jornada e execução. O mesmo Activity Name
  pode ser reutilizado em jornadas e públicos diferentes.
- Não identificar o segmento apenas por `apr`, pelo texto da resposta ou pelo
  histórico global da mesma activity. Não juntar jornadas ou copiar resultados
  entre elas porque compartilham a resposta padrão.
- Para **ANC / Aprovados_nao_convertidos**, o responsável confirmou:
  **Etapa = Meio_de_Funil; Subgrupos = N/A (sem subgrupo)**.
- A confirmação inclui os casos de `JOR_AQS_BB_NA_ANC_MEIO_DE_FUNIL_PAD_VIBE_SET26`
  e `JOR_AQS_BB_NA_ANC_MEIO_DE_FUNIL_PAD_VIBE_OUT26` revisados no CSV (63).
- `JOR_AQS_BB_*` é uma forma abreviada observada de Bem Barato / B2B2C;
  reconhecer a dimensão sem renomear automaticamente a jornada persistida.
- A regra ANC não transforma respostas de outras jornadas, como carrinho,
  automaticamente em Meio de Funil. O contexto da jornada continua prevalecendo.

## Causa do erro observado no parser

O histórico da mesma activity compartilhada, de segmentos e de tokens semelhantes
oferecia subgrupos de carrinho para uma jornada ANC. O formato abreviado
`JOR_AQS_BB_*` também não era reconhecido pelo parser canônico, deixando a etapa
dependente dessas sugestões. Assim apareceram Reativacao e Abandonados D-21 A D>7.

A correção local reconhece o formato abreviado; fixa ANC em Meio_de_Funil / N/A;
retira etapa e subgrupos incompatíveis da lista de sugestões; e impede que respostas
de opt-out usem histórico da mesma activity em outras jornadas, buckets globais,
tokens ou outros segmentos para completar suas dimensões.

Implementação local em 26/10/2026: `intelligentImportRouting.ts` e
`intelligentUpdateEngine.ts`, usados pela skill e pelo checkout do Atualizador
Inteligente. Isso não confirma publicação do código na aplicação em produção.

## Melhorias propostas para acompanhamento

Estas são propostas, ainda não implementadas:

1. Distinguir mensagem principal, clique em “Não tenho interesse agora” e resposta
   enviada/entregue no catálogo e na visualização de jornadas.
2. Relacionar a resposta ao template, botão e execução de origem, preservando
   jornada, BU, parceiro, canal e período. Registrar a evidência do vínculo.
3. Acompanhar cliques no botão, pessoas únicas, respostas enviadas e entregues,
   repetição e tempo entre o clique e a resposta, quando essas fontes existirem.
4. Separar esses eventos na análise de volume e de conteúdo para evitar que uma
   resposta automática seja interpretada como uma nova comunicação principal.
   Qualquer mudança nos indicadores atuais precisa de contrato e validação próprios.
5. Investigar propostas/cartões associados às activities de resposta no BI.
   Associação no export não demonstra que a mensagem de opt-out gerou conversão.

Sem identificadores de pessoa/evento e população compatível, contagem de mensagens
não deve ser apresentada como contagem de pessoas nem como taxa de opt-out única.

## Relacionado

- [[Importador-Segmentacao-Aquisicao-2026-10]]
- [[Jornada-Disparos]]
- [[activities]]
- [[Canais]]
