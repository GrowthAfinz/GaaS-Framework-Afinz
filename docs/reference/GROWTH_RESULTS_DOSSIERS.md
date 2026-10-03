# Resultados como assunto da Wiki

## Navegação atual
Framework → Aquisição abre o explorador. Framework → Aprendizado e Memória abre a Wiki. O menu Análise mantém as telas analíticas existentes.

Resultados é um item de WIKI_TOPICS, com a mesma apresentação e navegação dos demais assuntos. Abre a nota canônica `07-Evolucao/Resultados-Evolucao-e-Retrospectivas.md`, ligada a Resultados-CRM, Resultados-Midia-Paga, Resultados-B2C e Retrospectiva-Mensal-Growth.

A sequência de Aprendizado e Memória é Fila, Wiki, Report Live, Apostas, Outcomes e Memória. Resultados não integra essa sequência.

## Links anteriores
`?view=learning&section=results` é reconhecido como entrada da Wiki. Após carregar o catálogo, VaultWorkspace resolve a nota central pelo caminho exato e substitui a URL pelo item da nota. Links de retorno de apostas históricas usam `section=vault&wiki_topic=results`, com a mesma resolução. Os parâmetros result_* são descartados.

## Conhecimento e fontes
A organização editorial é contexto → evidência → evolução mensal → retrospectiva → aposta → verificação → memória. Evolução e retrospectiva acompanham qualquer leitura de resultado. A Wiki projeta as notas canônicas do vault; seu leitor preserva fontes, links e histórico documental.

## Compatibilidade
Os registros de retrospectivas e apostas existentes são preservados. A área analítica introduzida no PR anterior deixou de ser montada pela navegação. Este ajuste não altera as tabelas operacionais, seus registros nem permissões.

## Verificação
Testes de navegação cobrem a sequência sem a aba Resultados, os links anteriores e a resolução do assunto sem confundi-lo com a nota da tela legada Resultados. Rodar npm test, npm run typecheck:release e npm run build. Validar a nota e seus links na Wiki autenticada depois da sincronização e do deploy.
