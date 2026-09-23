# Release 6 — reutilização determinística publicada

**Data:** 2026-09-23  
**Estado:** publicada na `main`, Supabase e GitHub Pages  
**PR funcional:** [#23](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/23)  
**Merge:** `ec223dae3a65281a317ba12e91830f182f127731`

## Resultado

A criação de uma aposta agora consulta memórias versionadas por matching determinístico. Para cada sugestão elegível, o usuário precisa registrar `reused` ou `discarded`; descarte exige justificativa. O drawer da aposta preserva a revisão e a decisão consultadas, e a aba Memória expõe contagens e taxa de reuso.

Não foram introduzidos embeddings, busca vetorial, similaridade de texto livre ou recomendação generativa.

## Contrato materializado

- `growth_find_applicable_learnings(uuid)` retorna no máximo cinco matches explicados;
- coincidência apenas de frente não qualifica;
- conflito explícito de dimensão exclui o match;
- expiração, contestação, substituição, invalidação ou bloqueio impedem reuso;
- `growth_accept_signal_as_bet_with_memory(...)` recalcula e valida o match no servidor;
- `growth_learning_applications` congela revisão, decisão, score, razões, elegibilidade e contexto;
- reuso cria `growth_learning_links.relation_type = 'applies_to'` para a aposta;
- snapshots de aplicação rejeitam update e delete;
- `growth_learning_applications_v` usa `security_invoker`;
- `growth_memory_active_v` inclui `reused_count`, `discarded_count` e `reuse_rate`.

## Migrations

Arquivos rastreados:

- `20260923174806_growth_learning_reuse_release_6.sql`;
- `20260923180857_growth_learning_reuse_candidate_index.sql`.

Versões registradas no Supabase:

- `20260923180746_growth_learning_reuse_release_6`;
- `20260923180940_growth_learning_reuse_candidate_index`.

O segundo arquivo foi adicionado apó o advisor identificar a FK `action_candidate_id` sem índice de cobertura.

## Estado remoto reconciliado

Logo apó a publicação:

- 0 aplicações de memória persistidas;
- 5 memórias ativas;
- 3 colunas de medição de reuso presentes;
- matcher e comando transacional presentes;
- `authenticated` executa o matcher;
- `anon` não lê a view de aplicações;
- os 10 candidatos reais mais recentes retornaram 0 matches.

Zero match é o resultado correto para o dataset atual: os sinais recentes de cobertura de template e qualidade de mídia não compartilham dimensão específica suficiente com as cinco memórias curadas. O sistema não forçou uma sugestão apenas para preencher a interface.

## Gates

O workflow do PR `35900571699` passou com:

- 143 testes frontend;
- contrato SQL da Release 6 em PostgreSQL 17;
- 57 testes do Report Live;
- TypeScript com 57 diagnósticos preexistentes e zero novos;
- checks das Edge Functions;
- build Vite.

O workflow pós-merge `35907261008` repetiu os gates e publicou o Pages. O bundle `index-DBXuWFmr.js` respondeu HTTP 200 e contém:

- `growth_find_applicable_learnings`;
- `growth_accept_signal_as_bet_with_memory`;
- `Memória aplicável`.

## Limites mantidos

- mesclar um sinal em aposta existente ainda não abre uma nova decisão de memória;
- não há aprendizado automático dos pesos;
- não há aplicação silenciosa;
- o Report Live não foi alterado;
- nenhum sinal, aposta ou aplicação sintética foi persistido em produção.

## Próximo corte

A Release 7 permanece como integração transversal e editorial: iniciar apostas nas telas analíticas, reapresentar os objetos nas telas de origem e projetar apostas, outcomes e aprendizados no Report Live. Antes de implementá-la, o corte deve ser especificado em uma entrega vertical menor; a Release 6 não autoriza antecipar todas as integrações de uma vez.
