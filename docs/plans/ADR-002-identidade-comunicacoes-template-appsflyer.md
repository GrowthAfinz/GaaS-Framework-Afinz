# ADR-002 — Identidade de comunicações, assets e AppsFlyer

- Status: aceito
- Data: 2026-06-21
- Escopo: CRM no GaaS, com integração futura à visão de criativos de mídia paga

## Contexto

O GaaS já registra a execução e a performance de CRM em `activities` e os
criativos de mídia paga em `ad_creatives`. O conteúdo utilizado nos disparos
CRM, porém, ainda não possui identidade visual persistente. Isso impede responder
com segurança qual comunicação foi reutilizada, comparada ou associada a um
resultado.

A planilha geradora de links AppsFlyer já adota a semântica correta, mas ainda é
um protótipo operacional: `af_ad` recebe o Activity Name e `af_ad_id` recebe o
identificador do template.

## Decisão

O GaaS passa a distinguir quatro conceitos:

1. `activity`: instância de execução de um disparo.
2. `template_id`: identidade estável do conteúdo reutilizável.
3. asset: representação física do conteúdo no Storage.
4. link de atribuição: uso rastreável de um template em uma activity.

O modelo inicial será formado por:

- `communication_templates`;
- `communication_slots`, para governar as posições recorrentes das réguas;
- `activities.template_id`, opcional para preservar o histórico atual;
- `attribution_links`;
- bucket privado `crm-communications`.

## Invariantes

### Identidade do template

- `template_id` identifica o conteúdo, não a execução.
- Data, safra, segmento e Activity Name não fazem parte do `template_id`.
- Reuso do mesmo conteúdo preserva o mesmo `template_id`.
- Mudança visível de copy, oferta, CTA ou layout cria nova versão.
- Ajuste técnico invisível não cria nova versão.
- O padrão inicial usa identificadores legíveis, por exemplo:
  `WPP-CARRINHO-01`, `WPP-CARRINHO-01A`, `WPP-CARRINHO-01B`.

### AppsFlyer

`onelink_template_id` e `template_id` são conceitos diferentes:

- `onelink_template_id`, por exemplo `9ODN`, identifica infraestrutura OneLink;
- `template_id`, por exemplo `WPP-CARRINHO-01A`, identifica conteúdo CRM.

Contrato de parâmetros:

| Parâmetro | Origem | Semântica |
| --- | --- | --- |
| `pid` | valor fixo `crm` | media source de governança |
| `af_channel` | canal da activity | canal real |
| `c` | campanha/jornada | campanha CRM |
| `af_adset` | segmento/base | público |
| `af_ad` | Activity Name | execução e reconciliação |
| `af_ad_id` | `template_id` | conteúdo utilizado |
| `af_sub1` | `template_id` | espelho para BI/raw data |
| `af_sub4` | BU | unidade de negócio |
| `deep_link_value` | destino | rota desejada no app |

O mesmo template pode gerar links diferentes quando utilizado em activities
diferentes. Por isso, a URL gerada pertence a `attribution_links`, não ao
registro mestre do template.

### Cobertura e backfill

O histórico anterior à adoção deste modelo não terá backfill obrigatório. Ele
será enriquecido sob demanda quando houver valor analítico ou evidência segura.

Para réguas atuais, a unidade de gestão é o `communication_slot`, identificado
por `jornada + Activity Name + canal`:

- recorrência recente pode criar um slot `candidate`, mas nunca ativá-lo;
- `active`, `paused` e `retired` são decisões explícitas do operador;
- slots ativos precisam ter responsável e cobertura acompanhada;
- `ready` exige um `current_template_id`;
- a troca do template vigente altera o slot, mas não reescreve activities já
  executadas;
- na ingestão futura, um slot ativo e pronto fornece automaticamente o
  `activities.template_id` da nova execução;
- ausência de cobertura não apaga nem bloqueia o dado executado: gera pendência
  operacional visível.

O sistema deve separar três níveis de tratamento:

