# Revisão da integração nativa — Pool de Ofertas Visa na Fábrica

Data: 05/11/2026. Estado: análise e contrato de implementação; não implementado/publicado por este documento.

## Decisão atual do operador

A correção posterior do Pablo substitui a organização da SPEC_CODEX_Fabrica_Vai_de_Visa.md: Rentabilização é a terceira frente da árvore principal, após Aquisição e Ciclo de Vida. A régua usa o mesmo workspace de três painéis, seleção, template-fonte, renderer, revisão e estados da Fábrica. O editor adapta seus campos ao contrato do Pool. Não deve existir uma página/aba operacional independente para os e-mails Visa.

Hierarquia por jornada:

```
AQUISIÇÃO
CICLO DE VIDA
RENTABILIZAÇÃO
  POOL DE OFERTAS VISA
    BLACK FRIDAY
      E-mail 1 · persona
      E-mail 2 · cartão
```

Black Friday é a campanha/edição sazonal; BF26_V1 é a chave técnica de sua versão de conteúdo. Nenhum dos dois é uma semana, segmento ou parceiro. Natal será outra campanha/edição na mesma régua. Parceiro, grupo de afinidade e célula são dimensões da personalização; não criam uma cópia editorial por destinatário.

## Evidência revisitada

- `Afinz-CRM-Midia-Vault/04-Operacao/Fabrica-de-Emails-GaaS.md`: unidade editorial é a régua; layout caixa/editor/prévia; template é fonte de renderização, não briefing/jornada; já prevê réguas de Aquisição e Rentabilização.
- `Afinz-CRM-Midia-Vault/04-Operacao/Emails-Dinamicos-Vai-de-Visa.md`: conteúdo por grupo/versão/célula e reutilização do padrão de lookup do Plurix. A nota reúne versões históricas conflitantes (3/4 cards, limite, RaiseError e diferentes DEs); não tratar todo o texto como regra simultânea.
- `Afinz-CRM-Midia-Vault/10-Resultados/Iniciativas/Iniciativa-Pool-de-Ofertas-Vai-de-Visa.md`: campanha de incentivo ao uso, B2C/B2B2C, afinidade MCC e sazonalidade inicial Black Friday; não aquisição nem Pool de Parceiros.
- `domain/management.ts`: JourneyFamily já inclui Rentabilização; EmailStrategy já tem businessFront e contexto de jornada.
- `components/DynamicEmailWorkspace.tsx`: shell e renderer já existem; o desvio atual é o modo `vdv` e o bloco `VdvInboxSection` paralelo a JourneyBriefingTree. A ordenação atual é alfabética, não a ordem de frentes pedida.
- `ampscript/renderer.ts`: `renderDynamicEmail` já recebe `options.vars`, permitindo resolver lookup em TypeScript sem criar outro motor de renderização.
- `services/workspaceService.ts`: `toBriefing` hidrata apenas BRIEFING_COLUMNS; adicionar campos Visa arbitrários sem mudar o contrato provoca perda no recarregamento. Save, filtros e contagens precisam reconhecer o documento Visa, não apenas links visuais.

## O que preservar da entrega existente

Preservar os contratos CSV de briefing/movimento, parser, validador, resolver TypeScript, regras de hero/cartão/célula, fixtures, envelope e testes de paridade. Preservar as três ofertas e reservas nas posições seguintes; primeiro card centralizado no desktop quando ímpar; mobile em coluna; skip sem tema ou ofertas válidas. Nenhuma alteração automática de audiência/SFMC.

Remover a separação operacional: aba Pool Vai de Visa, `mode='vdv'`, card paralelo na caixa e iframe isolado como prévia principal. Componentes de catálogo/vitrine podem ser reaproveitados como seções do editor comum, não remontados como página.

## Contrato editorial comum (proposta técnica)

Criar um documento editorial normalizado com identidade, frente, régua, campanha/edição, sequência, template vinculado, status, revisão e versão. Usar um discriminante de contrato (`acquisition` ou `vdv`) para selecionar o adaptador de conteúdo. Os briefings de aquisição existentes continuam legíveis por compatibilidade.

Para Visa, o contexto mínimo é: régua Pool de Ofertas Visa, campanha Black Friday, versão BF26_V1, toque V1/V2 e slot do template. TEMA/HERO/MOVIMENTO são referências compartilhadas da edição; as OFERTAS pertencem ao catálogo. Não copiar 89 linhas em cada toque, não transformar nomes técnicos em colunas de aquisição e não tratar amostras fictícias como registros operacionais.

A árvore, busca, estados, contagens, arquivamento, duplicação e seleção consomem o mesmo documento normalizado. Identidades persistidas, não duas linhas hardcoded desconectadas do ciclo editorial. Ordem explícita: Aquisição, Ciclo de Vida, Rentabilização. No modo Por parceiro, preservar a régua e sua frente sem inventar parceiros para cada template.

## Editor central contextual do Pool

Continua no painel central da Fábrica, com a caixa à esquerda e a prévia comum à direita. Reutiliza títulos, accordions, âncoras, avisos e salvamento; os campos são próprios do contrato Visa:

