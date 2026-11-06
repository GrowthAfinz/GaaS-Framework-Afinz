# WIKI-COLAB-02 · Persistência, versões e reconciliação com o vault

Versão: 1.0 · 06/11/2026 · Planejada para implementação na main

Spec criada; funcionalidade ainda não implementada por este pacote.

## Problema

gaas_vault_notes é projeção do vault; sync e publicador direto podem substituir conteúdo. Histórico de ingestão não é edição colaborativa completa.

## Comportamento esperado

Persistir versão operacional com revisão, autor derivado da sessão, origem, hash-base e idempotência. Gravação atômica condicionada à revisão; sem mudança não cria versão; restauração cria nova versão. Reconciliar base comum, app e arquivo. Preservar os dois conteúdos em conflito e o rascunho local. Todos os escritores e consumidores devem aderir ao contrato.

## Dependências

Nenhuma spec anterior.

## Plano técnico

Proposta aditiva: wiki_documents, wiki_document_revisions, wiki_block_anchors, wiki_document_bindings e wiki_sync_conflicts. Reusar identidades e tabelas existentes onde compatíveis. RPC wiki_save_document(note_id,expected_revision,idempotency_key,changes). RLS por espaço/time, concessão explícita e limite de payload; nenhum service_role no browser. Decisão de permissões precisa descrever o grupo autorizado, não promover o time a admin global.

## Verificação e recuperação

Testes SQL de RLS, revisão, retry e rollback; integração dos escritores e índices; guardar recibo por nota e hash. Exportação condicionada ao hash-base. Rollback do frontend mantém exportação/revisões disponíveis.

## Fora desta entrega

Não torna o GaaS fonte canônica por decisão implícita. Não promete sync automático com OneDrive no GitHub Pages. Não introduz CRDT nesta entrega.

## Critérios de aceite

- [ ] Duas sessões sobre a mesma revisão: só uma grava; a outra recebe conflito e conserva o texto.
- [ ] Repetir idempotency_key devolve a mesma gravação; falha transacional não deixa revisão parcial.
- [ ] Casos arquivo=base, app=base, app=arquivo e ambos divergentes têm resultados definidos e testados; exclusão/renomeação não apagam edição pendente.
- [ ] Sync por pasta, importador de lote e publish_single_vault_note não sobrescrevem edição humana silenciosamente.
- [ ] Leitura, Notas, Conexões, busca, backlinks, context packs e selo de revisão humana usam a revisão correta.
- [ ] Usuário fora do espaço não lê nem escreve; colaborador edita apenas notas/tarefas permitidas; histórico não aceita autor fornecido pelo cliente.

## Rastreabilidade

[Plano e ordem de implementação](README.md). O registro em Correções e Melhorias aponta para esta spec e para seu trabalho SDD. Estado do planejamento não significa implementação concluída.
