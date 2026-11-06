# Piloto Visa · direção editorial 1

Pedido aprovado por Pablo: opção 1 do mockup; adicionar e excluir, além de editar; publicar primeiro só nesta nota. As demais notas mantêm o leitor existente.

## Entrega

- Título Atividades: Construção do Piloto; índice da nota, busca local, seções e grupos recolhíveis; cantos retos e lápis discreto.
- Editar título/apresentação, títulos de seções e conteúdo via Markdown com prévia. Texto, tabelas e Mermaid continuam no mesmo formato. Os campos individuais de atividades têm seus próprios lápis.
- Incluir, duplicar, mover e excluir seções; incluir, duplicar, mover e remover atividades da nota. A remoção preserva o registro original em Testes e Tarefas.
- Histórico da nota por revisão e autor da sessão; restaurar cria nova revisão. Campos de tarefas continuam no histórico do registro original.
- Rascunho de texto recuperável por sessão e usuário, revisão otimista, retry idempotente e bloqueio de fonte divergente.

## Persistência e permissões

As tabelas gaas_wiki_pilot_documents/revisions são uma camada de trabalho isolada. A revisão zero guarda o Markdown original exato. A ingestão do vault não sobrescreve essa camada. O operador compara a fonte e reconhece explicitamente uma mudança antes de continuar; isso preserva o trabalho e não equivale a merge automático de três vias.

Leitura exige membro aprovado, como o vault. Escrita e histórico detalhado exigem as permissões administrativas já existentes. O RPC SECURITY DEFINER é intencional para a transação atômica e verifica sessão, membro aprovado e administrador; clientes não têm escrita direta nas tabelas. O aviso informativo do advisor para RPC público foi revisado nesse contexto.

Não há sincronização automática de volta ao arquivo Obsidian, busca global, backlinks ou context packs. Exportar Markdown permite revisão manual; tarefas são vínculos e não cópias no arquivo exportado. Liberar edição ao restante do time requer permissão própria e permanece pendente, sem promover pessoas a administrador.

## Verificação

12 testes frontend de formato/preservação, validação de atividades e renderização; 6 testes SQL de revisão, restauração, retries, concorrência, fonte divergente, RLS, datas e auditoria. Testes adicionais da CI cobrem dependências e contratos existentes. Typecheck de release sem novos erros; dívida preexistente registrada: 57. Build Vite concluído com avisos preexistentes de tamanho de chunks/imports.

Conferência visual em 1440, 1024 e 390 px usando o componente real e fixture local com conteúdo da nota. Inclusão/exclusão/restauração de seção, inclusão/remoção de atividade e recuperação de rascunho após recarregar verificadas na UI. Nenhuma atividade sintética de QA foi persistida em produção. Ver [design-qa.md](design-qa.md).

## Próximos cortes

WIKI-COLAB-02/03/04 permanecem parciais para o contrato global, índices/consumidores, editor de trechos e QA de colaboração com permissões próprias. WIKI-COLAB-05 a 09 permanecem abertas: BlockNote, comentários, blocos reutilizáveis, texto para atividade e coedição simultânea. A entrega atual não adota BlockNote nem CRDT.

## Recuperação

Reverter o frontend ao leitor anterior não remove documentos, revisões ou tarefas. Exportar a versão de trabalho antes da reversão. Não executar down migration ou apagar revisões. O arquivo canônico do vault não é alterado pelo piloto.
