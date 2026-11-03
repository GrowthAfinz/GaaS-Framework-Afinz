---
title: Plurix — Recência, automação e comunicações
tags: [plurix, recencia, sfmc, automation, sms, whatsapp, aquisicao]
tipo: runbook
camada: operacao
atualizado: 2026-10-28
status: documentado-com-pendencias
fonte: conversa operacional e screenshots SFMC de outubro de 2026; consulta Supabase e fontes oficiais em 2026-10-26
---

# Plurix — Recência, automação e comunicações

## Objetivo e alcance da evidência

Converter compradores recentes sem cartão em solicitantes do cartão +amigo Afinz Visa, usando economia potencial nas compras e oferta pré-aprovada como argumentos. Este documento consolida as decisões e correções da conversa até 28/10/2026. Não certifica configuração ao vivo, entrega, conversão nem sucesso de todas as execuções posteriores.

Relacionados: [[07-Evolucao/Segmento-Recencia-de-Compra]], [[07-Evolucao/Resultados-CRM-Recencia_de_Compra]], [[03-Dimensoes/Bandeiras-Plurix]], [[07-Evolucao/Parceiro-Plurix]].

## Dados e significado comercial

- Arquivo de entrada: `lista_nao_cartonistas.csv`, 407.711 registros na carga observada. Arquivo local `(1).csv` foi identificado como cópia equivalente no trabalho anterior.
- Grão da entrada: CPF. Histórico: CPF e semana de referência.
- `economia_4_semanas`: economia potencial calculada pelo parceiro para pagamento com o cartão, referente às quatro semanas do arquivo. Não é desconto recebido, cashback, saldo, economia futura garantida ou benefício líquido após mensalidade.
- Campos brutos: `cpf`, `desc_nome`, `desc_telefone_principal`, `desc_email`, `bol_optin_whats`, `bol_optin_sms`, `bol_optin_email`, `bandeiras`, `cupons_semana`, `gasto_semana`, `cupons_4_semanas`, `gasto_4_semanas`, `gasto_produtos_com_desconto`, `produtos_com_desconto`, `economia_4_semanas`.
- CSV separado por vírgula, com aspas duplas como qualificadores. A economia bruta continha quatro casas decimais: usar Decimal(18,4) na entrada e arredondar para duas no histórico.
- Erros resolvidos durante a importação: `InvalidFieldMap` e `InvalidDecimalScale`. A carga bruta de 407.711 foi observada após correção.
- `bandeiras` pode agregar redes separadas por vírgula. A decisão foi usar a primeira rede em `INVESTIDA`. Isso não torna a economia agregada atribuível exclusivamente a essa rede. Futuro arquivo com apenas a última rede foi mencionado como intenção, não como contrato já comprovado.

## Extensões de dados e localização

Compartilhadas: `Itens Compartilhados > Extensões de Dados Compartilhadas > Plurix > 3_RECENCIA_PLX`. SQL usa `ENT.[nome]`.

| DE | Papel | Grão / ação |
|---|---|---|
| RECENCIA_PLX_ENTRADA | Arquivo bruto atual, 15 campos | CPF, importação da base atual |
| RECENCIA_CONTROLE_CARGA | Identificação da carga e semana | CARGA_ID, adicionar/atualizar |
| RECENCIA_PLX | Histórico bruto com semana e data de importação | CPF + SEMANA_REFERENCIA, adicionar/atualizar |
| RECENCIA_CRUZAMENTO | Enriquecimento, indicadores e motivo principal | CPF, sobrescrever |
| RECENCIA_FUNIL | Contagens por resultado e carga | Sobrescrever |
| RECENCIA_PLX_APTOS | Audiência e personalização da jornada | CPF, sobrescrever |

Fontes locais na BU: `[COMUNICACAO_PLX]`, `[PRE_APROVADO_PLX]`, `[Plurix_publico]`, `[GC_Mesa_Gupshup]`. Restrição compartilhada: `ENT.[sem_interesse]`.

## Automação RECENCIA_CRUZAMENTO

São seis etapas, com sete atividades no arranjo mostrado. A importação móvel e o detalhamento final do funil podem ficar na mesma etapa, pois leem aptos e gravam destinos diferentes. Consultas dependentes devem ficar em etapas sucessivas.

