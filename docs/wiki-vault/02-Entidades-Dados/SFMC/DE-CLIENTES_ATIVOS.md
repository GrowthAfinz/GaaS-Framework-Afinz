---
tags: [entidade, sfmc, data-extension, clientes-ativos, rentabilizacao, base-de-clientes]
tipo: entidade
camada: entidades
aliases: [CLIENTES ATIVOS, CLIENTES_ATIVOS, DE Clientes Ativos, base de clientes ativos]
atualizado: 2026-11-09
status: a-validar
fonte: prints da DE no SFMC (Propriedades e Registros) e consultas Query Studio de 03/11/2026, operador
---

# DE `CLIENTES ATIVOS` (SFMC)

## Aplicação no Pool de Ofertas Visa · consolidação de 09/11

A revisão da Q_VDV_03_CRUZAMENTO usa DISTINCT CPF,NR_CONTA antes de agregar MAPA_MCC, mantém a elegibilidade por linha NORMAL com compra em 30 dias e limite ≥200, e exclusões por CPF no escopo B2C/B2B2C consultado. Nome/canal/contato usam MAX e não resolvem prioridade comercial de múltiplos cartões.

NM_PARCEIRO só é preenchido para um parceiro B2B2C NORMAL único e sem B2C NORMAL. NM_CARTAO fica NULL; ORIGEM não foi homologada como nome do cartão. Bloqueio celular é separado do de e-mail e não comprova consentimento. Conferir frescor, MID e cobertura da fonte antes da primeira execução da revisão. [[DE-VDV_CRUZAMENTO]] contém o SQL atual; não alterar esta DE de origem para acomodar o piloto.



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
### DE `CLIENTES ATIVOS` (SFMC)

**Definição e propósito:** Data Extension do Marketing Cloud com a **carteira de cartões ativos** da Afinz, um registro por cartão/produto do cliente, atualizada todo dia. É a fonte de contato (e-mail, celular, bloqueios), estado de crédito (status, limite) e comportamento (primeira/última compra, último acesso) para qualquer comunicação com **quem já tem o cartão**: rentabilização, ativação, upgrade, tombamento.

> Status: estrutura e distribuição = `confirmado` (03/11/2026); significado dos códigos de uma letra (`STATUS_CARTAO`, `STATUS_CONTA`) e de alguns flags = `a-validar`.

### Grão, chave e localização

- **Pasta no MC:** Extensões de Dados › `Cartonistas` › `CLIENTES ATIVOS` (o nome da pasta não indica o conteúdo: em 03/11/2026 só havia B2C e B2B2C).
- **Chave primária composta:** `DESCRICAO_PRODUTO` + `BANDEIRA` + `STATUS_CARTAO` + `CPF`.
- **Grão:** um registro por CPF × produto × bandeira × status do cartão. **O CPF se repete** — a própria descrição da DE avisa ("A base pode conter o mesmo cliente mais de uma vez pois contas difer…"). Observado em 03/11/2026: CPFs com 2 e 3 linhas entre os `STATUS = 'NORMAL'`.
- **Subscriber Key:** `CPF` (o mesmo ID do All Subscribers).
- **Atualização:** diária. `DT_CARGA` = 03/11/2026 05:16 na leitura. "Última atualização: Nunca" na tela só significa que não houve import manual.
- **Volume:** 517.025 registros (📊 03/11/2026).

### Campos

