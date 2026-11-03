---
tags: [ia,skills,catalogo]
tipo: operacao
camada: evolucao
atualizado: 2026-10-30
status: confirmado
fonte: gaas-supabase
---

# Skills do Projeto

## Catálogo vigente em 30/10/2026

A fonte canônica é o repositório público GaaS-Framework-Afinz, na pasta `.claude/skills/`. A biblioteca está em **Aprendizado e Memória → Trabalhar com IA → Skills**, depois de Contribuições.

- **35 pacotes próprios**, incluindo os PPTX completos autorizados pelo Pablo.
- **110 fichas de terceiros**, com origem oficial e sem redistribuição dos arquivos.
- Download individual, caso de uso e detalhes recolhidos, tamanho e contexto estimado por skill.
- Botões funcionais para adicionar por ZIP e excluir, com commits na main via credencial GitHub de escrita; catálogo publicado após CI/deploy.
- Sem duplicar pacotes no Supabase Storage e sem novo nível de acesso no catálogo.
- Estimativa de tokens: caracteres / 4 de SKILL.md e referências Markdown; binários e scripts excluídos.
- Compatibilidade de instruções não certifica execução em cada IA.

O inventário, as fusões e a manutenção estão em [[Catalogo-de-Skills]]. Cada capacidade tem uma ficha na pasta `09-Inteligencia-IA/Skills/`.

## Registro histórico anterior à consolidação

As seções abaixo preservam o levantamento anterior. Caminhos, contagens e bloqueios de ambiente desse registro não representam o catálogo vigente.

**Definição:** as **skills de IA** (capacidades especializadas, acionáveis por agente) que já operam o GaaS — a inteligência aplicada da operação. Cada uma tem gatilho, entrada e saída próprios.

## Catálogo
| Skill | Gatilho | Entrada → Saída |
|---|---|---|
| **growth-brain-intelligence-engine** | analisar campanhas, CAC, safra, gargalo | [[activities]] → insights causais + diagnóstico + oportunidades priorizadas |
| **storytellingfiltergaas** | transformar análise em deck/PDF para stakeholders | output do Growth Brain → narrativa Contexto→Mudança→Causa→Ação |
| **afinz-crm-diarizado** | Excel diarizado de aquisição CRM, Copa 2026 | [[activities]] + [[b2c_daily_metrics]] → Excel com auditoria |
| **b2c-originacao-updater** | subir planilha de produção diária B2C | XLSX/CSV → [[b2c_daily_metrics]] (total + serasa_api) |
| **copa-crm-parser** | dados de campanha Copa | parsing de bloco Copa → estrutura |
| **afinz-pptx** | slides/deck com identidade Afinz | conteúdo → .pptx (PJ verde D3FF00, PF azul 00C6CC) |

## Como conversam com o vault
Hoje as skills consomem dados do Supabase direto. O ganho de [[Vault-como-Contexto|riqueza]]: fazê-las **lerem este vault como ontologia** (definições, regras, status de confiança) antes de analisar — garante linguagem única ([[Ontologia-v2]]) e evita reconter a operação a cada execução.

## Relacionado
- [[Agentes-e-Workflows]] · [[Vault-como-Contexto]] · [[Pipeline-ML]] · [[Orientador]] · [[Ontologia-v2]]
