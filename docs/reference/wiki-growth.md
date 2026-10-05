# Wiki de Growth

A Wiki aparece em Framework → Aprendizado e Memória, imediatamente depois de Fila. O nome público substitui Vault; `section=vault` e as tabelas existentes são mantidos para compatibilidade com links e histórico.

## Leitura e navegação

- Entrada por sete assuntos, com pastas técnicas numa seção secundária.
- Duas áreas: navegação recolhível e leitor. Resultados de busca substituem os assuntos na lateral.
- Busca debounced de 250 ms, resultados paginados de 60 notas e quantidade total independente dos resultados.
- Índice completo de metadados carregado em páginas de 100 para resolver links determinísticos. Markdown e referências são carregados apenas ao abrir uma nota; cache limitado à sessão do componente e invalidado após sincronização.
- O leitor é carregado em chunk separado ao entrar na Wiki. Nenhuma geração por IA é necessária para navegar.
- Links internos preservam busca e filtros, atualizam `item` na URL e abrem na mesma aba. Caminho exato vence; caminho relativo à nota vem em seguida; basename só é aceito se único. Nomes ambíguos mostram opções e notas ausentes mostram aviso.
- Seções usam IDs normalizados e únicos, com fragmentos compartilháveis. O histórico recupera a posição de leitura durante a sessão. Recarregar preserva nota, busca, pasta e fragmento via URL.
- A rota explícita tem prioridade após hidratação assíncrona do estado salvo do app, evitando retorno involuntário ao Launch Planner.
- Links externos abrem outra aba com `noopener noreferrer`. URLs filtradas pelo Markdown não viram links para a página do app.

## Fonte e acesso

A pasta canônica continua sendo a fonte editorial. A Wiki consulta a projeção autenticada existente, sem alterar RLS, permissões ou schemas. O comando de sincronização fica no menu Administrar e continua restrito a administradores.

O estado da nota é documental, não uma certificação automática de claims comerciais. Datas de modificação da fonte e de indexação são apresentadas separadamente nos detalhes.

## Verificação

Os testes `wikiNavigation.test.ts` verificam caminhos, ambiguidades, headings repetidos e blocos de código. `vaultMarkdown.test.ts` verifica a preservação de wikilinks através do renderizador real e o filtro de URLs inseguras. O contrato de navegação preserva as rotas existentes e a nova ordem das abas.

QA local usa fixture temporária do acervo canônico, sem credenciais ou mutações: início → produtos → benefício → seção → recarregar → busca → serviço → voltar. A versão publicada precisa ser conferida com a sessão autenticada do GaaS; fixture local não certifica autenticação nem publicação.


## Comunicações visuais nos resultados da Wiki

Notas com analytics CRM ou rentabilização apresentam três blocos no mesmo mês e
recorte dos resultados, após a evolução mensal:

- **Comunicações utilizadas:** apenas vínculo direto `activities.template_id`.
  Agrupa execuções por template, sem presumir que o arquivo atual é a versão enviada.
- **Biblioteca deste público e parceiro:** templates vinculados em outros meses,
  configurações ativas com igualdade de Activity Name, jornada e canal, e assets
  `ready` da fábrica. Configuração não é evidência de envio. Assets exigem uma
  correspondência explícita de parceiro ou segmento; conflito de BU/parceiro exclui
  a referência, e conflito de público/produto exige validação visível. Campos em
  branco não são curingas. Filtro de canal respeita os assets de e-mail.
- **Jornada visual:** agrupamento por jornada literal, etapa, subgrupo, safra, ordem,
  template e canal. Sem ordem numérica positiva, exibe “Ordem não informada”.
  Execuções sem peça continuam visíveis. Não representa sequência por pessoa.

A leitura é autenticada e paginada de `communication_templates`,
`communication_slots` e `dynamic_email_assets`, sem copiar assets ou alterar vínculos.
Falhas são explicitadas por fonte; dados indisponíveis não são contados como zero.
A rentabilização não possui `template_id`: recebe biblioteca/configuração e posições
observadas, sem herdar a prova de envio da aquisição. Transporta as dimensões de
produto, oferta, promoção, crédito e ordem disponíveis em sua própria tabela.

Prévias de imagens usam URLs assinadas do bucket cadastrado; assets externos exigem
HTTPS. HTML só é carregado quando a prévia entra na tela e é renderizado em iframe
com sandbox sem permissões. Paginação visual limita os cartões/posições iniciais a
12, com acesso a todo o conjunto. O detalhe apresenta dimensões, assunto/preheader,
versão cadastrada, resultados e evolução dos disparos explicitamente vinculados.
Totais podem ser parciais; CAC conserva o contrato de custo/cartões completos.
Janelas excluem as chaves duplicadas globais e dias abertos. Os atalhos para jornada
preservam mês, nota e demais filtros para consultar sua retrospectiva.
