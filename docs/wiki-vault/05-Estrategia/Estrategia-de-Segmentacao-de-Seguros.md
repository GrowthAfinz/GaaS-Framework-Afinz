---
title: Estratégia de Segmentação de Seguros
tags: [estrategia, seguros, segmentacao, sfmc, regua]
tipo: estrategia
camada: estrategia
aliases: [Estratégia de seguros, Segmentação de Seguros]
atualizado: 2026-11-06
status: proposto
status_detalhe: síntese editorial aprovada; desenho operacional consolidado, implantação e pendências a confirmar
fonte: Automacao-Processos-Seguros; DE-MAPA_SEGUROS; Segmentacao-Seguros-Celular (04/11/2026)
---

# Estratégia de Segmentação de Seguros

## 1. Lógica da estratégia

Escolher a próxima oferta pelo contexto do cliente e conduzir uma pessoa por vez em uma etapa de seguro. O objetivo é chegar à contratação efetivada e acompanhar sua permanência. Preenchimento de formulário é um evento intermediário.

Esta página apresenta o desenho consolidado mais recente, incluindo a revisão de 04/11 à tarde. **A estratégia está proposta; sua publicação não confirma implantação no SFMC.** O fluxo original de dados tem execução a confirmar, e os novos passos estão identificados abaixo. Diagnósticos, SQL e histórico permanecem em [[Segmentacao-Seguros-Celular]], [[Automacao-Processos-Seguros]] e [[DE-MAPA_SEGUROS]].

O engajamento orienta a audiência inicial: compra e acesso ao app nos últimos 30 dias. Boas-vindas, até 60 dias da primeira conta, é uma célula de teste. A compra em eletrônicos é contexto auxiliar; o gatilho prioritário do Celular depende de troca comprovada de modelo de aparelho. Idade, gênero inferido, limite e posse genérica de seguros não demonstram propensão causal. A revisão mais recente retirou limite disponível da elegibilidade.

## 2. Regras por seguro

As condições comuns de entrada e saída estão na seção seguinte. Esta matriz registra somente o que muda entre produtos.

| Seguro | Quem e quando trabalhar | Abordagem | Impedimento específico | Evento e fonte de conclusão |
|---|---|---|---|---|
| Celular | Pessoa com smartphone apto; prioridade para troca de modelo comprovada. Lead da LP nos últimos 90 dias segue para recuperação, fora da nova oferta. | Gatilho: um contato no D+1. Na régua, apresentar opções e deixar o cliente escolher Essencial, Plus ou Premium na LP. | Aparelho fora dos critérios propostos ou sem evidência suficiente para o gatilho. Posse atual ainda sem coluna na MAPA. | Efetivação/apólice em fonte a integrar. LP mede adesão e plano escolhido; não comprova venda. |
| Mulher | Público feminino na etapa definida pela rotação; a regra de identificação e elegibilidade comercial precisa de confirmação. | Oferta do produto; quem abandonou segue para recuperação em jornada própria. | Posse/contratação precisa de outra fonte: a coluna histórica `seguro_vida_mulher` não representa o produto atual. Gênero inferido não substitui a confirmação necessária na LP. | Contratação confirmada na fonte operacional; cobertura por CPF ainda pendente na MAPA. |
| Residencial 24h | Etapa da rotação conforme perfil e seguros anteriores. Não há gatilho residencial validado; mudança de CEP e compras ligadas à casa são hipóteses. | Oferta de assistência residencial, com exclusão de quem já possui o produto. | Flag `afinz_assit_residencial_24h > 0`, observada na MAPA. | Contratação confirmada; mudança de posse poderá servir como evidência operacional após validação das flags e do log. |

**Aptidão do aparelho, proposta:** smartphone Android/iOS, uso nos últimos 90 dias, Android 13+ ou iOS 17+, valor estimado acima de aproximadamente R$ 600. São filtros de seleção de marketing; os requisitos contratuais da seguradora precisam ser confirmados. Novo registro de aparelho sem mudança de modelo pode ser reinstalação e não dispara o gatilho. A DEVICE disponível na análise era uma amostra antiga, insuficiente para operar essa seleção.

