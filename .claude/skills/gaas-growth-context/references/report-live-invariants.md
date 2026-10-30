# Report Live Invariants

Use estes invariantes antes de qualquer acao de Report Live.

## Arquitetura

`DB append-only -> views tidy -> narrativa LLM -> deck vitrine`

- 1 view = 1 tabela/grafico = 1 slide = 1 comentario.
- Deck e vitrine; planilha/view segura dado, formula e grafico.
- Textos sao preenchidos por humano ou IA.
- Numeros vem de Supabase/SQL/views.
- LLM nao cria numero, meta, variacao, taxa ou baseline.

## Report Live com skip_llm

Quando o fluxo usa `skip_llm`, a LLM externa deve entregar:

- textos prontos por slide;
- recomendacoes por slide ou bloco;
- limites de leitura;
- confianca;
- action queue.

A publicacao deve enviar estes textos para a edge function `report-sync` com `skip_llm:true`, conforme o runbook vigente do projeto.

## Publicacao e observabilidade

- Disparar publicacao via `pg_net` quando o runbook pedir execucao pelo banco.
- O payload deve carregar `skip_llm:true`, `texts`, `recomendacoes`, periodo e identificadores do report.
- Validar `report_runs` ate status final `done` ou erro explicito.
- Preservar contadores e `briefing_version` quando existirem no fluxo.
- Se a publicacao nao for executada, declarar que o texto/payload foi preparado mas nao enviado.

## Briefing e memoria

- Ler a aba `BRIEFING` da planilha-mestre antes de escrever narrativa final.
- Briefing define tom humano e foco do output.
- `report_memory` define memoria de negocio.
- Nao misturar briefing, memoria e dado vivo como se fossem a mesma fonte.
- O briefing pode mudar a enfase e o tom; nao pode autorizar numero fora da view.

## Guardrails

- Usar apenas dias fechados quando o output exigir comparacao operacional.
- Respeitar consolidacao D-3 quando o runbook ou fonte especifica indicar essa latencia.
- YoY proibido ate jan/2027, salvo instrucao contraria baseada em fonte valida.
- CPA plataforma nao e CAC.
- Conversao zero e dado valido.
- Zeramento abrupto pode ser tracking, coleta ou mapping.
- Tendencia exige janela suficiente; nao vender causalidade com poucos pontos.
- PT-BR sem emojis para textos de report.