| Etapa | Atividade | O que faz |
|---|---|---|
| 1 | RECENCIA_CONTROLE_CARGA | Registra/atualiza a carga com STATUS PREPARACAO, semana e DATA_CRIACAO |
| 2 | Q_PLX_RECENCIA_02_HISTORICO | Copia entrada para histórico, acrescenta semana e DATA_IMPORTACAO, arredonda economia |
| 3 | Q_PLX_RECENCIA_03_CRUZAMENTO | Cruza cadastro, oferta e restrições; calcula indicadores e RESULTADO |
| 4 | Q_PLX_RECENCIA_04_FUNIL | Resume o cruzamento por resultado |
| 5 | Q_PLX_RECENCIA_05_APTOS | Valida telefone e oferta, prepara personalização e marca WPP/SMS/NOT_CANAL |
| 6 | IMP_PLX_RECENCIA_APTOS + Q_PLX_RECENCIA_06_FUNIL_CANAIS | Importa cadastro móvel e substitui o funil geral pelo detalhamento final |

O registro de controle muda quando a consulta 1 executa, não simplesmente quando um arquivo é importado. O status PREPARACAO não comprova conclusão: não foi implementada atividade de encerramento da carga nesta conversa. QTDE_ESPERADA apareceu vazia.

Semana calculada: segunda-feira da semana anterior à data de execução em UTC-3. Exemplo observado em 21/10: `RECENCIA_2026-10-12`. A fórmula depende da data de execução, não do conteúdo/data do arquivo. Reprocessar arquivo antigo em outra semana pode rotulá-lo incorretamente. Mesma semana atualiza a mesma carga; não há identidade determinística do arquivo implementada.

### Etapa 3 — Regras do cruzamento

Cadastro, nome, e-mail e telefone de cadastro vêm da COMUNICACAO_PLX. Limite e validade vêm da PRE_APROVADO_PLX. CPFs das fontes auxiliares são normalizados para 11 dígitos após validação de tamanho e caracteres. O histórico é restringido aos CPFs presentes na entrada atual e à semana/carga em PREPARACAO.

Prioridade do CASE: formato CPF; ausência no cadastro; ausência em pré-aprovados; validade ausente; oferta vencida; cartonista em Plurix_publico; sem_interesse; Mesa Gupshup; TIPO indicando cartonista; investida ausente; economia não positiva; passou nos filtros. Os motivos são exclusivos pelo primeiro teste atendido; as flags podem se sobrepor.

**Correção excepcional de validade:** todos os registros consultados na PRE_APROVADO_PLX estavam armazenados como 11/01/2026 (YEAR 2026, MONTH 1, DAY 11). O usuário confirmou que a intenção era 01/11/2026 e pediu correção na query. Somente a data `20260111` é convertida para `20261101` na subconsulta de pré-aprovados. Outras datas ficam inalteradas. Não estender automaticamente essa exceção para nova safra/ano.

### Etapa 5 — Contrato final aprovado na conversa

