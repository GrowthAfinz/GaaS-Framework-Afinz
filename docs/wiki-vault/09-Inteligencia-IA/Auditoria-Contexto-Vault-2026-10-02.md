---
tags: [auditoria, vault, contexto-ia, onboarding]
tipo: evidencia
camada: evolucao
atualizado: 2026-10-02
status: confirmado
fonte: gaas-supabase
---

# Auditoria de Contexto do Vault — 02/10/2026

**Definição:** registro do inventário e do primeiro corte editorial da enciclopédia interna para pessoas novas e IAs, com evidências, mudanças e pendências.

## Escopo e evidências

Pedido do operador: enriquecer notas, reduzir lacunas e navegar pelos serviços internos de Growth. Corte implementado: Produtos → Briefing → Fábrica → E-mails Dinâmicos → SFMC, com páginas de entrada, padrão editorial e proveniência.

Fontes consultadas: vault local; skills `produtos-afinz`, `emails-dinamicos-sfmc`, `growth-saas-marketing-cloud`; referências de briefing/produto; código da Fábrica e parser/reader do vault no checkout `importer-aqs-routing`, commit local `1ef6b4d`; Supabase do projeto `mipiwxadnpwtcgfcedym`. O checkout é evidência local, não prova isolada de deploy.

> Snapshot anterior à revisão: inventário local com **189 arquivos Markdown elegíveis**; projeção Supabase com **188 notas ativas**, último sync concluído em **29/09/2026**, com **1.929 links**. O inventário contou **1.937 ocorrências de wikilink** e **19 referências sem alvo publicável**. Escopos e momentos são diferentes; esses números não são uma taxa de completude.

## Conhecimento incorporado

- Público de topo de Plurix, Dia e Bem Barato: membros do Clube conforme decisão local de 02/10 e contexto +amigo observado no GaaS. Separar essa audiência de elegibilidade universal para solicitar.
- Fichas do vault versus cadastro operacional: quatro fichas documentais, um contexto ativo na Fábrica (+amigo) e sete guardrails ativos.
- Marca: bloqueio de Compre Mais/Superpão na régua, comunicação como +amigo no escopo registrado.
- Context Pack: snapshot de contexto com seções omitidas, escopo, guardrails e estados de prontidão; ausência não significa inexistência da capacidade.
- Grãos: audiência, briefing, assinatura, template e jornada explicados separadamente.
- CSV: UTF-8 sem BOM, vírgula, CRLF e 36 colunas no contrato de setembro; correção da contagem 36 menos 10 = 26 campos restantes.
- CPF: alinhamento da skill com a correção documental de linha única e sequência in-place; DE real continua a conferir antes de operação.

## Lacunas e conflitos mantidos explícitos

| Questão | Impacto | Evidência necessária / dono |
|---|---|---|
| Condições comerciais históricas nas fichas | impedir promessa desatualizada | fonte oficial vigente por rede; Produto, dono a confirmar |
| Você Bem cobertura familiar `allowed` com peça antiga | cadastro não prova autorização comercial completa | condições/validação comercial, Produto/Jurídico |
| Guardrails sem URL | limita rastreabilidade da alegação | fonte e data por regra; responsável de produto |
| Até 40 dias para +amigo em fontes documentais divergentes | não liberar claim por inferência | reconciliar fonte e escopo; Produto |
| Contextos dos outros três cartões ausentes na Fábrica | cobertura operacional parcial | cadastro governado com evidência; Produto/CRM |
| Oito redes comerciais versus seis assinaturas | evitar criação ou oferta por analogia | escopo operacional por rede; CRM |
| SFMC não inspecionado nesta revisão | não declarar jornada/teste atual certificado | DE, template, jornada e Test Send; operador SFMC |
| Inventário por títulos | ausência de heading não prova falta de conteúdo | revisão editorial humana/IA por assunto |

## Entregáveis e reprodução

### Validação local concluída

Inventário final do corte: **198 notas elegíveis**, **2.125 ocorrências de wikilink**, **zero alvos ausentes** e **zero alvos ambíguos** na auditoria local. O compilador foi corrigido para preservar os três arquivos `README.md` que antes colidiam por nome; a ontologia passou a incluir as 198 fontes. Verificação adicional confirmou retenção integral das fontes e resolução do wikilink por caminho do README Vibe. Esses resultados validam a estrutura local; a projeção requer verificação separada.

[[Enciclopedia-Servicos-Growth]] é a entrada. [[Padrao-Editorial-Enciclopedia]] e [[Fontes-e-Proveniencia-Growth]] sustentam a revisão. `scripts/audit_vault_context.py` gera CSV/JSON de inventário e links em `outputs/vault-context-2026-10-02/`. A ontologia é compilada pelo script existente.

A comparação dos hashes locais com os publicados deve identificar o que mudou. Uma publicação só deve ser chamada sincronizada depois de run concluído e verificação de hashes/contagens. O relatório de validação na pasta de outputs registra o resultado real da publicação, sem confundir a revisão com recertificação comercial.

## Próximos cortes

Revisar entidades de dados (grão/chaves/ausência), depois mídia/audiências/mensuração e Report Live/aprendizado. Não houve enriquecimento semântico integral das demais notas nesta rodada. Relações tipadas, filtros por serviço, sumário fixo e atalhos de módulos no reader são propostas de interface; a navegação entregue nesta rodada usa conteúdo e wikilinks.

## Relacionado

- [[Enciclopedia-Servicos-Growth]] · [[GaaS-Vault-Library]] · [[Changelog-do-Vault]]
- [[Padrao-Editorial-Enciclopedia]] · [[Fontes-e-Proveniencia-Growth]]
