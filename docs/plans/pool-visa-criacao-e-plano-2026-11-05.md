# Pool Visa: criação por grupo e Plano de Comunicação

## Entrega

- O Plano pede Aquisição, Ciclo de Vida ou Rentabilização antes de listar produtos. O Pool usa o mesmo Plano, Ficha, accordion e controles de versão.
- Black Friday é campanha, com versão técnica explícita, e seus dois documentos continuam sendo os toques V1 e V2. Grupos não duplicam briefings.
- O editor compacto separa grupo do comprador, tratamento visualizado e vitrine editada. As ofertas são selecionadas por marca/benefício; ativação é booleana; posições posteriores à terceira são reservas.
- A Biblioteca recebe uma subvisão Ofertas Visa com edição do catálogo, vigência, condições e usos por versão/grupo/célula/posição. Salva pelo RPC existente, sem alterar CSV ou template.
- A campanha oferece comparação dos grupos e dos dois toques, em desktop/mobile, usando o renderizador e resolver atuais. A prévia usa a vitrine carregada; não simula Q08 nem consulta o SFMC.
- A comparação do Plano Visa resolve assunto/preheader com herança do V2, abertura, cards válidos, CTA, links e hero da amostra. Aquisição conserva seus campos.

## Estratégia e operação SFMC

Fonte principal: `04-Operacao/Plano-de-Comunicacao-Pool-Vai-de-Visa.md`, atualizada em 05/11. O runbook operacional e a estratégia de rotação foram relidos após a atualização enviada pelo operador durante a implementação.

- BU pai Banco Afinz: inferência forte, conforme evidência do runbook. MID permanece aberto. B2C e B2B2C são os públicos de negócio da fase 1; não são tratadas como duas BUs técnicas.
- PREPARAÇÃO 02, 03, 04 e 06: versão documentada rodando. Import 01 ainda a incluir.
- Alterações em 03/04, passos 05/08/09/10 e novas etapas do funil: proposta, SQL não testado.
- DISPARO substitui o desenho antigo CONGELAR. Cadência de dois disparos semanais é decisão registrada; dias, alternância V1/V2 e entrada de novos aptos permanecem abertos.
- A regra 2 do grupo + 1 descoberta aparece como proposta com a decisão de posições aberta. A vitrine manual atual continua válida até a automação entrar no ar.
- As decisões 21 a 29 têm links para a Wiki. SQLs são exibidos como documentação, sem botão de execução.

Os documentos são compilados em `visaOperation.json`. Regenerar com:

```powershell
node scripts/build-visa-operation-doc.mjs '<diretório do Afinz-CRM-Midia-Vault>'
node scripts/build-visa-plan-seed.mjs '<diretório do Afinz-CRM-Midia-Vault>'
```

A query completa Q02 foi extraída da página 5 de `VDV_Automacao_Preparacao.pdf`, preservada em `visaMapaQuery.sql`. O runbook PDF contém versão antiga da Q04 com CROSS APPLY; a interface usa a versão UNION ALL da nota da DE e identifica separadamente a alteração proposta de 05/11.

## Migration para aprovação

`supabase/migrations/20261106011637_visa_communication_plan.sql` é somente de inclusão e idempotente. Cadastra uma régua, dois planos vinculados aos IDs conferidos em produção, uma Ficha e oito regras. Estados iniciais são rascunho, certificação não testada e proveniência por campo. Conteúdo marcado [P] permanece proposta; nenhum plano existente é sobrescrito ao reaplicar.

Não foi aplicada em produção. Não muda os contratos das DEs de Aquisição ou Visa, o template, o exportador nem a configuração de automações do SFMC. GRUPO_2, SAFRA e MOTIVO continuam sendo pré-requisitos propostos da operação SFMC, não novos campos silenciosos nos CSVs atuais.

## Wiki

Publicação autorizada pelo operador: 16 notas do Pool e decisões atualizadas, com cópias de revisão anteriores preservadas. Recibo `ac23c74b-7a98-419b-b809-cf9db4394413`, concluído, `deleted_count = 0`. Conferência posterior: 16 hashes iguais à origem. Notas de outras iniciativas não foram sobrescritas. Não se usou o finalizador global que marca ausências como tombstones.

## Validação e limites

Testes do módulo cobrem herança, grupos, genérico de comparação, vencimento, agrupamento por campanha, seleção anterior da frente, documentação de estados e migration em Postgres local via PGlite. O teste da migration também reaplica após alteração humana e verifica preservação de Aquisição.

O build passou antes da última atualização documental; os checks finais do PR verificam a revisão completa. TypeScript usa o gate de regressão existente, que desconta a dívida documentada da main.

QA visual e print permanecem pendentes: o controle de navegador no Windows não conseguiu confirmar a URL e encerrou a inspeção; a tentativa seguinte não teve conexão com o servidor local nem Chrome disponível. Não há evidência de fidelidade visual final. A prévia local de QA usa os componentes reais e fixtures, não dados de clientes, e não faz parte do build publicado.

Nenhum Test Send ou SQL proposto foi executado no tenant SFMC. A Wiki publicada é documentação, não confirmação da implantação da rotação.
