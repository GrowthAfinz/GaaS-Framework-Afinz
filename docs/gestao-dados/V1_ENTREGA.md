# Gestão de Dados V1 · entrega

Continuação de `FASE0_DIAGNOSTICO.md`. Layout escolhido no mockup: atualização "Assistente em etapas" e histórico
"Quadro de status + Registro com linha do tempo", dentro de Configurações no formato Setup.

## O que mudou para quem usa

- **Configurações virou Setup**: menu lateral com Gestão de dados (Atualizar bases, Histórico de atualizações,
  Arquivos e versões), Operação (Metas, Packs SFMC) e Acesso (Usuários, Minha conta e aparência). A seção fica na
  URL (`?cfg=historico`), então voltar e F5 caem no mesmo lugar. Os atalhos antigos (Packs SFMC, Metas) continuam.
- **Atualizar bases em etapas**: Arquivo, Escopo, Revisão, Gravação e Recibo. A revisão deixou de ser uma camada
  por cima do app e passou a fazer parte da página.
- **Escopo virou etapa própria**: a escolha de frente e período, que antes ficava escondida dentro da revisão, vem
  antes dela, já com o padrão da casa marcado.
- **Números honestos**: a faixa da revisão conta o escopo; "conflitos" são só os de jornada (bloqueiam gravação);
  a origem que a taxonomia não identifica aparece como "não identificada", não como erro.
- **Histórico próprio**: estado de cada base com as cargas dos últimos 30 dias e selo de frescor (âmbar depois de
  2 dias), lista paginada no servidor com filtro de frente e situação, registro de cada execução com mudanças campo a
  campo, gravados, o que ficou de fora, linha do tempo e CSV do resultado.
- Sair para o Histórico no meio de uma revisão não perde nada: o importador fica montado.

## Engenharia

| Mudança | Efeito |
|---|---|
| Cache de normalização de texto | mesmas strings deixam de ser normalizadas milhares de vezes |
| Cache do ranking de cada balde do histórico | o balde global deixa de ser reordenado por disparo e campo |
| Inferência determinística uma vez por disparo | antes eram nove |
| Data em cache no `dayDiff` e janela D0-D2 por datas distintas | a consolidação deixou de ser quadrática |
| Leitura, índice e motor num Web Worker, com plano B | a tela não trava durante o processamento |
| Histórico de Rentabilização em páginas paralelas, ordem estável e cache na sessão | antes eram ~40 chamadas em sequência a cada arquivo |
| Recarga do store depois de gravar em segundo plano | o recibo aparece na hora |
| Sem esperas artificiais | saíram ~1 s de `sleep` e o mínimo de 900 ms de loading |

O golden da Fase 0 passou idêntico depois de cada mudança do motor, e um teste novo prova que o pipeline do worker
(CSV, matriz, motor) dá o mesmo resultado que chamar o motor direto.

### Baseline depois (mesma máquina e fixture da Fase 0, Total CRM)

| Linhas | Antes | Depois |
|---|---|---|
| 5 mil | 12,4 s | 5,7 s |
| 20 mil | 36,9 s | 11,4 s |
| 50 mil | 49,6 s | 19,2 s |

E agora fora da thread principal. No harness (navegador, modo de desenvolvimento), 20 mil linhas não geraram
nenhuma tarefa longa na thread principal durante o processamento.

## O que ficou para depois

- **Virtualização da tabela de revisão**: segue paginada de 100 em 100. Virtualizar pede dependência nova
  (`@tanstack/react-virtual`).
- **Visual da tabela de revisão**: a parte de dentro (barra de seleção, tabela, gaveta de detalhe) mantém o visual
  anterior; só cabeçalho, rodapé e navegação mudaram.
- **Índice enxuto do histórico em IndexedDB** e deduplicação no servidor: o cache atual é da sessão.
- **Desfazer execução**: só proposta, não implementado.
- **Gravação e Recibo não foram exercitados no harness** (o mock não grava); a lógica de gravação é a mesma de antes.
