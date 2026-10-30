# Régua completa: sequência multicanal de ativações

Regra confirmada por Pablo em 09/10/2026.

- Buscar todos os canais no contexto BU × parceiro × segmento × safra; não limitar a WhatsApp nem depender apenas do nome da jornada, prefixo da atividade ou vínculo de template.
- Separar ordem do toque na safra, nome da atividade, ordinal da peça/template e data de execução. Uma atividade `dispvibe2` pode ser o 7º toque da safra; D2 não determina a ordem de entrega.
- Quando o operador confirmar a posição de ativação, apresentá-la como confirmação operacional, distinguindo-a da ordem atualmente gravada. Não alterar o banco por essa confirmação sem uma tarefa de gravação autorizada.
- Conferir Canal nas colunas oficiais: uma atividade contendo `wpp` pode ter Canal SMS. Expor a divergência, sem excluir o registro nem renomeá-lo silenciosamente.
- Cruzar activities (incluindo template_id vazio), catálogo e packs. Cadastro/uso configurado de SMS D2 não comprova execução na safra. Procurar classificações divergentes quando um toque parecer ausente; explicitar a cobertura e a fonte.
- Ordenar por posição de ativação comprovada; usar datas para organizar registros cuja posição está desconhecida, sem promover essa ordenação cronológica a ordinal confirmado.
- Duas datas da mesma atividade não são automaticamente dois toques. Ativações distintas com o mesmo nome também não devem ser fundidas automaticamente: exigir evidência de ativação ou definição operacional; listar datas/execuções separadamente quando não for possível decidir.
- Não contar opt-outs e respostas operacionais como toques de campanha. Não presumir que todas as pessoas receberam os toques anteriores.
- `activities."Ordem de disparo"` é evidência a verificar, não sequência garantida. Há ordinais repetidos, ausentes e divergentes da intenção operacional. Não definir o próximo número usando apenas máximo + 1, número do template ou contagem de dias/linhas disponíveis.

Entrega: tabela com ordem de ativação (ou desconhecida), datas, canal, Activity Name completo, Template ID e evidência (vinculado em activities / observado no pack / somente cadastro), indicando lacunas e divergências. Não afirmar régua completa quando faltam fontes ou posições.
