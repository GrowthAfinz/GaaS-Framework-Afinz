# Dispatch Order Intelligence

## 1. Objetivo

Criar inteligencia de ordem de disparo para relacionar templates, activity_names e reguas mesmo quando a nomenclatura muda ao longo do tempo.

A pergunta que o sistema precisa responder:

`Este activity_name corresponde a qual posicao da regua e a qual template esperado?`

## 2. Fontes de sinal

Usar em ordem de confianca:

1. Campo oficial `"Ordem de disparo"` em `activities`, quando preenchido e coerente.
2. Padroes de `activity_name`: `disp1s1`, `disp2s1`, `d01`, `d02`, `email_1`, `email_2`, `reenvio`, `abriu`, `nao_abriu`.
3. Padroes de `template_id`: `S1D01`, `S1D02`, `S3D01`, sufixos `_A`, `_B`, variantes.
4. Data relativa dentro da mesma jornada/campanha.
5. Texto do template: assunto, preheader, CTA, oferta e copy.
6. Planilha de governanca quando houver item planejado ainda ausente no Supabase.

## 3. Modelo de normalizacao

Normalizar:

- caixa
- acentos
- separadores (`_`, `-`, espacos)
- zeros a esquerda
- sinonimos de canal (`email`, `e-mail`)
- nomes de parceiros com duplicidade (`Bem Barato`, `Bem_Barato`)

Extrair entidades:

- canal
- parceiro
- segmento
- campanha/promocional
- semana/safra
- numero do disparo
- branch da regua
- variante A/B
- tipo de reuso/reenvio

## 4. Regra de ranking

Score recomendado:

- canal bate: peso alto
- parceiro bate: peso alto, mas pode virar penalidade se o historico for inconsistente
- segmento bate: peso alto
- campanha/jornada bate: peso alto
- semana bate: peso medio
- ordem bate: peso muito alto
- texto/assunto/CTA bate: peso medio
- data relativa coerente: peso medio
- ja vinculado ao template: mover para bucket proprio

Penalidades:

- semana diferente: exibir com aviso e sem priorizacao
- parceiro diferente: conflito, exceto se planilha/vault indicar reuso
- canal diferente: conflito forte
- ordem divergente: revisar
- baixa amostra: reduzir confianca
- ausente em Supabase: planejado/ausente, sem link ativo

## 5. Buckets de saida

### Alta confianca

Canal, segmento, parceiro/campanha e ordem batem ou sao fortemente inferidos.

### Revisar

Match plausivel, mas falta uma dimensao importante ou existe baixa amostra.

### Conflitos

Ha semelhanca, mas alguma regra forte diverge.

### Ja vinculados

Activity_name ja vinculado ao template ou a outro template.

### Planejados/ausentes

Activity aparece na planilha/governanca, mas nao existe no historico Supabase.

## 6. Explicabilidade obrigatoria

Cada sugestao deve mostrar:

- score total
- ordem inferida
- sinais positivos
- penalidades
- fonte usada
- sample/historico
- frase curta de decisao

Exemplo:

`Alta confianca: mesmo canal, parceiro Bem Barato, segmento CRM, campanha Copa e ordem S1D01/disp1s1.`

Exemplo com aviso:

`Revisar: mesmo parceiro e segmento, mas semana diferente. Exibir sem priorizacao.`

## 7. Reuso e branches

Nao assumir que um template pertence a uma unica activity_name.

Casos esperados:

- Email 1 reenviado com assunto diferente.
- Email 2 usado em branches abriu/nao abriu.
- Semana repetida com a mesma peca.
- Template reaproveitado em jornada equivalente.

O sistema deve representar isso como grafo:

`template_id -> activity_names -> execucoes -> metricas`

## 8. Criterio de acao

Nunca auto-vincular quando:

- score esta abaixo do limiar
- canal diverge
- ha conflito de parceiro/segmento sem explicacao
- item e apenas planejado/ausente
- ha duplicidade nao resolvida

Preferir acao manual com explicacao e atualizacao imediata de status.

