"""Apply the CRM/Growth editorial revision to the versioned Wiki mirror."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NOTE = ROOT / 'docs/wiki-vault/05-Estrategia/Estrategia-de-Segmentacao-de-Seguros.md'
s = NOTE.read_text(encoding='utf-8')
s = s.replace('A estratégia tem duas portas de entrada. Na **mensal**, o cliente recebe uma sequência de seguros, um produto por vez. No **trigger**, uma compra em uma categoria MCC abre uma oportunidade de oferta no dia seguinte.', 'Na **régua mensal**, cada cliente percorre a sequência de seguros para os quais está elegível. No **trigger**, uma compra na categoria MCC definida para o produto permite selecionar o cliente em D+1. Esta página orienta o time de CRM e Growth na seleção de público, na criação das DEs e na configuração da automação.')
s = s.replace('seguros-percurso-v2.svg','seguros-percurso-v3.svg').replace('seguros-sfmc-v2.svg','seguros-sfmc-v3.svg')
device='''## Como usar DEVICE no Seguro Celular

Usar o aparelho para **priorizar e diferenciar o público**, mantendo o trigger por compra em Eletrônicos. Não precisamos começar com preço estimado, indicação automática de plano ou histórico de troca de aparelho.

### Segmentação inicial proposta

| Segmento | Regra simples | Como trabalhar |
|---|---|---|
| RECENTE_IDENTIFICADO | Smartphone com marca e modelo identificados, fonte atual e último uso real nos últimos 90 dias | Público prioritário para testar Celular. Comparar contratação com os demais segmentos; personalização por modelo só depois de validar a identificação. |
| IDENTIFICADO_SEM_RECENCIA | Smartphone identificado, mas último uso ausente ou fora da janela de 90 dias, com fonte atual | Oferta genérica e leitura separada. Não afirmar que esse ainda é o aparelho usado pelo cliente. |
| SEM_DADO_CONFIAVEL | Sem DEVICE, modelo não identificado, tipo incerto ou fonte desatualizada | Não excluir automaticamente do Seguro Celular. Manter oferta genérica se as demais regras permitirem. |

Os 90 dias são uma recomendação configurável para o teste. Não são uma regra da seguradora. A mudança de prioridade na sequência mensal também precisa de aprovação; o segmento não altera a ordem sozinho. Dispositivo confirmado como tablet ou outro tipo não recebe personalização de celular e fica no público genérico, sem presumir ausência de smartphone.

### Dados mínimos e tratamento

Pedir à IN uma linha por CPF com tipo do dispositivo, marca, modelo, sistema, último uso e referência real da extração. Quando houver vários aparelhos, selecionar o smartphone com último uso mais recente e desempate estável; não repetir o CPF. O contrato completo está em SEGUROS_DEVICE_CPF no bloco de DEs abaixo. Se a fonte já entregar esse contrato, reaproveitá-la em vez de criar uma cópia desnecessária.

O SFMC recebe colunas prontas. O JSON deve ser aberto e os códigos de modelo normalizados no lake/IN, evitando um parser de aparelhos dentro de cada query de público. Para a primeira versão não é necessário um de-para de preços ou planos.

**O que temos hoje:** uma amostra de 100 linhas recebida em 04/11, com referência de agosto/2025 e lacunas de data. Ela explica a estrutura, mas não sustenta seleção atual. Importar essa amostra hoje não torna os aparelhos recentes. Até receber uma fonte válida, classificar como SEM_DADO_CONFIAVEL e manter comunicação genérica. A finalidade de uso dessa fonte também precisa ser confirmada com seu responsável.

Não inferir troca de aparelho apenas pela primeira aparição do registro: reinstalação do app pode gerar um novo registro. Não estimar renda, preço ou plano por marca. O cliente continua escolhendo o plano na LP. O resultado deve ser lido por segmento até contratação e, quando disponível, permanência.

'''
if '## Como usar DEVICE no Seguro Celular' not in s:
    s=s.replace('## Como a mensal continua andando',device+'## Como a mensal continua andando')
a=s.index('## Onde isso fica no SFMC') if '## Onde isso fica no SFMC' in s else s.index('## DEs para criação no SFMC');b=s.index('## Como a automation executa o desenho',a)
s=s[:a]+'''## DEs para criação no SFMC

O bloco **Referência técnica: Data Extensions** traz todos os campos, tipos, tamanhos, PK, obrigatoriedade, defaults, pastas, External Keys, sendability e responsáveis por gravação. Os públicos e marcadores são modelos para clonar; o dicionário aparece uma vez por modelo.

| Função | DEs |
|---|---|
| Fontes tratadas | SEGUROS_DEVICE_CPF e SEGUROS_SOLICITACOES_CPF_PRODUTO; reaproveitar contratos equivalentes da origem quando possível |
| Seleção | SEGUROS_ELEGIBILIDADE_CPF |
| Percurso mensal | SEGUROS_CONTROLE_CPF e sua área de preparo |
| Parâmetros | SEGUROS_CONFIG_ESTRATEGIA |
| Entrada nas jornadas | Seis SEG_APTOS: Mulher, Residencial e Celular, cada um com MENSAL e TRIGGER |
| Retorno das jornadas | Seis SEG_MARCADOR, um por produto e tipo de régua, para separar escritores simultâneos |
| Acompanhamento | SEGUROS_HISTORICO_CICLOS e SEGUROS_EXECUCOES |
| Decisões de trigger | Lake ou, se necessário, SEGUROS_TRIGGER_CONTROLE |

Esse é um contrato proposto para criação, não um inventário de DEs já implantadas. O pacote de referência cobre 21 nomes físicos, incluindo a alternativa condicional de trigger. Antes de criar, conferir o que pode ser atendido por fontes e controles existentes. Não vamos recriar CLIENTES ATIVOS, MAPA_SEGUROS, MAPA_MCC ou LPs.

Mensal e trigger podem coexistir. Por isso, o marcador de uma jornada não pode sobrescrever o estado de outra. A automação concilia os retornos e é a única responsável pelo percurso mensal.

'''+s[b:]
a=s.index('A `processos_seguros` é a frente') if 'A `processos_seguros` é a frente' in s else s.index('A proposta é estender a `processos_seguros`');b=s.index('## O que acontece depois do formulário',a)
s=s[:a]+'''A proposta é estender a `processos_seguros` depois da atualização e validação das fontes. O processamento segue esta ordem:

**Validar fontes → atualizar solicitações e elegibilidade → conciliar marcadores → selecionar mensal → decidir triggers → entregar públicos às jornadas.**

A mensal é decidida primeiro para que um trigger não seja liberado para o mesmo seguro na mesma execução. Os marcadores registram entrada, semana e encerramento; a automação aplica os intervalos, a regra de inatividade e a próxima seleção. O bloco **Referência técnica: Automation Studio** detalha as atividades, entradas e destinos, ações de gravação, inicialização, falhas e testes com Pablo.

'''+s[b:]
s=s.replace('| DEs e jornadas | Criar estruturas; definir BU, chaves, reentrada, marcadores e interrupção do ciclo anterior com Pablo. |','| DEs e jornadas | Validar os contratos propostos, BU, identidade de envio, cópia dinâmica do ciclo, reentrada e interrupção do ciclo antigo com Pablo. |\n| DEVICE | Receber fonte atual, confirmar finalidade e cobertura, validar modelo e último uso. Aprovar janela e uso do segmento antes de personalizar a seleção. |')
start=s.find('## Referência técnica: Data Extensions')
end=s.index('## Referências técnicas')
if start == -1:
    start=end
s=s[:start]+(ROOT/'docs/plans/seguros-segmentacao/de-reference-v2.md').read_text(encoding='utf-8')+'\n'+(ROOT/'docs/plans/seguros-segmentacao/automation-reference-v2.md').read_text(encoding='utf-8')+'\n'+s[end:]
s=s.replace('status_detalhe: desenho consolidado com decisões de 06/11; implantação no SFMC e parâmetros restantes pendentes','status_detalhe: estratégia operacional para CRM e Growth; contratos de DE e segmentação DEVICE propostos para validação no tenant')
NOTE.write_text(s,encoding='utf-8')
print('Updated operating note with DEVICE, complete DE contracts and automation reference.')
