# Pool Visa · implementação editorial e prévia multicanal

09/11/2026. Autorização explícita para implementar a revisão aprovada e publicar na main. Sem autorização para alterar/ativar/enviar no SFMC.

## Publicado no código

- Leitor colaborativo existente, com narrativa revisada, abertura operacional, três diagramas ampliáveis, contratos e SQLs recolhíveis. Preserva ID/título da nota e integração com as tarefas reais do Pool.
- Prévia de LP integrada ao editor do Pool: grupo/célula/data da amostra, rodada, desktop/mobile, revalidação de vigência, três cards e reservas, resgate/condições. Import de POOL de nove campos local à prévia. Banner sinalizado como asset pendente; não cria CloudPage.
- Referência operacional da Fábrica substitui o desenho intermediário de duas automações pela PREPARAÇÃO de seis passos. As seis SQLs de referência e-mail ficam integrais, com montagem relatada e estado explícito.
- Contrato de simulação de canais: bloqueios próprios, app em 60 dias inclusivos, rejeição de ausente/inválido/futuro, exclusão de controles, uma escolha por CPF/rodada e tetos de 5.000 WhatsApp/100.000 SMS por rodada. Mesma política em SEG-A/B. Sem política explícita retorna parâmetros pendentes; nenhum peso é aprovado por esta implementação.
- Correção de quebra de linha nas ações da Wiki em viewport estreito, preservando as melhorias de leitura da main.

## Fonte e persistência

20 notas canônicas do Pool e dependências revisadas. Caminhos/aliases antigos mantidos, histórico anterior recolhido, sem tombstones. Datas editoriais em 09/11; SQLs de origem preservados. A ontologia foi recompilada e o lint do vault executado. Drift de outras notas não faz parte desta entrega.

A sincronização é escopada, com hashes remotos, lock do documento, ausência de revisão colaborativa concorrente e snapshot da fonte anterior. Não usar finish_sync para um inventário parcial. A reconciliação das tarefas usa os IDs/revisões existentes e a RPC governada, preservando marcos concluídos, datas, responsáveis, comentários e resoluções. Execução/QA não são concluídos por publicação editorial.

## Preparado para aplicação manual no SFMC

`CONTRATO.md` e `Q_VDV_03_CRUZAMENTO_MULTICANAL_PROPOSTA.sql` detalham o delta de campos/nulidade e a separação de aptidão comum e por canal. A query proposta não foi executada no tenant. As SQLs em `sql-referencia-email/` são as fontes integrais da montagem anterior, não uma implantação multicanal.

Faltam aplicação dos deltas, política/pesos/cotas/pressão, ligação das supressões móveis reais, assets e resolução token+rodada no servidor da CloudPage, primeira execução e Test Send/QA de canal. Histórico móvel existente terá localização/cobertura investigada depois, sem bloquear o início do piloto. Preços e orçamento não foram inventados. O código não agenda nem envia mensagens.

## Verificação

Testes de fronteira de app, bloqueios/controles, simetria A/B, não sobreposição e tetos; tema/rodada, validade/reservas, escaping, import ambíguo e ausência de scripts na LP; leitor de notas e integridade dos snapshots. QA visual local em desktop/mobile com os componentes reais. O CI completo e o deploy são conferidos na publicação.

Os testes locais não certificam o SFMC, as supressões de um provedor, a medição de compras ou a publicação final da LP.

## Atualização posterior de 09/11 · fonte única e teste pontual

O operador confirmou renderização no SFMC e recebimento correto de um Test Send. A evidência é pontual: V2, todas as células, clientes/mobile, LP, WhatsApp/SMS e produção não foram homologados por esse relato. O teste não é registrado como incidente de entrega.

A fonte única do fallback da Fábrica resolve rodada/tema e VERSAO_EMAIL opcional. Desktop: duas ofertas na primeira linha e a terceira centralizada abaixo, todas com a mesma largura; mobile: ordem 1, 2, 3 empilhada. O acabamento de largura/mobile foi conferido localmente após o relato, sem novo envio no SFMC. Fixtures V5 e slots históricos V1/V2 preservados. Até três ofertas vigentes e compactação com reservas mantidas; quatro continua evolução.

A sincronização usa controle de hash/versão do slot builtin-vdv-pool e dos cinco documentos, sem tombstones. Na atividade de QA existente, apenas o critério do Test Send pontual é concluído; dependências e demais critérios permanecem abertos.
