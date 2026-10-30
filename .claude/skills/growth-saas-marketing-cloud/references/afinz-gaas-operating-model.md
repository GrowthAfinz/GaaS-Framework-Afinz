# Afinz GaaS Operating Model

## 1. Definicao do produto

GaaS Afinz e um sistema operacional de growth para aquisicao CRM e midia paga. Nao tratar como dashboard generico.

Funcao central: transformar historico, dados vivos, campanhas, jornadas, templates e resultados em decisoes acionaveis para o operador.

Pergunta-mestra:

`O que precisamos fazer hoje para melhorar producao, eficiencia ou confiabilidade da operacao?`

## 2. Decisao em ate 2 minutos

Toda tela ou recomendacao deve ajudar a responder:

1. A operacao esta saudavel, em risco ou comprometida?
2. O desvio vem de dados, volume, funil, custo, mix, criativo ou execucao?
3. Qual campanha, segmento, canal, jornada, template ou activity_name explica a mudanca?
4. A operacao esta no ritmo necessario para a meta?
5. O que deve ser feito hoje, acompanhado ou investigado?

Usar a narrativa:

`Sinal -> Impacto -> Causa provavel -> Evidencia -> Acao -> Confianca`

## 3. Escopo operacional

Frentes principais:

- CRM Aquisicao: fonte central `activities`; foco em propostas, aprovados, cartoes, CAC e funil completo.
- CRM Rentabilizacao: fonte `rentabilizacao_activities`; limitar a execucao, entrega, abertura e clique, exceto regra especifica de Opt-in Copa Visa.
- Originação B2C: fonte `b2c_daily_metrics`; leitura de producao total e contexto.
- Midia paga: fonte `paid_media_metrics`; leitura por plataforma, campanha, adset, anuncio/criativo.
- Metas: fonte `goals`; ritmo, gap e cac_max.
- Qualidade de coleta: `collection_queue` e `collection_execution_logs`.

## 4. Ontologia operacional

Entidades nucleares:

- Campanha: unidade de planejamento e leitura agregada.
- Jornada: sequencia logica de disparos, frequentemente codificada no nome.
- Regua: jornada como sequencia ordenada e condicional.
- Disparo: execucao concreta, geralmente uma linha em `activities`.
- Template: conteudo reutilizavel desacoplado do disparo.
- Experimento: agrupamento de variacoes comparaveis.
- Segmento: publico-alvo central para expectativa de conversao, custo e acao.
- Safra: coorte temporal para recorrencia e comparacao.

Regra critica: `template_id` nao e `activity_name`.

- `template_id`: identidade de conteudo/criativo.
- `activity_name`: identidade de execucao/disparo.

## 5. Fonte viva vs contexto

Usar o vault Obsidian como ontologia, memoria semantica e contrato operacional.

Usar Supabase como fonte viva para numeros atuais.

Snapshots do vault ajudam a interpretar, mas nao substituem consulta viva quando a decisao depende de dado atualizado.

## 6. Principios de produto

- Decisao antes de visual.
- Acao reversivel antes de automacao definitiva.
- Sugestao explicavel antes de "IA magica".
- Governanca antes de escrita automatica.
- Comparacao somente entre unidades semanticamente compativeis.
- Baixa amostra reduz confianca, nao deve sumir sem explicacao.
- Conversao zero e resultado valido, nao dado ausente.

## 7. Priorizacao

Priorizar acoes por:

`impacto esperado x urgencia x confianca / esforco`

Buckets recomendados:

- Agir hoje: bloqueio, perda material ou acao de baixo arrependimento.
- Acompanhar: sinal relevante que precisa de nova janela.
- Investigar: baixa confianca, problema de dados ou hipotese.

## 8. UX minima por modulo

Cada modulo relevante deve expor:

- estado atual
- fonte e periodo
- filtros ativos
- baseline ou comparativo
- principal sinal
- explicacao da recomendacao
- acao disponivel
- status de confianca

## 9. Quando propor automacao

Automatizar apenas quando:

- a entidade esta bem definida
- a regra e explicavel
- ha historico suficiente
- o erro e reversivel ou revisavel
- existe estado de auditoria

Caso contrario, propor "assistencia inteligente" com confirmacao humana.