**Outros produtos:** Você Bem, Dental, AP e Proteção Completa entram como contexto de posse e contato. Não recebem uma nova régua nesta estratégia. Você Bem tem dinâmica automática/gratuita e cobrança a confirmar; Dental, AP e Proteção Completa têm informação de venda por call/recuperação. Somá-los como “comprador de seguro digital” distorce a seleção.

## 3. Percurso do cliente

**Base por CPF → elegibilidade → controle/tratamento → escolha do seguro → etapa de contato → contratação ou fim da etapa → pausa → próxima oferta.**

A base proposta exige pelo menos uma conta `NORMAL` e nenhuma conta em atraso. Bloqueios são respeitados por canal. Desinteresse em `ENT.sem_interesse` impede contato; o grupo controle de 10% permanece sem exposição da estratégia, mas participa da medição. A atribuição proposta é fixa por CPF, com semente própria de seguros. O controle precisa abranger também os gatilhos para preservar a comparação.

| Perfil | Sequência proposta |
|---|---|
| Mulher com aparelho apto | Celular → Mulher → Residencial |
| Homem com aparelho apto | Celular → Residencial |
| Mulher sem aparelho apto | Mulher → Residencial, **ordem pendente de alinhamento** |
| Homem sem aparelho apto | Residencial |
| Gênero ausente ou não contemplado na regra | Encaminhamento a definir; não classificar silenciosamente como homem ou mulher. |

Cada etapa dura 30 dias, com pausa de 15 dias entre etapas. A cadência proposta é de dois e-mails e um SMS por seguro; WhatsApp fica restrito a boas-vindas, gatilho e pessoas que clicaram. A quantidade de contatos nessas exceções e o teto compartilhado com outras frentes ainda precisam ser definidos.

Quem já possui ou efetiva o seguro pula a etapa correspondente. O gatilho Celular tem prioridade e conta como a etapa Celular, evitando sua repetição na rotação. Atraso ou desinteresse interrompe o percurso. Critérios de retomada após regularização, fim de todas as etapas, nova elegibilidade e recuperação pós-formulário permanecem abertos; não há reentrada automática definida.

## 4. Execução na automação

A `processos_seguros` faz a troca diária entre Marketing Cloud e Athena/S3. A separação proposta ocorre **por CPF na base comum**, seguida da escolha de `PRODUTO_ATUAL` no controle da régua. Não há evidência de três automações independentes nem de DEs finais de disparo já definidas para cada produto.

| Passo / estado | Entrada → atividade → saída | Ação e responsabilidade |
|---|---|---|
| 1 · execução a confirmar | `LP_SEGUROS_GERAL` → `query_lp_seguros_athena` → `LP_SEGUROS_ATHENA` | Substituir; padroniza os formulários para exportação. |
| 2–4 · execução a confirmar | `LP_SEGUROS_ATHENA` → extração, conversão UTF-16/UTF-8 e transferência → S3 `tbl_formulario_seguros_AAAA-MM-DD.csv` | Exporta adesões para o processamento externo. |
| 5 · execução a confirmar | S3 `mapa_seguro.csv` → `Importação S3 Mapa Seguros` → `MAPA_SEGUROS` | Sobrescrever; foto de posse por CPF, chave normalizada com 11 dígitos. |
| 6 · proposto | `MAPA_SEGUROS` → `VER_SEG_MAPA_CONTAGEM` | Interrompe abaixo de 600 mil linhas; limite inicial baseado no diagnóstico de 04/11, sujeito a revisão. |
| 7 · proposto | MAPA hoje + `MAPA_SEGUROS_ONTEM` → `Q_SEG_06_MOVIMENTO` → `SEGUROS_MOVIMENTO_LOG` | Atualizar; chave CPF + produto + data de detecção. Registra ENTRADA/SAIDA. |
| 8 · proposto | `MAPA_SEGUROS` → `Q_SEG_07_SNAPSHOT` → `MAPA_SEGUROS_ONTEM` | Substituir; chave CPF. Guarda a foto somente depois da comparação. |
| 9 · proposto | `CLIENTES ATIVOS` + MAPA + `MAPA_MCC` + LP → `Q_SEG_08_BASE_CPF` → `SEG_BASE_CPF` | Substituir; chave CPF. Base não sendable com elegibilidade, sinais e controle. DEVICE ainda depende de integração. |
| 10 · proposto, query a escrever | Base elegível + estado anterior → `SEG_REGUA_CONTROLE` | Atualizar; chave CPF. Guarda produto atual, datas, produtos já recebidos, motivo de saída e grupo. |
| Entrega às jornadas · a definir | Controle da régua → audiências de Celular, Mulher e Residencial → jornadas e recuperação | Nomes, chaves, sendability, ação de gravação e vínculo com cada jornada ainda não confirmados. |

