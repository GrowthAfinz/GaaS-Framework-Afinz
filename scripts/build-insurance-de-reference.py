"""Proposed SFMC creation contracts. Generates documentation, never writes to SFMC."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / 'docs/plans/seguros-segmentacao/de-contracts-v2.json'


def field(name, kind='Text', length=None, required=False, pk=False, default=None, purpose=''):
    return dict(name=name, type=kind, length=length, required=required or pk, primary_key=pk, default=default, purpose=purpose)


def t(name, length, purpose, required=False, pk=False, default=None):
    return field(name, 'Text', length, required, pk, default, purpose)


def date(name, purpose, required=False):
    return field(name, 'Date', required=required, purpose=purpose)


def flag(name, purpose, default=False):
    return field(name, 'Boolean', required=True, default=default, purpose=purpose)


def num(name, purpose, default=None):
    return field(name, 'Number', default=default, purpose=purpose)


def de(names, fields, folder, action, owner, sendable=False, retention='Sem exclusão automática no piloto; definir retenção antes de produção.', notes=''):
    return dict(names=names, fields=fields, folder='Shared Data Extensions/Seguro/'+folder,
                external_key='Mesmo nome técnico da DE; conferir unicidade no tenant antes de criar.',
                sendable=sendable, send_relationship='CONTACT_KEY → Subscribers.Subscriber Key' if sendable else None,
                action=action, writer=owner, retention=retention, notes=notes, status='PROPOSTA_DE_CRIACAO')


identity=[t('CPF',11,'CPF normalizado; nunca número.',pk=True),t('CONTACT_KEY',254,'Identidade de envio existente; pacote atual usa CPF. Validar o vínculo antes de criar.',True)]
contacts=[field('EMAIL','EmailAddress',254,purpose='Endereço de e-mail.'),field('PHONE','Phone',50,purpose='Telefone com DDI e DDD; não presumir opt-in.'),field('LOCALE','Locale',5,purpose='Localidade validada; não preencher se desconhecida.'),t('FIRST_NAME',100,'Primeiro nome para personalização.'),flag('FL_EMAIL_PERMITIDO','Permissão e entregabilidade do canal, reavaliadas antes do envio.'),flag('FL_SMS_PERMITIDO','Permissão e disponibilidade do canal SMS.'),flag('FL_WPP_PERMITIDO','Permissão e disponibilidade do canal WhatsApp.')]
provenance=[t('VERSAO_REGRA',20,'Versão aplicada, por exemplo SEG_V2.',True),t('ID_EXECUCAO',64,'Execução que gerou a decisão.',True),date('DT_ATUALIZACAO','Instante da atualização pela automação.',True)]
elig=identity+contacts+[t('STATUS_CONTA',50,'Situação normalizada da conta selecionada.',True),field('LIMITE_DISPONIVEL','Decimal','18,2',purpose='Limite da conta apta selecionada; não somar cartões duplicados.'),num('IDADE','Idade informada pela fonte.'),t('GENERO',20,'Valor e semântica da fonte, sem inferir gênero por compra.'),flag('FL_SUPRESSAO_GERAL','Desinteresse ou outro impedimento geral. Desconhecido exige conferência.',True)]
for product in ['MULHER','RESIDENCIAL','CELULAR']:
    elig += [t('POSSE_'+product,15,'SIM / NAO / DESCONHECIDA; NAO exige fonte válida.',True,default='DESCONHECIDA'),t('SOLICITACAO_'+product,25,'NENHUMA / EM_PROCESSAMENTO / CONFIRMADA / NAO_EFETIVADA / DESCONHECIDA.',True,default='DESCONHECIDA'),flag('APTO_'+product,'Elegibilidade de produto; não é confirmação de entrada em jornada.'),t('MOTIVO_'+product,200,'Motivo principal da aptidão ou impedimento.',True,default='PENDENTE_VALIDACAO')]
elig += [t('SEGMENTO_DEVICE',40,'RECENTE_IDENTIFICADO / IDENTIFICADO_SEM_RECENCIA / SEM_DADO_CONFIAVEL.',True,default='SEM_DADO_CONFIAVEL'),t('DEVICE_MARCA',50,'Marca normalizada, quando confiável.'),t('DEVICE_MODELO',100,'Modelo normalizado, quando confiável.'),date('DEVICE_ULTIMO_USO','Último uso real observado na origem.'),date('DEVICE_DT_REFERENCIA','Referência da extração na origem.'),date('DT_ULT_COMPRA_ELETRONICOS','Última data por categoria, se a fonte for a MAPA_MCC.'),date('DT_ULT_COMPRA_SAUDE_BELEZA','Última data por categoria.'),date('DT_ULT_COMPRA_ELETRODOMESTICOS','Última data por categoria.')]+provenance
control=[t('CPF',11,'Um percurso mensal por CPF.',pk=True),t('ID_CICLO',64,'Identificador imutável da participação mensal atual; vazio antes da inicialização.'),t('SEGURO_ATUAL',20,'MULHER / RESIDENCIAL / CELULAR.'),t('STATUS',40,'AGUARDANDO_INICIALIZACAO / ENTRADA_PENDENTE / SEM1… / AGUARDANDO_PROXIMO_PRODUTO / SEM_PRODUTO_ELEGIVEL.',True,default='AGUARDANDO_INICIALIZACAO'),t('PROXIMO_SEGURO',20,'Próximo produto previsto; revalidar na liberação.'),flag('FL_CICLO_ATIVO','Indica ciclo mensal válido para contato.'),date('DT_ENTRADA','Entrada efetiva, não apenas inclusão no público.'),date('DT_MUDANCA_STATUS','Muda somente quando a etapa avança.'),date('DT_CONCLUSAO_REGUA','Somente conclusão normal da última semana.'),date('DT_ENCERRAMENTO_CICLO','Encerramento normal ou por exceção.'),date('DT_LIBERACAO_PROXIMO_PRODUTO','Conclusão + intervalo; inatividade libera sem nova espera.'),num('DIAS_INTERVALO_APLICADO','Valor congelado ao concluir a régua.'),t('MOTIVO_SAIDA',200,'CONCLUSAO / SEM_AVANCO_15_DIAS / SOLICITACAO / CONTRATACAO / SUPRESSAO.')]+provenance
config=[t('CHAVE',80,'Identificador do parâmetro.',pk=True),t('VALOR',200,'Valor em texto, convertido e validado pela query.',True),t('TIPO',10,'NUMERO / TEXTO / BOOLEANO.',True),t('DESCRICAO',300,'O que altera e quando passa a valer.',True),t('VERSAO_REGRA',20,'Versão da configuração.',True),date('DT_ATUALIZACAO','Última alteração do parâmetro.',True)]
device=[t('CPF',11,'Uma linha por CPF; IN seleciona o smartphone de uso mais recente.',pk=True),t('DEVICE_ID_ORIGEM',100,'Identificador estável, se disponível; não usar como prova de compra.'),t('TIPO_DISPOSITIVO',20,'SMARTPHONE / TABLET / OUTRO / DESCONHECIDO.',True,default='DESCONHECIDO'),t('MARCA',50,'Marca padronizada.'),t('MODELO',100,'Modelo padronizado; manter código de origem para rastreio.'),t('SISTEMA',20,'ANDROID / IOS / OUTRO / DESCONHECIDO.'),t('VERSAO_SISTEMA',30,'Versão observada; não é condição comercial aprovada.'),date('DT_PRIMEIRO_USO','Opcional; não demonstra troca de aparelho.'),date('DT_ULTIMO_USO','Último evento real de uso do aparelho na origem.'),date('DT_REFERENCIA_FONTE','Referência do arquivo, obrigatória.',True),date('DT_CARGA','Momento em que o SFMC recebeu a foto.',True)]
requests=[t('CPF',11,'Chave parcial da solicitação atual.',pk=True),t('PRODUTO',20,'Chave parcial; produto normalizado.',pk=True),t('ID_SOLICITACAO',100,'Identificador na fonte; não fabricar se ausente.'),t('STATUS',25,'EM_PROCESSAMENTO / CONFIRMADA / NAO_EFETIVADA / DESCONHECIDA.',True),date('DT_FORMULARIO','Instante do aceite válido.'),date('DT_RETORNO','Instante do retorno operacional, se recebido.'),field('ACEITE_VALIDO','Boolean',purpose='Aceite de contratação validado; nulo exige revisão.'),t('FONTE',100,'LP e/ou retorno que sustenta o estado.',True),date('DT_REFERENCIA_FONTE','Referência da fonte consultada.',True),date('DT_ATUALIZACAO','Atualização da projeção operacional.',True)]
entry=[t('ID_ENTRADA',80,'Chave estável por participação; não regenerar em toda execução.',pk=True),t('CPF',11,'Cliente selecionado.',True),t('CONTACT_KEY',254,'Mesmo Contact Key existente no SFMC.',True),t('ID_CICLO',64,'Participação imutável usada nos marcadores.',True),t('PRODUTO',20,'Produto fixo correspondente à DE.',True),t('TIPO_REGUA',10,'MENSAL ou TRIGGER, fixo conforme a DE.',True)]+contacts+[date('DT_ENTRADA_PREVISTA','Janela autorizada de entrada.',True),date('DT_GERACAO','Criação da entrada; não renovar em reexecuções.',True),t('ID_EVENTO_COMPRA',100,'Obrigatório para trigger; nulo na mensal.'),t('CATEGORIA_MCC',30,'Obrigatória no trigger; categoria normalizada.'),date('DT_COMPRA','Data/hora da compra quando disponível, ou data agregada identificada como tal.'),t('SEGMENTO_DEVICE',40,'Segmento de aparelho no instante da seleção.',True,default='SEM_DADO_CONFIAVEL'),t('DEVICE_MARCA',50,'Somente se confiável.'),t('DEVICE_MODELO',100,'Somente se confiável.')]+provenance
markers=[t('CPF',11,'Uma linha por cliente em cada DE física de marcador.',pk=True),t('ID_CICLO',64,'Copiado do Journey Data da entrada; nunca do ciclo atual de Contact Data.',True),t('PRODUTO',20,'Valor fixo da DE.',True),t('TIPO_REGUA',10,'Valor fixo da DE.',True),t('STATUS',40,'ENTROU / SEM1… / CONCLUIU / SAIU.',True),date('DT_MARCADOR_SFMC','Use current time da atividade; relógio SFMC do tenant.',True),t('MOTIVO_SAIDA',200,'Somente quando houver encerramento.'),t('VERSAO_REGRA',20,'Versão trazida pela entrada.',True)]
history=[t('ID_CICLO',64,'Uma linha por participação mensal ou trigger.',pk=True),t('CPF',11,'Cliente.',True),t('PRODUTO',20,'Seguro.',True),t('TIPO_REGUA',10,'MENSAL / TRIGGER.',True),t('STATUS',40,'Situação reconciliada da participação.',True),flag('FL_CICLO_ATIVO','Validade atual do ciclo para contatos.'),date('DT_AUTORIZACAO','Seleção para a entrada.',True),date('DT_ENTRADA','Confirmação de entrada.'),date('DT_ULTIMO_AVANCO','Último marcador aceito do mesmo ciclo.'),date('DT_ENCERRAMENTO','Encerramento da participação.'),t('MOTIVO_SAIDA',200,'Razão do encerramento.'),t('ID_EVENTO_COMPRA',100,'Preenchido nos triggers; permite rastrear sua origem.')]+provenance
trigger=[t('ID_EVENTO_COMPRA',100,'Chave parcial; identidade estável do evento na fonte.',pk=True),t('PRODUTO',20,'Chave parcial; decisão é por evento e seguro.',pk=True),t('CPF',11,'Cliente.',True),t('CATEGORIA_MCC',30,'Categoria que acionou a seleção.',True),date('DT_COMPRA','Instante ou data da compra, com granularidade declarada.',True),t('GRANULARIDADE_EVENTO',20,'TRANSACAO ou CPF_CATEGORIA_DIA.',True),t('DECISAO',25,'DESCARTADO / AUTORIZADO / ENTRADA_CONFIRMADA / ENCERRADO.',True),t('MOTIVO',200,'Por exemplo MENSAL_ATIVA, SOLICITACAO, POSSE, SEM_CANAL.',True),date('DT_DECISAO','Primeira decisão; preservar em reexecuções.',True),t('ID_CICLO',64,'Ciclo de trigger, se autorizado.')]+provenance
run=[t('ID_EXECUCAO',64,'Execução da automação.',pk=True),date('DT_INICIO','Início.',True),date('DT_FIM','Fim, inclusive de falha.'),t('STATUS',20,'INICIADA / FONTES_INVALIDAS / FALHOU / CONCLUIDA.',True),date('DT_REFERENCIA_MAPA','Referência real da MAPA.'),date('DT_REFERENCIA_MCC','Referência real de compras.'),date('DT_REFERENCIA_DEVICE','Referência real de DEVICE; ausência não invalida toda a estratégia.'),num('QT_ELEGIVEIS','Contagem observada após a seleção.'),num('QT_ENTRADAS_MENSAL','Entradas mensais autorizadas.'),num('QT_ENTRADAS_TRIGGER','Triggers autorizados.'),num('QT_TRIGGERS_DESCARTADOS','Eventos descartados nesta execução.'),t('ERRO',500,'Etapa e causa da falha; sem CPF ou contato em texto livre.'),t('VERSAO_REGRA',20,'Versão em execução.',True)]
records=[
 de(['SEGUROS_ELEGIBILIDADE_CPF'],elig,'00_Dados', 'Overwrite, somente com fontes válidas','Queries de elegibilidade'),
 de(['SEGUROS_CONTROLE_CPF','SEGUROS_CONTROLE_CPF_PREPARO'],control,'01_Controle','CONTROLE: Update a partir de PREPARO; PREPARO: Overwrite após ler estado e marcadores','Somente automação de conciliação',notes='Dois objetos com o mesmo schema. A área PREPARO permite calcular o próximo estado sem sobrescrever a fonte que está sendo lida. A jornada não escreve diretamente nessas DEs.'),
 de(['SEGUROS_CONFIG_ESTRATEGIA'],config,'01_Controle','Update manual governado','Responsável CRM/Growth'),
 de(['SEGUROS_DEVICE_CPF'],device,'00_Dados','Overwrite, arquivo completo validado','Import da IN/lake; proposta de contrato de origem'),
 de(['SEGUROS_SOLICITACOES_CPF_PRODUTO'],requests,'00_Dados','Update; preservar processamento sem retorno','Conciliação das LPs e retorno de contratação'),
 de([f'SEG_APTOS_{p}_{kind}' for p in ['MULHER','RESIDENCIAL','CELULAR'] for kind in ['MENSAL','TRIGGER']],entry,'02_Publicos','Update somente para novas entradas; não alterar payload de entrada já confirmada','Queries de seleção',True, notes='Uma DE física para cada produto/tipo. ID_ENTRADA é PK; CONTACT_KEY é identidade de envio. Não confundir as duas chaves. O feed deve reter entradas pendentes até confirmação; não usar Overwrite diário.'),
 de([f'SEG_MARCADOR_{p}_{kind}' for p in ['MULHER','RESIDENCIAL','CELULAR'] for kind in ['MENSAL','TRIGGER']],markers,'03_Marcadores','Update Contact, sem Overwrite da automação','Somente a jornada correspondente',notes='Proposta para separar escritores simultâneos. PK CPF por DE, evitando atualização ambígua de chaves compostas por Update Contact. Validar cópia dinâmica do ID_CICLO no tenant. Só aceitar marcador cujo ciclo ainda seja o ciclo válido.'),
 de(['SEGUROS_HISTORICO_CICLOS'],history,'01_Controle','Update por ID_CICLO, preservando ciclos encerrados','Conciliação; não é uma linha por contato ou por semana'),
 de(['SEGUROS_TRIGGER_CONTROLE'],trigger,'01_Controle','Update idempotente por evento/produto','Somente se decisões não forem persistidas e retornadas pelo lake',notes='DE condicional, não obrigatória se o lake oferecer esse contrato. Não contém uma cópia de todas as compras.'),
 de(['SEGUROS_EXECUCOES'],run,'01_Controle','Update por ID_EXECUCAO','Orquestração/Script Activity de acompanhamento'),
]
catalog=dict(version='seguros-sfmc-proposal/2',status='DESENHO_PARA_VALIDACAO_NO_TENANT',de_contracts=records,
             note='Não cria objetos nem altera SFMC. Campos e nomes propostos; confirmar BU, permissões e retenção antes de criar.')
CATALOG.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
parts=['## Referência técnica: Data Extensions','',
       'Contrato proposto para criação. As seis DEs de público compartilham um modelo; as seis de marcador compartilham outro. Cada tabela abaixo lista todos os campos do respectivo modelo, sem repetir o mesmo dicionário seis vezes. Não são objetos já implantados.','',
       '**Pasta e BU:** pastas sugeridas abaixo de `Shared Data Extensions/Seguro`. Confirmar a BU de execução e o acesso às DEs compartilhadas; usar `ENT.` apenas onde o contexto exigir. CustomerKey igual ao nome técnico é proposta, não chave existente. Não recriar as fontes atuais.','',
       '**Identidade e datas:** CPF em Text(11), validado e com zeros preservados. CONTACT_KEY deve reproduzir a identidade já usada no envio. Date não guarda fuso: fontes devem declarar referência e fuso; normalizar os marcadores do relógio SFMC antes de comparar com fontes externas. Os 15 dias são tempo decorrido; D+1 usa a data de compra no calendário de negócio validado.','',
       '**Retenção:** não ligar expurgo automático durante o piloto. Antes de produção, aprovar retenção por finalidade, exportação do histórico e limpeza das entradas já encerradas. Não definir “sem retenção para sempre” por omissão.','']
for record in records:
    names=record['names']
    heading=names[0] if len(names)==1 else ('Modelo dos seis públicos SEG_APTOS' if record['sendable'] else 'Controle mensal e área de preparo' if names[0]=='SEGUROS_CONTROLE_CPF' else 'Modelo dos seis marcadores de jornada')
    parts += ['### '+heading,'', '**DEs físicas:** '+', '.join('`'+name+'`' for name in names)+'.','',
              f"**Pasta:** `{record['folder']}`. **External Key:** mesmo nome técnico, após conferir unicidade. **Sendable:** {'sim, '+record['send_relationship'] if record['sendable'] else 'não'}. **Gravação:** {record['action']}. **Responsável:** {record['writer']}.",'']
    if record['notes']:parts += [record['notes'],'']
    parts += ['| Campo | Tipo / tamanho | PK | Obrigatório | Padrão | Uso |','|---|---|:---:|:---:|---|---|']
    for f in record['fields']:
        kind=f['type']+(f"({f['length']})" if f['length'] else '')
        default='—' if f['default'] is None else str(f['default']).lower() if isinstance(f['default'],bool) else str(f['default'])
        parts.append(f"| `{f['name']}` | {kind} | {'Sim' if f['primary_key'] else '—'} | {'Sim' if f['required'] else 'Não'} | {default} | {f['purpose']} |")
    parts += ['']
parts += ['### Valores iniciais da configuração','', '| CHAVE | VALOR | TIPO | Situação |','|---|---|---|---|',
          '| DIAS_ENTRE_PRODUTOS | 15 | NUMERO | Definido; congelar o valor aplicado ao concluir cada ciclo. |',
          '| DIAS_MAX_SEM_AVANCO_SEMANA | 15 | NUMERO | Definido; comparação estritamente maior que 15 dias. |',
          '| DELAY_TRIGGER_DIAS | 1 | NUMERO | D+1 definido; depende da atualização de compras. |',
          '| DEVICE_JANELA_USO_DIAS | 90 | NUMERO | Recomendação de segmentação, a validar. |',
          '| DEVICE_MAX_DEFASAGEM_DIAS | A definir | NUMERO | Não aceitar arquivo velho apenas porque foi importado hoje. |',
          '| ORDEM_PRODUTOS | A aprovar | TEXTO | Não ativar a rotação sem ordem definida. |',
          '| INTERVALO_MIN_TRIGGER_DIAS | A aprovar | NUMERO | A sugestão anterior de 30 dias ainda não é decisão. |',
          '| PERCENTUAL_CONTROLE | A aprovar | NUMERO | A sugestão anterior de 10% ainda não é decisão. |','',
          'Parâmetro obrigatório ausente ou inválido bloqueia a etapa que depende dele. Não converter vazio em zero. Um parâmetro de DEVICE pendente não deve bloquear ofertas genéricas dos outros seguros.','',
          '### Fontes existentes: campos consumidos, sem recriação','',
          '| Fonte | Campos usados / verificação |','|---|---|',
          '| CLIENTES ATIVOS | CPF, NR_CONTA, EMAIL, PRI_NOME, NR_CELULAR, LOCALE, STATUS, bloqueio_email, bloqueio_celular, LIMITE_DISPONIVEL; recência se usada para desempate. Grão não é CPF: deduplicar contas/cartões antes da seleção. |',
          '| MAPA_SEGUROS | CPF e flags de produto validadas. São campos de posse atual, não data de venda; manter DESCONHECIDA quando a cobertura do produto não estiver confirmada. Ver [[DE-MAPA_SEGUROS]]. |',
          '| MAPA_MCC | nr_conta, nr_cpf, dt_ultima_compra_saude_beleza, dt_ultima_compra_eletrodomesticos, dt_ultima_compra_eletronicos e referência real da fonte. Os demais campos estão em [[DE-MAPA_MCC]]; acumulados não identificam valor ou ID da transação. |',
          '| LP_Seguros, schema do pacote recebido | CPF Text(50) PK; data_preenchimento Date; produto Text(50); aceita_contratacao Boolean; parceiro Text(50); ORIGEM Text(150); COMUNICACAO Text(150); GENERO Text(50). Apenas CPF é não nulo no export. Normalizar para o contrato, sem alterar a DE original. |',
          '| LP_SEGUROS_GERAL | Schema completo não veio neste pacote. Confirmar relação com LP_Seguros e fonte oficial; não declarar nomes ou chaves de origem que não foram verificados. |',
          '| ENT.sem_interesse e DE_EXCLUSAO_MULHER | Verificar campos de identificação, escopo, motivo e alimentação antes de incorporá-las. Não assumir que são contratação. |','',
          '### Fontes técnicas','',
          '- [Salesforce: DataExtensionField](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/dataextensionfield.html), para PK, obrigatoriedade, tamanho e precisão.',
          '- [Salesforce: Update a Contact](https://help.salesforce.com/s/articleView?id=mktg.mc_jb_update_a_contact.htm&type=5&language=en_US), para marcador, data atual e separação da DE de entrada. A configuração dinâmica precisa de teste no tenant.','']
(ROOT/'docs/plans/seguros-segmentacao/de-reference-v2.md').write_text('\n'.join(parts),encoding='utf-8')
print(f'{len(records)} modelos; {sum(len(r["names"]) for r in records)} DEs físicas (inclui 1 condicional).')
