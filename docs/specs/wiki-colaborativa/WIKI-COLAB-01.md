# WIKI-COLAB-01 · Layout compacto e atividades do piloto

Versão: 1.1 · 06/11/2026 · Piloto Visa

Implementação do piloto descrita em [PILOTO-VISA.md](PILOTO-VISA.md). Publicação condicionada ao validate do PR.

## Problema

A nota Visa mistura leitura longa, fichas e um checklist com nome específico; a edição de atividades não é evidente nem cobre todos os campos.

## Comportamento esperado

Renomear exatamente para Atividades: Construção do Piloto. Seta de recolher separada do lápis. Linhas com atividade, responsável, estado e conclusão; grupos recolhíveis; título, descrição, critérios, dependências, referências e evidências editáveis pelos controles do registro original. Manter preparação e validação separadas. Campos da tarefa usam saveWork e seu histórico, sem cópias.

## Dependências

Nenhuma spec anterior.

## Plano técnico

Modificar WikiPilotChecklist e separar linha de leitura de formulário. Neste corte, habilitar explicitamente apenas o caminho Visa; vínculo genérico para outras notas permanece como evolução. Direção editorial 1: página branca, índice lateral, teal/lime, cantos retos. Adicionar, duplicar, reordenar e excluir seções e atividades com recuperação. Reusar registros de tarefas existentes.

## Verificação e recuperação

Comparar antes/depois em 1440, 1024 e 390 px; teclado e toque; testar datas antigas sem data e conclusão/reabertura já cobertas. Feature flag mantém atividades salvas recuperáveis.

## Fora desta entrega

Não muda SQL ou jornadas SFMC. Colaboração de não administradores só é liberada após WIKI-COLAB-02/03; não contornar permissões de tarefas.

## Critérios de aceite

- [ ] O novo nome aparece no cabeçalho e nome acessível, sem Seedlist no título do componente.
- [ ] Editar uma atividade na Wiki altera o mesmo registro em Testes e Tarefas e vice-versa.
- [ ] Reabrir preserva conclusão anterior no histórico; concluir continua exigindo critérios, data e evidência conforme contrato existente.
- [ ] Editar, salvar e recolher não perdem foco, rolagem ou rascunho. Botão de lápis não alterna a seção.
- [ ] Dependências inválidas ou cíclicas são rejeitadas no servidor; alterações de critérios respeitam recálculo das marcações.

## Rastreabilidade

[Plano e ordem de implementação](README.md). O registro em Correções e Melhorias aponta para esta spec e para seu trabalho SDD. Estado do planejamento não significa implementação concluída.
