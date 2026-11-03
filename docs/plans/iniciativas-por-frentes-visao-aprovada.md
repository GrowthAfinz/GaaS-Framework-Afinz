# Iniciativas por frentes de negócio — contrato de implementação

Data: 03/11/2026. Referência aprovada: `exec-eece4469-08d7-40f7-af5b-de68f23afb94.png`.
Objetivo: substituir a entrada de Testes e Tarefas pela composição aprovada e conservar
os cadastros, relações, histórico e controles operacionais da release anterior.

## Decisões de engenharia

1. A imagem é a referência de composição, tipografia e densidade. Textos, estados e
   decisões vêm de dados reais; os exemplos da imagem não viram resultados comprovados.
2. Reutilizar `WorkHub` como controlador e os formulários atuais. Extrair uma superfície
   de apresentação `InitiativeWorkbench`, com CSS restrito a essa área.
3. Remover o cabeçalho redundante apenas em Testes e Tarefas. Preservar o shell global.
4. Manter navegação por URL e links antigos da Fila. Frente, iniciativa e trabalho são
   seleções independentes. Trocar de frente não deve abrir uma iniciativa de outra frente.
5. A etapa da iniciativa é declarada e versionada: Contexto, Preparação, Teste/Desenvolvimento,
   Leitura/Verificação e Aprendizado. Contagem de checklist não determina essa etapa.
6. Adicionar pergunta orientadora e referências de contexto ao cadastro da iniciativa.
7. Decisões de produto têm registro próprio, autor, data e referência opcional à Wiki.
   Correção acontece por novo registro que substitui o anterior, sem apagar o original.
8. Favorito é preferência local por usuário, sem alterar o estado coletivo da iniciativa.
9. Preparar o próximo passo abre um trabalho pertinente. Preparar uma sessão dos agentes
   produz um briefing copiável para ativação explícita por skill; não chama LLM automaticamente.

## Composição e comportamento

- Em desktop, trilho esquerdo aproximado de 255 px; coluna central flexível; contexto
  direito aproximado de 350 px. A proporção é calibrada na captura de 1487 × 1058.
- Fundo branco/ice, divisórias leves, teal nas ações, lilás na pergunta e âmbar na atenção.
- Centro: frente, título/objetivo da iniciativa, favorito, ação principal e menu secundário;
  percurso de etapas; três trabalhos prioritários com expansão; registro de decisões.
- Direita: contexto da Wiki e pergunta da iniciativa. Referências vazias explicam como preencher.
- Esquerda: nome exato “Iniciativas por frentes de negócio” e as quatro frentes, mais visão geral.
- Lista/quadro e filtros continuam como organização avançada sob demanda, sem dominar a entrada.
- Visão geral lista iniciativas. Frente vazia e trabalhos sem iniciativa continuam acessíveis.
- Em telas menores, a navegação e o contexto se reorganizam sem esconder ações ou exigir
  leitura horizontal da página inteira. O percurso pode rolar dentro de seu próprio controle.

## Dados e integridade

Migração aditiva em `growth_work_initiatives`: `phase`, `guiding_question`, `context_links`.
Decisões em tabela própria com RLS administrativa e funções de escrita que verificam usuário,
revisão e origem. Novos campos entram no histórico já existente de iniciativas.
Nenhuma tarefa ou decisão histórica é apagada. Mudanças concorrentes não sobrescrevem versões.
Referência de nota não equivale a publicação, aprovação ou comprovação do resultado do teste.

## Plano de execução

1. Capturar a referência e confirmar navegador de QA; medir a composição e registrar limites.
2. Implementar modelo e contratos SQL, com testes de permissão, concorrência e preservação.
3. Implementar a nova apresentação sobre os dados e formulários existentes.
4. Completar ações de etapa, favorito, seleção, próximo passo, contexto, decisão e briefing.
5. Verificar casos reais e estados vazio/erro/carregamento; testar navegação e responsividade.
6. Comparar capturas lado a lado com a referência na mesma resolução; corrigir diferenças.
7. Atualizar documentação e publicar somente depois dos checks e da revisão visual.

## Critérios de aceite

- Uma iniciativa real pode ser aberta por frente ou link, com trabalhos e contexto corretos.
- Todo controle principal possui ação funcional; favorito não altera o trabalho coletivo.
- Etapa e pergunta sobrevivem à recarga e aparecem no histórico.
- Decisões são persistidas e correções conservam o registro anterior.
- O usuário consegue voltar de um detalhe sem perder a frente e a iniciativa.
- Não há aprovação automática de proposta, execução de LLM ou conclusão comercial inventada.
- Tipografia, espaçamentos, cores, ícones e conteúdo têm evidência de comparação visual.
- Build e contratos passam. Se o navegador impedir captura/comparação, o QA fica bloqueado:
  não declarar “100% parecido” com base apenas no código ou no sucesso do deploy.

## Papel da IA

A IA pode recuperar contexto, propor próximos passos, identificar lacunas e preparar
contribuições. A interface deve mostrar fontes e distinguir sugestão de decisão registrada.
Aprendizado só é publicado pela governança existente de propostas da Wiki; o percurso
visual da iniciativa não promove hipótese a conhecimento validado.

## Direção final de publicação · 03/11/2026

Pablo autorizou publicar com os testes atuais, registrando a revisão visual como pendente.
A referência permanece o alvo visual; a entrega não alega equivalência pixel a pixel.
Favoritos são locais por usuário, decisões reais têm registro próprio e a etapa é explícita.
A ativação dos agentes continua por comando. A autorização não encerra as tarefas macro do Loop.
