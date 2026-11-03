---
tags: [supabase,tabela,auth]
tipo: entidade
camada: dados
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Tabela: profiles

**Definição:** os **usuários** do GaaS — perfil ligado ao `auth.users` do Supabase, com `role` para controle de acesso.

## Contexto
Campos: `id` (FK → auth.users), `email`, `full_name`, `avatar_url`, `role` (default `user`). Sustenta o `AuthContext` e o `UserRoleContext` da [[Configurações|aba de Configurações]]. RLS habilitado (uma das poucas tabelas protegidas — ver [[Governança-de-Dados]]).

> 📊 Snapshot 2026-06-08 — 7 usuários.

## Relacionado
- [[Configurações]] · [[Governança-de-Dados]] · [[Modelo-de-Estado]]
