# Plurix V17 CRM

## Contrato

Fonte de referencia: V16 revisao 3, MD5 81d0fc720b981e7628bc9f5c87ec2339. V17 MD5 473c7393c4451ff5013c135264d652a7, 65934 caracteres. Todo o HTML desde DOCTYPE e identico a V16.

Os prints fornecidos pelo usuario mostram a DE transmissivel COMUNICACAO_PLX, CPF Text(16) obrigatorio e chave primaria, relacionado a Subscriber Key. FIRST_NAME Text(20), INVESTIDA Text(50) e LIMITE_CRD Number sao os campos usados pela V17. Nenhum registro pessoal dos prints e copiado para testes ou artefatos.

Mudancas apenas no preparo: DE de audiencia, campos FIRST_NAME/LIMITE_CRD/INVESTIDA e marcador V17. CPF continua textual, com fallback para _subscriberkey; lookup exige uma linha. As regras de nome, limite e normalizacao das seis redes permanecem.

SEQUENCIA e TIPO da nova audiencia nao sao usados. A posicao continua em ESTADO_SEQUENCIA_CRM, com fallback para E-mail 1 se nao existe estado; duplicidade/estado invalido bloqueia o envio. Briefing em TB_BRIEFING_CAMPANHA_AQUISICAO, TP_CAMPANHA CRM, vigencia e cardinalidade preservadas. Nao ha escrita em DE durante envio.

V16 permanece intacta. Novo slot V17 ativo, nao principal global. A regua V3 e seus 24 briefings apontam para V17, com snapshots anteriores/posteriores. Nenhum campo de briefing mudou, incluindo links S1D01 a S1D04, checks PNG transparentes, assinatura Amigao para adquiridas e rodape discreto.

## QA

- Testes de fonte revertem somente os campos autorizados e exigem igualdade integral com V16.
- Matriz de preview: seis redes, oito sequencias, com e sem limite. O espelho local nao executa lookups reais do SFMC.
- 48 comparacoes dos 24 briefings atuais, com/sem limite, produzem HTML renderizado identico.
- Quatro previews desktop renderizados com assets carregados.
- Fonte do pacote igual a fixture e migration. Checagem de tipos sem novas falhas.
- Auditoria sem bloqueantes; TreatAsContent permanece limitado ao briefing governado.
- Verificacao no banco confirma V16 intacta, V17 com hash esperado, 24 vinculos e zero alteracoes de conteudo.

## Entrega

Pacote PLURIX_V17_PACOTE_SFMC.zip em artifacts/plurix-v17-2026-10-29 na raiz do projeto pai: HTML, TXT, assunto, pre-cabecalho, copia do CSV atual e instrucoes.

No SFMC atualizar HTML e pre-cabecalho completo; o preparo existe nos dois e deve ser V17. O CSV nao precisa ser reimportado se a ultima V3 ja esta atualizada. Nenhuma mudanca em audiencia, Journey Builder ou opt-out e executada por esta publicacao.

Status ready_for_test_send. Falta Preview/Test Send do tenant com contato de teste da COMUNICACAO_PLX, confirmando a linha de audiencia, nome, limite, rede e sequencia atual. A publicacao no GaaS nao executa um envio SFMC.
