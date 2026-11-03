---
tags: [supabase,tabela,comunicacoes]
tipo: entidade
camada: dados
atualizado: 2026-08-12
status: confirmado
fonte: gaas-supabase
---

# Tabela: communication_templates

**Definição:** o catálogo de peças criativas (imagem) já enviadas — cada linha é 1 asset (WhatsApp/E-mail/SMS/Push), com storage próprio (Supabase Storage) e metadados de campanha/segmento. É a base de dados por trás da [[Galeria-de-Templates]].

## Contexto

**Importante: não confundir com [[Emails-Dinamicos-SFMC]].** Esta tabela é interna ao GaaS (módulo Comunicações) e é **retrospectiva** — cataloga o que já rodou, tipicamente a partir de screenshot + planilha de governança (`gaas-governanca-comunicacoes`). Não é onde a copy é escrita antes do disparo. A autoria de conteúdo pré-envio de e-mail acontece na Data Extension `TB_BRIEFING_CAMPANHA_AQUISICAO` do SFMC ([[Emails-Dinamicos-SFMC]]); esta tabela só entra depois, quando alguém sobe o asset final pra comparação/análise. Para WhatsApp/SMS/Push não existe hoje um motor de briefing equivalente — a peça nasce fora do GaaS e só chega aqui depois de rodar.

Campos: `template_id` (normalizado maiúsculo pela governança; forma original fica em `metadata.template_id_planilha`), `channel`, `family` (hoje sempre nulo — não preenchido ainda), `version_label`, `status` (`draft`/`active`), `storage_bucket`/`original_path`/`preview_path`/`thumbnail_path` (2 renditions WebP conforme [[Galeria-de-Templates]]), `metadata` jsonb (campanha, semana, segmento; futuramente `texto_completo`/`oferta`/`cta` extraídos por LLM — pipeline ainda não implementado, ver decisão aberta em [[Galeria-de-Templates]]).

> 📊 Snapshot 2026-08-12 — 61 templates: 46 `draft` (pré-criados pela `gaas-governanca-comunicacoes`, sem asset ainda) e 15 `active`. Por canal: 48 E-mail, 10 WhatsApp, 3 Push, 0 SMS. `family` vazio em 100% das linhas.

## Relacionado

- [[Galeria-de-Templates]] · [[communication_slots]] · [[activities]] · [[Emails-Dinamicos-SFMC]] · [[Template]] · [[ad_creatives]]
