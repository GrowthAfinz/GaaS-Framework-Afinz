# Integração do PR #33 na main de 27/10/2026

Base: `73ccd4bdbca48d45b717742c61c021aad838b8e8`.
Origem: PR #33, commit `26dd12d2420d4f4ab8327a6af398dd58c9e34db2`.
Branch separada: `codex/report-live-monthly-full-integration8`.

## Resultado da integração local

O cherry-pick teve conflito somente em `.gitignore`. Foram preservadas a proteção existente `.env.agent` e a exclusão de exports reais `artifacts/report-live-async/golden/`. Nenhuma proteção foi removida.

Os arquivos de código combinaram textualmente com a main atual. Isso não é prova de ausência de regressão; os testes e o CI precisam ser avaliados no SHA final desta branch.

Duas correções adicionais:

- P1 sem candidata declara a ausência no snapshot e exige verificar cobertura/amostra antes de inferir estabilidade. Não recomenda manter curso apenas porque a fila está vazia.
- Checagem de fixtures normaliza CRLF para LF na leitura. O gerador e os dados não mudam; a comparação não acusa drift semântico por checkout Windows.

## Efeito esperado e limites

`monthly_report` passa a ser alias de `monthly_full`. A cardinalidade mensal passa a decorrer da cobertura e das fusões aprovadas. `executivo_mensal`/`deep_dive` continuam projeções derivadas. O contrato de pacote de produção passa a exigir evidência narrativa e contrato explícito de gráfico nos arquétipos correspondentes.

A validação legada continua separada por versão de spec. Isso preserva o histórico como histórico; não recertifica, publica ou ativa o run antigo. O PR não resolve lacunas de chart_contract/narrativa do futuro pacote real nem a tentativa Google parada.

Não há migration, mudança em resolvePartner, novo run, deploy de Edge Function, publicação Google, mudança de ponteiro ou limpeza de staging nesta integração. O PR #33 original permanece aberto; esta branch é a integração revisável sobre main atual, sem reescrever a branch antiga.

## Gates

- Report Live: 69/69 testes locais.
- Fixtures: 1 baseline estrutural + 3 fixtures, verificação sem regravar conteúdo.
- Renderer Office: 3/3.
- Deno: passou.
- Frontend completo, TypeScript, build e CI: consultar resultados finais do PR; não inferir segurança de produção apenas destes testes de contrato.

Não é possível prometer risco zero. O resultado permite revisar o merge de código separadamente da aplicação/deploy e da primeira geração real do monthly_full.
