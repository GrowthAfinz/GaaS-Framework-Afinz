# Estratégias · navegação, responsividade e Seguros

Pedido de Pablo em 06/11/2026: retirar o verde de Adicionar seção; abrir Assuntos e a seta sem sair da nota; aplicar tópicos às notas de Estratégia; criar assunto Estratégias e habilitar o editor em Estratégia de Segmentação de Seguros. Depois, solicitou sugestões editoriais e redesenho dos dois diagramas no estilo editorial aprovado.

## Entrega

O assunto Estratégias é um catálogo de navegação em ?view=learning&section=vault&wiki_topic=strategies, alimentado pelas notas existentes da pasta 05-Estrategia. Não cria cópias nem muda caminhos, IDs ou o Markdown canônico. Na consulta de implementação havia 24 notas nessa pasta.

Assuntos e a seta do leitor de estratégias alternam o painel de assuntos, sem history.back e sem remover o item da URL. A busca apresenta destinos sem fechar a nota antes da escolha explícita. Os tópicos internos apenas expandem e rolam o documento. No celular, Nesta estratégia abre um índice recolhível; tabelas têm rolagem horizontal e diagramas preservam a abertura ampliada existente.

O editor versionado passa a aceitar notas da pasta 05-Estrategia. A leitura continua condicionada ao membro aprovado; a escrita e o histórico detalhado continuam administrativos. As atividades vinculadas da Visa só aparecem na Visa; o servidor rejeita esse tipo de vínculo nas outras notas. Não cria atividades de Seguros por cópia. Corpo, títulos, inclusão/exclusão e restauração usam o contrato de revisão existente.

Adicionar seção e ações de gravação usam fundo branco, contorno fino e teal discreto. Referências/fichas técnicas começam recolhidas. A ordenação editorial sugerida para o texto de Seguros não foi aplicada implicitamente; suas decisões e tópicos originais são preservados.

## Diagramas

seguros-percurso-v2.svg: elegibilidade compartilhada, duas entradas, espera entre produtos, descarte por mensal ativa/autorizada, exceção por inatividade e processamento/posse. seguros-sfmc-v2.svg: fontes, validação, elegibilidade, conciliação, seleção mensal, seleção trigger e retorno dos marcadores. Parâmetros são separados e decisões de trigger mantêm local a definir.

SVGs determinísticos, texto selecionável, title/desc acessíveis, fundo branco, cantos retos e conectores teal. Os caminhos publicados foram preservados para atualizar a nota sem alterar o conteúdo ou seu hash. As pendências continuam propostas; diagramas não certificam execução no SFMC.

## Validação

18 testes frontend passaram, incluindo importação de Seguros sem checklist Visa, normalização CRLF, classificação do assunto e grupos do mapa. 5 testes SQL passaram: revisão, concorrência, fonte, idempotência, membro aprovado, administrador, isolamento de pasta e rejeição de vínculo Visa em Seguros. RPC em produção verificado em transação com rollback, sem persistir fixture.

Typecheck de release sem novos erros (dívida anterior: 57). SVGs XML válidos, sem scripts e sem bordas arredondadas. Dois diagramas inspecionados no navegador. UI real com fixture local em 1440/1024/390: tópicos, Assuntos/seta sem mudar URL, índice móvel, editor/prévia/cancelar e catálogo. Largura móvel 383/383 px; console sem erros. Evidências locais em .local-qa/screenshots/insurance-*.jpg e seguros-*-editorial.jpg; não publicadas como dados reais.

## Limites e recuperação

Índices de busca global, backlinks e context packs continuam usando a fonte canônica; não há sync automático de volta ao vault. Permissões de colaboradores e demais specs futuras permanecem pendentes. Reverter o frontend não apaga os documentos de trabalho nem revisões.
