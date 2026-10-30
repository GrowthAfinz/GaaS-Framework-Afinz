# Parte REPORT-LIVE — gerar PPTX/PDF sob demanda

**Quando roda:** só por pedido explícito ("gera o report live / o PPT") ou quando houver um pedido na fila de render aguardando (clique em "Gerar" no GaaS, quando existir).
**Nunca** roda por efeito colateral da parte loop.
**Aprovação:** o Pablo valida no chat do Cowork; só depois do "aprovado" explícito os arquivos sobem para o Storage.

> **Estado em 28/09/2026:** o renderer e as peças de Supabase listadas em [`DEPENDENCIAS.md`](DEPENDENCIAS.md) ainda não existem. O passo 1 detecta isso e para com um status claro. Não improvise renderer, não gere slide "de exemplo" com dado real e não use Google Slides.

---

## Passo 1 — Checar se dá para rodar
Verifique, nesta ordem:

1. **Renderer existe?** Procure `report_live_renderer/__main__.py` no checkout do app (`calendar-estrategico/` atualizado com `origin/main`, ou no worktree indicado pelo Codex).
2. **Fila de render existe?**
   ```sql
   select to_regclass('public.report_render_jobs') is not null as fila_existe;
   ```
3. **Exportação do pacote liberada para o dispatcher?** `report_live_dispatch` hoje só aceita `build`, `worker` e `inspect_contract`. É preciso um modo que devolva o pacote/URL assinada do run certificado (ver DEPENDENCIAS, item 2).

Se qualquer um faltar, **pare** e responda:

> Report Live (PPT/PDF) ainda não pode ser gerado: falta <itens>. O último run certificado é <id> (<período>). Assim que o Codex/renderer entregar, é só pedir de novo.

Para achar o último run certificado:
```sql
select id, report_profile, period_start, period_end, certified_at, content_hash
from report_runs where certification_status = 'certified'
order by certified_at desc nulls last limit 3;
```

## Passo 2 — Escolher o run
- Com fila: pegue o job mais antigo `queued` e reivindique pela RPC de lease que o Codex criar (nunca por update direto).
- Sem fila (pedido no chat): use o run certificado mais recente do período pedido. Confirme com o Pablo em uma linha: "Vou gerar o Report Live do run <id> (<período>, perfil <perfil>). Ok?"

## Passo 3 — Baixar o pacote
Chame o modo de exportação liberado (DEPENDENCIAS, item 2), leia a resposta em `net._http_response` e baixe o `report-render-package.json` pela URL assinada para `outputs/report-live/<run_id>/`.
Valide o pacote com o comando `validate` do renderer. Se falhar, pare e mostre os erros (código do slide, campo, motivo).

## Passo 4 — Renderizar e fazer QA
```bash
python -m report_live_renderer render --package outputs/report-live/<run_id>/report-render-package.json \
  --template .claude/skills/afinz-pptx/assets/afinz_template_institucional.pptx \
  --output-dir outputs/report-live/<run_id>/dist
python -m report_live_renderer validate --package ... --pptx .../report-live.pptx --pdf .../report-live.pdf
```
Siga a spec do renderer (`docs/plans/report-live-async/CLAUDE_COWORK_RENDERER_SPEC.md`) e as decisões de 25/09 (`PRODUCT_DECISIONS_2026-09-25.md`). Inspecione **todas** as prévias.

## Passo 5 — Validação do Pablo (no Cowork)
Mostre:
- nº de páginas e a contabilidade das 57 páginas históricas (preserve/merge/…);
- `qa-report.json` resumido: erros (deve ser 0) e avisos;
- as prévias das páginas com aviso + capa + C1 + C8;
- o caminho local do PPTX e do PDF.

Pergunte: **"Aprovado para subir no Storage?"** Só um "aprovado"/"sim" explícito vale. Qualquer ajuste pedido → volte ao passo 4 (se for do renderer) ou explique que é do dado/engine (se for número).

## Passo 6 — Subir no Storage (após aprovação)
Use o caminho de upload governado (DEPENDENCIAS, item 4): paths imutáveis `runs/<run_id>/renders/<renderer_version>/…`, com os hashes SHA-256 do PPTX, PDF e prévias. Finalize o job com os hashes.
Não mova o ponteiro de publicação por conta própria, a menos que a RPC de finalização do Codex faça isso como parte do contrato aprovado.

## Passo 7 — Resumo
"Report Live <período> gerado e enviado: <n> páginas, QA ok, run <id>, arquivos em <paths>. Disponível no GaaS em Relatórios → Report Live" (ou o motivo exato de ter parado).
