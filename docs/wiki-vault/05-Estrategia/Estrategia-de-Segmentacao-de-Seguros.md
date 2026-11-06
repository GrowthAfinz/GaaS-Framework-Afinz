---
title: Estratégia de Segmentação de Seguros
tags: [estrategia, seguros, segmentacao, sfmc, regua]
tipo: estrategia
camada: estrategia
aliases: [Estratégia de seguros, Segmentação de Seguros]
atualizado: 2026-11-06
status: proposto
status_detalhe: estratégia operacional para CRM e Growth; contratos de DE e segmentação DEVICE propostos para validação no tenant
fonte: decisões do Pablo em 06/11/2026; pacote SFMC e queries fornecidas; notas técnicas de Seguros
---

# Estratégia de Segmentação de Seguros

Na **régua mensal**, cada cliente percorre a sequência de seguros para os quais está elegível. No **trigger**, uma compra na categoria MCC definida para o produto permite selecionar o cliente em D+1. Esta página orienta o time de CRM e Growth na seleção de público, na criação das DEs e na configuração da automação.

As duas frentes partem da mesma elegibilidade. O que muda é o momento de entrar. O formulário suspende a oferta daquele produto enquanto a solicitação é processada; a confirmação de posse encerra sua aquisição.

> Desenho de referência da estratégia. A implantação no SFMC ainda depende das definições técnicas reunidas ao final.

## O fluxo, de ponta a ponta

