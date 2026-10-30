# Ramificações, ocorrências e reuso

Uma peça pode ser reaproveitada intencionalmente em outro caminho, momento ou jornada. Não classificar reuso como erro a partir de asset/content hash/Template ID iguais. A intenção da régua e o público de cada ramo vêm antes desse diagnóstico.

## Contrato da extração

- Ocorrência: jornada de origem + versão + activity_key; Activity Name permanece legível.
- Caminhos: lista completa de percursos até o nó; cada decisão inclui activity_key, tipo, nome, outcome_key, label, condição e refActivityCustomerKey quando houver. Sim de «Abrir» não equivale a Sim de «Clicar».
- Tempo: lista ordenada de esperas fixas, esperas por evento/data e janelas STOWAIT. Janela Einstein não é atraso fixo; não somar como horário exato.
- Conteúdo: asset_id/nome/hash separados de ID observado (af_sub3), ID proposto/aprovado e momento operacional. Não afirmar que o ID aprovado mudou se o único dado é o link exportado.
- Reuso: informar «mesma peça, ocorrência distinta», registrando posição e caminho. Mesma occurrence_key repetida em leitura do mesmo snapshot pode ser duplicação técnica; mesmo conteúdo em outra occurrence_key não é.
- Métricas: vincular execuções específicas por jornada/canal/período; não multiplicar métricas de uma atividade por quantidade de caminhos em um Join.

## Caso BP Semana 1

JOR_AQS_B2C_NA_BP_AQUISICAO_PAD_VIBE_SEM1: a decisão de abertura referencia o primeiro e-mail. Abriu e não clicou leva ao disparo 2; não abriu leva aos disparos 3 e 4. O pack de 7/10/2026 versão 1 reutiliza o asset 90095 nos disparos 2 e 4; o link desse asset observa D02. Isso descreve reuso entre ocorrências e não confirma erro. Se houver ID proposto/aprovado distinto para o disparo 4, conservar essa fonte separadamente.

## Critérios para revisar uma extração

1. Reuso em ramos distintos preserva dois nós e duas posições, sem diagnóstico automático de erro.
2. O rótulo Sim/Não identifica qual decisão foi tomada e qual mensagem foi avaliada.
3. Convergência conserva todos os percursos; não escolhe só o primeiro.
4. Ausência de caminho ou atividade desconhecida aparece explicitamente.
5. Desenho exibe Activity Name inteiro junto à prévia, com Template ID e asset em campos distintos.

## Desenho: gramática do Journey Builder + fichas

- Canvas em grade: nós pequenos, colunas fixas; cada ramo ocupa uma linha e começa na coluna do pai. Conectores ortogonais; rótulos no ponto de bifurcação. Esperas e decisões são losangos laranja, Einstein é losango azul-marinho, mensagens/Update Contact são quadrados verde-água, saídas são círculos verdes.
- Número por mensagem em ordem de leitura (linha, depois coluna), miniatura fixa para reconhecimento; a prévia legível fica numa ficha numerada abaixo. Activity Name completo, assunto/pré-header, ID observado no link, caminho, tempo e reuso ficam na ficha. Não colocar caixas explicativas no meio do canvas.
- Dia nominal soma somente esperas fixas; janela Einstein é indicada separadamente como até +Nh. WAIT configurado por evento/data, espera desconhecida e convergências com tempos distintos não permitem inventar um dia exato. As saídas preservam o dia nominal do caminho. Meta/critério global de saída aparece fora do fluxo, pois pode interromper o caminho.
- Reuso ganha selo informativo. Conteúdo que menciona explicitamente um marco diferente do ramo pode gerar revisão de adequação; asset igual, sozinho, não é erro. Link curto sem af_sub3 observado não prova que a URL final é desparametrizada.
- Preferir o grafo do mesmo parsePackage.ts usado pela ingestão e MessagePreview.tsx para os canais suportados. E-mail vem do HTML/slots/assets do pack, incluindo imagens base64 em `file`; ausência de publishedURL não prova ausência de imagem. SMS mostra texto, remetente e estimativa de segmentos.
- Não presumir árvore: Join pode convergir; conservar nó único e todos os caminhos. Random Split continua ramificação; Path Optimizer, espera por evento, metas e critérios de saída exigem tratamento específico. Detectar formatos não suportados antes de renderizar, sem duplicar nós para disfarçar convergência.
- Exportar PNG com escala 3, PDF opcional separado em fluxo/fichas e modo só fluxo com linhas compactas. Declarar versão do pack e eventual diferença da referência SFMC; não inventar contagem de contatos, público ou confirmação de execução.
