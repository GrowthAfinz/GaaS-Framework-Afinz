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
