# QA, prontidão e fontes

## Severidade

- **Bloqueante:** AMPscript inválido, campo/lookup sem contrato, link crítico ausente, promessa incompatível com legal, exposição de dado, JavaScript ou ausência de fallback que elimina a ação.
- **Revisão:** possível quebra em cliente, contraste, dark mode, densidade, redundância, dimensão inadequada ou condição não coberta.
- **Informativo:** oportunidade de simplificação ou melhoria não necessária para Test Send.

## Matriz de QA

1. Lógica: delimitadores, IF/ENDIF, variáveis, rowsets, vazio, fallbacks, URLs e tracking.
2. Conteúdo: promessa, objeção, oferta, CTA, vigência e legal.
3. Visual: hierarquia, largura, alinhamento, ordem, espaçamento, imagens, assinatura e mobile.
4. Acessibilidade: live text, alt, headings, ordem, contraste mínimo 4.5:1 para texto normal e 3:1 para texto grande, alvo de pelo menos 24×24 CSS px quando aplicável.
5. Clientes: Gmail, Outlook desktop/web, Apple Mail, imagens bloqueadas e dark mode.
6. Operação: Activity Name, campos da DE, versão, template principal, exportação e Test Send.

Para templates compartilhados ou versionados, aplique também a matriz e o gate de promoção de [dynamic-template-regression.md](dynamic-template-regression.md). Um único preview aprovado não libera as demais sequências.

## Deliverability

O conteúdo pode sinalizar risco, mas não provar configuração de infraestrutura. Para marketing em escala, audite externamente SPF, DKIM, DMARC, alinhamento, TLS, reputação/spam e one-click unsubscribe. Não tente “corrigir” isso apenas no HTML.

## Status

- `blocked`: falha estrutural, de dados, segurança ou legal.
- `needs_review`: renderização ou decisão editorial pendente.
- `ready_for_test_send`: simulação e auditoria local passaram.
- `sfmc_certified`: somente com evidência do Test Send aprovado.

## Fontes técnicas primárias

- AMPscript: https://developer.salesforce.com/docs/marketing/marketing-cloud-ampscript/
- Sintaxe no conteúdo: https://developer.salesforce.com/docs/marketing/marketing-cloud-ampscript/guide/mc-ampscript-guide-language-basics-adding-to-content.html
- Ordem de operações: https://developer.salesforce.com/docs/marketing/marketing-cloud-ampscript/guide/mc-ampscript-guide-language-basics-order-of-operations.html
- Rowsets e validação: https://developer.salesforce.com/docs/marketing/marketing-cloud-ampscript/guide/mc-ampscript-guide-data-structures.html
- `TreatAsContent`: https://developer.salesforce.com/docs/marketing/marketing-cloud-ampscript/references/mc-ampscript-content/mc-ampscript-reference-content-treat-as-content.html
- `RedirectTo`: https://developer.salesforce.com/docs/marketing/marketing-cloud-ampscript/references/mc-ampscript-http/mc-ampscript-reference-http-redirect-to.html
- `RaiseError`: https://developer.salesforce.com/docs/marketing/marketing-cloud-ampscript/references/mc-ampscript-utilities/mc-ampscript-reference-utilities-raise-error.html
- Test Send: https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/starting_an_email_send_definition_test_send
- CSS no Gmail: https://developers.google.com/workspace/gmail/design/css
- Diretrizes para remetentes: https://support.google.com/mail/answer/81126
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Imagens acessíveis: https://www.w3.org/WAI/tutorials/images/

Use Can I Email e Litmus como evidência operacional complementar para clientes específicos; confirme data e matriz de suporte antes de prescrever um hack.
