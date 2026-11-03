---
tags: [fontes, proveniencia, contexto-ia, governanca]
tipo: referencia
camada: negocio
atualizado: 2026-10-02
status: confirmado
fonte: operador
---

# Fontes e Proveniência de Growth

**Definição:** regras de leitura para reconciliar conhecimento do vault, configuração do GaaS, evidência de plataforma e propostas, sem transformar ausência ou conflito em certeza.

## Cada fonte responde a uma pergunta

| Pergunta | Evidência adequada | Limite |
|---|---|---|
| Qual benefício pode ser comunicado? | fonte oficial vigente, condições e validação interna rastreável | página antiga ou peça histórica não garante vigência |
| Qual regra está cadastrada na Fábrica? | contextos e guardrails ativos no Supabase | estar `allowed` não prova que a evidência comercial é suficiente |
| Qual comportamento existe no app? | código da versão publicada e verificação do comportamento | arquivo de worktree não prova deploy |
| O que o SFMC executa? | DE, template, jornada e testes da BU aplicável | Supabase e prévia local não certificam SFMC |
| Qual resultado ocorreu? | fonte operacional, granularidade, janela e qualidade verificadas | falta de registro não significa zero |
| O que uma decisão significa? | nota canônica e registro datado da decisão | hipótese e roadmap não são implementação |

O vault explica e preserva conhecimento. A projeção no GaaS disponibiliza as notas. A Fábrica conserva registros operacionais editáveis com versões próprias. Quando esses materiais divergem, registrar o conflito e conferir a fonte que responde à pergunta; não sobrescrever silenciosamente a decisão operacional a partir de uma nota antiga.

## Datas que não podem ser confundidas

- `atualizado`: revisão editorial da nota.
- Data da evidência: quando fonte ou configuração foi consultada.
- Vigência: janela na qual uma condição se aplica.
- Sincronização: quando a cópia entrou no GaaS.
- Certificação: quando o teste operacional foi aprovado para um recorte e versão.

Atualizar ou sincronizar uma nota não revalida automaticamente benefícios. `valid_to` vazio significa fim desconhecido, não benefício permanente.

## Procedimento para uma IA

1. Fixar objetivo, produto, público, canal e data de corte.
2. Ler a nota de entrada e as referências que sustentam a regra relevante.
3. Separar fatos observados, histórico, interpretação e proposta.
4. Confrontar plataforma/código atual quando a tarefa depende do estado de execução.
5. Nomear informação ausente e o que ela impede concluir.
6. Entregar mudanças e validação no escopo pedido; registrar fonte e versão.

Não incluir CPF, e-mail de cliente, segredos ou dados de teste identificáveis em notas e pacotes de contexto compartilhados. Usar exemplos sintéticos identificados como tais.

## Conflitos registrados em 02/10/2026

- **Audiência SFMC:** skill antiga descrevia CPF repetido; nota corrigida em agosto descreve linha única e avanço in-place. A nota é a referência documental atual; configuração da DE deve ser conferida antes de carga real.
- **CSV:** implementação Plurix antiga dizia UTF-8 com BOM; contrato de setembro exige UTF-8 sem BOM. O contrato mais recente está em [[Emails-Dinamicos-SFMC]].
- **38 × 36 campos:** prosa histórica descreve 38 campos; exportação governada permanece de 36 colunas. Não acrescentar colunas com base nessa contagem.
- **Você Bem:** guardrail ativo de cobertura familiar está `allowed`, mas a evidência é apenas texto de peça antiga; outro guardrail exige revisão do percentual/cobertura. O cadastro é confirmado, a autorização comercial completa permanece pendente.
- **Prazo +amigo:** referência de produto de setembro permite prazo condicionado, enquanto [[Motor-de-Briefing-Automatico]] mantém bloqueio mais amplo. Registrar divergência e validar escopo/fonte vigente; não liberar claim por inferência.
- **Redes comerciais × assinaturas:** ficha menciona oito redes comerciais; operação histórica governa seis assinaturas. Compre Mais e Superpão possuem bloqueio de marca no GaaS e devem comunicar como +amigo no escopo registrado.

## Relacionado

- [[Auditoria-Contexto-Vault-2026-10-02]] · [[Padrao-Editorial-Enciclopedia]]
- [[Ficha-de-Produto-Guia]] · [[GaaS-Vault-Library]] · [[Conflitos-de-Fonte-Produtos-2026-08]]
