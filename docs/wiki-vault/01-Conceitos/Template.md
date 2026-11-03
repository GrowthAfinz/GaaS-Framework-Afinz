---
tags: [conceito,v2,aprendizado]
tipo: conceito
camada: negocio
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Template

**Definição:** o **conteúdo** do [[Disparo]] (HTML de e-mail, copy de SMS, mensagem de WhatsApp), desacoplado da instância de envio.

## Contexto
**Entidade nova na [[Ontologia-v2|v2]]**, origem no doc GaaS×Miro. Na v2 é **atributo do disparo** (`template_id`), não tabela própria — pode ser promovido a entidade depois se precisar de versionamento de criativo. Inferido pela chave `jornada+canal+ordem+oferta+promocional`; confiança <80% vai pra fila de revisão humana.

**Por que importa:** hoje o mesmo criativo pode aparecer no Disparo 1 e no Disparo 11 da mesma jornada — e isso é invisível. O template torna o reuso rastreável. Pergunta de negócio que responde: *qual criativo gerou resposta?*

## Relacionado
- [[Disparo]] · [[Experimento]] · [[Entidades-v2]] · [[Ingestão-de-Dados]]
