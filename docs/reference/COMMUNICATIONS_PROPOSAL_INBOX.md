# Cadastro e Templates V2 — fila compartilhada de propostas

Implementação de 07/10/2026. Wiki fora do escopo.

## Operação
A tela abre em Propostas, sem depender do mês dos dashboards. Uma linha representa uma mensagem/uso configurado. O operador abre Revisar, edita o ID, confronta conteúdo/público, registra motivo e salva. Pode aprovar ou rejeitar em massa; rejeição exige motivo. Aprovação exige simulação vigente. Cada lote tem mesma origem e contexto, incluindo campanha/oferta conhecida; Vibe e Copa ficam separados. Opt-outs ficam no filtro técnico e não entram em lotes.

Escolher versão atual é explícito. Sem selecionar activities, a aprovação cadastra conteúdo e uso configurado; não inventa execução. Para vínculos históricos, o operador informa datas/evidência e escolhe IDs exatos. O banco revalida jornada, canal, período, vínculo existente e versão atual. Vínculos preenchidos não são sobrescritos.

O upload virou ação secundária pequena ao lado do resumo. Só recebe ZIP e publica mensagens/propostas no staging; não contém a revisão. Biblioteca usa linhas compactas e preserva anexos e versões. Histórico reúne análise recebida, publicação da análise, edição, rejeição e aplicação com ator e snapshot.

## Persistência e autorização
- communications_analysis_runs: produtor, origem, versão de regra e fontes/hashes.
- communications_reconciliation_proposals: uma proposta por mensagem, revisão otimista, ID observado/proposto, contexto, alternativas, razões, divergências, decisão preparada e reviewer.
- communications_proposal_events: snapshots de cada revisão/decisão.
- communications_proposal_batches: chave idempotente, seleção congelada, fingerprint e resultado.

Leitura e revisão compartilhadas seguem o escopo autenticado já existente de Comunicações. Não se adicionou uma nova matriz de permissões por BU. Produtor e operador ficam registrados separadamente. Tabelas novas têm RLS e SELECT autenticado; writes passam por gateway validado privado, public wrappers SECURITY INVOKER. Nenhuma credencial administrativa vai ao navegador.

A migração prepara propostas do pack já recebido sem aprovar conteúdo ou vincular disparos. Novas mensagens recebem proposta determinística ao fim da transação. Uma análise de agente pode complementar a proposta antes da revisão humana; não sobrescreve revisão humana.

## Contrato para a IA publicar depois da extração
1. Extrair pacote com o parser e publicar stage_sfmc_package(p_package,p_scope) numa sessão autenticada do produtor.
2. Consultar mensagens/catalogo/histórico e cruzar governança/Vault. Consultas paginadas, sem usar lista visual como universo.
3. Chamar publish_communications_analysis(p_import_id,p_analysis), usando a sessão do produtor, não a identidade do reviewer.

p_analysis:
```json
{
  "rule_version": "nome-versao-da-skill-e-regra",
  "source_refs": {"package_sha256":"hash", "workbook_sha256":"hash", "vault_notes":["notas e revisões"]},
  "proposals": [{
    "message_id":"uuid",
    "proposed_template_id":"b2c_car21_vibe_srsa_Dispd2",
    "resolved_context":{"partner":"Serasa","segment":"Abandonados","subgroup":"21D","family":"car21","channel":"WhatsApp","order":"Não comprovada","evidence":{}},
    "reasons":["Evidência por campo"],
    "conflicts":["Divergências a revisar"],
    "alternatives":["outros IDs candidatos"]
  }]
}
```
A publicação gera nova revisão em estado review. Não escolhe versão atual nem vincula activities. A UI não chama um modelo externo: propostas iniciais são determinísticas; o endpoint recebe a análise preparada pela IA fora do GaaS. Não foi instalado scheduler/processador autônomo de arquivos.

## Governança implementada
ID em af_sub3 tem caixa preservada. Título Meta gera candidatos somente no mesmo canal. Carrinho car21 e carsab permanecem famílias distintas. Contexto Serasa propõe srsa conforme o catálogo atual; inst é interpretado como institucional apenas nesta família. O ramo explícito do Activity Name precede o último critério do caminho; pais que mencionam dois públicos não viram evidência unilateral. Título Meta divergente pode recuperar candidato já existente quando família/público/campanha e ordinal explícito no Activity Name identificam esse cadastro no mesmo canal; permanece em revisão. Sem essas provas, o ID fica a definir. Sufixo herdado do candidato é conservado e sinalizado; não certifica ordem cronológica.

No exemplo 21D/Serasa com título de sábado/institucional, a proposta passa a car21/srsa, mas o conteúdo observado e o candidato configurado permanecem visíveis, em revisão. Não há troca automática da peça.

## Reuso e limites
Tabela compara texto normalizado entre todas as mensagens coletadas. Painel consulta o universo de versões aprovadas e activities com template, mostra cobertura, datas e quantidade do mesmo parceiro/segmento. Vínculo de ID não certifica qual versão histórica foi enviada. Não mede frequência individual, não conclui que texto sem match é inédito e não faz similaridade semântica. A ordem do ramo/esperas é exibida; a UI não inventa uma sequência global para caminhos paralelos.

A fila e catálogo usam leituras paginadas. Leitura de várias tabelas não é um snapshot transacional; revisão/fingerprint do banco impede aplicar uma seleção que mudou. Disparos antigos sem texto não entram na comparação de copy.

## Validação
305 testes frontend existentes; contratos SQL de ingestão/propostas; browser QA em PGlite isolado com 18 ocorrências/14 campanhas/4 técnicas: editar, salvar, recarregar, simular, aprovar conteúdo, escolher atual, rejeitar e consultar técnico. Desktop/mobile e Escape/foco do painel verificados. Nenhuma aprovação de produção feita durante QA. Typecheck de release sem novos erros, mantendo a dívida documentada do main.

Executar: npm run test:sfmc-package-sql; npm test; npm run typecheck:release; npm run build. Browser: servidor Vite em 3017 e node scripts/qa-communications-proposals.mjs. qa-sfmc-package.mjs encaminha para o mesmo cenário.
