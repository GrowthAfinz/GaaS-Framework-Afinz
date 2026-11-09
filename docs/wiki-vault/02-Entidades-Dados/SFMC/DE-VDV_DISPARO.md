---
tags: [entidade, sfmc, data-extension, vai-de-visa, sendable, disparo]
tipo: entidade
camada: entidades
aliases: [VDV_DISPARO, público do disparo Vai de Visa]
atualizado: 2026-11-09
status: a-validar
fonte: desenho de 05/11/2026; DE ainda não criada no SFMC
---

# Audiência do Pool · APTOS substitui a proposta VDV_DISPARO

A audiência corrente é VDV_APTOS, enviável por CPF→SubscriberKey, gerada no quinto passo da PREPARAÇÃO. Esta nota preserva a identidade e o antecedente VDV_DISPARO, mas não orienta criar uma DE adicional. Também não criar VDV_AUDIENCIA_DISPARO.

SAFRA preserva participação e controle; APTOS cruza SAFRA com CRUZAMENTO atual, filtra células tratadas, _Subscribers, tema e pelo menos três marcas válidas na rodada. Contato atual vem de CRUZAMENTO, alocação/token de SAFRA. Saídas por inaptidão não apagam a participação; retorno não re-sorteia. Não excluir quem recebeu a rodada passada.

Não é criada atividade de envio nesta fase. Antes de eventual envio manual, conferir APTOS, supressões, intervalo desde a preparação, template novo e Test Send. DT_ATUALIZACAO não é DT_DISPARO. Proteção de repetição e JobID↔rodada permanecem pendentes.

Contrato completo: [[DE-VDV_APTOS]]. Preparação: [[Automacao-VDV-Pool-de-Ofertas]]. Participação: [[DE-VDV_ENVIO|VDV_SAFRA]].



### Delta multicanal · aplicação manual no SFMC pendente

As seis SQLs integrais nesta nota são referência da montagem orientada a e-mail. CRUZAMENTO filtra e-mail/bloqueio_email globalmente; APTOS consulta _Subscribers e não transporta ULTIMO_ACESSO. Elas não implementam a política multicanal aprovada.

Manter uma PREPARAÇÃO MAPA → CRUZAMENTO → SAFRA → POOL → APTOS → FUNIL e as mesmas entidades. APTOS continua única, com uma linha por CPF por rodada e seleção de canal identificável; sem DE extra de audiência ou histórico de rotação.

| Destino | Delta proposto | Efeito / conferência |
|---|---|---|
| CRUZAMENTO | + FL_BLOQ_EMAIL Number, ULTIMO_ACESSO Date, DT_REF_ELEGIBILIDADE Date; EMAIL passa a aceitar NULL | Aptidão comum sem veto global de e-mail. Transportar bloqueios separados e uso real do app. 32 → 35 campos de referência. |
| SAFRA | EMAIL deve aceitar NULL; preserva 18 campos e PK CPF+ID_SAFRA | Incluir participantes móveis sem e-mail e controles; manter grupo/célula/token. Canal não é re-sorteio experimental. |
| APTOS | + CANAL_ENVIO Text(20), ID_RODADA Text(60), ID_POLITICA_CANAL Text(60), ULTIMO_ACESSO Date, FL_BLOQ_EMAIL Number, FL_APTO_EMAIL/FL_APTO_WHATSAPP/FL_APTO_SMS Number, DT_REF_ELEGIBILIDADE Date; EMAIL anulável | 20 → 29 campos de referência. Uma escolha por CPF/rodada, supressão por canal, app 60 dias só nos móveis. Campos de política/rodada obrigatórios no contrato novo. |
| POOL / BRIEFING | Mantêm nove / 41 campos | Reutilizar seleção e conteúdo na LP; não criar entidades de hero/tema. |
| FUNIL | Mantém 11 campos; novas linhas de diagnóstico | Canal, sobreposição, controle excluído, data futura, app inválido, total por rodada e teto; proporções por célula continuam na SAFRA. |

Tipos/tamanhos são proposta de contrato a conferir antes de editar/recriar DE. Não sobrescrever dados existentes para trocar PK/nulidade. Conferir export/backup, impacto nos consumidores e teste em cópia. A SQL de referência e-mail fica preservada; o arquivo Q_VDV_03_CRUZAMENTO_MULTICANAL_PROPOSTA.sql prepara a aptidão comum, mas depende dos campos novos e não é a seleção final de canal.

Para a APTOS multicanal, faltam pesos/cotas/pressão aprovados e a ligação das supressões de WhatsApp/SMS à fonte real. O contrato executável de simulação está em poolChannels.ts: só aceita política explícita, exclui controles, separa bloqueios, aplica a janela de app e os tetos e atribui no máximo um canal. O sorteio da simulação não é declarado equivalente ao CHECKSUM do SFMC. Não substituir a query real por uma escolha arbitrária de pesos.

## 3. Canais e política de seleção

