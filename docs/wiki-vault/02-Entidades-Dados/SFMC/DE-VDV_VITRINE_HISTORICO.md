---
tags: [entidade, sfmc, data-extension, vai-de-visa, vitrine, historico, rotacao, medicao]
tipo: entidade
camada: entidades
aliases: [VDV_VITRINE_HISTORICO, histórico da vitrine, memória da rotação]
atualizado: 2026-11-09
status: a-validar
fonte: desenho de 05/11/2026 ([[Rotacao-de-Ofertas-Vai-de-Visa]]); DE ainda não criada no SFMC
---

# Histórico de seleção do Pool · integrado à DE POOL

A seleção atual e as rodadas anteriores ficam juntas em VDV_POOL_OFERTAS_GRUPO_POSICAO, com PK VERSAO+GRUPO+CELULA+POSICAO e carga Update pela Q_VDV_08_POOL. Não criar VDV_VITRINE_HISTORICO nem VDV_POOL_HISTORICO_ROTACAO para esta revisão.

DT_RODADA identifica a data da seleção; VERSAO identifica a rodada e VERSAO_TEMA resolve o tema. A rotação olha seleções principais (posições 1–3, ativas, mesmo tema) até ontem. Reservas escolhidas na renderização não viram automaticamente seleção principal no histórico. OFERTA_ID não congela textos, fotos e condições; a tabela não prova recebimento ou conteúdo exato enviado.

Uma VERSAO com qualquer registro impede nova seleção da Q08 naquele dia. Parcial precisa de diagnóstico e correção controlada. Para exposição real, conciliar JobID, rodada/toque, template e eventos de envio. Contrato: [[DE-MOVIMENTO_OFERTAS_VISA|POOL unificado]].



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
### DE `VDV_VITRINE_HISTORICO` (SFMC)

**Definição e propósito:** a **memória da rotação** do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Vai de Visa]]. Cada disparo grava aqui a vitrine que cada grupo recebeu, com o motivo de cada oferta. A regra de rotação lê esta DE para saber há quanto tempo uma oferta não aparece no grupo; a medição lê para saber que marcas cada cliente viu.

> Status: `a-validar` — a criar no SFMC, pasta `POOL DE OFERTAS VISA`. Não sendable.

### Grão, chave e campos

PK `DT_DISPARO + VERSAO + GRUPO + CELULA + POSICAO`.

| Campo | Tipo | Uso |
|---|---|---|
| `DT_DISPARO` | Date, PK | dia do disparo (Brasília) |
| `VERSAO` | Text 20, PK | versão de conteúdo (tema), ex. `BF26_V1` |
| `GRUPO` | Text 30, PK | grupo da vitrine (`MODA`, `GENERICO`…) |
| `CELULA` | Text 10, PK | `TODAS` ou célula de teste |
| `POSICAO` | Number, PK | 1 a 6 |
| `OFERTA_ID` | Text 60 | `ID` da oferta no acervo |
| `MOTIVO` | Text 20 | `GRUPO` · `GRUPO_2` · `DESCOBERTA` · `COMPLETAR` |
| `FL_EXIBIDA` | Number | 1 se a posição é mostrada pelo template (hoje, 1 a 3); 0 se é reserva |
| `DT_REGISTRO` | Date | data e hora da gravação |

Ação da query (`Q_VDV_09_HISTORICO`): **Atualizar** (acumula; rodar duas vezes no mesmo dia regrava as mesmas chaves).

### Usos

- **Rotação:** "dias sem aparecer" = hoje − último `DT_DISPARO` com `FL_EXIBIDA = 1` para o par grupo × oferta (lido só até ontem).
- **Medição:** cliente → grupo e célula (em [[DE-VDV_ENVIO]]) → vitrine do dia (aqui) → compra por marca (IN). Cerca de 24 linhas por disparo (4 grupos × 6 posições).
- **Auditoria:** por que uma oferta apareceu para um grupo (`MOTIVO`).

### Relacionado

[[Rotacao-de-Ofertas-Vai-de-Visa]] · [[DE-MOVIMENTO_OFERTAS_VISA]] · [[Automacao-VDV-Pool-de-Ofertas]] · [[DE-VDV_ENVIO]]
:::

