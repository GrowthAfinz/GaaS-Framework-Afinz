# Snapshot completo da Wiki

Espelho versionado das notas Markdown elegíveis do vault local do Pablo em `docs/wiki-vault/`.
A Wiki viva permanece em Supabase; este diretório não é carregado pelo frontend.
O manifesto guarda os hashes de conteúdo. Não editar os compilados para corrigir notas.
Templates e configurações Obsidian não fazem parte da publicação.

Origem local: `Afinz-CRM-Midia-Vault/`, externa à raiz deste repositório de aplicação.
A publicação usa baseline, trava e uma transação para inventário completo sem exclusões.
Para verificar o snapshot: `node scripts/export-vault-projection.mjs --vault docs/wiki-vault --batch-size 10000`.
