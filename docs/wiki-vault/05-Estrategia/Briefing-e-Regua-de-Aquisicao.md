---
tags: [briefing, regua, aquisicao, estrategia, onboarding]
tipo: estrategia
camada: estrategia
atualizado: 2026-10-02
status: confirmado
fonte: codigo-gaas
---

# Briefing e Régua de Aquisição

**Definição:** contrato de intenção que explica a função de cada comunicação, o contexto que a justifica e a mudança de comportamento esperada antes de escrever a peça.

## Contexto e conceitos

Uma régua organiza vários contatos em torno de um objetivo. O briefing de cada toque precisa ensinar produto e público a quem vai produzir ou revisar a mensagem. O CSV técnico contém os campos que o template consome; ele não substitui o raciocínio do briefing.

Segmento descreve o estado do público; jornada descreve o fluxo; sequência identifica a posição do toque. Um segmento pode participar de jornadas distintas. Uma ordem de oito toques não implica oito dias nem intervalo universal.

## O que preencher por toque

| Bloco | Pergunta que precisa responder |
|---|---|
| Papel | Por que este e-mail existe e qual lacuna do anterior resolve? |
| Público e momento | Quem recebe, qual sinal justifica o contato e quem sai? |
| Objetivo | O que a pessoa deve entender ou fazer? |
| Proposta de valor | Qual benefício principal importa para esse público? |
| Prova | Qual fonte, condição, rede/praça e vigência sustentam o argumento? |
| Mensagem e objeção | Qual ideia fica e qual barreira é removida? |
| CTA | Qual ação e destino, em cada ocorrência? |
| Conteúdo | Assunto, pré-cabeçalho, título, corpo, imagem e legal coerentes |
| Dinâmica | Quais campos variam, de onde vêm e qual fallback aprovado? |
| Operação | Gatilho, cadência, supressões, chave e assinatura |
| Teste | Hipótese, métrica, janela e comparação |
| Rastreabilidade | Versão planejada, peça executada e motivo das diferenças |

Ausência de informação deve aparecer como pendência; não completar contexto comercial por analogia entre produtos.

## Exemplo de progressão +amigo

**Arquitetura recomendada, não comprovação de uma régua atualmente enviada:** diferenciar Clube e cartão → provar economia aplicável à rede → explicar custos e condições → ampliar utilidade Visa/app → apresentar saúde quando validada → reduzir fricção → responder objeções → recapitular sem falsa urgência.

Na audiência de topo definida em 02/10/2026, o destinatário já é membro do Clube. A mensagem deve explicar o valor incremental do cartão. Essa restrição da régua não torna adesão ao Clube requisito universal para solicitar o produto. A supressão por proposta iniciada, aprovação ou recusa precisa ser definida e conferida na jornada real; a arquitetura de planejamento não prova implementação.

## Como revisar planejado e executado

1. Identificar régua, toque, assinatura e versão.
2. Conferir se o argumento central aparece na headline, corpo e imagem.
3. Validar a condição comercial tanto na arte quanto no texto e no legal.
4. Verificar se todos os CTAs seguem a ação pretendida e têm destino/tracking governados.
5. Registrar diferenças deliberadas e lacunas; não afirmar aderência com base só no assunto.
6. Conferir se o toque repete o anterior ou prepara o próximo com intenção.

## Medição

Proposta iniciada/concluída, aprovação, ativação e primeira compra descrevem etapas diferentes. Abertura e clique ajudam a diagnosticar comunicação. Comparação entre campanhas não demonstra incremento causal; para esse objetivo é necessário desenho de controle adequado e dados com cobertura/janela explícitas.

## Fontes, limites e navegação

Fontes editoriais: `.claude/skills/produtos-afinz/references/briefing-regua-aquisicao.md`; [[Ficha-de-Produto-Guia]]; [[Fabrica-de-Emails-GaaS]]. Código consultado: `src/modules/dynamic-email/services/managementService.ts` e `export/aiContextMarkdown.ts`. A referência da skill contém orientação editorial; não confirma um benefício vigente nem jornada ativa.

[[Motor-de-Briefing-Automatico]] descreve também arquitetura e propostas de automação. Não presumir que todas as camadas ali descritas estão implementadas. [[Servico-Emails-Dinamicos]] é o caminho de execução.

## Relacionado

- [[Dicionario-de-Produtos]] · [[Topo-de-Funil]] · [[Segmentos]] · [[Régua]] · [[Jornada]]
- [[Fontes-e-Proveniencia-Growth]] · [[Enciclopedia-Servicos-Growth]]