[![Fluxo de Seguros: mensal por semanas e trigger MCC em D+1, com elegibilidade compartilhada, descarte e intervalo entre produtos.](https://growthafinz.github.io/GaaS-Framework-Afinz/wiki-diagrams/seguros-percurso-v3.svg)](https://growthafinz.github.io/GaaS-Framework-Afinz/wiki-diagrams/seguros-percurso-v3.svg)

*Clique no desenho para abrir e ampliar. Na mensal, a sequência volta ao primeiro produto elegível.*

Os 15 dias valem para a próxima oferta mensal. **Durante essa espera, os triggers continuam abertos.** Quem está em um trigger pode entrar na mensal. No sentido contrário, a mensal ativa impede um novo trigger do mesmo seguro: o evento é descartado, sem ficar na fila para depois.

## Quem recebe cada seguro

Nas duas frentes, a seleção exige situação de conta apta, canal permitido e ausência de solicitação em processamento ou posse do seguro. Na mensal, o produto precisa ser o próximo da sequência e estar liberado após o intervalo. No trigger, a pessoa não pode estar na mensal daquele mesmo seguro.

| Seguro | Critério mensal | Critério trigger |
|---|---|---|
| Mulher | Público feminino e idade abaixo de 65 anos. | Mesma elegibilidade do produto + compra em **Saúde e Beleza**, com entrada em **D+1**. |
| Residencial | Limite disponível de pelo menos **R$ 100**. | Mesma elegibilidade do produto + compra em **Eletrodomésticos**, com entrada em **D+1**. |
| Celular | Limite disponível de pelo menos **R$ 100**. | Mesma elegibilidade do produto + compra em **Eletrônicos**, com entrada em **D+1**. |

A confirmação comercial dos critérios de Mulher, sua fonte de identificação e os demais requisitos de Celular continuam pendentes. Os campos de posse e a disponibilidade do D+1 também precisam da validação técnica descrita ao final.

Não exigimos valor mínimo da compra nesta versão. O valor acumulado de 12 meses da MAPA_MCC não representa o valor da transação. Eletrônicos não comprova compra de celular, e Saúde e Beleza inclui farmácia: são contextos de oferta cujo resultado vamos avaliar.

A ordem inicial ainda precisa de aprovação. A recomendação é **Mulher → Residencial → Celular** para elegíveis a Mulher; **Residencial → Celular** para os demais. Produtos inelegíveis são pulados. Ao terminar a sequência, volta ao primeiro elegível; se nenhum estiver disponível, aguarda mudança de condição.

## Como usar DEVICE no Seguro Celular

Usar o aparelho para **priorizar e diferenciar o público**, mantendo o trigger por compra em Eletrônicos. Não precisamos começar com preço estimado, indicação automática de plano ou histórico de troca de aparelho.

### Segmentação inicial proposta

| Segmento | Regra simples | Como trabalhar |
|---|---|---|
| RECENTE_IDENTIFICADO | Smartphone com marca e modelo identificados, fonte atual e último uso real nos últimos 90 dias | Público prioritário para testar Celular. Comparar contratação com os demais segmentos; personalização por modelo só depois de validar a identificação. |
| IDENTIFICADO_SEM_RECENCIA | Smartphone identificado, mas último uso ausente ou fora da janela de 90 dias, com fonte atual | Oferta genérica e leitura separada. Não afirmar que esse ainda é o aparelho usado pelo cliente. |
| SEM_DADO_CONFIAVEL | Sem DEVICE, modelo não identificado, tipo incerto ou fonte desatualizada | Não excluir automaticamente do Seguro Celular. Manter oferta genérica se as demais regras permitirem. |

Os 90 dias são uma recomendação configurável para o teste. Não são uma regra da seguradora. A mudança de prioridade na sequência mensal também precisa de aprovação; o segmento não altera a ordem sozinho. Dispositivo confirmado como tablet ou outro tipo não recebe personalização de celular e fica no público genérico, sem presumir ausência de smartphone.

### Dados mínimos e tratamento

Pedir à IN uma linha por CPF com tipo do dispositivo, marca, modelo, sistema, último uso e referência real da extração. Quando houver vários aparelhos, selecionar o smartphone com último uso mais recente e desempate estável; não repetir o CPF. O contrato completo está em SEGUROS_DEVICE_CPF no bloco de DEs abaixo. Se a fonte já entregar esse contrato, reaproveitá-la em vez de criar uma cópia desnecessária.

O SFMC recebe colunas prontas. O JSON deve ser aberto e os códigos de modelo normalizados no lake/IN, evitando um parser de aparelhos dentro de cada query de público. Para a primeira versão não é necessário um de-para de preços ou planos.

**O que temos hoje:** uma amostra de 100 linhas recebida em 04/11, com referência de agosto/2025 e lacunas de data. Ela explica a estrutura, mas não sustenta seleção atual. Importar essa amostra hoje não torna os aparelhos recentes. Até receber uma fonte válida, classificar como SEM_DADO_CONFIAVEL e manter comunicação genérica. A finalidade de uso dessa fonte também precisa ser confirmada com seu responsável.

Não inferir troca de aparelho apenas pela primeira aparição do registro: reinstalação do app pode gerar um novo registro. Não estimar renda, preço ou plano por marca. O cliente continua escolhendo o plano na LP. O resultado deve ser lido por segmento até contratação e, quando disponível, permanência.

## Como a mensal continua andando

A jornada atualiza o status a cada semana: `SEM1`, `SEM2`, `SEM3`… Ao concluir a última semana, registra `AGUARDANDO_PROXIMO_PRODUTO`, a data de conclusão e a liberação após 15 dias. Chegar à última semana ainda não inicia essa contagem.

O controle guarda seguro atual, próximo seguro, status, datas e identificador do ciclo. A data da última mudança só é renovada quando o status realmente muda. A liberação é calculada uma vez por conclusão, com o intervalo configurado; execuções seguintes não empurram a data para a frente. Mudanças no parâmetro valem para novas conclusões. Cada ciclo identifica uma participação, impedindo que um marcador antigo altere a nova.

**Mais de 15 dias na mesma semana:** a automação encerra o ciclo com motivo `SEM_AVANCO_15_DIAS` e libera o próximo seguro, sem acrescentar outra espera. Registra encerramento por inatividade, não conclusão normal. O ciclo anterior precisa ser invalidado antes dos próximos contatos.

Uma data de liberação autoriza a seleção; `SEM1` só é registrada quando houver entrada efetiva no novo ciclo. Bounce não comprova saída da jornada. Bloqueios, desinteresse e contratação continuam sendo respeitados. O desbloqueio recupera o percurso; não libera um canal impedido.

## DEs para criação no SFMC

O bloco **Referência técnica: Data Extensions** traz todos os campos, tipos, tamanhos, PK, obrigatoriedade, defaults, pastas, External Keys, sendability e responsáveis por gravação. Os públicos e marcadores são modelos para clonar; o dicionário aparece uma vez por modelo.

| Função | DEs |
|---|---|
| Fontes tratadas | SEGUROS_DEVICE_CPF e SEGUROS_SOLICITACOES_CPF_PRODUTO; reaproveitar contratos equivalentes da origem quando possível |
| Seleção | SEGUROS_ELEGIBILIDADE_CPF |
| Percurso mensal | SEGUROS_CONTROLE_CPF e sua área de preparo |
| Parâmetros | SEGUROS_CONFIG_ESTRATEGIA |
| Entrada nas jornadas | Seis SEG_APTOS: Mulher, Residencial e Celular, cada um com MENSAL e TRIGGER |
| Retorno das jornadas | Seis SEG_MARCADOR, um por produto e tipo de régua, para separar escritores simultâneos |
| Acompanhamento | SEGUROS_HISTORICO_CICLOS e SEGUROS_EXECUCOES |
| Decisões de trigger | Lake ou, se necessário, SEGUROS_TRIGGER_CONTROLE |

Esse é um contrato proposto para criação, não um inventário de DEs já implantadas. O pacote de referência cobre 21 nomes físicos, incluindo a alternativa condicional de trigger. Antes de criar, conferir o que pode ser atendido por fontes e controles existentes. Não vamos recriar CLIENTES ATIVOS, MAPA_SEGUROS, MAPA_MCC ou LPs.

Mensal e trigger podem coexistir. Por isso, o marcador de uma jornada não pode sobrescrever o estado de outra. A automação concilia os retornos e é a única responsável pelo percurso mensal.

## Como a automation executa o desenho

[![Execução no SFMC: fontes, validação, elegibilidade, controle, seis públicos e retorno dos marcadores.](https://growthafinz.github.io/GaaS-Framework-Afinz/wiki-diagrams/seguros-sfmc-v3.svg)](https://growthafinz.github.io/GaaS-Framework-Afinz/wiki-diagrams/seguros-sfmc-v3.svg)

*Clique para ampliar o mapa de execução.*

A proposta é estender a `processos_seguros` depois da atualização e validação das fontes. O processamento segue esta ordem:

**Validar fontes → atualizar solicitações e elegibilidade → conciliar marcadores → selecionar mensal → decidir triggers → entregar públicos às jornadas.**

A mensal é decidida primeiro para que um trigger não seja liberado para o mesmo seguro na mesma execução. Os marcadores registram entrada, semana e encerramento; a automação aplica os intervalos, a regra de inatividade e a próxima seleção. O bloco **Referência técnica: Automation Studio** detalha as atividades, entradas e destinos, ações de gravação, inicialização, falhas e testes com Pablo.

## O que acontece depois do formulário

**Oferta → formulário válido → solicitação em processamento → confirmação de posse.**

O formulário suspende novas ofertas daquele seguro nas duas frentes. A MAPA confirma posse quando o produto estiver corretamente representado. Ausência na MAPA durante o processamento não libera nova oferta automaticamente. Recusa ou não efetivação precisam de retorno e regra próprios.

Os resultados ficam em [[10-Resultados/Mecanicas/Seguros|Seguros]] e no BI. Aqui mantemos as regras, sem repetir tabelas de performance.

## Pendências para implantação

| Pendência | Definição necessária |
|---|---|
| MAPA_SEGUROS | Campo de cada produto, significado de posse vigente e atraso de atualização. Mulher estava com flag zerada no diagnóstico; Celular não tinha coluna; flags residenciais precisam ser reconciliadas. Ver [[DE-MAPA_SEGUROS]]. |
| D+1 e identidade do evento | Atualização compatível com D+1 e identificação de compra já processada. A MAPA_MCC agregada não possui ID de transação; última data não distingue várias compras no mesmo dia. Ver [[DE-MAPA_MCC]]. |
| DEs e jornadas | Validar os contratos propostos, BU, identidade de envio, cópia dinâmica do ciclo, reentrada e interrupção do ciclo antigo com Pablo. |
| DEVICE | Receber fonte atual, confirmar finalidade e cobertura, validar modelo e último uso. Aprovar janela e uso do segmento antes de personalizar a seleção. |
| Decisões ainda abertas | Ordem dos produtos, eventual controle de 10%, intervalo entre triggers, duração/cadência e tratamento de não efetivação. Recomendações anteriores não se tornam regras por omissão. |

## Referência técnica: Data Extensions

Contrato proposto para criação. As seis DEs de público compartilham um modelo; as seis de marcador compartilham outro. Cada tabela abaixo lista todos os campos do respectivo modelo, sem repetir o mesmo dicionário seis vezes. Não são objetos já implantados.

**Pasta e BU:** pastas sugeridas abaixo de `Shared Data Extensions/Seguro`. Confirmar a BU de execução e o acesso às DEs compartilhadas; usar `ENT.` apenas onde o contexto exigir. CustomerKey igual ao nome técnico é proposta, não chave existente. Não recriar as fontes atuais.

**Identidade e datas:** CPF em Text(11), validado e com zeros preservados. CONTACT_KEY deve reproduzir a identidade já usada no envio. Date não guarda fuso: fontes devem declarar referência e fuso; normalizar os marcadores do relógio SFMC antes de comparar com fontes externas. Os 15 dias são tempo decorrido; D+1 usa a data de compra no calendário de negócio validado.

**Retenção:** não ligar expurgo automático durante o piloto. Antes de produção, aprovar retenção por finalidade, exportação do histórico e limpeza das entradas já encerradas. Não definir “sem retenção para sempre” por omissão.

### SEGUROS_ELEGIBILIDADE_CPF

**DEs físicas:** `SEGUROS_ELEGIBILIDADE_CPF`.

**Pasta:** `Shared Data Extensions/Seguro/00_Dados`. **External Key:** mesmo nome técnico, após conferir unicidade. **Sendable:** não. **Gravação:** Overwrite, somente com fontes válidas. **Responsável:** Queries de elegibilidade.

| Campo | Tipo / tamanho | PK | Obrigatório | Padrão | Uso |
|---|---|:---:|:---:|---|---|
| `CPF` | Text(11) | Sim | Sim | — | CPF normalizado; nunca número. |
| `CONTACT_KEY` | Text(254) | — | Sim | — | Identidade de envio existente; pacote atual usa CPF. Validar o vínculo antes de criar. |
| `EMAIL` | EmailAddress(254) | — | Não | — | Endereço de e-mail. |
| `PHONE` | Phone(50) | — | Não | — | Telefone com DDI e DDD; não presumir opt-in. |
| `LOCALE` | Locale(5) | — | Não | — | Localidade validada; não preencher se desconhecida. |
| `FIRST_NAME` | Text(100) | — | Não | — | Primeiro nome para personalização. |
| `FL_EMAIL_PERMITIDO` | Boolean | — | Sim | false | Permissão e entregabilidade do canal, reavaliadas antes do envio. |
| `FL_SMS_PERMITIDO` | Boolean | — | Sim | false | Permissão e disponibilidade do canal SMS. |
| `FL_WPP_PERMITIDO` | Boolean | — | Sim | false | Permissão e disponibilidade do canal WhatsApp. |
| `STATUS_CONTA` | Text(50) | — | Sim | — | Situação normalizada da conta selecionada. |
| `LIMITE_DISPONIVEL` | Decimal(18,2) | — | Não | — | Limite da conta apta selecionada; não somar cartões duplicados. |
| `IDADE` | Number | — | Não | — | Idade informada pela fonte. |
| `GENERO` | Text(20) | — | Não | — | Valor e semântica da fonte, sem inferir gênero por compra. |
| `FL_SUPRESSAO_GERAL` | Boolean | — | Sim | true | Desinteresse ou outro impedimento geral. Desconhecido exige conferência. |
| `POSSE_MULHER` | Text(15) | — | Sim | DESCONHECIDA | SIM / NAO / DESCONHECIDA; NAO exige fonte válida. |
| `SOLICITACAO_MULHER` | Text(25) | — | Sim | DESCONHECIDA | NENHUMA / EM_PROCESSAMENTO / CONFIRMADA / NAO_EFETIVADA / DESCONHECIDA. |
| `APTO_MULHER` | Boolean | — | Sim | false | Elegibilidade de produto; não é confirmação de entrada em jornada. |
| `MOTIVO_MULHER` | Text(200) | — | Sim | PENDENTE_VALIDACAO | Motivo principal da aptidão ou impedimento. |
| `POSSE_RESIDENCIAL` | Text(15) | — | Sim | DESCONHECIDA | SIM / NAO / DESCONHECIDA; NAO exige fonte válida. |
| `SOLICITACAO_RESIDENCIAL` | Text(25) | — | Sim | DESCONHECIDA | NENHUMA / EM_PROCESSAMENTO / CONFIRMADA / NAO_EFETIVADA / DESCONHECIDA. |
| `APTO_RESIDENCIAL` | Boolean | — | Sim | false | Elegibilidade de produto; não é confirmação de entrada em jornada. |
| `MOTIVO_RESIDENCIAL` | Text(200) | — | Sim | PENDENTE_VALIDACAO | Motivo principal da aptidão ou impedimento. |
| `POSSE_CELULAR` | Text(15) | — | Sim | DESCONHECIDA | SIM / NAO / DESCONHECIDA; NAO exige fonte válida. |
| `SOLICITACAO_CELULAR` | Text(25) | — | Sim | DESCONHECIDA | NENHUMA / EM_PROCESSAMENTO / CONFIRMADA / NAO_EFETIVADA / DESCONHECIDA. |
| `APTO_CELULAR` | Boolean | — | Sim | false | Elegibilidade de produto; não é confirmação de entrada em jornada. |
| `MOTIVO_CELULAR` | Text(200) | — | Sim | PENDENTE_VALIDACAO | Motivo principal da aptidão ou impedimento. |
| `SEGMENTO_DEVICE` | Text(40) | — | Sim | SEM_DADO_CONFIAVEL | RECENTE_IDENTIFICADO / IDENTIFICADO_SEM_RECENCIA / SEM_DADO_CONFIAVEL. |
| `DEVICE_MARCA` | Text(50) | — | Não | — | Marca normalizada, quando confiável. |
| `DEVICE_MODELO` | Text(100) | — | Não | — | Modelo normalizado, quando confiável. |
| `DEVICE_ULTIMO_USO` | Date | — | Não | — | Último uso real observado na origem. |
| `DEVICE_DT_REFERENCIA` | Date | — | Não | — | Referência da extração na origem. |
| `DT_ULT_COMPRA_ELETRONICOS` | Date | — | Não | — | Última data por categoria, se a fonte for a MAPA_MCC. |
| `DT_ULT_COMPRA_SAUDE_BELEZA` | Date | — | Não | — | Última data por categoria. |
| `DT_ULT_COMPRA_ELETRODOMESTICOS` | Date | — | Não | — | Última data por categoria. |
| `VERSAO_REGRA` | Text(20) | — | Sim | — | Versão aplicada, por exemplo SEG_V2. |
| `ID_EXECUCAO` | Text(64) | — | Sim | — | Execução que gerou a decisão. |
| `DT_ATUALIZACAO` | Date | — | Sim | — | Instante da atualização pela automação. |

### Controle mensal e área de preparo

**DEs físicas:** `SEGUROS_CONTROLE_CPF`, `SEGUROS_CONTROLE_CPF_PREPARO`.

**Pasta:** `Shared Data Extensions/Seguro/01_Controle`. **External Key:** mesmo nome técnico, após conferir unicidade. **Sendable:** não. **Gravação:** CONTROLE: Update a partir de PREPARO; PREPARO: Overwrite após ler estado e marcadores. **Responsável:** Somente automação de conciliação.

Dois objetos com o mesmo schema. A área PREPARO permite calcular o próximo estado sem sobrescrever a fonte que está sendo lida. A jornada não escreve diretamente nessas DEs.

| Campo | Tipo / tamanho | PK | Obrigatório | Padrão | Uso |
|---|---|:---:|:---:|---|---|
| `CPF` | Text(11) | Sim | Sim | — | Um percurso mensal por CPF. |
| `ID_CICLO` | Text(64) | — | Não | — | Identificador imutável da participação mensal atual; vazio antes da inicialização. |
| `SEGURO_ATUAL` | Text(20) | — | Não | — | MULHER / RESIDENCIAL / CELULAR. |
| `STATUS` | Text(40) | — | Sim | AGUARDANDO_INICIALIZACAO | AGUARDANDO_INICIALIZACAO / ENTRADA_PENDENTE / SEM1… / AGUARDANDO_PROXIMO_PRODUTO / SEM_PRODUTO_ELEGIVEL. |
| `PROXIMO_SEGURO` | Text(20) | — | Não | — | Próximo produto previsto; revalidar na liberação. |
| `FL_CICLO_ATIVO` | Boolean | — | Sim | false | Indica ciclo mensal válido para contato. |
| `DT_ENTRADA` | Date | — | Não | — | Entrada efetiva, não apenas inclusão no público. |
| `DT_MUDANCA_STATUS` | Date | — | Não | — | Muda somente quando a etapa avança. |
| `DT_CONCLUSAO_REGUA` | Date | — | Não | — | Somente conclusão normal da última semana. |
| `DT_ENCERRAMENTO_CICLO` | Date | — | Não | — | Encerramento normal ou por exceção. |
| `DT_LIBERACAO_PROXIMO_PRODUTO` | Date | — | Não | — | Conclusão + intervalo; inatividade libera sem nova espera. |
| `DIAS_INTERVALO_APLICADO` | Number | — | Não | — | Valor congelado ao concluir a régua. |
| `MOTIVO_SAIDA` | Text(200) | — | Não | — | CONCLUSAO / SEM_AVANCO_15_DIAS / SOLICITACAO / CONTRATACAO / SUPRESSAO. |
| `VERSAO_REGRA` | Text(20) | — | Sim | — | Versão aplicada, por exemplo SEG_V2. |
| `ID_EXECUCAO` | Text(64) | — | Sim | — | Execução que gerou a decisão. |
| `DT_ATUALIZACAO` | Date | — | Sim | — | Instante da atualização pela automação. |

### SEGUROS_CONFIG_ESTRATEGIA

**DEs físicas:** `SEGUROS_CONFIG_ESTRATEGIA`.

**Pasta:** `Shared Data Extensions/Seguro/01_Controle`. **External Key:** mesmo nome técnico, após conferir unicidade. **Sendable:** não. **Gravação:** Update manual governado. **Responsável:** Responsável CRM/Growth.

| Campo | Tipo / tamanho | PK | Obrigatório | Padrão | Uso |
|---|---|:---:|:---:|---|---|
| `CHAVE` | Text(80) | Sim | Sim | — | Identificador do parâmetro. |
| `VALOR` | Text(200) | — | Sim | — | Valor em texto, convertido e validado pela query. |
| `TIPO` | Text(10) | — | Sim | — | NUMERO / TEXTO / BOOLEANO. |
| `DESCRICAO` | Text(300) | — | Sim | — | O que altera e quando passa a valer. |
| `VERSAO_REGRA` | Text(20) | — | Sim | — | Versão da configuração. |
| `DT_ATUALIZACAO` | Date | — | Sim | — | Última alteração do parâmetro. |

### SEGUROS_DEVICE_CPF

**DEs físicas:** `SEGUROS_DEVICE_CPF`.

**Pasta:** `Shared Data Extensions/Seguro/00_Dados`. **External Key:** mesmo nome técnico, após conferir unicidade. **Sendable:** não. **Gravação:** Overwrite, arquivo completo validado. **Responsável:** Import da IN/lake; proposta de contrato de origem.

| Campo | Tipo / tamanho | PK | Obrigatório | Padrão | Uso |
|---|---|:---:|:---:|---|---|
| `CPF` | Text(11) | Sim | Sim | — | Uma linha por CPF; IN seleciona o smartphone de uso mais recente. |
| `DEVICE_ID_ORIGEM` | Text(100) | — | Não | — | Identificador estável, se disponível; não usar como prova de compra. |
| `TIPO_DISPOSITIVO` | Text(20) | — | Sim | DESCONHECIDO | SMARTPHONE / TABLET / OUTRO / DESCONHECIDO. |
| `MARCA` | Text(50) | — | Não | — | Marca padronizada. |
| `MODELO` | Text(100) | — | Não | — | Modelo padronizado; manter código de origem para rastreio. |
| `SISTEMA` | Text(20) | — | Não | — | ANDROID / IOS / OUTRO / DESCONHECIDO. |
| `VERSAO_SISTEMA` | Text(30) | — | Não | — | Versão observada; não é condição comercial aprovada. |
| `DT_PRIMEIRO_USO` | Date | — | Não | — | Opcional; não demonstra troca de aparelho. |
| `DT_ULTIMO_USO` | Date | — | Não | — | Último evento real de uso do aparelho na origem. |
| `DT_REFERENCIA_FONTE` | Date | — | Sim | — | Referência do arquivo, obrigatória. |
| `DT_CARGA` | Date | — | Sim | — | Momento em que o SFMC recebeu a foto. |

### SEGUROS_SOLICITACOES_CPF_PRODUTO

**DEs físicas:** `SEGUROS_SOLICITACOES_CPF_PRODUTO`.

**Pasta:** `Shared Data Extensions/Seguro/00_Dados`. **External Key:** mesmo nome técnico, após conferir unicidade. **Sendable:** não. **Gravação:** Update; preservar processamento sem retorno. **Responsável:** Conciliação das LPs e retorno de contratação.

| Campo | Tipo / tamanho | PK | Obrigatório | Padrão | Uso |
|---|---|:---:|:---:|---|---|
| `CPF` | Text(11) | Sim | Sim | — | Chave parcial da solicitação atual. |
| `PRODUTO` | Text(20) | Sim | Sim | — | Chave parcial; produto normalizado. |
| `ID_SOLICITACAO` | Text(100) | — | Não | — | Identificador na fonte; não fabricar se ausente. |
| `STATUS` | Text(25) | — | Sim | — | EM_PROCESSAMENTO / CONFIRMADA / NAO_EFETIVADA / DESCONHECIDA. |
| `DT_FORMULARIO` | Date | — | Não | — | Instante do aceite válido. |
| `DT_RETORNO` | Date | — | Não | — | Instante do retorno operacional, se recebido. |
| `ACEITE_VALIDO` | Boolean | — | Não | — | Aceite de contratação validado; nulo exige revisão. |
| `FONTE` | Text(100) | — | Sim | — | LP e/ou retorno que sustenta o estado. |
| `DT_REFERENCIA_FONTE` | Date | — | Sim | — | Referência da fonte consultada. |
| `DT_ATUALIZACAO` | Date | — | Sim | — | Atualização da projeção operacional. |

### Modelo dos seis públicos SEG_APTOS

**DEs físicas:** `SEG_APTOS_MULHER_MENSAL`, `SEG_APTOS_MULHER_TRIGGER`, `SEG_APTOS_RESIDENCIAL_MENSAL`, `SEG_APTOS_RESIDENCIAL_TRIGGER`, `SEG_APTOS_CELULAR_MENSAL`, `SEG_APTOS_CELULAR_TRIGGER`.

**Pasta:** `Shared Data Extensions/Seguro/02_Publicos`. **External Key:** mesmo nome técnico, após conferir unicidade. **Sendable:** sim, CONTACT_KEY → Subscribers.Subscriber Key. **Gravação:** Update somente para novas entradas; não alterar payload de entrada já confirmada. **Responsável:** Queries de seleção.

Uma DE física para cada produto/tipo. ID_ENTRADA é PK; CONTACT_KEY é identidade de envio. Não confundir as duas chaves. O feed deve reter entradas pendentes até confirmação; não usar Overwrite diário.

| Campo | Tipo / tamanho | PK | Obrigatório | Padrão | Uso |
|---|---|:---:|:---:|---|---|
| `ID_ENTRADA` | Text(80) | Sim | Sim | — | Chave estável por participação; não regenerar em toda execução. |
| `CPF` | Text(11) | — | Sim | — | Cliente selecionado. |
| `CONTACT_KEY` | Text(254) | — | Sim | — | Mesmo Contact Key existente no SFMC. |
| `ID_CICLO` | Text(64) | — | Sim | — | Participação imutável usada nos marcadores. |
| `PRODUTO` | Text(20) | — | Sim | — | Produto fixo correspondente à DE. |
| `TIPO_REGUA` | Text(10) | — | Sim | — | MENSAL ou TRIGGER, fixo conforme a DE. |
| `EMAIL` | EmailAddress(254) | — | Não | — | Endereço de e-mail. |
| `PHONE` | Phone(50) | — | Não | — | Telefone com DDI e DDD; não presumir opt-in. |
| `LOCALE` | Locale(5) | — | Não | — | Localidade validada; não preencher se desconhecida. |
| `FIRST_NAME` | Text(100) | — | Não | — | Primeiro nome para personalização. |
| `FL_EMAIL_PERMITIDO` | Boolean | — | Sim | false | Permissão e entregabilidade do canal, reavaliadas antes do envio. |
| `FL_SMS_PERMITIDO` | Boolean | — | Sim | false | Permissão e disponibilidade do canal SMS. |
| `FL_WPP_PERMITIDO` | Boolean | — | Sim | false | Permissão e disponibilidade do canal WhatsApp. |
| `DT_ENTRADA_PREVISTA` | Date | — | Sim | — | Janela autorizada de entrada. |
| `DT_GERACAO` | Date | — | Sim | — | Criação da entrada; não renovar em reexecuções. |
| `ID_EVENTO_COMPRA` | Text(100) | — | Não | — | Obrigatório para trigger; nulo na mensal. |
| `CATEGORIA_MCC` | Text(30) | — | Não | — | Obrigatória no trigger; categoria normalizada. |
| `DT_COMPRA` | Date | — | Não | — | Data/hora da compra quando disponível, ou data agregada identificada como tal. |
| `SEGMENTO_DEVICE` | Text(40) | — | Sim | SEM_DADO_CONFIAVEL | Segmento de aparelho no instante da seleção. |
| `DEVICE_MARCA` | Text(50) | — | Não | — | Somente se confiável. |
| `DEVICE_MODELO` | Text(100) | — | Não | — | Somente se confiável. |
| `VERSAO_REGRA` | Text(20) | — | Sim | — | Versão aplicada, por exemplo SEG_V2. |
| `ID_EXECUCAO` | Text(64) | — | Sim | — | Execução que gerou a decisão. |
| `DT_ATUALIZACAO` | Date | — | Sim | — | Instante da atualização pela automação. |

### Modelo dos seis marcadores de jornada

**DEs físicas:** `SEG_MARCADOR_MULHER_MENSAL`, `SEG_MARCADOR_MULHER_TRIGGER`, `SEG_MARCADOR_RESIDENCIAL_MENSAL`, `SEG_MARCADOR_RESIDENCIAL_TRIGGER`, `SEG_MARCADOR_CELULAR_MENSAL`, `SEG_MARCADOR_CELULAR_TRIGGER`.

**Pasta:** `Shared Data Extensions/Seguro/03_Marcadores`. **External Key:** mesmo nome técnico, após conferir unicidade. **Sendable:** não. **Gravação:** Update Contact, sem Overwrite da automação. **Responsável:** Somente a jornada correspondente.

Proposta para separar escritores simultâneos. PK CPF por DE, evitando atualização ambígua de chaves compostas por Update Contact. Validar cópia dinâmica do ID_CICLO no tenant. Só aceitar marcador cujo ciclo ainda seja o ciclo válido.

| Campo | Tipo / tamanho | PK | Obrigatório | Padrão | Uso |
|---|---|:---:|:---:|---|---|
| `CPF` | Text(11) | Sim | Sim | — | Uma linha por cliente em cada DE física de marcador. |
| `ID_CICLO` | Text(64) | — | Sim | — | Copiado do Journey Data da entrada; nunca do ciclo atual de Contact Data. |
| `PRODUTO` | Text(20) | — | Sim | — | Valor fixo da DE. |
| `TIPO_REGUA` | Text(10) | — | Sim | — | Valor fixo da DE. |
| `STATUS` | Text(40) | — | Sim | — | ENTROU / SEM1… / CONCLUIU / SAIU. |
| `DT_MARCADOR_SFMC` | Date | — | Sim | — | Use current time da atividade; relógio SFMC do tenant. |
| `MOTIVO_SAIDA` | Text(200) | — | Não | — | Somente quando houver encerramento. |
| `VERSAO_REGRA` | Text(20) | — | Sim | — | Versão trazida pela entrada. |

### SEGUROS_HISTORICO_CICLOS

**DEs físicas:** `SEGUROS_HISTORICO_CICLOS`.

**Pasta:** `Shared Data Extensions/Seguro/01_Controle`. **External Key:** mesmo nome técnico, após conferir unicidade. **Sendable:** não. **Gravação:** Update por ID_CICLO, preservando ciclos encerrados. **Responsável:** Conciliação; não é uma linha por contato ou por semana.

| Campo | Tipo / tamanho | PK | Obrigatório | Padrão | Uso |
|---|---|:---:|:---:|---|---|
| `ID_CICLO` | Text(64) | Sim | Sim | — | Uma linha por participação mensal ou trigger. |
| `CPF` | Text(11) | — | Sim | — | Cliente. |
| `PRODUTO` | Text(20) | — | Sim | — | Seguro. |
| `TIPO_REGUA` | Text(10) | — | Sim | — | MENSAL / TRIGGER. |
| `STATUS` | Text(40) | — | Sim | — | Situação reconciliada da participação. |
| `FL_CICLO_ATIVO` | Boolean | — | Sim | false | Validade atual do ciclo para contatos. |
| `DT_AUTORIZACAO` | Date | — | Sim | — | Seleção para a entrada. |
| `DT_ENTRADA` | Date | — | Não | — | Confirmação de entrada. |
| `DT_ULTIMO_AVANCO` | Date | — | Não | — | Último marcador aceito do mesmo ciclo. |
| `DT_ENCERRAMENTO` | Date | — | Não | — | Encerramento da participação. |
| `MOTIVO_SAIDA` | Text(200) | — | Não | — | Razão do encerramento. |
| `ID_EVENTO_COMPRA` | Text(100) | — | Não | — | Preenchido nos triggers; permite rastrear sua origem. |
| `VERSAO_REGRA` | Text(20) | — | Sim | — | Versão aplicada, por exemplo SEG_V2. |
| `ID_EXECUCAO` | Text(64) | — | Sim | — | Execução que gerou a decisão. |
| `DT_ATUALIZACAO` | Date | — | Sim | — | Instante da atualização pela automação. |

### SEGUROS_TRIGGER_CONTROLE

**DEs físicas:** `SEGUROS_TRIGGER_CONTROLE`.

**Pasta:** `Shared Data Extensions/Seguro/01_Controle`. **External Key:** mesmo nome técnico, após conferir unicidade. **Sendable:** não. **Gravação:** Update idempotente por evento/produto. **Responsável:** Somente se decisões não forem persistidas e retornadas pelo lake.

DE condicional, não obrigatória se o lake oferecer esse contrato. Não contém uma cópia de todas as compras.

| Campo | Tipo / tamanho | PK | Obrigatório | Padrão | Uso |
|---|---|:---:|:---:|---|---|
| `ID_EVENTO_COMPRA` | Text(100) | Sim | Sim | — | Chave parcial; identidade estável do evento na fonte. |
| `PRODUTO` | Text(20) | Sim | Sim | — | Chave parcial; decisão é por evento e seguro. |
| `CPF` | Text(11) | — | Sim | — | Cliente. |
| `CATEGORIA_MCC` | Text(30) | — | Sim | — | Categoria que acionou a seleção. |
| `DT_COMPRA` | Date | — | Sim | — | Instante ou data da compra, com granularidade declarada. |
| `GRANULARIDADE_EVENTO` | Text(20) | — | Sim | — | TRANSACAO ou CPF_CATEGORIA_DIA. |
| `DECISAO` | Text(25) | — | Sim | — | DESCARTADO / AUTORIZADO / ENTRADA_CONFIRMADA / ENCERRADO. |
| `MOTIVO` | Text(200) | — | Sim | — | Por exemplo MENSAL_ATIVA, SOLICITACAO, POSSE, SEM_CANAL. |
| `DT_DECISAO` | Date | — | Sim | — | Primeira decisão; preservar em reexecuções. |
| `ID_CICLO` | Text(64) | — | Não | — | Ciclo de trigger, se autorizado. |
| `VERSAO_REGRA` | Text(20) | — | Sim | — | Versão aplicada, por exemplo SEG_V2. |
| `ID_EXECUCAO` | Text(64) | — | Sim | — | Execução que gerou a decisão. |
| `DT_ATUALIZACAO` | Date | — | Sim | — | Instante da atualização pela automação. |

### SEGUROS_EXECUCOES

**DEs físicas:** `SEGUROS_EXECUCOES`.

**Pasta:** `Shared Data Extensions/Seguro/01_Controle`. **External Key:** mesmo nome técnico, após conferir unicidade. **Sendable:** não. **Gravação:** Update por ID_EXECUCAO. **Responsável:** Orquestração/Script Activity de acompanhamento.

| Campo | Tipo / tamanho | PK | Obrigatório | Padrão | Uso |
|---|---|:---:|:---:|---|---|
| `ID_EXECUCAO` | Text(64) | Sim | Sim | — | Execução da automação. |
| `DT_INICIO` | Date | — | Sim | — | Início. |
| `DT_FIM` | Date | — | Não | — | Fim, inclusive de falha. |
| `STATUS` | Text(20) | — | Sim | — | INICIADA / FONTES_INVALIDAS / FALHOU / CONCLUIDA. |
| `DT_REFERENCIA_MAPA` | Date | — | Não | — | Referência real da MAPA. |
| `DT_REFERENCIA_MCC` | Date | — | Não | — | Referência real de compras. |
| `DT_REFERENCIA_DEVICE` | Date | — | Não | — | Referência real de DEVICE; ausência não invalida toda a estratégia. |
| `QT_ELEGIVEIS` | Number | — | Não | — | Contagem observada após a seleção. |
| `QT_ENTRADAS_MENSAL` | Number | — | Não | — | Entradas mensais autorizadas. |
| `QT_ENTRADAS_TRIGGER` | Number | — | Não | — | Triggers autorizados. |
| `QT_TRIGGERS_DESCARTADOS` | Number | — | Não | — | Eventos descartados nesta execução. |
| `ERRO` | Text(500) | — | Não | — | Etapa e causa da falha; sem CPF ou contato em texto livre. |
| `VERSAO_REGRA` | Text(20) | — | Sim | — | Versão em execução. |

### Valores iniciais da configuração

| CHAVE | VALOR | TIPO | Situação |
|---|---|---|---|
| DIAS_ENTRE_PRODUTOS | 15 | NUMERO | Definido; congelar o valor aplicado ao concluir cada ciclo. |
| DIAS_MAX_SEM_AVANCO_SEMANA | 15 | NUMERO | Definido; comparação estritamente maior que 15 dias. |
| DELAY_TRIGGER_DIAS | 1 | NUMERO | D+1 definido; depende da atualização de compras. |
| DEVICE_JANELA_USO_DIAS | 90 | NUMERO | Recomendação de segmentação, a validar. |
| DEVICE_MAX_DEFASAGEM_DIAS | A definir | NUMERO | Não aceitar arquivo velho apenas porque foi importado hoje. |
| ORDEM_PRODUTOS | A aprovar | TEXTO | Não ativar a rotação sem ordem definida. |
| INTERVALO_MIN_TRIGGER_DIAS | A aprovar | NUMERO | A sugestão anterior de 30 dias ainda não é decisão. |
| PERCENTUAL_CONTROLE | A aprovar | NUMERO | A sugestão anterior de 10% ainda não é decisão. |

Parâmetro obrigatório ausente ou inválido bloqueia a etapa que depende dele. Não converter vazio em zero. Um parâmetro de DEVICE pendente não deve bloquear ofertas genéricas dos outros seguros.

### Fontes existentes: campos consumidos, sem recriação

| Fonte | Campos usados / verificação |
|---|---|
| CLIENTES ATIVOS | CPF, NR_CONTA, EMAIL, PRI_NOME, NR_CELULAR, LOCALE, STATUS, bloqueio_email, bloqueio_celular, LIMITE_DISPONIVEL; recência se usada para desempate. Grão não é CPF: deduplicar contas/cartões antes da seleção. |
| MAPA_SEGUROS | CPF e flags de produto validadas. São campos de posse atual, não data de venda; manter DESCONHECIDA quando a cobertura do produto não estiver confirmada. Ver [[DE-MAPA_SEGUROS]]. |
| MAPA_MCC | nr_conta, nr_cpf, dt_ultima_compra_saude_beleza, dt_ultima_compra_eletrodomesticos, dt_ultima_compra_eletronicos e referência real da fonte. Os demais campos estão em [[DE-MAPA_MCC]]; acumulados não identificam valor ou ID da transação. |
| LP_Seguros, schema do pacote recebido | CPF Text(50) PK; data_preenchimento Date; produto Text(50); aceita_contratacao Boolean; parceiro Text(50); ORIGEM Text(150); COMUNICACAO Text(150); GENERO Text(50). Apenas CPF é não nulo no export. Normalizar para o contrato, sem alterar a DE original. |
| LP_SEGUROS_GERAL | Schema completo não veio neste pacote. Confirmar relação com LP_Seguros e fonte oficial; não declarar nomes ou chaves de origem que não foram verificados. |
| ENT.sem_interesse e DE_EXCLUSAO_MULHER | Verificar campos de identificação, escopo, motivo e alimentação antes de incorporá-las. Não assumir que são contratação. |

### Fontes técnicas

- [Salesforce: DataExtensionField](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/dataextensionfield.html), para PK, obrigatoriedade, tamanho e precisão.
- [Salesforce: Update a Contact](https://help.salesforce.com/s/articleView?id=mktg.mc_jb_update_a_contact.htm&type=5&language=en_US), para marcador, data atual e separação da DE de entrada. A configuração dinâmica precisa de teste no tenant.

## Referência técnica: Automation Studio

Desenho de implementação a validar no tenant. Os passos originais de `processos_seguros` constam da nota [[Automacao-Processos-Seguros]]; os novos nomes de query abaixo são propostas. Não há ativação automática nem migração das jornadas existentes nesta documentação.

### Organização e dependências

Manter o processamento diário ligado à `processos_seguros`. A fonte de MCC e a DEVICE precisam estar disponíveis antes da seleção. Não duplicar o import da MAPA_MCC que já pertence à frente Vai de Visa: consumir a versão válida e registrar sua referência. Se os horários não permitirem dependência segura, separar uma automação de seleção que só inicie após o marcador de sucesso das fontes.

Cada etapa dependente ocupa um passo próprio no Automation Studio. Atividades no mesmo passo podem executar em paralelo; a validação precisa de uma condição que realmente interrompa a execução, não apenas uma linha escrita em uma DE. Falha de fonte não deve zerar públicos nem liberar ofertas com posse desconhecida.

| Ordem | Atividade / tipo proposto | Entrada → destino | Ação / condição |
|---|---|---|---|
| 0 | Registro de início / Script Activity | Referências das fontes → SEGUROS_EXECUCOES | Criar ID_EXECUCAO; STATUS=INICIADA. |
| 1–5 existentes | Query, Extract, conversão, File Transfer e Import | LP → LP_SEGUROS_ATHENA → S3/Athena → MAPA_SEGUROS | Preservar as atividades existentes; confirmar nomes, horário e estado ativo com Pablo. |
| 6 | Verificação de fontes / Verification e/ou Script Activity | Contagem, referência e chaves de MAPA, cadastro e compras | Parar seleção se fonte essencial inválida. O limite histórico de 600 mil da MAPA é parâmetro a revisar; não prova atualidade. DEVICE ausente ou velha permite apenas segmento genérico. |
| 7 | Q_SEG_SOLICITACOES / SQL | LP oficial + retorno de contratação → SEGUROS_SOLICITACOES_CPF_PRODUTO | Update. Aceite válido inicia processamento; não apagar solicitação só porque saiu de uma foto da LP. |
| 8 | Q_SEG_ELEGIBILIDADE / SQL | Cadastro deduplicado + posse + solicitações + DEVICE + MCC → SEGUROS_ELEGIBILIDADE_CPF | Overwrite somente após aprovação das fontes. Um CPF por linha; ausência de dado não vira posse=NAO. |
| 9 | Q_SEG_CONTROLE_PREPARO / SQL | Controle atual + seis marcadores + elegibilidade + configuração → SEGUROS_CONTROLE_CPF_PREPARO | Overwrite da área de preparo. Aplicar primeiro supressões e solicitações, depois conclusão e inatividade. |
| 10 | Q_SEG_CONTROLE_APLICAR / SQL | PREPARO → SEGUROS_CONTROLE_CPF | Update. Só a automação escreve o estado reconciliado. |
| 11 | Q_SEG_CICLOS / SQL | Decisões mensais e marcadores → SEGUROS_HISTORICO_CICLOS | Update por ID_CICLO; preservar ciclos encerrados. |
| 12 | Q_SEG_APTOS_*_MENSAL / três queries | Próximo produto liberado + ciclo autorizado → três públicos mensais | Update apenas de novas entradas; manter entradas pendentes. As três queries são mutuamente exclusivas por CPF na mensal e podem compartilhar um passo somente após a decisão central. |
| 13 | Q_SEG_DECISAO_TRIGGER / SQL ou decisão no lake | Compras D+1 + elegibilidade + mensal ativa ou autorizada → registro de decisões | Registrar também descarte. Se o lake já guarda e retorna a decisão, não criar cópia dessa função no SFMC. |
| 14 | Q_SEG_APTOS_*_TRIGGER / três queries | Eventos autorizados ainda não confirmados → três públicos trigger | Update por ID_ENTRADA estável. Não colocar novamente compra descartada em execução posterior. |
| 15 | Registro de fechamento / Script Activity | Contagens e referências → SEGUROS_EXECUCOES | STATUS=CONCLUIDA e DT_FIM. Alertar se execução ficou INICIADA além do SLA combinado. |

O cabeçalho e o fechamento não tornam a automação uma transação. Se uma query intermediária falhar, as escritas anteriores podem ter persistido. Antes de reexecutar, conferir ID_EXECUCAO, ciclos e decisões já gravadas. Os identificadores estáveis tornam a repetição segura; não gerar outro ID_CICLO para o mesmo ciclo pendente.

### O que Pablo configura em cada jornada

| Posição | Configuração |
|---|---|
| Entrada | Usar a SEG_APTOS do produto e tipo corretos; CONTACT_KEY como identidade existente. Confirmar processamento de novas linhas e reentrada após saída na jornada correspondente. Mensal e trigger são jornadas separadas. |
| Primeiro passo | Confirmar que o ciclo ainda está válido e que não houve formulário, posse ou supressão desde a seleção. Depois escrever ENTROU e ID_CICLO da entrada na DE de marcador daquela jornada. |
| Início de cada semana mensal | Escrever SEM1, SEM2… e Use current time em DT_MARCADOR_SFMC. ID_CICLO deve vir do Journey Data original. Não copiar o ID do controle atual. |
| Antes de cada contato | Consultar Contact Data atual para permissão de canal, solicitação, posse e validade do ciclo. Journey Data preserva a entrada e não serve para descobrir uma contratação posterior. |
| Depois da última semana | Escrever CONCLUIU e data atual. A automação transforma isso em AGUARDANDO_PROXIMO_PRODUTO, grava conclusão e congela a liberação. |
| Saída por exceção | Registrar SAIU e motivo quando a configuração permitir. A ausência de marcador é coberta pela conferência de inatividade. |

Use current time é uma opção documentada pela Salesforce para atributos Date na atividade Update Contact. O piloto precisa confirmar a gravação dinâmica do ID_CICLO, o relacionamento com Contact Builder e a seleção correta da linha. O desenho usa marcador separado por produto/tipo, com PK CPF, para não depender de Update Contact localizar uma linha por chave composta.

**Limite importante:** um marcador atrasado não pode reabrir um ciclo. A conciliação só aceita ID_CICLO igual à participação válida e timestamp mais recente. Se um ciclo antigo sobrescrever uma linha de marcador, ele é ignorado e sinalizado; não muda o controle atual. Antes de permitir nova entrada no mesmo produto/tipo, validar que a jornada anterior saiu. Se a cópia dinâmica do ciclo ou esse bloqueio não forem viáveis no tenant, substituir o marcador por escrita condicionada via integração; não retirar a proteção para facilitar a montagem.

### Conclusão, inatividade e mudança de produto

- Conclusão normal: aceitar o marcador do ciclo ativo; gravar DT_CONCLUSAO_REGUA, DT_ENCERRAMENTO_CICLO, DIAS_INTERVALO_APLICADO e DT_LIBERACAO_PROXIMO_PRODUTO uma única vez. Aguardar 15 dias, conforme configuração vigente naquela conclusão.
- Inatividade: apenas status SEMn com ciclo ativo, sem solicitação/posse/supressão prioritária, e **mais de** 15 dias sem avanço. Encerrar com SEM_AVANCO_15_DIAS; liberar próximo produto imediatamente na próxima seleção, sem outra espera.
- O teste de tempo usa timestamps no mesmo relógio. Não usar apenas diferença de datas de calendário: exatamente 15 dias ainda não atende a “mais de 15”.
- Liberação não é entrada. Manter ENTRADA_PENDENTE até confirmação ENTROU; não inventar SEM1 só porque a linha foi gravada na SEG_APTOS.
- Terminou a sequência: voltar ao primeiro produto elegível. Sem produto elegível: SEM_PRODUTO_ELEGIVEL, reavaliado com a próxima atualização de fontes.

### Compras D+1 e descarte

Preferir evento da compra com ID estável e data de negócio. Se só houver a MAPA_MCC agregada, a unidade possível é CPF + categoria + dia; não chamar isso de transação individual nem detectar múltiplas compras no mesmo dia. Um arquivo que chega hoje com referência antiga não cumpre D+1.

Cada autorização de trigger deve reservar um ID_CICLO no SEGUROS_HISTORICO_CICLOS antes de publicar a entrada. Se o registro da decisão e o histórico forem gravados em passos distintos, conferir ambos na recuperação de falha; AUTORIZADO não equivale a ENTRADA_CONFIRMADA.

Definir horário de corte e SLA com a IN. Eventos atrasados não devem entrar silenciosamente em D+3 como se fossem D+1: registrar atraso e aplicar uma política de recuperação aprovada. Mensal ativa ou autorizada na mesma execução descarta o evento do mesmo produto. Trigger ativo permite mensal. A espera de 15 dias entre produtos não bloqueia triggers.

### Validação antes de ativar

1. Criar DEs e relacionamentos em ambiente de teste, sem publicar jornadas de produção. Conferir PK, tamanho, obrigatoriedade, sendability e chaves externas.
2. Conferir cobertura real de posse, formulários e DEVICE. Carregar configuração aprovada. Não transformar clientes já em jornada em novas entradas no primeiro dia; inicializar o controle a partir do estado operacional conhecido.
3. Testar: mensal bloqueia trigger do mesmo seguro; trigger permite mensal; formulário interrompe contatos; posse exclui aquisição; exatamente 15 dias não dispara inatividade e mais de 15 dispara; ciclo antigo não atualiza o novo; reexecução não duplica entrada.
4. Testar reentrada no mesmo seguro após uma volta completa e ausência de canal válido. Bounce não equivale a saída nem autoriza insistência no endereço impedido.
5. Comparar seleção de Celular com e sem DEVICE: cobertura, recência, duplicidade por CPF e quantidade de SEM_DADO_CONFIAVEL. Só então aprovar o uso da segmentação.
6. Rodar um piloto observável, conferir marcadores e retorno de formulário/contratação e só depois ampliar a base. Ativação no SFMC continua sendo uma etapa própria com Pablo.

### Monitoramento e recuperação

Alertas mínimos: fonte atrasada, mudança abrupta de volume, duplicidade de chave, ciclo parado, entrada pendente sem confirmação, marcador de ciclo antigo e falha de query. Pausar a etapa de seleção afetada em falha de fonte; não usar Overwrite vazio como rollback. Preservar controle e históricos e retomar a execução pelo último estado conferido.

As propostas antigas MAPA_SEGUROS_ONTEM e SEGUROS_MOVIMENTO_LOG continuam descritas em [[Automacao-Processos-Seguros]] para medição de mudanças de posse. Não são substitutas da confirmação de contratação nem pré-requisito para segmentar DEVICE nesta versão.

Fonte técnica: [Salesforce — Update a Contact](https://help.salesforce.com/s/articleView?id=mktg.mc_jb_update_a_contact.htm&type=5&language=en_US).

## Referências técnicas

As notas de 04/11 preservam o diagnóstico e o desenho anterior. Para a nova implementação, usar os contratos desta página; o script antigo Q_SEG_DEVICE_PLANO, com faixas estimadas de plano, precisa ser substituído pela segmentação DEVICE aqui proposta.

[[Automacao-Processos-Seguros]] · [[DE-MAPA_SEGUROS]] · [[DE-MAPA_MCC]] · [[MCC]] · [[Segmentacao-Seguros-Celular]] · [[MOC-SFMC-DEs-e-Automations]]
