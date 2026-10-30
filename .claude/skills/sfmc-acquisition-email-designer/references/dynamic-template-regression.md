# Evolução e regressão de templates dinâmicos

Use este protocolo quando um único HTML/AMPscript atende vários e-mails. A unidade de qualidade não é o arquivo-fonte: é cada estado visual que ele pode produzir.

## 1. Defina a ancestralidade antes de editar

Registre um manifesto curto:

| Item | Conteúdo esperado |
|---|---|
| Versão operacional | fonte atualmente usada ou marcada como principal |
| Referência visual canônica | versão ou peça que contém a composição aprovada |
| Ancestral técnico | fonte da qual a candidata será derivada |
| Correções preservadas | ganhos que não podem regredir |
| Regressões conhecidas | perdas já observadas por sequência |
| Fonte no frontend | constante, fixture ou registro exibido pelo editor |
| Fonte persistida | id, versão e checksum do registro no Supabase |

A versão canônica é a combinação correta de comportamento e composição, não necessariamente a predecessora numérica. Quando nenhuma versão contém todos os acertos, escolha a mais próxima e reaplique correções como patches localizados.

## 2. Monte a matriz de renderizações

Liste produto, sequência, assinatura, briefing e condições que alteram blocos. Registre por linha:

| Estado | Papel visual | Headline | CTA | Assets essenciais | Campos condicionais | Referência |
|---|---|---|---|---|---|---|
| produto + sequência + assinatura | ver taxonomia abaixo | esperado | esperado | esperado | esperado | versão/print |

Papéis visuais úteis:

- `full_width_benefit_card`: argumento principal ocupa a largura antes do próximo bloco.
- `text_image_split`: texto e imagem dependem de proporção e ordem responsiva.
- `comparison_visual`: comparação de preço, benefício ou produto é a prova central.
- `instructional_banner`: arte explica etapas ou funcionamento.
- `cta_only`: bloco existe prioritariamente para conversão.
- `visual_proof`: asset sustenta uma afirmação do texto.

Esses papéis são classificações, não layouts fixos. Uma regra genérica como “sempre 55/45” não pode substituir a necessidade de cada sequência.

### Escopo mínimo por risco

- Mudança apenas editorial em um campo: sequência alterada em todas as assinaturas relevantes.
- Mudança de CSS, estrutura, condição, asset ou bloco compartilhado: todas as sequências com ao menos uma assinatura representativa; inclua todas as assinaturas nas sequências diretamente afetadas.
- Mudança em lookup, assinatura, fallback ou contrato de dados: matriz completa das combinações suportadas.
- Dúvida sobre alcance: expanda o escopo; nunca o reduza silenciosamente.

## 3. Faça comparação controlada

Fonte canônica e candidata devem usar exatamente o mesmo:

- briefing e sua versão;
- produto, campanha e sequência;
- assinatura;
- nome, limite e demais dados fictícios do assinante;
- política de asset pendente;
- viewport e mecanismo de renderização.

Para o app GaaS, use o comparador desta skill a partir da raiz do app:

```powershell
node node_modules/vite-node/vite-node.mjs `
  "..\.claude\skills\sfmc-acquisition-email-designer\scripts\compare_dynamic_email_versions.ts" `
  --from builtin-plurix-v7 --to builtin-plurix-v8 `
  --product AMIGAO --sequence "E-mail 2" `
  --output-dir artifacts/dynamic-email-comparison/e2
```

O utilitário gera HTMLs individuais, painel lado a lado, PNG desktop/mobile e `comparison.json`. Use apenas dados fictícios de assinante.

## 4. Cubra o contrato de campos

Para cada campo do contrato, registre:

| Campo | Lido | Renderizado em | Condição | Posição/papel | Comportamento vazio |
|---|---|---|---|---|---|

Em contratos como o briefing de 36 campos, `Field()` existir no código não prova cobertura. O campo pode ser lido e nunca chegar ao HTML, ficar atrás de uma condição incorreta ou aparecer em uma posição que destrói sua função visual.

Compare a cobertura da candidata com a canônica. Toda redução precisa ser deliberada, documentada e autorizada.

## 5. Verifique paridade de fonte

Confirme que:

```text
fonte exibida no editor = fonte exportada = fonte persistida = fonte testada
```

Compare bytes ou checksum após normalizar apenas finais de linha. Não aceite uma constante local que sobreponha silenciosamente o registro do Supabase. Se houver override temporário, reporte-o como bloqueante para promoção.

## 6. Transformações seguras

Geradores de nova versão devem:

1. normalizar `CRLF` e `LF` antes de procurar âncoras;
2. validar a presença e a quantidade de todas as âncoras;
3. falhar quando uma substituição resultar em zero alterações;
4. validar contagens e invariantes depois da transformação;
5. comparar a saída esperada com a fonte usada no frontend e na migration;
6. nunca remover blocos por semelhança textual ampla quando uma âncora estrutural específica existir.

## 7. Gate de promoção

Uma candidata só pode virar principal quando:

- todas as sequências no escopo foram renderizadas;
- imagens essenciais carregaram e nenhuma nova imagem está quebrada;
- headings, CTAs e campos renderizados têm cobertura igual ou superior à referência;
- nenhum CTA ou asset foi perdido sem decisão explícita;
- não surgiu rodapé legal duplicado;
- hierarquia e papel visual foram revisados nos PNGs desktop e mobile;
- frontend e Supabase usam a mesma fonte;
- auditorias, testes e build passaram;
- o relatório identifica limitações que ainda dependem do Test Send.

Falha em qualquer item mantém o status `blocked` ou `needs_review`; jamais `ready_for_test_send`.

## 8. Saída da análise

Entregue uma linha por estado:

```text
Produto · sequência · assinatura
Fonte canônica -> candidata
Preservado
Melhorado
Regredido
Campos/CTAs/assets ausentes
Diferença desktop/mobile
Severidade e ação
```

Separe claramente diferença objetiva, avaliação visual e decisão editorial. Um diff de código não substitui o comparativo renderizado.
