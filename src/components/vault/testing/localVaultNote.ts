import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd, env } from 'node:process';

/**
 * As notas reais da Wiki não ficam no repositório público: a fonte é o vault Obsidian local
 * e a cópia viva é o Supabase (`gaas_vault_notes`). Testes que validam conteúdo de uma nota
 * real leem direto do vault local e são pulados quando ele não existe (CI, clone limpo).
 *
 * Ordem de busca: GAAS_VAULT_DIR, pasta irmã do checkout e pasta dois níveis acima (worktrees).
 */
export function localVaultNote(relativePath: string): string | null {
  const roots = [env.GAAS_VAULT_DIR, '../Afinz-CRM-Midia-Vault', '../../Afinz-CRM-Midia-Vault'].filter(
    (dir): dir is string => Boolean(dir),
  );
  for (const root of roots) {
    const file = resolve(cwd(), root, relativePath);
    if (existsSync(file)) return readFileSync(file, 'utf8');
  }
  return null;
}