1. histórico: opcional e sob demanda;
2. réguas ativas: inventário e governança obrigatórios;
3. novos disparos: associação automática sempre que o slot estiver pronto.

### Enriquecimento pelo Framework

O enriquecimento visual não cria uma taxonomia paralela para `Oferta` e
`Promocional`. `activities` permanece a fonte semântica oficial das dimensões do
Framework.

- `Oferta + Promocional` é uma chave composta e deve ser resolvida pelo
  histórico de activities equivalentes;
- alegações visíveis no print, como limite, créditos Vibe, desconto e urgência,
  são metadados criativos separados;
- `Oferta 2 + Promocional 2` segue a mesma lógica de contexto histórico;
- valores físicos como `Padrao` e `N/A` devem ser preservados como estão no
  banco;
- erros de origem, como `#DIV/0!`, não podem ser propagados;
- cada campo enriquecido deve registrar proveniência e confiança;
- na ausência de match seguro, o sistema apresenta candidatos e exige revisão,
  sem inventar classificação.

### Storage

- O banco guarda caminhos e metadados, nunca o binário.
- O bucket CRM é privado e acessado por URL assinada.
- Os caminhos são determinísticos e versionados:

```text
crm-communications/{template_id}/{version}/original.ext
crm-communications/{template_id}/{version}/preview.webp
crm-communications/{template_id}/{version}/thumbnail.webp
```

- Arquivos não são sobrescritos entre versões.
- O hash serve para detectar conteúdo duplicado, sem bloquear deliberadamente
  registros distintos.

## Modelo inicial

### `communication_templates`

Catálogo mestre e visual das comunicações CRM. Mantém identidade, canal, estado,
caminhos dos assets e metadados mínimos.

### `activities.template_id`

FK opcional para `communication_templates`. Registros históricos permanecem
válidos sem backfill imediato. O backfill deve ocorrer em processo auditável,
com confiança e revisão humana para casos ambíguos.

### `communication_slots`

Cadastro operacional das posições de comunicação nas réguas. Mantém ciclo de
vida, cobertura, template vigente, responsável, prazo de revisão e última
ocorrência observada. Resolve a gestão do presente sem impor completude ao
histórico.

### `attribution_links`

Registra a URL e o snapshot dos parâmetros AppsFlyer por activity, template,
destino e versão do link.

## Segurança

- As novas tabelas usam RLS.
- Apenas usuários autenticados podem ler e gerenciar o catálogo nesta primeira
  fase, coerente com o uso interno do GaaS.
- `anon` não recebe acesso.
- O bucket é privado; não persistir URLs assinadas no banco.
- Novas tabelas recebem grants explícitos para `authenticated`, pois projetos
  Supabase podem não expor tabelas novas automaticamente à Data API.

## Consequências

### Positivas

- O mesmo conteúdo passa a ser reconhecido entre disparos.
- AppsFlyer, CRM e previews compartilham uma identidade comum.
- A futura aba Comunicações e o PPT automatizado deixam de depender de pastas e
  nomes de arquivos.
- O histórico atual não é quebrado.

### Trade-offs

- A cobertura inicial será parcial até o backfill de `template_id`.
- A qualidade depende de governança na criação de novas versões.
- Métricas de canais diferentes não devem ser condensadas em um score universal.

## Não objetivos desta fase

- unificar fisicamente `ad_creatives` e CRM;
- criar canvas infinito semelhante ao Miro;
- OCR, análise visual ou classificação por LLM;
- renderizar HTML de e-mail automaticamente;
- sincronizar Google Drive;
- afirmar atribuição causal antes de deep link e postbacks estarem validados.

## Próximas fases

1. Inventário e backfill assistido de templates históricos.
2. Triagem dos slots candidatos e confirmação das réguas ativas.
3. Upload manual de original, preview e thumbnail.
4. Galeria e drawer de análise no GaaS.
5. Geração e auditoria de links AppsFlyer dentro do GaaS.
6. View semântica unindo CRM e `ad_creatives` na experiência de Comunicações.
7. Seleção automática de evidências visuais para relatórios PPT.
