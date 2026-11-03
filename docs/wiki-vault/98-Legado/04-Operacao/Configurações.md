---
tags: [gaas,aba,admin]
tipo: operacao
camada: operacao
atualizado: 2026-06-08
status: legado
fonte: gaas-supabase
status_original: confirmado
legado_desde: 2026-10-29
---

# Aba: Configurações

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver o app atual e o [[00-Indice/MOC-Operacao|MOC de operação]].

**Definição:** a aba de **administração** — gestão de [[goals|metas]], versionamento de framework e migração de dados.

## O que entrega
- **GoalsManager**: CRUD das metas mensais ([[Metas-e-CAC]]).
- **Versionamento**: histórico de CSVs de framework (`framework_versions`, `useVersionManager`).
- **DataMigration**: ferramentas de migração/ajuste de dados.
- Controle de acesso por papel (`UserRoleContext`, `profiles`).

## Relacionado
- [[Metas-e-CAC]] · [[goals]] · [[profiles]] · [[GaaS-9-Áreas]]
