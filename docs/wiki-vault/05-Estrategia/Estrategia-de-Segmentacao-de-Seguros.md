---
title: Estratégia de Segmentação de Seguros
tags: [estrategia, seguros, segmentacao, sfmc, regua]
tipo: estrategia
camada: estrategia
aliases: [Estratégia de seguros, Segmentação de Seguros]
atualizado: 2026-11-06
status: proposto
status_detalhe: desenho consolidado com decisões de 06/11; implantação no SFMC e parâmetros restantes pendentes
fonte: decisões do Pablo em 06/11/2026; pacote SFMC e queries fornecidas; notas técnicas de Seguros
---

# Estratégia de Segmentação de Seguros

A estratégia tem duas portas de entrada. Na **mensal**, o cliente recebe uma sequência de seguros, um produto por vez. No **trigger**, uma compra em uma categoria MCC abre uma oportunidade de oferta no dia seguinte.

As duas frentes partem da mesma elegibilidade. O que muda é o momento de entrar. O formulário suspende a oferta daquele produto enquanto a solicitação é processada; a confirmação de posse encerra sua aquisição.

> Desenho de referência da estratégia. A implantação no SFMC ainda depende das definições técnicas reunidas ao final.

## O fluxo, de ponta a ponta

[![Fluxo de Seguros: mensal por semanas e trigger MCC em D+1, com elegibilidade compartilhada, descarte e intervalo entre produtos.](https://growthafinz.github.io/GaaS-Framework-Afinz/wiki-diagrams/seguros-percurso-v2.svg)](https://growthafinz.github.io/GaaS-Framework-Afinz/wiki-diagrams/seguros-percurso-v2.svg)

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

## Como a mensal continua andando

A jornada atualiza o status a cada semana: `SEM1`, `SEM2`, `SEM3`… Ao concluir a última semana, registra `AGUARDANDO_PROXIMO_PRODUTO`, a data de conclusão e a liberação após 15 dias. Chegar à última semana ainda não inicia essa contagem.

O controle guarda seguro atual, próximo seguro, status, datas e identificador do ciclo. A data da última mudança só é renovada quando o status realmente muda. A liberação é calculada uma vez por conclusão, com o intervalo configurado; execuções seguintes não empurram a data para a frente. Mudanças no parâmetro valem para novas conclusões. Cada ciclo identifica uma participação, impedindo que um marcador antigo altere a nova.

**Mais de 15 dias na mesma semana:** a automação encerra o ciclo com motivo `SEM_AVANCO_15_DIAS` e libera o próximo seguro, sem acrescentar outra espera. Registra encerramento por inatividade, não conclusão normal. O ciclo anterior precisa ser invalidado antes dos próximos contatos.

Uma data de liberação autoriza a seleção; `SEM1` só é registrada quando houver entrada efetiva no novo ciclo. Bounce não comprova saída da jornada. Bloqueios, desinteresse e contratação continuam sendo respeitados. O desbloqueio recupera o percurso; não libera um canal impedido.

## Onde isso fica no SFMC

Os nomes abaixo formam o contrato do novo desenho. As DEs faltantes serão criadas; as antigas `FILTRADO` ficam fora dele.

| DE | Responsabilidade |
|---|---|
| `SEGUROS_ELEGIBILIDADE_CPF` | Uma linha por CPF: contatos, aptidão por produto e motivos de impedimento. Alimentada pelas queries de elegibilidade. |
| `SEGUROS_CONTROLE_CPF` | Percurso mensal: seguro atual, semana, próximo seguro, datas e ciclo. Recebe marcadores das jornadas e conferência de inatividade. |
| `SEGUROS_CONFIG_ESTRATEGIA` | Parâmetros separados: `DIAS_ENTRE_PRODUTOS = 15` e `DIAS_MAX_SEM_AVANCO_SEMANA = 15`. |
| `SEG_APTOS_MULHER_MENSAL`, `SEG_APTOS_RESIDENCIAL_MENSAL`, `SEG_APTOS_CELULAR_MENSAL` | Entradas autorizadas nas jornadas mensais. |
| `SEG_APTOS_MULHER_TRIGGER`, `SEG_APTOS_RESIDENCIAL_TRIGGER`, `SEG_APTOS_CELULAR_TRIGGER` | Entradas autorizadas após compra e aplicação das exclusões. |
| Histórico de participações — nome a definir | Ciclos mensais e triggers, identificados por CPF, produto, tipo de régua e ciclo. |
| Registro de decisões de trigger — local a definir | Identifica o evento e se foi liberado, descartado ou teve entrada confirmada. Pode ficar no lake; se ele não guardar essas decisões, usar a DE proposta `SEGUROS_TRIGGER_CONTROLE`. |

Mensal e trigger podem coexistir. Por isso, o controle mensal não será usado como campo único de participação nas duas frentes. O registro de trigger guarda a decisão, não uma cópia de todas as compras: uma compra descartada por mensal ativa não pode reaparecer quando essa mensal terminar.

`CLIENTES ATIVOS`, `MAPA_SEGUROS`, `MAPA_MCC` e formulários são fontes. `LP_Seguros` e `LP_SEGUROS_GERAL` aparecem nas evidências atuais; falta confirmar sua relação e a fonte oficial de solicitações. A MAPA_MCC é por conta, exigindo cuidado para não duplicar o cliente por conta/cartão.

## Como a automation executa o desenho

[![Execução no SFMC: fontes, validação, elegibilidade, controle, seis públicos e retorno dos marcadores.](https://growthafinz.github.io/GaaS-Framework-Afinz/wiki-diagrams/seguros-sfmc-v2.svg)](https://growthafinz.github.io/GaaS-Framework-Afinz/wiki-diagrams/seguros-sfmc-v2.svg)

*Clique para ampliar o mapa de execução.*

A `processos_seguros` é a frente de troca de dados com Athena/S3: prepara e exporta formulários e importa a MAPA de volta. A integração proposta acrescenta estas etapas, em sequência. Os rótulos abaixo descrevem funções, não Query Activities já criadas.

| Etapa | O que acontece |
|---|---|
| Validar fontes | Conferir volume e atualidade antes de alterar públicos. Arquivo incompleto não pode produzir falsas mudanças de posse. |
| Atualizar elegibilidade | Cadastro + posse + solicitações + sinais de compra alimentam `SEGUROS_ELEGIBILIDADE_CPF`. |
| Conciliar participações | Marcadores, solicitações, posse e prazo sem avanço atualizam controle e histórico. |
| Selecionar mensal | Próximo produto elegível e data de liberação alimentam as três DEs mensais. |
| Selecionar triggers | Compra, D+1, elegibilidade e exclusão pela mensal alimentam as três DEs de trigger ou registram descarte. |
| Executar jornadas | Pablo configura os marcadores de entrada, semana e encerramento nas DEs correspondentes. |

A seleção de trigger precisa considerar também as entradas mensais autorizadas na mesma execução, evitando liberar as duas por concorrência. Chaves, ações de gravação e reentrada serão definidas junto da configuração das jornadas.

O fluxo detalhado de arquivos e SQL permanece em [[Automacao-Processos-Seguros]]. As automações antigas de carrinho fazem recuperação por clique; sua convivência com o novo desenho precisa ser alinhada antes de reaproveitar ou desativar atividades.

## O que acontece depois do formulário

**Oferta → formulário válido → solicitação em processamento → confirmação de posse.**

O formulário suspende novas ofertas daquele seguro nas duas frentes. A MAPA confirma posse quando o produto estiver corretamente representado. Ausência na MAPA durante o processamento não libera nova oferta automaticamente. Recusa ou não efetivação precisam de retorno e regra próprios.

Os resultados ficam em [[10-Resultados/Mecanicas/Seguros|Seguros]] e no BI. Aqui mantemos as regras, sem repetir tabelas de performance.

## Pendências para implantação

| Pendência | Definição necessária |
|---|---|
| MAPA_SEGUROS | Campo de cada produto, significado de posse vigente e atraso de atualização. Mulher estava com flag zerada no diagnóstico; Celular não tinha coluna; flags residenciais precisam ser reconciliadas. Ver [[DE-MAPA_SEGUROS]]. |
| D+1 e identidade do evento | Atualização compatível com D+1 e identificação de compra já processada. A MAPA_MCC agregada não possui ID de transação; última data não distingue várias compras no mesmo dia. Ver [[DE-MAPA_MCC]]. |
| DEs e jornadas | Criar estruturas; definir BU, chaves, reentrada, marcadores e interrupção do ciclo anterior com Pablo. |
| Decisões ainda abertas | Ordem dos produtos, eventual controle de 10%, intervalo entre triggers, duração/cadência e tratamento de não efetivação. Recomendações anteriores não se tornam regras por omissão. |

## Referências técnicas

[[Automacao-Processos-Seguros]] · [[DE-MAPA_SEGUROS]] · [[DE-MAPA_MCC]] · [[MCC]] · [[Segmentacao-Seguros-Celular]] · [[MOC-SFMC-DEs-e-Automations]]