- Destino sobrescrito: RECENCIA_PLX_APTOS.
- Saídas: CPF, CARGA_ID, SEMANA_REFERENCIA, FIRST_NAME, EMAIL, LOCALE, INVESTIDA, ECONOMIA_4_SEMANAS, GASTO_4_SEMANAS, GASTO_PRODUTOS_COM_DESCONTO, PRODUTOS_COM_DESCONTO, LIMITE_CRD, VALIDADE, TELEFONE, CANAL, APTO_RECENCIA, LIBERADO_ENVIO, MOTIVO_PENDENCIA, DATA_PROCESSAMENTO.
- `TELEFONE`: **tipo Phone/Telefone**, único telefone de envio na DE. Nome anterior PHONE_ENVIO foi removido e não deve permanecer no SELECT nem nos mapeamentos. O campo temporário Phone também foi descartado. Número normalizado exclusivamente de COMUNICACAO_PLX.PHONE, sem fallback para o arquivo.
- `LOCALE`: **tipo Locale/Localidade**, valor `BR`. Texto não satisfazia os critérios de elegibilidade do preview de SMS. Não é necessário alterar `'BR' AS LOCALE` ao recriar o campo com tipo correto.
- `ECONOMIA_4_SEMANAS` e `LIMITE_CRD`: **Texto**, definidos para pelo menos 30 caracteres (screenshot posterior mostra 50). SQL converte decimal(18,2) para texto e substitui ponto por vírgula. Ex.: `29,34`, `2500,00`. Campos numéricos de origem permanecem numéricos no cruzamento.
- EMAIL precisa comportar o endereço completo. Houve truncamento; recomendação foi 254 caracteres, mas screenshot posterior mostra Texto(250). Harmonização para 254 permanece uma verificação pendente, sem cortar endereços para caber.
- Nomes: AMIGAO/AMIGÃO → Amigão, BOA → Boa, AVENIDA → Avenida, PARANA/PARANÁ → Paraná. Demais valores preservados até mapear nomes reais.
- Mantidos: formato de celular brasileiro, 55 + DDD válido + 9 + oito dígitos; rejeição de últimos oito dígitos todos iguais; limite numérico positivo; validade pelo menos a data atual UTC-3.
- Mantida unicidade de telefone entre CPFs: agrupa telefone nacional normalizado na união de COMUNICACAO_PLX e entrada atual; aceita COUNT(DISTINCT CPF)=1. **A entrada ainda participa dessa regra**, mesmo após remover a igualdade de telefones.
- **Removido:** exigir que telefone da COMUNICACAO_PLX seja igual ao telefone de origem.
- **Removido:** excluir do público por falta de opt-in WPP/SMS na entrada.
- Canal: opt-in WPP=1 → WPP; senão opt-in SMS=1 → SMS; senão NOT_CANAL. WPP tem prioridade quando ambos são verdadeiros.
- APTO_RECENCIA=1 em todas as linhas retornadas. LIBERADO_ENVIO=1 para indicação WPP/SMS; zero para NOT_CANAL. Motivo para NOT_CANAL: `Sem indicacao de canal na origem`.
- LIBERADO_ENVIO é uma flag da consulta, não certificação de autorização de envio. Inscrição atual e descadastros precisam ser respeitados no canal. Não foi implementada checagem de ciclo ativo/proposta em andamento no SQL 5.

### Etapa 6 — SQL final de detalhamento do funil

Nome: Q_PLX_RECENCIA_06_FUNIL_CANAIS. Destino RECENCIA_FUNIL, Sobrescrever. Executar depois dos aptos. A consulta 4 e esta não podem escrever simultaneamente. O resumo 4 é intermediário; o 6 substitui sua linha de aprovados pelos grupos finais, sem somar novamente o subtotal.

```sql
SELECT
    f.CARGA_ID,
    f.SEMANA_REFERENCIA,
    f.RESULTADO,
    COUNT(*) AS TOTAL_CPFS,
    GETDATE() AS DATA_PROCESSAMENTO
FROM (
    SELECT
        r.CARGA_ID,
        r.SEMANA_REFERENCIA,
        CASE
            WHEN r.RESULTADO <>
                 'Passou nos filtros - validar telefone e canal'
                THEN r.RESULTADO
            WHEN a.CPF IS NULL
                THEN 'Fora dos aptos - revisar filtros do passo 5'
            WHEN a.CANAL = 'WPP'
                THEN 'WPP - prioridade com opt-in na origem'
            WHEN a.CANAL = 'SMS'
                THEN 'SMS - opt-in SMS sem opt-in WPP'
            WHEN a.CANAL = 'NOT_CANAL'
                THEN 'NOT_CANAL - sem opt-in na origem'
            ELSE 'Canal nao identificado - revisar passo 5'
        END AS RESULTADO
    FROM ENT.[RECENCIA_CRUZAMENTO] r
    LEFT JOIN ENT.[RECENCIA_PLX_APTOS] a
        ON a.CPF = r.CPF
       AND a.CARGA_ID = r.CARGA_ID
       AND a.SEMANA_REFERENCIA = r.SEMANA_REFERENCIA
) f
GROUP BY f.CARGA_ID, f.SEMANA_REFERENCIA, f.RESULTADO
```

## Importação móvel e audiência

