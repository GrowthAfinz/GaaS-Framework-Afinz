# Comparação dos relatórios de Aquisição e Seguros — 04/11/2026

## Evidência e achados

1. **Aquisição publicada — referência visual válida.** Overview com período de outubro/2026 e dados presentes: cabeçalho compacto, cinco abas integradas ao cabeçalho, faixa de KPIs, tabelas densas com cabeçalho escuro. Captura `01-aquisicao-overview.png`.
2. **Seguros publicado antes — divergência confirmada.** Cabeçalho mais alto, nove visões fora do cabeçalho, selects sem o mesmo tratamento visual e preparação de carga exposta na leitura principal. Não havia versão selecionada: essa captura não permite comparar valores, gráficos ou cobertura de resultados com Aquisição. Captura `02-seguros-antes.png`.
3. **Seguros modular local — navegação e estrutura verificadas.** Preview somente de leitura com cópias das referências XLSX. Overview capturado; as cinco abas foram abertas e seus conteúdos inspecionados pela interface. Mensal apresentou sete meses, duas séries de produto, investimento e tabela com MoM; Diário/Acumulado manteve contratações ausentes; Evolução alternou Performance/Anomalias; Relatórios agrupou arquivos, comitê e governança. Captura final de Overview `04-seguros-overview-final.png`.

| Elemento | Problema observado | Implementação |
|---|---|---|
| Cabeçalho e abas | Duas implementações com hierarquias diferentes | Mesmo `ReportWorkspaceHeader` e catálogo `REPORT_VIEWS` |
| KPIs | Cards e faixas sem um contrato comum | Mesmo `ReportKpiStrip`, com métricas de cada domínio |
| Diário | Ausente como visão principal de Seguros | Visão CRM diária; controle Diário/Acumulado compartilhado |
| Mensal | Tabela simples isolada | Renderer de gráfico e tabela mensal compartilhados; atalhos 3M/6M/12M |
| Evolução e anomalias | Sem entrada equivalente | Mesma aba primária, alternância de desempenho e alertas verificáveis |
| Relatórios | Ingestão e revisão misturadas com análise | Grid de entrega compartilhado; operações dentro de Relatórios |

## Limites da comparação

As capturas estão em `artifacts/insurance-local/visual-audit/`, ignoradas pelo Git para não publicar dados operacionais. A referência de Aquisição e o preview têm fontes, períodos e estados de carga distintos; os números não são comparáveis entre frentes.

O controle de captura do Chrome apresentou timeout em screenshots com gráficos e ao tentar igualar o viewport. A configuração temporária de viewport foi restaurada. Portanto, esta rodada não certifica igualdade pixel a pixel de todas as visões. O funcionamento foi conferido pela interface e pelo DOM: as duas séries mensais renderizaram 14 barras cada após desativar a animação inicial do renderer compartilhado, evitando que a aba em segundo plano ficasse com o desenho pendente. Não foi feita uma auditoria completa de teclado, leitores de tela ou breakpoints móveis.

## Contrato de negócio preservado

Contratação é o resultado final de Seguros; cadastro enviado não é venda. Contratações do XLSX têm grão mensal, sem evento individual de confirmação. O diário não rateia vendas mensais nem atribui disparos a produtos por nomes semelhantes. Ausência, zero observado, parcialidade e populações distintas continuam explícitos.

O preview não autenticou, salvou, certificou, alterou notas nem publicou documentos vivos. A ativação do frontend não substitui a validação da primeira carga autenticada.

## Arquitetura e validação

O contrato reutilizável está em [report-workspace.md](../architecture/report-workspace.md). A suíte completa local passou antes dos últimos ajustes de controles; os testes focados finais cobriram as cinco abas, cadastro versus contratação, custo SUM/SUM, ausências no diário, acumulado e limites de MoM. TypeScript passou sem novos erros frente à dívida registrada, e o build local passou. A validação de release da `main` é a verificação final do conjunto publicado.
