# Wiki de Growth

A Wiki aparece em Análise → Aprendizado e Memória, imediatamente depois de Fila. O nome público substitui Vault; `section=vault` e as tabelas existentes são mantidos para compatibilidade com links e histórico.

## Leitura e navegação

- Entrada por seis assuntos, com pastas técnicas numa seção secundária.
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
