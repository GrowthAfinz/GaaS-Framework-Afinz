# Headers renderizados como imagens

Use este modo quando o usuário escolher imagens geradas a partir de HTML para conservar uma composição de marca. Esta escolha permite rasterizar título e subtítulo do header; não estende a autorização ao corpo, CTA, nome ou limite do destinatário.

## Fonte e escopo

- Use o HTML de referência aprovado para geometria, cores, fontes e assets. Leia conteúdo dos briefings atuais e registre régua, sequência, produto, id e versão; não confunda versão da régua com versão do template.
- Se houver várias bandeiras, compare título, subtítulo, imagem e logo antes de deduplicar. Campo de logo vazio não autoriza inventar assinatura.
- Gere uma peça piloto quando o usuário pedir validação da primeira; prepare o manifesto das demais sem produzir ou publicar o lote prematuramente.
- Renderize HTML com um navegador em tamanho desktop fixo e capture somente o header. Não use imagegen para redesenhar logos, cartões ou textos oficiais.
- Preserve o texto literal com textContent. Use somente assets HTTPS de fontes conhecidas; inspecione imagens baixadas e não execute scripts contidos no HTML recebido. O script bloqueia JavaScript e requisições fora dos hosts oficiais informados.

## Execução

O script usa o Playwright instalado no projeto indicado por `--runtime`, sem instalar dependências globais:

```powershell
node scripts/render_header_images.mjs --runtime C:/caminho/app --template C:/caminho/header.html --manifest C:/caminho/headers.json --out C:/caminho/saida --index 0
```

Manifesto: array de objetos com `product`, `sequence`, `title`, `subtitle`, `card`, `logo` (opcional), e metadados de proveniência. O adaptador inicial é específico ao HTML padrão Plurix: valida âncoras e falha se a estrutura mudar. Não o apresente como renderizador de qualquer HTML.

## Entrega e verificação

- PNG opaco 2x, HTML com dados resolvidos, metadados de dimensões/checksums e alt equivalente ao título/subtítulo. Não incorpore dados pessoais.
- Verifique todas as imagens carregadas, ausência de corte, texto integral, medidas, proporção e captura mobile da imagem pronta. Abra o PNG antes de entregar.
- 2x melhora a rasterização do texto; não cria detalhe adicional nos assets originais. Registre a resolução nativa das imagens.
- A peça deve ocupar uma única imagem fluida no e-mail, com largura HTML e CSS, altura automática e alt. Não reintroduza título ou logos HTML sobre ela.
- O arquivo local não é URL de envio. Publicação no Content Builder e associação às linhas do briefing são etapas separadas. Não escreva em DE, régua ou template por consequência da geração local.
- Não prometa que a imagem força o corpo inteiro ao tema claro. Aceitação visual e Test Send real continuam separados da renderização local.
