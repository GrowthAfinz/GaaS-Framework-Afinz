---
tags: [operacao, sfmc, package-manager, jornadas]
tipo: operacao
camada: operacao
atualizado: 2026-10-07
status: confirmado
fonte: documentacao-salesforce-e-pacotes-reais
---

# SFMC Package Manager e pacotes de jornada

**Definição e propósito:** o Package Manager é o app nativo do Marketing Cloud que empacota jornadas, automações, DEs e conteúdo com as dependências e implanta em outra BU. Para o GaaS, o valor está no **ZIP exportado**: é uma foto legível e completa de cada jornada (passos, filtros, esperas, mensagens, links), sem precisar de API.

## Contexto e conceitos

- Menu: **Plataforma → Package Manager** (na UI em português: abas Pacote, Implantação, Soluções da indústria). Pablo tem acesso na BU Plurix (06/10/2026).
- **Pacote** = definição (o que foi selecionado) + dependências puxadas automaticamente.
- **Deploy (Implantação)** = subir o ZIP numa BU e recriar os itens.
- Suporta: jornadas completas (entrada por DE, esperas, splits, e-mail, SMS, push, WhatsApp, Update Contact, STO, eventos de API e data), automações, DEs (só estrutura), Content Builder, CloudPages.

## Funcionamento e operação

**Criar pacote:** Pacote → Criar → Nova definição ou Da existente → escolher itens → Save & Continue → (opcional) desmarcar *Preserve Folder Structure* → Package Items → revisar → Next → Download Package. **Upload exige ZIP**; o JSON serve para hospedar e linkar de outro pacote.

**Implantar:** Implantação → Deploy → subir ZIP → pasta, prefixo/sufixo e timestamp opcionais → campos personalizáveis → Next → ação por item → Deploy → Deploy Summary (Success, Warning, Information, Task, Error).

**Campos personalizáveis:** placeholders `{{mcpm:nomeDoCampo}}` em atividades do Journey Builder, Content Builder, CloudPages e envio de e-mail de automação. O deploy pede o valor e substitui. Não funciona em nome de jornada nem de e-mail; e-mail e SMS da jornada têm campos fixos.

## Regras, condições e limites

- **1º deploy só permite criar ou pular** cada item. Manter, atualizar ou renomear existente só aparece ao atualizar um pacote já implantado.
- DE não compartilhada vira **cópia vazia**; DE compartilhada com mesmo nome é referenciada.
- AMPscript é empacotado, mas só referência **por ID** vira dependência. `LookupRows` com nome de DE em texto não entra; `ContentBlockByName` entra.
- Filtro que usa grupos do Contact Builder puxa o **grupo inteiro** (pacotes de 1 jornada vieram com 23 a 37 DEs).
- `WAITUNTILCHATRESPONSE` (espera por resposta no WhatsApp) é **não suportado** (aviso no pacote).
- Limites: item até 5 MB, pacote até 50 MB. Esperas não levam data específica.
- **Não serve como gerador de jornada na mesma BU:** cria cópias das DEs com sufixo, mas o e-mail dinâmico lê DE pelo nome escrito no código, então a jornada clonada grava num lugar e lê de outro. Serve para backup, mover entre BUs e **ler a estrutura**.

## Exemplo e validação

Pacotes analisados em 06 e 07/10/2026:
- `pacote teste - plurix-v1.zip`: 1 jornada (Plurix CRM SEM1, e-mail dinâmico V12).
- `teste - b2c ngd-v1.zip` e `-v2.zip`: 5 e depois 30 jornadas (NGD, ANC, topo, Clube Bem Barato, carrinho B2C e Bem Barato).
- `Minha definição ... 4_09_14 PM-v1.zip`: 14 jornadas de carrinho 21D e sábado (mai a set/26).

Leitura e achados em [[Auditoria-Jornadas-SFMC-2026-10]].

## Fontes e evidências

- Salesforce Help: *Package Manager in Marketing Cloud Engagement*, *Package Items*, *Customize Branding in Packaged Items*, *Deploy Packaged Items*, *Update Packaged Items*, *Supported Objects*, *Supported Actions*, *Notifications* (lidas em 06/10/2026).
- Estrutura interna do ZIP: `.claude/skills/sfmc-jornadas-pacote/references/anatomia-pacote.md`.

## Lacunas e pendências

- Rodar o teste de deploy numa pasta de teste para ver se placeholders funcionam no **filtro de entrada**. Dono: Pablo.
- Status de uma jornada após deploy (rascunho) não está explícito na documentação.

## Relacionado

- [[SFMC-Salesforce-Marketing-Cloud]] · [[SFMC-Integracao-API-Roadmap]] · [[Comunicacoes-Pacote-SFMC-Catalogo]] · [[Auditoria-Jornadas-SFMC-2026-10]]
- Skill do repositório: `sfmc-jornadas-pacote` (extrai mensagens, liga a `activities`, raio-x de jornada).