Definição `IMP_PLX_RECENCIA_APTOS`, criada no Contact Builder e selecionada na atividade de importação móvel da automação. Origem RECENCIA_PLX_APTOS; ação mostrada: Adicionar e atualizar. Não é importação de novo CSV nem cópia para outra DE. Importar todos os aptos finais foi decisão expressa, inclusive contatos já existentes e NOT_CANAL; importar não autoriza disparar.

| Campo da DE | Atributo móvel | Uso |
|---|---|---|
| CPF | _ContactKey | Identidade |
| TELEFONE | _MobileNumber | Celular |
| LOCALE | _Locale | País/localidade |
| FIRST_NAME | _FirstName | Nome e variável WPP 1 |
| ECONOMIA_4_SEMANAS | _City | Variável WPP 2 |
| LIMITE_CRD | _ZipCode | Variável WPP 3 |
| INVESTIDA | _State | Variável WPP 4 |

**Desvio operacional aceito pelo usuário:** ele informou ter testado a personalização por atributos móveis. City/ZipCode/State são usados como transporte de valores comerciais, sobrescrevendo dados globais desses atributos. Isso pode afetar outras mensagens e jornadas; não tratar como arquitetura recomendada genérica. Para SMS, variáveis vêm diretamente da DE.

Audiência escolhida: RECENCIA_PLX_APTOS, transmissível e testável, CPF relacionado à Chave de assinante. Separar caminhos WPP/SMS e excluir NOT_CANAL dos envios. Valores de entrada da jornada devem ser preservados como snapshot quando necessário; sobrescrita semanal da DE e atributos móveis pode mudar personalização de quem já está em jornada.

## Comunicações e personalização

### WhatsApp — template montado/testado visualmente

Imagem do cartão +amigo; corpo observado:

```text
Oi, {{1}}. Ja pensou que suas compras podem render mais?
Nas ultimas 4 semanas, voce poderia ter economizado R${{2}} pagando com o cartao +amigo Afinz Visa.
Voce tem uma oferta pre-aprovada com limite de R${{3}}!
Peca seu cartao e aproveite nas proximas compras no {{4}}.
```

Transcrição normalizada de conteúdo, não exportação byte a byte do template. O template mostrado tinha acentos/emoji e rodapé `Oferta sujeita a análise e validade.` Botões: Pedir cartão; Não tenho interesse agora. Ordem final de variáveis: nome, economia, limite, investida. Aprovação Meta, vínculo definitivo e entrega da peça não foram certificados por essa conversa.

### SMS — versão que o usuário informou como final

```text
%%FIRST_NAME%%, vimos sua compra no %%=Replace(Replace(AttributeValue("INVESTIDA"),"ã","a"),"á","a")=%%! Voce poderia ter economizado R$%%eCONOMIA_4_SEMANAS%% com o cartao +amigo. Limite pre-aprovado de R$%%LIMITE_CRD%%. Peca ja: https://bit.ly/47tZLFN
```

### SMS — última alternativa solicitada para D+4

```text
%%FIRST_NAME%%, com o cartao +amigo voce poderia ter economizado R$%%ECONOMIA_4_SEMANAS%% nas ultimas semanas no %%=Replace(Replace(AttributeValue("INVESTIDA"),"ã","a"),"á","a")=%%! Limite pre-aprovado: R$%%LIMITE_CRD%%. Solicite: https://bit.ly/47tZLFN
```

Alternativa redigida, sem confirmação de publicação/envio. Manter economia potencial. A frase liga o valor à rede: usar apenas quando o cálculo for daquela rede ou corrigir a copy se multibandeira. Não há teste comprovando superioridade da segunda versão.

Regra operacional: SMS sem acentos no texto e valores dinâmicos; preservar Amigão/Paraná na DE e WhatsApp. Replace acima cobre ã/á, não todos os caracteres possíveis. Nome pessoal e outras redes ainda precisam de revisão completa de caracteres. Limite de segmentos é medido após renderização das variáveis e link; a contagem do código AMPscript não representa o texto entregue.

## Snapshots observados, não produção atual

| Resultado do cruzamento | Quantidade |
|---|---:|
| Não localizado na COMUNICACAO_PLX | 227829 |
| Sem registro na PRE_APROVADO_PLX | 58699 |
| Já possui cartão - Plurix_publico | 76 |
| Registrado na restrição sem_interesse | 973 |
| Reservado para a Mesa Gupshup | 5881 |
| Passou nos filtros - validar telefone e canal | 114253 |
| Total | 407711 |