`SEG_BASE_CPF` responde **quem é a pessoa e seu contexto**. `SEG_REGUA_CONTROLE` responde **em qual etapa ela está**. As audiências de disparo devem derivar dessa decisão, respeitando produto, grupo, canal e supressões; não são sinônimos da base comum.

**Cuidados de execução:** atividades de um mesmo passo rodam em paralelo. Por isso comparação, snapshot e audiência ficam em passos sequenciais. Na primeira ativação, inicializar a foto anterior antes de habilitar o diff, evitando registrar toda a carteira como venda nova. O arquivo de retorno tem nome fixo: a contagem protege contra truncamento, mas não garante atualização; falta validar também a data de geração. SQL e procedimento detalhado estão na nota da automação.

## 5. Medição e decisões abertas

| Evento | Como ler e de onde vem |
|---|---|
| Exposição e engajamento | Execução da comunicação: envio/entrega e clique, com cobertura por canal. Exposições não são pessoas únicas. |
| Lead / adesão | Preenchimento na `LP_SEGUROS_GERAL`, por CPF, produto e data; plano quando disponível. |
| Contratação / efetivação | Confirmação operacional ou apólice. O diff de posse é um sinal candidato, cuja semântica precisa ser validada. |
| Permanência / saída | Acompanhamento em 30, 60 e 90 dias. SAIDA da MAPA só pode ser chamada de cancelamento após confirmar o significado das flags. |
| Incrementalidade | Comparar tratamento e controle no mesmo produto, população e janela. Proposta inicial: conversão em 30 dias, por célula; não atribuir causalidade por clique ou posse. |

O BI e a nota [[10-Resultados/Mecanicas/Seguros|Seguros]] concentram resultados e cobertura das fontes. Esta página concentra as regras que permitem interpretá-los; valores históricos não são repetidos aqui.

| Decisão / confirmação necessária | O que impede | Responsável a envolver |
|---|---|---|
| Estado ativo da automação, horários e passos efetivos | Tratar o desenho como operação implantada | Operação CRM |
| Significado das flags e inclusão de Mulher/Celular na MAPA | Exclusão por posse e medição de efetivação/saída desses produtos | Dados/Athena + Seguros |
| DEVICE atual, histórico por CPF e finalidade autorizada | Seleção de aparelho e gatilho real de troca | IN/Dados + Segurança |
| Elegibilidade comercial, gênero e ordem inicial para mulheres sem aparelho apto | Fechar a seleção e sequência por produto | Seguros + CRM |
| DEs finais, chaves de envio e queries da régua/recuperação | Conectar a decisão às jornadas sem duplicidade | Operação CRM |
| Pressão conjunta com call/Vai de Visa, exceções de WhatsApp e reentrada | Governar convivência e retomadas | Growth + CRM + Call |
| Atualidade do arquivo e validação inicial dos movimentos | Evitar mudanças falsas e medir com confiança | Dados + Operação CRM |

## Referências de implementação

[[Automacao-Processos-Seguros]] · [[DE-MAPA_SEGUROS]] · [[Segmentacao-Seguros-Celular]] · [[MOC-SFMC-DEs-e-Automations]] · [[Anti-Overlap-Pressão-de-Contato]]