| Campo | Tipo (MC) | Tam. | PK | Nulo | Padrão | Uso / valores observados |
|---|---|---:|:-:|:-:|---|---|
| `DESCRICAO_PRODUTO` | Text | 100 | ✓ | Não | | variante: `PLATINUM`, `CLASSIC` |
| `BANDEIRA` | Text | 100 | ✓ | Não | | `VISA` |
| `STATUS_CARTAO` | Text | 50 | ✓ | Não | | código de 1 letra: `0`, `F`, `S`, `E`, `R`, `C`, `B`, `H`, `G` — *a-validar* |
| `CPF` | Text | 50 | ✓ | Não | | 11 dígitos com zero à esquerda; Subscriber Key |
| `PRI_NOME` | Text | 50 | | Sim | | primeiro nome para personalização |
| `EMAIL` | EmailAddress | 254 | | Sim | | pode vir vazio |
| `NR_CELULAR` | Phone | 50 | | Sim | | com DDI 55 + DDD |
| `UF` | Text | 50 | | Sim | | sigla |
| `LIMITE_CREDITO` | Text | 50 | | Sim | | limite total **como texto** — não usar em comparação numérica |
| `LOCALE` | Locale | 5 | | Sim | | `br` |
| `DATA_ABERTURA_CONTA` | Date | | | Sim | | abertura da conta |
| `TIPO_CARTAO` | Text | 50 | | Sim | | vazio nas amostras |
| `PARCEIRO_ORIGEM` | Text | 50 | | Sim | | código do ponto de venda (ex.: formato `Q67901`, `Z-TW17`) |
| `DT_CARGA` | Date | | | Sim | data atual | data/hora da carga |
| `STATUS` | Text | 250 | | Sim | | **campo legível de situação**: `NORMAL`, `BLOQUEADO ATRASO`, `CANCELAMENTO INVOLUNTARIO` |
| `LOJA` | Text | 150 | | Sim | | loja de origem (razão comercial + unidade) |
| `PRODUTO` | Text | 150 | | Sim | | produto comercial: `PLATINUM`, `INSTITUCIONAL`, nome do parceiro B2B2C, `OUTROS` |
| `QTD_TITULAR` | Number | | | Sim | 1 | cartões titulares |
| `QTD_ADICIONAL` | Number | | | Sim | 0 | cartões adicionais |
| `QTD_VIRTUAL` | Number | | | Sim | 0 | cartões virtuais |
| `FL_WHITELABEL` | Text | 500 | | Sim | `N` | cartão de marca própria do parceiro |
| `DATA_NASCIMENTO` | Date | | | Sim | | |
| `flg_upsell` | Text | 50 | | Sim | | `0`/`1` — elegível a upgrade? *a-validar* |
| `STATUS_CONTA` | Text | 100 | | Sim | | código de 1 letra: `0`, `W`, `A`, `J`, `Z`, `Y` — *a-validar* |
| `COD_PRODUTO` | Text | 50 | | Sim | | vazio nas amostras |
| `ORIGEM` | Text | 250 | | Sim | | emissor/parceiro de origem (ex.: `EMISSOR LEGADO NAO IDENTIFICADO`, nome do parceiro + VISA) |
| `flg_desbloqueio` | Text | 50 | | Sim | | `0` nas amostras — *a-validar* |
| `LIMITE_DISPONIVEL` | Decimal | | | Sim | | **limite livre na data da carga**; pode ser **negativo** |
| `DATA_PRIMEIRA_COMPRA` | Date | | | Sim | | vazio = nunca comprou |
| `DATA_ULTIMA_COMPRA` | Date | | | Sim | | base do filtro "ativo 30 dias" |
| `STATUS_ENTREGA` | Text | 50 | | Sim | | `Entregue`, `Comprovante registrado`, vazio |
| `FL_TOMBAMENTO` | Text | 50 | | Sim | `0` | marca de migração/tombamento |
| `bloqueio_email` | Boolean | | | Sim | False | **True = não enviar e-mail** |
| `bloqueio_celular` | Boolean | | | Sim | false | **True = não enviar SMS/WhatsApp** |
| `RAMO` | Text | 20 | | Sim | | `PLATINUM`, `RAMO DURO`, `ODONTO`, `OUTROS` |
| `CANAL` | Text | 50 | | Sim | | **BU**: `B2C`, `B2B2C` (Plurix ausente em 03/11/2026) |
| `FRANQUIA` | Text | 20 | | Sim | | `AFINZ` |
| `ID_ORGANIZACAO` | Text | 10 | | Sim | | id numérico do parceiro; `-99999` = sem organização |
| `NR_CONTA` | Text | 20 | | Sim | | 19 dígitos; **chave de join com [[DE-MAPA_MCC]]** |
| `GENERO` | Text | 1 | | Sim | | `F`, `M`, `O` |
| `ULTIMO_ACESSO` | Date | | | Sim | | último acesso ao app |

### Distribuição

> 📊 Snapshot 2026-11-03 — Query Studio, `GROUP BY CANAL, STATUS`.

| CANAL | NORMAL | BLOQUEADO ATRASO | CANCELAMENTO INVOLUNTARIO | Total |
|---|---:|---:|---:|---:|
| B2B2C | 308.389 | 59.677 | 484 | 368.550 |
| B2C | 126.186 | 21.798 | 491 | 148.475 |
| **Total** | **434.575** | **81.475** | **975** | **517.025** |

`STATUS` × `STATUS_CARTAO` × `STATUS_CONTA` gera 184 combinações: os códigos de uma letra detalham o `STATUS`, mas o filtro operacional usa só `STATUS`.

