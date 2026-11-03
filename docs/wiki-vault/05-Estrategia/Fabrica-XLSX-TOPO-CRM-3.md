---
tags: [estrategia, gaas, fabrica-de-emails, xlsx, plurix, briefing, ia]
tipo: especificacao
camada: estrategia
atualizado: 2026-10-06
status: planejado
fonte: decisoes-do-usuario-e-planilha-de-referencia
---

# Fábrica XLSX — TOPO DE FUNIL (CRM) 3

## Decisão alinhada em 06/10/2026

Após o teste bem-sucedido do único motor [[Emails-Dinamicos-Plurix-V11]], o usuário decidiu que a copy da faixa de limite **não deve ficar no template AMPscript**. Marketing deve escrever o conteúdo dos e-mails no XLSX; IA importa e enriquece rascunhos; GaaS é a fonte principal das edições operacionais posteriores.

**Status: especificação aprovada para implementação futura.** A nova régua, a coluna MENSAGEM_LIMITE e o importador XLSX não foram implementados nesta tarefa. As decisões foram entregues em um prompt para Claude, salvo em `docs/plans/PROMPT_FABRICA_XLSX_TOPO_CRM_3.md` na raiz do projeto. Não confundir esse prompt com uma release publicada.

## As cinco decisões do usuário

| Tema | Contrato aprovado |
|---|---|
| Mensagem de limite no SFMC | Nova coluna opcional no briefing existente |
| Variação do texto | Por e-mail, com marcadores de nome/limite; faixa só com limite positivo |
| Trabalho da IA | Salvar rascunhos enriquecidos com origem dos preenchimentos e lacunas explícitas |
| Primeiro escopo | Dois toques; nova régua `TOPO DE FUNIL (CRM) 3` |
| Edição após importar | GaaS; reimportar mostrando diferenças, sem sobrescrever silenciosamente |

## Entrada editorial

Referência: `Regua_Plurix_TopoFunil_Proposta_Outubro26 (2).xlsx`, recebido do usuário. Possui as abas “Ficha | Régua Topo Plurix” e “Briefing Fábrica”. A segunda organiza campos em linhas e E-mail 1 a E-mail 8 em colunas.

A linha 22 diz que o texto da faixa é fixo no template. Essa orientação precisa ser substituída por um campo preenchível por toque. Ler cabeçalhos/rótulos, não posições fixas. Valores em branco, espaços ou NBSP não são conteúdo preenchido.

A planilha também descreve V10, header dinâmico, pool, benefícios e pendências comerciais. Essas instruções são referência histórica, não autorização para contrariar o recorte atual: headers por imagem e nenhum pool. Condições comerciais e assets pendentes não devem virar fatos confirmados pelo importador.

## Fluxo proposto

XLSX do marketing → interpretação/validação por IA → enriquecimento com cadastros governados → payload estruturado → MCP Supabase → rascunhos versionados no GaaS → revisão/edição/prévia → exportação SFMC → Test Send e jornada de QA.

IA pode completar cores, links, assinaturas, assets e identidade de produto quando houver fonte governada, registrando origem e justificativa. Não inventar oferta, benefícios, vigência, elegibilidade ou condição comercial. Informações ausentes ficam pendentes.

O payload deve conter régua/toque, variantes por rede, conteúdo, vínculo do template, origem do arquivo/aba, proveniência por campo, inferências, avisos, pendências e chave estável de reimportação. Não salvar automaticamente como pronto ou certificado. Futuras skills de Claude e Codex deverão compartilhar esse contrato; não foram criadas ainda.

## Novo contrato proposto para a faixa

- Coluna `MENSAGEM_LIMITE`: Texto, opcional/anulável; dimensionar conforme as mensagens e marcadores.
- Exportação passa de 36 a 37 colunas **somente quando implementada e coordenada com a DE SFMC**. Hoje o contrato operacional continua com 36.
- Marcadores amigáveis: `{{nome}}` e `{{limite}}`, com substituição controlada, sem executar AMPscript arbitrário desse campo.
- Mensagem por toque compartilhada pelas seis variantes de rede; E1 não altera E2.
- Exibir somente com limite positivo e mensagem preenchida; mensagem vazia não recebe fallback de copy fixa.
- Nome vazio precisa de comportamento explícito, sem saudação quebrada; limite ausente não vira zero.
- Novo bloco “Faixa de limite pré-aprovado” na edição e na prévia, abaixo do header.
- Remover o nome repetido no corpo dos dois novos briefings, preservando sentido e concordância. Não alterar todas as réguas antigas.

Exemplos para revisão editorial, a armazenar nos dados do briefing, não no template:

```text
E-mail 1: Parabéns, {{nome}}! Você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.
E-mail 2: Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado para pedir seu cartão +amigo.
```

## Isolamento da nova régua

A chave técnica atual é produto + TP_CAMPANHA + SEQUENCIA. O nome visual `TOPO DE FUNIL (CRM) 3` não isola sozinho as novas linhas das CRM antigas. A implementação deve definir um identificador técnico de campanha e manter correspondência entre cadastro, briefing exportado, lookup e jornada, sem perder a classificação de negócio CRM.

Preservar uma posição por CPF em ESTADO_SEQUENCIA_CRM e explicitar o limite de um percurso ativo por contato. Não confundir esse estado com entrega de e-mail. Não trocar o principal ou os vínculos das réguas antigas indiscriminadamente. A V11 testada deve permanecer recuperável; criar candidata versionada para o contrato novo.

## Critérios de conclusão futura

Conteúdo editado = salvo = exportado = simulado. Reimportação sem duplicação nem perda de edição no GaaS. CSV de 37 colunas validado e coordenado com SFMC; matriz de dois toques × seis redes; nome/limite/mensagem ausentes ou inválidos tratados; assets, desktop/mobile e clientes de email revisados; histórico e proveniência preservados; regressão das réguas antigas.

Entregar XLSX atualizado, contrato/payload de importação, nova régua em rascunho, template candidato, CSV, instruções SFMC, integração Supabase, merge em main, deploy e verificação da Fábrica publicada. Não ativar jornadas nem enviar ao público. Novo Test Send/jornada QA certificará a nova versão; o teste anterior não o substitui.

Relacionados: [[Emails-Dinamicos-Plurix-V11]] · [[Fabrica-de-Emails-GaaS]] · [[Emails-Dinamicos-SFMC]] · [[Briefing-e-Regua-de-Aquisicao]] · [[Servico-Emails-Dinamicos]].
