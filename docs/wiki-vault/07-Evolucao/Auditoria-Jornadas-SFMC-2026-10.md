---
tags: [evidencia, sfmc, jornadas, auditoria, copy, rastreio, parceiros]
tipo: evidência
camada: evolucao
atualizado: 2026-10-07
status: a-validar
fonte: pacotes-package-manager-e-supabase-activities
---

# Auditoria de jornadas SFMC (out/2026)

**Definição e propósito:** o que a leitura dos pacotes do Package Manager (06 e 07/10/2026), cruzada com o vault e com `activities`, mostrou sobre as jornadas de aquisição. Serve de ponto de partida para correções e para a lista de lógicas a confirmar.

> **Regra de leitura (Pablo, 07/10/2026):** muitas inconsistências aqui são **lógicas do CRM ainda não documentadas**; só parte é erro pontual. Cada item abaixo está num de três baldes: **erro confirmado**, **hipótese a testar** ou **lógica a perguntar**. A lista viva de lógicas fica em `.claude/skills/sfmc-jornadas-pacote/references/logicas-crm.md`.

## Contexto e conceitos

Pacotes lidos: Plurix CRM SEM1 (1 jornada), B2C NGD v1 (5) e v2 (30 jornadas: NGD, ANC, topo Tudão, Clube Bem Barato, carrinho B2C e Bem Barato) e carrinho 21D/sábado (14 jornadas, mai a set/26). Resultados de `activities` consultados em 06/10/2026, com setembro ainda imaturo.

## Padrões de jornada observados

| Padrão | Onde | Estrutura |
|---|---|---|
| E-mail dinâmico com estado | Plurix CRM | entrada `COMUNICACAO_PLX` (TIPO=CRM) com exclusões Contact Builder → decisão `LIMITE_CRD` → split 4×25% com esperas 0 a 3 dias → Update Contact `SEQUENCIA` em `ESTADO_SEQUENCIA_CRM` → e-mail V12 |
| Disparo WhatsApp com opt-out | NGD e ANC | entrada `DE_JORNADA_UNIFICADA_*` + 5 exclusões → decisão `MES_REF` + `CAMPANHA` → (split 50/50 + 1 dia) → template Meta → espera resposta 2 dias → "Não tenho interesse agora" grava `sem_interesse.resposta` ("ngd DDMM b2c"), que vira exclusão. Meta: app etapa 2 a 6. Saída: negado orgânico ou cliente ativo |
| SMS simples | NGD e ANC | mesma entrada e decisão, SMS do 29776 |
| Régua semanal de e-mail | topo Tudão e Clube Bem Barato | 4 e-mails + SMS para quem clicou, Update Contact de semana e bounce |
| Carrinho | B2C (institucional e eCred/Serasa) e Bem Barato | diário recorrente, 21D e sábado, ramos por `rede` |

## Resultados por parceiro (activities, ago e set/26)

| Parceiro | Achado |
|---|---|
| **Proprietária** | Repescagem: disp1 de set fez 435 cartões, CAC R$ 8,96, 4,3% de conversão; disparos seguintes rendem bem menos (ago Vibe WPP CAC R$ 49,90, SMS R$ 27,10). Upgrade: ago 7 cartões por R$ 3.036; set disp1 16 cartões, CAC R$ 97. Topo Tudão: ~1,2 milhão de e-mails para ~58 cartões, base `Tudao_B2C_202603` de março |
| **Serasa (carrinho eCred)** | maior ativo (880 a 940 cartões/mês); propostas passam da base (lead externo); D0 eCred com link genérico sem `af_sub` |
| **Bem Barato** | Repescagem ago: SMS 45 cartões CAC R$ 4,76 x WhatsApp 31 CAC R$ 17,40. Upgrade ago: 4 cartões (SMS). Carrinho: ~15 pessoas/dia e 0 cartões em set. Clube SEM2: 29 cartões, CAC R$ 6,40. Jornadas NGD/ANC de set ausentes de `activities` |

