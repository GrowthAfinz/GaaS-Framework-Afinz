# Aprendizado e Memória: colaboração com IA

## Experiência

As seis seções mantêm IDs e links compatíveis: Fila, Wiki, Report Live, Apostas,
Outcomes e **Registros** (`section=memory`; `section=records` é um alias de leitura).
O cabeçalho é compacto em todas as seções. A barra global de filtros do Framework
não aparece nesta área. Fila e Report Live têm período próprio, persistido em
`learning_start` e `learning_end`; as outras seções indicam seu alcance explicitamente.

Na Wiki, **Trabalhar com IA** abre três vistas:

- Preparar contexto: todas as notas publicadas elegíveis, objetivo opcional,
  comparação local opcional e resultados agregados selecionados explicitamente.
- Pacotes de contexto: manifestos e ZIPs de versões preservadas em Storage privado.
- Contribuições: envio do modelo JSON, comparação com a fonte atual e fila de revisão.

## Contratos

`gaas-knowledge-pack/1` identifica um manifesto imutável com caminhos e SHA-256,
datas, versão sincronizada, exclusões, referências não resolvidas, comparação local
e resultados agregados opcionais. O snapshot de notas é uma única consulta SQL,
sem paginação do corpo e sem limite de uma página REST. Sincronizações incompletas
bloqueiam a exportação. A ontologia compilada é derivada, nunca fonte de edição.

O ZIP contém notas originais, índice, guia, mapa do GaaS, instruções para IA,
ontologia unificada, divisões por assunto, manifesto e modelo de contribuição.
Anexos binários não publicados no leitor ficam fora e são declarados no manifesto.
Possíveis credenciais e CPFs identificáveis são excluídos pelo verificador local;
esta verificação é preventiva e não substitui a revisão do conteúdo a compartilhar.
O aplicativo não transmite o pacote para provedores de IA.

Resultados opcionais reutilizam a fonte e os cálculos da Wiki; o usuário escolhe
frente, mês e filtros antes da leitura. Originação B2C exige escolher o total ou
uma origem específica. Dados ausentes continuam nulos. Conversões de mídia não
são cartões. A referência opcional do Report Live inclui versão, período e links,
sem copiar PDF ou Slides e sem acionar publicação.

`gaas-knowledge-contribution/1` contém `pack_id`, título, justificativa e alterações.
Cada alteração tem `path`, `base_hash` (null para nota nova) e Markdown completo.
O servidor verifica vínculo com o pacote, fonte atual, caminhos, tamanho,
duplicidade e hash esperado. Propostas são imutáveis; ajustes são enviados como
uma nova contribuição. Histórico de revisão é append-only.

## Autoridade e publicação

Somente o usuário governado de Pablo consta em `gaas_knowledge_reviewers`, resolvido
pela associação administrativa já existente. O time autenticado consulta pacotes
e contribui; não consegue se promover a revisor. Não há acesso anônimo.

Estados: `pending → approved | changes_requested | rejected`;
`changes_requested → approved | changes_requested | rejected`;
`approved → incorporated | rejected`. Pedir ajustes ou rejeitar exige comentário.

Aprovar não altera `gaas_vault_notes`. Pablo baixa um ZIP de alterações, usa sua
LLM no computador, revisa os hashes-base, aplica no vault, recompila e sincroniza.
**Verificar incorporação** só confirma quando todos os hashes esperados estão
publicados e associados a uma sincronização concluída após a aprovação.

O bucket `gaas-knowledge-packs` é privado, aceita ZIP até 20 MB e não permite
substituir versões. Uploads não registrados podem ser removidos pelo autor para
recuperação de erro; versões registradas ficam preservadas.

## Verificação

Os testes em `src/components/vault/knowledge/` exercitam exportação com mais de
400 notas, fidelidade de conteúdo e hashes, divergência local, referências,
exclusões, caminhos, autorização, duplicidade, propostas imutáveis, preservação
de arquivos, aprovação sem escrita no vault e confirmação por sync posterior.
O fluxo também passa pelo gate TypeScript e pelo build de produção existentes.
