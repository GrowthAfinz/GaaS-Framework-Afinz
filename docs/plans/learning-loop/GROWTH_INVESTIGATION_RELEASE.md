# Investigação Growth — entrega integrada

## Produto

Dois escopos do A0; entradas manuais em Resultados e na área Investigações, mais entrada automática por observações materiais T1/T2. A fila fica no Supabase. Codex/Claude somente a consomem quando o operador pede, seguindo `.claude/skills/gaas-growth-investigation/SKILL.md`.

O usuário consulta fatos, cobertura, cortes, hipóteses, próximas verificações e decisões. O monitor técnico fica recolhido. Candidata elegível aparece na Fila; assumir aposta exige usuário. Apostas, outcomes e memória usam os contratos existentes, sem simular campanha ou resultado real.

## Implementação

- `growth_investigations`: identidade por operação/período/pergunta/filtros.
- Evidências imutáveis com hash SHA-256 e revisão, leitura consistente em um statement, grão, reconciliação, cobertura e contexto de conteúdo/memória explicitamente vinculado.
- Números de custo/custo por cartão em evidências usam seis casas decimais; campos da origem e somas técnicas são preservados. Não há correção de fonte.
- Chave candidata repetida é detectada antes dos filtros analíticos e inclui colisões de outros recortes na mesma chave. Bloqueia métricas afetadas, sem descartar linhas arbitrariamente.
- Observação histórica original permanece referenciada. A nova política conservadora de grão pode excluir meses da referência que o observador original havia incluído; essa diferença é apresentada.
- Fila com reserva atômica de 30 minutos, renovação, até três tentativas por ciclo e reprocessamento manual auditado. Histórico de tentativas mantém sequência mesmo após reset do contador de retentativas.
- Novos dados invalidam análises anteriores. Conclusão revalida hash/revisão; trabalho antigo fica superseded em vez de publicar sobre dados novos.
- Publicação de análise e candidata é transacional. Uma candidata por investigação; revisões não reabrem decisões anteriores.
- Novas candidatas têm investigation_id/analysis_id e run_id nulo. Candidatas antigas mantêm o contrato de relatório; nenhuma investigação cria um report_run artificial.
- Guardas de escopo valem na leitura e nos comandos antigos de aposta/decisão. Perfis Plurix não ganham acesso ao recorte B2C pela nova interface.
- Hash da skill cobre instruções, contrato de saída e script de validação, normalizados para LF; não depende do modelo utilizado.

## APIs

App autenticado: `growth_investigation_operations`, `growth_list_investigations`, `growth_request_investigation`, `growth_decide_investigation`, `growth_retry_investigation`.

Agente autorizado: `growth_claim_investigation`, `growth_renew_investigation`, `growth_fail_investigation`, `growth_complete_investigation`, `growth_publish_investigation_analysis`.

Rotinas internas não ficam executáveis por anon/authenticated. Leitura respeita operação, perfil e membership ativo. A identidade do agente é declarada e auditada; não é prova criptográfica de qual LLM executou a tarefa. Validação de referências/valores não certifica semanticamente prosa livre.

## Operação e falhas

Peça: **“rode a fila de investigações usando a skill gaas-growth-investigation”**. Por padrão, a skill processa no máximo cinco itens por pedido. O estado pendente significa espera pelo agente, não falha do aplicativo.

Falhas técnicas vão a pending até o limite, depois failed. Dados insuficientes concluem blocked/inconclusive e não consomem retentativas em loop. Alteração de evidência cria nova revisão; decisão humana antiga é preservada. Agent claim e completion não mudam métricas da origem nem executam campanhas.

## Rollout

1. Aplicar migrations com `intake_enabled=false` e `candidates_enabled=false`.
2. Conferir funções, RLS, origem de candidatas e advisories versus baseline.
3. Publicar interface após CI no SHA final.
4. Habilitar intake; preparar os dois casos reais de setembro, pela mesma coleta do produtor e pela entrada manual; verificar deduplicação.
5. Consumir os dois trabalhos usando a skill, com candidatas ainda pausadas. Proprietaria permanece bloqueada quando o grão for ambíguo.
6. Habilitar publicação restrita ao piloto e publicar análise elegível pelo comando de publicação idempotente. Revalidar fonte/hash, candidata, evento e totais operacionais.

Nenhuma aposta ou outcome fictício será criado em produção para demonstrar o ciclo. O percurso completo até memória é exercitado com as migrations reais e dados sintéticos isolados.

## Rollback

Pausar novas solicitações/processamento e publicações:

```sql
update public.growth_investigation_settings set intake_enabled=false,candidates_enabled=false where id=true;
```

Preservar schema, evidências, análises, candidatas e decisões para auditoria. Não apagar dados ou desfazer migrations destrutivamente. A observação determinística anterior continua independente. O rollback do frontend não deve remover a compatibilidade de origem já usada por candidatas existentes.

## Validação

`npm run test:growth-investigations` cobre fila e contratos reais candidata → aposta → outcome revisado → memória, além de candidata antiga. Frontend cobre semântica de referência histórica, ausência/zero e precedência de desatualização. CI mantém os contratos anteriores e o gate de dívida TypeScript.

Os detalhes finais da implantação, hashes e IDs de evidências reais serão registrados no fechamento desta entrega. Dados operacionais detalhados continuam fora do Git.
