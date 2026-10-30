# Anatomia do pacote do Package Manager

Levantado em 06/10/2026 a partir de dois pacotes reais (Plurix CRM e B2C NGD v1/v2).

## Estrutura do ZIP

```
info.json                 nome, versão do pacote, config (preserveCategories, storeImagesAsReferences)
input.json                campos pedidos no deploy (classificação de envio, conta de WhatsApp, código SMS, domínio CloudPages)
selected-entities.json    o que foi selecionado à mão (o resto entrou como dependência)
references.json           grafo de dependências: item → [{identifier, relationship}]
entities/<tipo>/<id>.json um arquivo por item: {issues, originID, originEID, data}
```

Tipos que aparecem: `journeys`, `eventDefinitions`, `dataExtensions`, `sharedDataExtensions`,
`attributeGroups`, `attributeSets`, `attributeRelationships`, `assets`, `categories` (pastas),
`registeredCustomActivities` (WhatsApp), `dataFilters`, `cloudPageCollections`, `landingPages`.

- **DEs vêm só com estrutura** (campos, tipos, chave primária). Nenhum registro.
- Filtros que usam grupos do Contact Builder puxam o **grupo inteiro** com todas as DEs ligadas
  (pacotes de 1 jornada chegaram com 23 a 37 DEs).

## Referências internas

- `{{mcpm#/entities/<tipo>/<id>/data/<caminho>}}`: aponta pra outro item do pacote. O `<id>` é o
  ID real na BU de origem. `.../fields/name:SEQUENCIA/id` aponta para um campo.
- `{{mcpm:<campo>}}`: campo pedido no deploy (ex.: `sendClassification-marketing`,
  `whatsapp-account|path:ottPlatformAttributes.channelId`, `smsCode`).

## Jornada (`entities/journeys/*.json` → `data`)

`name`, `key`, `version`, `entryMode` (ex.: `SingleEntryAcrossAllVersions`), `categoryId`
(pasta), `defaults` (email/telefone vindos do evento), `triggers[0]` (entrada: tipo,
`description` com o filtro legível, `configurationArguments.criteria` em XML),
`activities[]`, `goals[]`, `exits[]`.

Cada atividade: `key` (ex.: `WHATSAPPACTIVITY-1`), `type`, `name` (= Activity Name da taxonomia),
`outcomes[]` com `next` (próxima atividade) e `metaData.label` / `criteriaDescription`.
O fluxo é um grafo: a raiz é a atividade que nenhuma outra aponta como `next`.

| type | O que importa |
|---|---|
| `MULTICRITERIADECISION` | `configurationArguments.criteria[<outcome>]` (XML); rótulo e `criteriaDescription` no outcome; `remainder_path` = "Restante" |
| `RANDOMSPLIT` | `outcomes[].arguments.percentage` |
| `WAIT` | `waitDuration`, `waitUnit`, `specifiedTime`, `timeZone` |
| `WAITUNTILCHATRESPONSE` | espera resposta no WhatsApp: `keywords`, `waitDuration`; outcomes por palavra, `EventFired` (respondeu outra coisa), `no_event` (não respondeu). **Package Manager avisa que não suporta.** |
| `UPDATECONTACTDATA` | `arguments.activityData.updateContactFields[]` (DE, campo, valor) |
| `EMAILV2` | `configurationArguments.triggeredSend.emailId` → asset; `emailSubject` |
| `SMSSYNC` | texto em `metaData.store.selectedContentBuilderMessage`; `fromName`; asset |
| `WHATSAPPACTIVITY` | `configurationArguments.assetId` → asset; `requestBody.template.name` (template Meta) e `components[].parameters[].text` (o que preenche `${1}`, `${2}`) |

## Asset de WhatsApp (`entities/assets/<id>.json`)

`views.whatsAppTemplate.meta.options.customBlockData`:
`display:message` (texto com `${n}`), `display:footer`, `display:message:parameters.N.display:argument`,
`display:buttons.button1.value` (link OneLink com `af_sub`), `button1.title`, `button2.title`
(resposta rápida, ex.: "Não tenho interesse agora"), `display:title:parameters.1.display:media:filename` (banner).
Ignorar os blocos `selectedTemplate`, `.template.` e `languages` (cópias do template original).

O asset de opt-out é `whatsAppSession` (mensagem de sessão, sem template Meta).

## Asset de SMS

`views.sms...displaymessage` (ou o texto direto na atividade `SMSSYNC`).

## Asset de e-mail dinâmico

HTML com AMPscript. O texto vem da DE de briefing (`TB_BRIEFING_CAMPANHA_AQUISICAO`), não do pacote.
O pré-cabeçalho pode carregar o bloco de inicialização do AMPscript (caso do PLURIX V12).


## Cobertura: o pack cobre o mês?

Um pacote traz só as jornadas escolhidas na exportação, de uma BU do SFMC. Antes de dizer que
"o mês está carregado", cruze com `activities`:

```sql
with s as (select "Canal" canal, "BU" bu,
  regexp_replace(upper(btrim(coalesce(jornada,''))),'^JOR_AQUISICAO_','JOR_AQS_') jor
  from activities where "Data de Disparo" between '<ini>' and '<fim>'
  and (jornada ilike 'JOR_AQ%' or "Activity name / Taxonomia" ilike '%_aqs_%'))
select (jor = any(array[<jornadas do pack normalizadas>])) no_pack, bu, canal, jor, count(*) disparos
from s group by 1,2,3,4 order by 1 desc, 5 desc;
```

Exemplo (pack 07/10/2026 9_50, set/26): o pack cobria 30 de 458 disparos de aquisição.
Ficaram de fora carrinho diário (B2C `JOR_AQS_B2C_CARRINHO_REATIVACAO_VIBE_PAD_26` SMS+WPP,
BB `JOR_AQS_BB_CARRINHO_REATIVACAO_VIBE_PAD_26`), topo CRM por semana (`..._BP_AQUISICAO_..._SEM*`,
`..._BB_CRM_AQUISICAO_..._SEM*`, os e-mails) e todo Plurix (outra BU do SFMC).
