# Checklist operacional do piloto na Wiki

A página `05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md` mostra um checklist recolhido antes de `1. Intenção estratégica`, nos modos Leitura e Notas. A vinculação está em `wikiPilotModel.ts`; outra nota não recebe o bloco por coincidência de título.

O bloco usa os mesmos registros de `growth_development_tasks`, o escritor `growth_save_development_task` e a auditoria de Testes e Tarefas. Mantém as permissões administrativas existentes; não há nova cópia do checklist no Markdown nem ampliação de acesso. As tarefas existentes conservam identidade, critérios, estado e revisão.

`details.completed_on` é a data de conclusão real no calendário de Brasília, distinta de `updated_at`. Novas conclusões recebem a data do banco; datas históricas podem ser corrigidas, nunca futuras. Editar uma tarefa concluída conserva a data. Tarefas antigas sem data permanecem sem data até registro explícito. Reabrir remove a data ativa, mantendo a conclusão anterior no evento versionado. Uma alteração concorrente falha pelo controle de revisão existente.

Marcar uma atividade só conclui diretamente quando todos os critérios já foram atendidos e existe evidência. Caso contrário, abre a ficha para preencher critérios, data e entrega. O backend continua exigindo critérios, resolução e dependências. A data também é editável na ficha de Testes e Tarefas.

Pronto para testar exige os oito marcos de construção/preparação; Validado na seedlist exige também as três atividades de validação. Registros faltantes ou cancelados não liberam o marco. As duas tarefas posteriores e o experimento não bloqueiam esse teste inicial; o encerramento do experimento segue seu próprio contrato. O escopo do piloto mantém três cards e não inclui GRUPO_2.

Migração `wiki_seedlist_checklist`: acrescenta três marcos documentados e quatro tarefas da seedlist na iniciativa existente, com IDs gerados pelo banco e `ON CONFLICT DO NOTHING`. Não muda as seis tarefas anteriores nem marca homologação SFMC como feita. Datas iniciais: PREPARAÇÃO documentada de 03/11; Fábrica e publicação da estratégia em 06/11/2026.

Validação: `node --test scripts/test-wiki-seedlist.mjs`, testes `wikiPilotModel.test.ts`, gate TypeScript e conferência visual. O teste SQL usa PGlite com o escritor real e cobre idempotência, evidência, datas, auditoria, dependências, concorrência e acesso negado. O GaaS não executa Test Send nem ativa jornadas por meio deste bloco.
