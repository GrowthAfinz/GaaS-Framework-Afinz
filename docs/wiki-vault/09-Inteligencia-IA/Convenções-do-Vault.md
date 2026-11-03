---
tags: [convencoes, editorial, contexto-ia]
tipo: referencia
camada: meta
atualizado: 2026-10-02
status: confirmado
fonte: operador
---

# Convenções do Vault

**Definição:** regras de escrita, localização e revisão do conhecimento canônico de Growth para pessoas e IAs.

## Local de autoria e publicação

Editar no vault Obsidian/OneDrive. O GaaS consulta uma projeção pesquisável; não é uma segunda fonte de autoria dessas notas. Depois de editar, recompilar `docs/AFINZ_GAAS_ONTOLOGY.md` com `python scripts/bundle_vault.py` e sincronizar a biblioteca pelo fluxo administrativo. Conteúdo operacional da Fábrica tem histórico próprio, conforme [[Fontes-e-Proveniencia-Growth]].

## Metadados e profundidade

Manter `tags`, `tipo`, `camada`, `atualizado`, `status` e `fonte`. Usar tipos existentes: conceito, dimensão, entidade, operação, estratégia, evidência, evolução, engenharia, MOC e referência. Preservar a grafia técnica já adotada no frontmatter. Não inventar fonte ou responsável para completar o cabeçalho.

`confirmado`, `inferência` e `a-validar` indicam confiança do conteúdo. Quando há estados mistos, explicitar por seção. Atualização editorial, validação de evidência, vigência e sincronização são datas diferentes.

[[Padrao-Editorial-Enciclopedia]] substitui a preferência antiga por notas sempre curtas: cada nota deve ter profundidade suficiente para seu assunto, sem lacunas implícitas e com links para detalhamento. Uma regra mantém um lugar canônico; sua aplicação pode aparecer em outras notas com referência.

## Links, arquivos e exemplos

- Usar wikilinks com alvo único e alias legível quando útil.
- Quando existem vários `README.md`, usar caminho completo relativo ao vault.
- Número vivo exige snapshot e fonte; exemplo inventado deve ser identificado como sintético.
- Preservar seções históricas datadas, sem apresentá-las como configuração atual.
- Anexos não Markdown permanecem locais; explicar o que contêm na nota.
- `99-Templates` não é publicado pelo reader. Por isso estas convenções têm endereço canônico em `09-Inteligencia-IA`.

## Revisão e recuperação

Auditar links e cobertura com `python scripts/audit_vault_context.py`. A detecção de blocos por títulos é uma heurística para triagem, não uma avaliação semântica automática. Registrar conflitos e dono a confirmar. Evitar apagar histórico para resolver contradição; mostrar qual contrato passou a valer e a evidência.

## Relacionado

- [[Enciclopedia-Servicos-Growth]] · [[Padrao-Editorial-Enciclopedia]]
- [[Runbook-Vault-Vivo]] · [[Changelog-do-Vault]] · [[Fontes-e-Proveniencia-Growth]]