E-mail, WhatsApp e SMS são canais principais da estratégia. O piloto separa parcelas sem sobreposição: cada CPF recebe no máximo um canal do Pool na mesma rodada. SEG-C e GEN-C ficam sem comunicação nos três canais. A alocação de grupo/célula permanece congelada na SAFRA; GEN-A usa a vitrine genérica, mas não representa comparação causal direta com SEG-B de outra população.

| Canal | Aptidão própria | Destino | Teto por rodada de envio |
|---|---|---|---|
| E-mail | Endereço disponível, sem bloqueio de e-mail, supressões/publication list e status de assinante conferidos | Links de oferta; CTAs finais a conferir | Orçamento e capacidade a definir |
| WhatsApp | Contato móvel, bloqueios/supressões próprios liberados e uso do app nos últimos 60 dias | LP personalizada da rodada | Até 5.000 mensagens |
| SMS | Contato móvel, bloqueios/supressões próprios liberados e uso do app nos últimos 60 dias | LP personalizada da rodada | Até 100.000 SMS |

Os tetos valem por rodada, sujeitos à elegibilidade e ao orçamento. Não são metas nem limites semanais. No SMS, destinatários, tentativas, reenvios e unidades faturadas/segmentos podem divergir: registrar cada unidade separadamente.

ULTIMO_ACESSO da CLIENTES ATIVOS é a referência de uso do app para os dois canais móveis. Normalizar a data para America/Sao_Paulo e comparar de hoje menos 60 dias até hoje, inclusive. Data inválida, ausente ou futura impede apenas a seleção móvel. O participante permanece na SAFRA e pode receber e-mail se elegível. DEVICE, modelo de aparelho e data de cadastro/importação não entram nesta regra. Usar o app não comprova uso de WhatsApp.

Permissões de uso/consentimentos dos canais foram confirmadas na definição do piloto. A execução continua respeitando os bloqueios e as supressões próprios: bloqueio de e-mail não é bloqueio de celular, e a consulta _Subscribers não pode excluir toda a audiência móvel.

:::details Sorteio, perfis e parâmetros pendentes
Sortear dentro de perfis relevantes, com grupo/célula, B2C/B2B2C e recência quando a fonte permitir. Aplicar a mesma política e probabilidade a SEG-A e SEG-B. Não priorizar maiores compradores no WhatsApp e interpretar o SMS residual como efeito do canal.

Pesos, cotas por perfil, tamanho da amostra, poder estatístico e pressão por pessoa seguem em aberto. O contrato usa ID_POLITICA_CANAL e ID_RODADA para identificar a regra; sem parâmetros aprovados, a simulação retorna “parâmetros pendentes” e não produz audiência. O módulo de simulação do GaaS não executa seleção no SFMC.

Evitar redistribuir silenciosamente participantes inelegíveis para preencher teto. Guardar a política, elegibilidade e contagens de cada perfil para interpretar diferenças de cobertura. A seleção de um CPF em um canal exclui os outros naquela rodada; rodadas futuras precisam respeitar a política de pressão ainda a definir.
:::

:::details Histórico anterior a 09/11 · não executar como instrução vigente
### DE `VDV_DISPARO` (SFMC)

**Definição e propósito:** o **público de cada disparo** do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Vai de Visa]]. A [[DE-VDV_ENVIO]] é o registro congelado da safra (quem entrou, em que grupo e célula); com 2 disparos por semana, parte dessa base deixa de estar apta (bloqueou e-mail, entrou em atraso, perdeu limite). Esta DE cruza a safra com a aptidão **do dia** e é o que o e-mail usa como envio.

> Status: `a-validar` — a criar. **Sendable** (`CPF` → Chave de assinante), Overwrite a cada disparo.

### Campos (17)

Os mesmos da [[DE-VDV_ENVIO]] (`CPF`, `ID_SAFRA`, `FIRST_NAME`, `EMAIL` EmailAddress, `NR_CELULAR` Phone, `LOCALE` Locale, `FL_BLOQ_CELULAR`, `CANAL`, `NM_PARCEIRO`, `NM_CARTAO`, `VL_LIMITE_DISPONIVEL`, `CD_GRUPO`, `CD_GRUPO_SECUNDARIO`, `DS_CELULA_TESTE`, `ID_VERSAO_OFERTAS`, `ID_ENVIO`) + `DT_DISPARO` Date. PK `CPF`.

### Regras

- **Grupo e célula vêm da `VDV_ENVIO`** (congelados): o cliente não muda de grupo dentro da safra.
- **Nome, e-mail e limite vêm da `VDV_APTOS` do dia** (mais atuais).
- Só células que recebem: `SEG-A`, `SEG-B`, `GEN-A`. O controle (`SEG-C`, `GEN-C`) fica fora do envio e continua na `VDV_ENVIO` para a medição.
- O histórico de quem recebeu cada disparo fica nas Data Views do SFMC (`_Sent`, `_Click`); esta DE é sobrescrita.

### Relacionado

[[DE-VDV_ENVIO]] · [[DE-VDV_APTOS]] · [[Automacao-VDV-Pool-de-Ofertas]] · [[Rotacao-de-Ofertas-Vai-de-Visa]]
:::