### Regras de uso

1. **Situação da conta:** filtrar por `STATUS = 'NORMAL'`. Cobre "sem bloqueio e sem atraso" de uma vez.
2. **Uma linha por cliente antes de enviar:** agrupar por `CPF`. Nome e e-mail por `MAX()`; limite = maior `LIMITE_DISPONIVEL` entre os cartões NORMAL.
3. **Bloqueio é por canal e por CPF:** se **qualquer** linha do CPF tiver `bloqueio_email = True`, o CPF sai do e-mail; idem `bloqueio_celular` para SMS/WhatsApp. Um não exclui do outro.
4. **Atraso em qualquer conta** exclui o CPF da oferta, mesmo com outro cartão NORMAL (decisão do Vai de Visa, 03/11/2026).
5. **Join com outras bases por `NR_CONTA`**, não por CPF: mais preciso e evita divergência de formatação do CPF entre fontes. Ao somar valores de outra tabela, usar `SELECT DISTINCT CPF, NR_CONTA` para não multiplicar pelo número de cartões da conta.
6. **Limite:** usar `LIMITE_DISPONIVEL` (decimal). `LIMITE_CREDITO` é texto.
7. **Booleans em SQL:** `bloqueio_email = 1` / `= 0`; para agregar, `MAX(CASE WHEN bloqueio_email = 1 THEN 1 ELSE 0 END)` (bit não aceita `MAX` direto).

Padrão de query por CPF em [[SFMC-Query-Studio-e-SQL]]; aplicação completa em [[DE-VDV_APTOS]].

### Campos que conectam a outras frentes

| Campo | Frente | Possível uso |
|---|---|---|
| `FL_TOMBAMENTO` | [[Publico-Cartonistas]] | identificar quem veio de migração/tombamento (segmento `Tombamento` do Super Nosso) |
| `flg_upsell` | [[Upgrade]] | público de upgrade de limite/produto |
| `flg_desbloqueio`, `STATUS_ENTREGA`, `DATA_PRIMEIRA_COMPRA` | [[Ativacao-e-Boas-Vindas]] | cartão entregue sem desbloqueio; desbloqueado sem primeira compra |
| `DATA_ULTIMA_COMPRA` | [[Incentivo-ao-Uso]], [[Reativacao-e-Datas]] | ativo × parado × reativação |
| `ULTIMO_ACESSO` | app / engajamento | quem usa o app × quem só usa o cartão |
| `DATA_ABERTURA_CONTA` | clusters | cliente novo × maduro (eixo adiado no Vai de Visa) |
| `LIMITE_DISPONIVEL` | [[Credito-e-Investimento]] | limite tomado: lembrete de fatura, aumento de limite |
| `FL_WHITELABEL`, `PRODUTO`, `ORIGEM` | [[Emails-Dinamicos-SFMC]] | escolher identidade visual B2B2C (pendência de template por marca) |
| `PARCEIRO_ORIGEM`, `LOJA`, `ID_ORGANIZACAO` | [[Dimensao-Canonica-de-Parceiro]] | resultado por parceiro/loja |
| `GENERO`, `DATA_NASCIMENTO`, `UF` | personalização | datas comemorativas, região — usar com cuidado (LGPD) |

### Exemplo e validação

Funil da base elegível do Vai de Visa, por linha: 434.575 NORMAL → 212.820 ativos 30 dias → 134.030 limite ≥ R$ 200 → 130.228 com e-mail → 129.955 com conta na MAPA. Por CPF, com regras por CPF: **130.175**. Detalhe em [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]].

### Lacunas e pendências

- Significado de `STATUS_CARTAO`/`STATUS_CONTA` → impede regra fina por código → dicionário do emissor/processadora → IN.
- Sem campo de dias em atraso → atraso só como status binário → confirmar se `BLOQUEADO ATRASO` cobre todo atraso → IN.
- Plurix ausente → fase 2 do Vai de Visa depende de outra fonte ou da inclusão nesta DE → IN.
- Responsável e automação de carga diária não documentados → impede diagnosticar falha de atualização → mapear em [[MOC-SFMC-DEs-e-Automations]] → a confirmar.

### Relacionado

[[MOC-SFMC-DEs-e-Automations]] · [[DE-MAPA_MCC]] · [[DE-VDV_APTOS]] · [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]] · [[SFMC-Query-Studio-e-SQL]] · [[SFMC-Salesforce-Marketing-Cloud]]
:::

