# Taxonomia de comunicações CRM

## Canal

- `whatsapp`: captura ou copy de WhatsApp, podendo conter botões e mídia.
- `sms`: mensagem curta com link ou placeholder de link.
- `email`: composição vertical de e-mail, geralmente com hero, blocos e CTA.
- `push`: título e corpo curtos de notificação.
- `unknown`: não há evidência suficiente.

## Intenção

- `acquisition`: oferta inicial de cartão ou produto.
- `approval`: comunica aprovação, pré-aprovação ou limite liberado.
- `activation`: incentiva ativação ou primeiro uso.
- `cart_abandonment`: retoma proposta ou solicitação não concluída.
- `reactivation`: tenta recuperar cliente ou proposta inativa.
- `repescagem`: oferece nova chance após análise ou tentativa anterior.
- `engagement`: estimula uso e benefícios sem nova aquisição explícita.
- `informational`: mensagem predominantemente informativa.
- `unknown`: intenção não sustentada pelo print.

## Alegações criativas de oferta

Estas categorias descrevem o conteúdo visível e não substituem `activities.Oferta` ou `activities.Promocional`. Usar uma lista. Tipos iniciais:

- `credit_limit`
- `vibe_credits`
- `discount`
- `virtual_card`
- `transport_voucher`
- `fee_or_installment`
- `other`

Registrar valor, unidade, condição e trecho de evidência quando visíveis. Não converter placeholder em número.

Os campos oficiais do Framework devem ser resolvidos separadamente pelo histórico, conforme `framework-crosswalk.md`.

## CTA

- `request_card`
- `activate_card`
- `access_offer`
- `talk_to_agent`
- `decline_offer`
- `open_link`
- `other`

Preservar o rótulo visível e classificar separadamente o tipo.

## Urgência

- `none`: sem pressão temporal.
- `low`: incentivo leve.
- `medium`: oportunidade ou prazo mencionado sem forte escassez.
- `high`: últimos dias, só hoje, tempo limitado ou pode acabar.

## Tema

Lista livre normalizada em snake_case, por exemplo `anniversary`, `black_friday`, `halloween`, `institutional` ou `vibe_double`.

## Placeholders

Preservar `raw` exatamente como aparece. Preencher `canonical` somente quando inequívoco, por exemplo:

- `%%FIRST_NAME%%` -> `first_name`
- `%%LIMITE%%` -> `credit_limit`
- `[link]` -> `link`

Tokens estranhos, como um CEP usado onde parece haver limite, devem ser preservados e sinalizados; não corrigir.

## Qualidade e revisão

Flags possíveis:

- `cropped`
- `unreadable_text`
- `channel_conflict`
- `possible_pii`
- `placeholder_anomaly`
- `duplicate_candidate`
- `ui_chrome_ambiguous`

Exigir revisão se houver flag material ou confiança menor que `0.85`.
