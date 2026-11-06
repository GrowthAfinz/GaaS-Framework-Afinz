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