114.253 é subtotal do cruzamento, não garantia de audiência final. A DE de aptos apareceu primeiro com 114.253 numa versão sem liberação efetiva, depois com 97.721 após filtros adicionais, e por último com **106.892** no screenshot após ajustes. Não atribuir causalidade exata a cada filtro sem auditoria. Distribuição final por canal não foi recebida nesta conversa.

Falhas observadas: SQL 5 interrompido por truncamento EMAIL; após excluir PHONE_ENVIO, erro Invalid column name PHONE_ENVIO. Corrigir SELECT e revalidar/reselecionar destino; revisar importação. O tipo Número não substitui Phone. Preview SMS passou a mostrar dados renderizados após os ajustes, sem provar entrega real.

Consulta Supabase de 26/10 identificou `afz_car_plx_aqs_wpp_rec_disp1_pontual` em 23/10/2026 no segmento Recencia_de_Compra, sem template_id. Registro de activity não comprova texto entregue, cobertura ou causalidade. Templates antigos de Copa não podem ser reutilizados como benefício vigente.

## Guardrails de copy, operação e mensuração

- Uma promessa central e um CTA direto à solicitação. Valor pequeno não justifica adjetivos como grande economia; testar economia primeiro versus limite primeiro em grupos comparáveis.
- Não prometer economia futura igual ao valor histórico nem anualizar por multiplicação. Não chamar economia bruta de líquida: mensalidade varia por rede.
- Quatro semanas são do arquivo original, não janela móvel no momento de cada toque. D+4 não atualiza automaticamente cálculo/período.
- Não criar falsa escassez nem apresentar pré-aprovado como aprovado definitivamente. Validar limite e validade antes de cada toque, não só na entrada.
- Oferta excepcional corrigida vence em 01/11/2026. D+4 após esse prazo não deve usar essa pré-aprovação sem renovação válida.
- Supressão de quem iniciou solicitação, virou cartonista, entrou em restrição ou se descadastrou é necessária no desenho da jornada; implementação completa não demonstrada.
- Ausência de opt-in na entrada deixou de excluir da DE. Isso não equivale a consentimento/inscrição para enviar, nem autoriza reativar descadastrados pela importação.
- Pontos encerrados em julho/2026; não usar. Percentuais, saúde, prazos e taxas dependem de rede e condições vigentes.
- Comparar proposta concluída, aprovação, cartão/primeira compra e custo, com controle e populações equivalentes. Cliques são diagnóstico, não prova de copy vencedora.
- Não usar dados ausentes como zero nem interpretar metadados sem conteúdo como texto validado.

Fontes consultadas na pesquisa de 26/10: [produto oficial](https://www.clubemaisamigo.com.br/cartao), [CDC](https://planalto.gov.br/ccivil_03/leis/l8078compilado.htm), [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm), [política WhatsApp](https://whatsappbusiness.com/policy/?faq=5), skills locais produtos-afinz e afinz-copy-aquisicao. Referências orientam operação; não constituem certificação jurídica da peça.

## Artefatos e pendências para continuidade

Kit anterior: `outputs/sfmc-recencia-guia-20261021/` com gerar_guia.py, guia HTML, schemas, ZIP e SQLs 01–04. Plano: `outputs/plurix-recencia-plano-20261021/Estrategia_Recencia_Plurix_Plano_Templates.xlsx`. Os artefatos anteriores **não foram sincronizados com todas as revisões finais de SQL 3/5/6, tipos e nomes desta conversa**. Não regenerar nem importar o kit antigo como se refletisse este contrato. SQL 5 completo mais recente foi entregue no chat; este documento registra seu contrato, não uma extração da versão salva ao vivo.

Próximas verificações: exportar as definições finais salvas no SFMC para versionar SQLs e mapeamentos; conferir EMAIL 254 e Locale; confirmar distribuição por canal e reconciliação dos 114.253; validar importação sem reativar opt-outs; testar SMS/WPP com valores reais; conferir validade em D+4; comprovar supressões e reentrada; vincular template_id à activity e medir resultados maturados. Não houve ativação de agendamento ou jornada certificada pelo agente.
