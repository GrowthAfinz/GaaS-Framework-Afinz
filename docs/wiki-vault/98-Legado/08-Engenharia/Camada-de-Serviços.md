---
tags: [engenharia, gaas, services]
tipo: engenharia
camada: codigo
tipo_diataxis: reference
atualizado: 2026-06-08
status: legado
fonte: codigo-gaas
status_original: confirmado
legado_desde: 2026-10-29
---

# Camada de Serviços

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver a documentação do repositório (`calendar-estrategico/docs/`) e o [[08-Engenharia/MOC-Engenharia|MOC de engenharia]].

O mapa completo dos services (arquivos, funções exportadas, padrões de código) vive no repo: [`calendar-estrategico/docs/reference/services.md`](../../calendar-estrategico/docs/reference/services.md). Hoje são 16 arquivos (5 de topo + 11 do pipeline ML) — CLAUDE.md ainda diz "13".

Os services são o ponto único de contato com o Supabase (todo o app é client-side, sem backend próprio) e a casa do pipeline de IA (ver [[Pipeline-ML]]).

**Pontos de atenção para negócio/segurança:**
- URL e `anon key` do Supabase estão **hardcoded** em `supabaseClient.ts`, não em `.env` como o CLAUDE.md sugere. Combinado com RLS desligado (ver [[Decisões-Técnicas]] e [[Dívida-Técnica]]), isso é risco real de exposição de dados — relevante para qualquer decisão de abrir o app além do time interno.
- `intelligentUpdateService` faz merge/atualização "inteligente" ao reimportar dados — a regra exata de merge (upsert por taxonomia vs. por id) ainda não está validada; cuidado ao confiar em reprocessamentos de histórico sem checar duplicidade.

## Relacionado
- [[Arquitetura-Geral]]
- [[Pipeline-ML]]
- [[Hooks-Catálogo]]
- [[Decisões-Técnicas]]
- [[Dívida-Técnica]]
- [[Convenções-de-Código]]
- [[MOC-Engenharia]]
