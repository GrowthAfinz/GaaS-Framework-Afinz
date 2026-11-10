# Wiki: onde ficam as notas

Este repositório é público e não guarda notas da Wiki, ontologia compilada nem instruções de agente.

- Fonte canônica: vault Obsidian local `Afinz-CRM-Midia-Vault/`, fora deste repositório.
- Cópia viva: Supabase, tabelas `gaas_vault_notes`, `gaas_vault_links` e `gaas_vault_note_revisions`.
- Backup do espelho que existia aqui (até 2026-11-10): bucket privado `repo-privado` no Supabase.

A publicação vault → Supabase continua com baseline, trava e uma transação para inventário completo sem exclusões.
Os scripts em `tooling/` rodam a partir do vault local; os arquivos gerados (`docs/ontology/`, manifestos) ficam no `.gitignore`.
Testes que validam conteúdo de nota real leem o vault local (`GAAS_VAULT_DIR` ou pasta irmã) e são pulados no CI.
