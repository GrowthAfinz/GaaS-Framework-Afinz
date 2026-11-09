# Plurix — completar a régua de topo

Os briefings de marketing completam a régua **V2 TOPO DE FUNIL DINÂMICO** com os
e-mails 5 a 8, nas seis redes. Os e-mails 1 a 4 já cadastrados são preservados.

Fonte: primeira seção de `Regua_Plurix_TopoFunil_Proposta_Outubro26.csv`. A seção
“Proposta preenchida” e os exemplos de ofertas não entram na carga. O hash da fonte
acompanha o fixture e a proveniência de cada novo rascunho.

Cada rede herda do e-mail 1 (toques ímpares) ou 2 (pares) seus estilos, botões,
assinaturas, logos, faixa de limite, vigência e nota legal. O destino dos links é
preservado, com semana e posição atualizadas para S3D01, S3D02, S4D01 e S4D02.
Os textos recebidos no campo de banner viram abertura e lista no segundo bloco,
usando o catálogo visual existente. Banners de corpo ficam vazios.

Correções editoriais: ortografia, título de saúde “Mais cuidado para sua saúde”
e assunto final sem “ÚLTIMA CHANCE”, pois não foi informada data de encerramento.
Os demais argumentos são os recebidos do marketing, sem benefícios novos.

A carga é aditiva e transacional: 24 briefings em `draft`, quatro estratégias em
`draft` / `needs_review` / `not_tested`, snapshots e proveniência. Uma repetição
com o mesmo conteúdo não duplica registros. Conteúdo divergente já existente
interrompe a carga, sem sobrescrever edições. O template não é alterado.

Validação: testes do contrato de conteúdo, renderizador de blocos e briefing;
simulação no banco com rollback e repetição da carga. A mesma transação verifica
que os e-mails 1 a 4 permanecem idênticos. Preview/Test Send no SFMC continua
pendente; esta publicação não ativa jornadas nem envia mensagens.
