# Afinz CRM Communications

## 1. Objetivo da area Comunicacoes

A aba Comunicacoes deve governar conteudo CRM, cobertura de activity_names e performance de templates.

Ela responde:

- quais templates existem?
- quais ainda nao tem asset?
- quais activity_names estao vinculadas a cada template?
- qual criativo gerou resposta?
- quais disparos ainda precisam de governanca?
- quais reusos de template existem?

## 2. Entidades e responsabilidades

- Template: conteudo reutilizavel. Pode conter asset, HTML, imagem, assunto, pre-cabecalho, texto extraido e metadados.
- Asset: arquivo visual/conteudo anexado ao template. Pode ser imagem, preview de HTML ou print integral.
- Activity name: execucao no SFMC e linha de historico em `activities`.
- Jornada: contexto operacional do disparo.
- Regua: sequencia logica/condicional de disparos.
- Template ID: chave governada para conteudo. Deve ser estavel.

Nao duplicar o mesmo asset no mesmo template. Se o usuario substituir, manter o template_id e trocar o asset/conteudo.

## 3. Separacao de abas

Separar a experiencia em:

### Cadastro e Templates

Uso: governar catalogo, assets, cobertura e vinculos.

Deve priorizar:

- templates draft/sem asset
- filtros globais sincronizados
- sugestoes inteligentes de activity_names
- buckets de confianca
- vinculo manual
- excluir/substituir asset
- status imediatamente atualizado apos acao

### Performance do Conteudo

Uso: analisar resultado de templates/pecas ja vinculados.

Modos recomendados:

- Visao Geral: peca campea, volume, base acionada, engajamento medio, ranking e proximas acoes.
- Galeria: comparacao visual de templates com KPIs compactos.
- Tabela: auditoria, ordenacao, filtros e exportacao.

## 4. Dados minimos de template

Campos recomendados:

- `template_id`
- canal
- campanha/jornada
- parceiro
- segmento
- semana/safra
- ordem de disparo inferida
- nome/descricao
- assunto
- pre-cabecalho
- texto completo
- CTA
- oferta
- promocional
- elementos visuais
- asset_url/storage_path
- hash do asset
- status: draft, ready, active, archived
- confidence/status de enriquecimento

## 5. AppsFlyer e governanca de links

Para CRM:

- `af_ad` deve carregar `activity_name`, quando a execucao precisa ser reconciliada.
- `af_ad_id` deve carregar `template_id`, quando a identidade do conteudo precisa ser rastreada.
- `c` representa campanha/jornada.
- `af_adset` representa segmento/base.
- `af_channel` representa canal real.

Nao repetir `pid` e `af_channel` na URL final se o OneLink curto ja os traz configurados.

## 6. Regras de UX

- Exibir preview legivel; nao depender apenas de thumbnail pequena.
- Em modal, manter preview e metadados lado a lado quando a leitura for importante.
- Ao vincular activity_name, atualizar status sem refresh manual.
- Ao excluir asset, manter template_id, vinculos e historico.
- Ao substituir asset, preservar template_id e atualizar metadados/reprocessamento.
- Mostrar "como chegou nisso?" em sugestoes e scores.
- Nao auto-vincular sugestoes fracas.

## 7. Sugestoes inteligentes

Sugestao deve considerar:

- canal
- parceiro
- segmento
- campanha/jornada
- semana/safra
- ordem de disparo
- activity_name
- template_id
- assunto/preheader/texto/CTA
- reuso historico do mesmo template

Saida deve trazer buckets:

- Alta confianca
- Revisar
- Conflitos
- Ja vinculados
- Planejados/ausentes

Cada item deve exibir motivo, score e divergencias.

## 8. Reuso de template

Reuso e esperado. Nao tratar como erro.

Exemplos:

- mesma peca em semanas diferentes
- reenvio para nao-abriu
- variacao de assunto com mesmo corpo
- mesmo template em branches diferentes da regua

O sistema deve mostrar reuso como informacao de governanca: onde aparece, em quais activity_names, com que performance e se ha diferenca semantica relevante.

