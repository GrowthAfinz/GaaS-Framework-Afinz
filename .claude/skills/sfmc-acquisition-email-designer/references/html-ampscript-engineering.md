# Engenharia de HTML e AMPscript

## Alterações visuais

Antes de editar, identifique o bloco completo e sua condição AMPscript. Descreva estado atual e destino para desktop/mobile.

- `resize`: atributo HTML, `max-width`, altura automática, proporção e arquivo-fonte.
- `align`: célula, bloco, texto, imagem e CTA; não dependa só de `margin:auto` no Outlook.
- `spacing`: use padding em `<td>` para layout crítico; documente colapso mobile.
- `reorder`: mova comentário, condição, tabela e fechamento como unidade atômica.
- `responsive`: empilhamento, largura fluida, fonte, padding, ordem e ocultação.
- `outlook_fallback`: largura em pixel, botão/background alternativo, MSO/VML somente quando necessário.

## AMPscript

- Delimitadores inline `%%= ... =%%`; blocos `%%[ ... ]%%`. Não misture fechamentos.
- Declare e inicialize variáveis antes do consumo no componente correspondente.
- Lembre a ordem SFMC: preheader → HTML → texto → assunto. Variável definida tarde não existe em componente processado antes.
- Lookup em chave não única é ambíguo. Para rowset, cheque quantidade antes de `Row()` e use `Field()` somente em linha válida.
- Personalização precisa de fallback explícito para vazio/nulo.
- `TreatAsContent()` pode avaliar personalização e código contido na string; só use em conteúdo governado e sanitizado.
- `RedirectTo()` deve ficar no `href` de link HTML para URLs dinâmicas e tracking compatível.
- `RaiseError()` é bloqueio/skip de erro; não substitui filtro, exclusão ou segmentação da jornada.
- Operações de escrita em DE durante envio têm efeitos transacionais e de ordem; não introduza `InsertDE`, `UpdateDE` ou `UpsertDE` sem solicitação e validação específicas.
- Segredos nunca ficam inline. Quando criptografia/JWT for realmente necessária, use chaves governadas no Key Management e prefira referência por key name.

## Segurança

- Não coloque PII em query string, comentários, atributos de diagnóstico ou exemplos entregues.
- Sanitize conteúdo dinâmico que possa conter HTML/AMPscript.
- Bloqueie `javascript:`, meta refresh e script cliente. SSJS é outro modo e exige decisão explícita.
- Preserve tracking e open counter existentes; não crie pixels paralelos.
- Valide esquema e host de links; diferencie deep link, OneLink e fallback web.

## Transformações versionadas

- Normalize finais de linha antes de aplicar substituições baseadas em texto; uma fonte em `CRLF` não pode fazer um patch pensado para `LF` falhar silenciosamente.
- Valide cada âncora antes de editar e a contagem esperada depois. Substituição sem alteração é erro, não sucesso.
- Prefira âncoras estruturais específicas e invariantes verificáveis a grandes trechos literais frágeis.
- Gere frontend e migration a partir da mesma saída e confira igualdade por bytes ou checksum depois da normalização permitida.
- Ao evoluir template compartilhado, siga o gate em [dynamic-template-regression.md](dynamic-template-regression.md); teste unitário do gerador não substitui regressão visual.

## HTML compatível

- Estrutura crítica em tabelas; `role="presentation"`, `cellpadding="0"`, `cellspacing="0"`, `border="0"` quando forem de layout.
- `lang`, charset, viewport e preheader controlado.
- CSS inline para o essencial. Gmail suporta subconjunto documentado de seletores/propriedades e media queries; outros clientes podem ignorar regras.
- Imagem: `src` HTTPS, `alt`, atributo `width`, style fluido, `display:block` quando apropriado e dimensão real suficiente.
- Botão: link real com área clicável; fallback Outlook quando o requisito visual justificar.
- Prefira live text para headline, benefício, preço/condição e CTA. No modo autorizado de headers rasterizados, siga [raster-headers.md](raster-headers.md): título/subtítulo podem integrar a imagem com alt equivalente; corpo e CTA continuam compreensíveis com imagens bloqueadas.
- Não use flex/grid como única estrutura crítica sem fallback; valide suporte atual na matriz de clientes-alvo.
- Dark mode: meta tags quando aplicável, contraste, logos transparentes, borda/halo e teste de inversão parcial/total.

## Cenários mínimos

Teste nome preenchido/vazio, assinatura válida/desconhecida, imagem/CTA vazio, lookup sem linha/duplicado, oferta vigente/expirada, texto curto/longo, mobile, imagens bloqueadas e dark mode.