Hipótese a testar: concentrar a repescagem no D0 a D3 depois do `MES_REF` e reduzir os toques finais (e o Upgrade). Não validado.

## Achados por balde

**Erro confirmado**
- Repescagem B2C disparo6 (30/09, `b2c_repescagem`): `%%FirstName%%` e `%%State%%` no lugar de nome e limite.

**Hipótese a testar (Test Send ou log)**
- Upgrade B2C disparo3 (17/09): `${2}`=`LIMITE_CRD`, `${3}`=`ULTIMO_LIMITE` em "de R$ {2} para R$ {3}"; a versão Bem Barato usa a ordem inversa.
- `%%FirstName%%` em jornadas cuja DE tem `PRIMEIRO_NOME`/`FIRST_NAME` (carrinho B2C, 21D, Bem Barato, NGD/ANC BB).
- Linhas de `activities` a partir de 11/09/2026 com prefixo `JOR_AQS_` sem safra e sem resultado; Bem Barato set/26 ausente.
- Atividade `afz_car_vis_aqs_wpp_anc_dispvibe4_pontual` é SMS com `wpp` no nome (custo e canal errados no GaaS).

**Lógica a perguntar**
- Upgrade "menor" com link de repescagem (`af_sub1=negados`): copy reaproveitada é desenho ([[Upgrade]]); a atribuição a Negados é intencional?
- Jornadas com o mesmo nome diferenciadas por espaço no fim; `JOR_AQS_` x `JOR_AQUISICAO_`; jornadas B2C na pasta "Aquisição VC Alvorada".
- Clube SEM3 entra por `CLUBE_BEM_BARATO_SET26` e grava semana em `CLUBE_BEM_BARATO_FEV26_v3`.
- Carrinho 21D set/26: atividades "serasa" usando o template institucional (`carrinho_b2c_sabado_sorteio`).
- `af_sub3` repetido entre disparos (disp4 e disp6 = `D5`); links de set/26 sem `af_sub3`.

## Copy x [[Pode-Dizer-Nao-Pode-Dizer]]

| Claim | Onde | Severidade |
|---|---|---|
| "Aproveite antes que essa oferta expire" / "Últimos dias" | NGD disparo3, BB NGD/ANC, ANC maior, SMS D4 carrinho | ALTA |
| Sorteio de R$ 100 mil | NGD disparo3, BB, ANC maior, carrinho sábado/21D | ALTA (regulamento expirado em 11/05/2026) |
| R$ 100 Vibe sem "anuidade ativa" | quase todo meio de funil e carrinho | ALTA |
| "Cartão virtual para usar na hora" no B2C | carrinho, ANC menor, NGD disp4/6 | ALTA |
| SMS sem "sujeito à análise de crédito" | SMS de NGD, ANC, carrinho | ALTA |
| "Limite de até R$ 6.000" | SMS ANC, carrinho sábado | ALTA (só com teto aprovado) |
| "Sua proposta foi reavaliada" | NGD disp1, SMS ANC menor BB | MÉDIA |

Padrão: os SMS de topo escritos depois de 20/08 já seguem as regras; a dívida está nos **templates de WhatsApp antigos aprovados na Meta** (`..._sorteio_mar26`, `..._1_2026`).

## Fontes e evidências

ZIPs do Package Manager (pastas Downloads do Pablo, 06 e 07/10/2026); consultas SQL em `activities` e tabelas de comunicação (06 e 07/10/2026); skill `sfmc-jornadas-pacote`.

## Lacunas e pendências

Respostas às lógicas acima, Test Send dos itens de hipótese e revisão em lote dos templates Meta. Dono: Pablo.

## Relacionado

- [[SFMC-Package-Manager-e-Pacotes]] · [[Comunicacoes-Pacote-SFMC-Catalogo]] · [[Repescagem]] · [[Upgrade]] · [[Carrinho-Abandonado]] · [[Vibe]] · [[Cartao-Bem-Mais-Afinz-Visa]] · [[AppsFlyer-Tracking-CRM]] · [[Formatacao-WhatsApp-Variaveis-e-Espacamento]]