| Seção | Conteúdo | Escopo da alteração |
|---|---|---|
| Organização e contexto | frente, régua, campanha, versão, toque, template | documento editorial |
| Envelope | assunto/pré-cabeçalho V1, overrides V2 e estado de herança, contadores e tokens | tema compartilhado ou override do toque |
| Saudação e abertura | saudação com/sem nome, intro, cartão padrão, cores | tema compartilhado |
| Hero | persona V1, cartão V2, parceiros, imagens/alt/link e nome do cartão | heros compartilhados da versão |
| Ofertas da vitrine | grupo/célula, posições 1–6, reordenação, até 3 válidas e reservas | movimento compartilhado |
| Oferta selecionada | marca, logo/foto, valor, prefixo/sufixo, complemento, resgate/cupom, URL, vigência e condições | catálogo compartilhado; mostrar usos afetados |
| CTA e condições | texto de botão, título e rodapé legal | tema compartilhado |
| Amostra e diagnóstico | nome, grupo, célula, versão, parceiro, cartão e data; hero/célula usados, cards e posição de origem | apenas simulação |

Toda edição compartilhada identifica que afeta V1/V2 e/ou outras vitrines. A regra de herança do V2 precisa ser visível; campos vazios não podem parecer um assunto perdido.

A ampliação do editor não equivale a mostrar as 41 colunas técnicas num formulário plano. O operador trabalha por bloco e intenção, com contrato físico acessível para auditoria/exportação.

## Template-fonte e prévia

Mesmo catálogo `dynamic_email_template_slots`, mesmo editor Template-fonte e mesmo vínculo por e-mail. Uma fonte canônica do Pool, parametrizada pelo toque. Derivar o SET @VersaoEmail e o envelope correto ao renderizar/exportar cada toque; manter as fontes antigas como histórico até verificar dependências, sem exclusão automática.

Pipeline único: documento selecionado → adaptador de conteúdo resolve as variáveis e diagnósticos → `renderDynamicEmail` → `PreviewWithStructure`/`EmailPreviewFrame` existentes. O resolver VDV já existente é o adaptador de lookup, não outro renderer.

As âncoras do Pool mapeiam hero, saudação/abertura, cards e condições às seções do editor. Preview permanece no viewport desktop fixo da Fábrica, com ampliar/abrir/imprimir existentes. QA mobile continua separado. Fonte, edição de campo e troca de amostra precisam atualizar a mesma prévia.

## Persistência e saída

A persistência deve conservar identidade editorial e contexto Visa no round-trip, com versão, autor e trilha de alteração. Não basta inserir slots de template. O loader atual por BRIEFING_COLUMNS precisa de adaptação explícita para o contrato Visa.

Salvar deve validar o documento e suas referências; preservar rascunho/pronto/teste/certificação com as mesmas regras de confiança, substituindo as exigências exclusivas de aquisição pelas exigências do Pool. Edições compartilhadas e conflitos devem ser confirmados como lote consistente; não declarar o conjunto salvo quando apenas uma parte persistiu.

Mesmo botão/fluxo de exportação da Fábrica, com saída escolhida pelo contrato do documento: Visa gera seus CSVs de conteúdo e HTML/envelope; aquisição mantém sua DE. Nunca passar Visa pelo exportador de 36/41 colunas da aquisição. Um filtro misto separa os pacotes por contrato ou pede escopo compatível, sem converter campos silenciosamente.

Mudanças de banco são aditivas, RLS e auditoria preservadas. A aplicação de migration permanece manual conforme instrução anterior, até novo comando. A disponibilidade do esquema deve ser exibida; não ocultar falha de carregamento atrás de fixtures como se fossem dados compartilhados.

## Critérios de aceite para a próxima implementação

1. Rentabilização aparece dentro da mesma árvore e depois de Ciclo de Vida; campanha Black Friday é um nível próprio antes dos dois e-mails.
2. Selecionar qualquer toque mantém a mesma caixa/editor/prévia; nenhum mode/página VDV separado.
3. As contagens, busca e estados refletem documentos reais; não existem entradas decorativas fora dos filtros.
4. Edição em cada bloco altera a prévia comum e respeita escopo compartilhado/herança.
5. Slot do Pool está no catálogo comum; editar a fonte e renderizar/exportar usa a mesma fonte e o toque selecionado.
6. Salvar/recarregar preserva identidade, campanha, versão e toque. Conflito não sobrescreve a sessão concorrente.
7. Arquivar/duplicar uma edição ou toque segue o ciclo editorial, preservando histórico e distinguindo catálogo compartilhado de cópia de campanha.
8. Exportação despacha pelo contrato correto; Visa nunca gera CSV de aquisição.
9. Paridade dos seis cenários e geometria desktop/mobile continuam válidas.
10. Teste interativo da Fábrica completa alterna Aquisição/VDV e V1/V2 sem navegar para outra página; valida pins, fonte, salvar/reabrir e exportação, não apenas a presença de um link.

## Sequência de implementação

1. Documento normalizado/adaptadores + contrato de persistência; testes de round-trip e compatibilidade.
2. Árvore canônica e seleção unificada, com campanha/edição e ordenação explícita.
3. Editor por seções e preview comum; reaproveitar resolver e controles existentes.
4. Salvamento/estados/exportação comuns com despacho por contrato; retirar o workspace paralelo.
5. QA com dados de aquisição e Visa, visual e interativo; revisão antes de nova publicação.

A análise não exige mudar as regras de seleção de ofertas já alinhadas. O problema corrigido aqui é de arquitetura editorial e integração do produto, não de descobrir um novo atalho para a tela paralela.
