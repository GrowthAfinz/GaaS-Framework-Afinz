---
tags: [ia, contexto, colaboracao, wiki, governanca]
tipo: operacao
camada: evolucao
atualizado: 2026-10-22
status: confirmado
fonte: codigo-gaas-e-validacao-local
---

# Inteligência compartilhada com IA no GaaS

## Objetivo

Dar ao time uma base comum para trabalhar com suas IAs: conhecer a operação,
entender produtos e métricas, preparar entregas, investigar resultados e devolver
propostas rastreáveis. O Obsidian no computador de Pablo continua canônico.

## Onde encontrar

**Análise → Aprendizado e Memória → Wiki → Trabalhar com IA**.

As seis abas permanecem: Fila, Wiki, Report Live, Apostas, Outcomes e **Registros**.
Registros é o novo nome de Memória; a rota técnica `section=memory` continua válida.
A Wiki reúne contexto; Registros diferencia curadoria do vault de aprendizado
validado por resultado. Uma nota antiga não prova vigência, execução ou causalidade.

## Preparar contexto

O padrão é incluir todas as notas publicadas elegíveis. O ZIP oferece notas com
suas pastas, datas e metadados, índice, guia de entrada, mapa do sistema, instruções
para IA, ontologia unificada, divisões por assunto e modelo de contribuição.
O manifesto identifica pacote, hashes, fontes, exclusões e referências não resolvidas.
O usuário pode informar uma tarefa para orientar a leitura sem perder o acervo completo.

Uma comparação opcional com a pasta do computador distingue notas só locais,
só publicadas e conteúdos diferentes. A comparação não sincroniza a pasta.
Pacote completo da projeção não significa conter arquivos locais não sincronizados.
Anexos binários não publicados no leitor não acompanham o ZIP; esta exclusão é explícita.

## Dados e publicações

Notas que descrevem tabelas não exportam seus registros. Resultados agregados vivos
são opcionais e exigem escolher frente, mês e filtros antes da consulta. O cálculo
reutiliza o contrato analítico da Wiki, com fonte, data e limitações.
Total B2C e contribuições por origem não devem ser somados. CPA de plataforma não
é CAC de cartão; valores ausentes permanecem ausentes.

É possível incluir referência à publicação vigente do Report Live: versão, período
e links. Isso não copia os arquivos de apresentação nem aciona publicação.

## Contribuir e revisar

1. O integrante baixa o pacote, escolhe sua IA e trabalha no ambiente externo.
2. A IA devolve o modelo `gaas-knowledge-contribution/1`, com pacote de origem,
   título, justificativa, fontes e Markdown completo por nota.
3. O integrante envia o JSON na Wiki. O sistema confere caminho, hash-base,
   vínculo com o pacote, tamanho, duplicidade e versão publicada atual.
4. A contribuição entra na fila. Apenas Pablo pode aprovar para incorporação local,
   solicitar ajustes ou rejeitar. A comparação mostra fonte atual e proposta.
5. Após aprovar, Pablo baixa as alterações para sua LLM, revisa os hashes-base,
   atualiza o vault no computador e executa `python scripts/bundle_vault.py`.
6. Pablo sincroniza o vault no GaaS e usa **Verificar incorporação**. A confirmação
   exige todos os hashes propostos em uma sincronização concluída após a aprovação.

**Aprovação não altera o vault e não equivale a publicação.** Ajustes são enviados
como nova contribuição, preservando a proposta anterior e o histórico de revisão.

## Acesso e limites

Pacotes ficam preservados em armazenamento privado para a equipe autenticada.
O aplicativo não envia conteúdo automaticamente a provedores de IA. Conteúdo com
possíveis credenciais ou CPFs é excluído preventivamente; revisar o material antes
de compartilhar continua necessário. Não incluir dados identificáveis de clientes.

O fluxo não edita o Obsidian remotamente e não promove propostas da IA a regras
vigentes ou aprendizados validados. A versão canônica continua sob controle de Pablo.

## Implementação e verificação

Contrato técnico em `docs/architecture/learning-intelligence-exchange.md`, no app.
Migration `20261022161253_knowledge_exchange.sql`: pacotes, contribuições, revisão,
auditoria, snapshot e bucket privado. Testes locais cobrem mais de 400 notas,
hashes, caminhos, permissões, duplicidade, imutabilidade e confirmação por sync.
Publicação concluída em 22/10/2026: PR #52 integrado à main como c9300b0.
CI de integração e deploy GitHub Pages concluídos com sucesso; 500 testes locais
passaram, o gate TypeScript não encontrou erros novos e o build foi concluído.
A verificação HTTP pública retornou 200 para HTML e bundles e confirmou Registros,
Trabalhar com IA, contratos de pacote e contribuições no código publicado.
O pacote gerado a partir do snapshot vivo incluiu as 411 notas, com 429 arquivos
e hashes conferidos. Anexos binários seguem excluídos. A sessão autenticada do
navegador encerrou durante a conferência; não foi declarada validação visual
autenticada final. Pipeline: https://github.com/GrowthAfinz/GaaS-Framework-Afinz/actions/runs/39820528996.

## Relacionado

- [[Enciclopedia-Servicos-Growth]] · [[GaaS-Vault-Library]]
- [[Vault-como-Contexto]] · [[Fontes-e-Proveniencia-Growth]]
- [[Roteamento-de-Memoria]] · [[Resultados-Evolucao-e-Retrospectivas]]
