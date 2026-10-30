# Contexto e Prompts do time · revisão de UX

- Entrada padrão em Pacotes de contexto, com acesso ao ZIP acima da caixa recolhida de atualização da Fila/notificações.
- Ordem: Pacotes de contexto, Prompts, Preparar contexto, Contribuições. Objetivos fornecidos por outro fluxo continuam abrindo a preparação.
- Preparação com objetivo opcional e uma ação principal; comparação local, resultados e Report Live preservados sob Personalizar pacote.
- Fundos discretos de verde, azul e lavanda; instruções do operador em details nativo fechado por padrão.
- Seis sugestões de prompts v1: unificação do Framework em XLSX, qualidade de dados, revisão semanal de disparos, retrospectiva mensal, briefing/régua e contribuição à Wiki. Busca, recorte opcional, copiar, baixar individual e baixar biblioteca Markdown para o time.
- Prompt de unificação revisado contra processDinamicaBI e consolidateOperationalRows de IntelligentFrameworkUpdate.tsx. O prompt orienta inspeção dos blocos reais, grão por disparo, cruzamento auditável, janela D0–D2 apenas sem ambiguidade e reconciliação. Não afirma equivalência de uma execução de LLM com o importador. Não foi executado contra um arquivo real nem certificado em um modelo específico.

## Verificação

- Gate TypeScript sem novos diagnósticos.
- Build de produção passou.
- 5 testes existentes de knowledgePack passaram, preservando integridade/hash do ZIP, comparação e contribuições.
- Fixture local scripts/fixtures/knowledge-workspace-qa.html usa dados simulados e bloqueia rede remota. Verificados: ordem dos menus, pacote acima das instruções recolhidas, formulário com opções fechadas, geração de ZIP simulado, copiar prompt com recorte, biblioteca Markdown baixada e inspecionada, busca com seleção do resultado e viewport móvel de 390 px sem overflow horizontal. Sem erros no console após recarregar.
- Nenhuma geração de pacote real ou alteração de contribuição/nota foi executada no ambiente de produção durante a validação.
