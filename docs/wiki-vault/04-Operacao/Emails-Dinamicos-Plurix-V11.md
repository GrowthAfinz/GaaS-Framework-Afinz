---
tags: [operacao, sfmc, plurix, emails-dinamicos, ampscript, gaas, sequencia]
tipo: operacao
camada: operacao
atualizado: 2026-10-06
status: confirmado
fonte: codigo-gaas-e-teste-informado-pelo-operador
---

# E-mails Dinâmicos Plurix V11

## Resultado de 06/10/2026

O usuário confirmou o recebimento correto de **E-mail 1 e E-mail 2 pelo mesmo motor V11**, em uma jornada de teste restrita ao próprio contato. Os prints de caixa de entrada mostram dois assuntos distintos; o print do e-mail mostra header por imagem, nome e faixa de limite pré-aprovado.

Essa evidência confirma o recorte testado: dois toques, uma rede e um contato. Não certifica todas as redes, clientes de e-mail, reentrada, concorrência, elegibilidade de produção ou modificações futuras. Nenhum disparo ao público foi realizado por esta tarefa.

## Contexto: o incidente do V9

O operador informou que uma régua V9 de dois disparos enviou o conteúdo E2 tanto no primeiro quanto no segundo. A investigação confirmou que o V9 da Fábrica e sua fonte persistida leem `[SEQUENCIA]`, enquanto os HTMLs históricos autoavançantes fazem lookup explícito da audiência atual. A causa histórica do incidente permanece não comprovada: um snapshot E1 sozinho não explica E2 no primeiro toque.

A prévia do GaaS não executa o bloco de preparação AMPscript. Ela injeta variáveis e pode renderizar mesmo com um lookup adulterado. Portanto, testes visuais não comprovam leitura das DEs ou progressão da jornada.

Foi considerada uma alternativa com dois assets de sequência fixa, mas **a decisão final do usuário foi manter um único motor que consulta o estado atual**. Os arquivos fixos são evidência de investigação, não o contrato operacional escolhido.

## Contrato V11 escolhido e testado

| Papel | Fonte | Dados usados |
|---|---|---|
| Público e dados cadastrais | `COMUNICACAO_PLX` | `CPF`, `EMAIL`, `FIRST_NAME`, `INVESTIDA`, `LIMITE_CRD` |
| Posição atual | `ESTADO_SEQUENCIA_CRM` | `CPF`, `SEQUENCIA` |
| Conteúdo | `TB_BRIEFING_CAMPANHA_AQUISICAO` | Produto × campanha × sequência e campos do e-mail |

O motor identifica a pessoa por CPF textual, usando Subscriber Key como fallback de identidade quando compatível. Preserva zeros à esquerda. Lê nome, rede e limite na audiência e **lê SEQUENCIA na DE de estado**, não na audiência nem no snapshot de entrada.

`INVESTIDA` é mapeada para `AMIGAO`, `BOA`, `AVENIDA`, `COMPRE MAIS`, `PARANA` e `SUPERPAO`, com variantes de acento aprovadas no código. A campanha técnica dessa V11 é `CRM`; as sequências aceitas são `E-mail 1` e `E-mail 2`.

A DE de estado criada possui CPF Texto/PK, OBS Texto, SEQUENCIA Texto e ATUALIZADO_EM Data. **Não há coluna CRM nem chave composta** nessa versão: uma posição por CPF. O contrato exige um único percurso/escritor controlando o estado de cada contato. Duas réguas simultâneas podem sobrescrever a mesma posição.

## Jornada de teste

Entrada filtrada para o contato interno → Update Contact com E1 → espera de QA → mesmo asset V11 → espera → Update Contact com E2 → espera → mesmo asset V11 → saída. O caminho restante sai sem envio. Nos prints, o filtro também está na entrada.

Update Contact grava SEQUENCIA e ATUALIZADO_EM com hora atual. A DE de estado precisa ser enviável, com CPF relacionado a Subscriber Key, para ser destino dessa atividade; isso não a transforma na audiência da jornada. Lookup isolado pode consultar uma DE não enviável. A DE de estado é separada da entrada, conforme a recomendação Salesforce.

ATUALIZADO_EM indica atualização do estado, não entrega do e-mail. Os intervalos curtos usados no QA não são cadência aprovada para produção nem garantia de sincronização. Não executar writes em DE no AMPscript de renderização.

## Conteúdo e comportamento atual

- Header exclusivamente por imagem HTTPS; sem header dinâmico nesta operação.
- Faixa quando `LIMITE_CRD` é numérico e positivo; formatação brasileira. Zero/vazio não inventa pré-aprovação.
- Pool explicitamente removido, independentemente de ofertas vigentes na DE do pool.
- Uma linha de audiência, uma de estado e uma de briefing por chave; ausência, duplicidade, sequência inválida ou vigência inválida geram erro do destinatário naquele envio.
- `RaiseError(..., true)` não remove automaticamente o contato dos próximos envios da jornada.
- **O texto da faixa ainda está fixo na V11 testada.** Externalizá-lo no briefing é a próxima proposta, não uma mudança já concluída.

O CSV exportado da DE SFMC fornecido em 06/10 tem 48 linhas e 36 colunas, sem linhas malformadas detectadas. As chaves AMIGAO + CRM + E1/E2 têm uma linha cada, vigentes de 17/08/2026 a 01/10/2028, com imagens e CTAs. Não foi necessário carregar novos briefings para esse teste. O assunto E1 tem um apóstrofo literal inicial, registrado como revisão editorial. Não deduzir o estado de outras DEs a partir do nome do arquivo exportado.

## Integração publicada na Fábrica

A V11 foi cadastrada em `dynamic_email_template_slots` como `builtin-plurix-v11`, com HTML completo, não placeholder. A fonte foi comparada com o arquivo local. **V9 permaneceu principal**; cadastrar V11 não muda automaticamente os vínculos de todos os briefings CRM.

Por isso, uma faixa visível na régua Topo de Funil/V10 pode não aparecer em Topo de Funil (CRM) quando o briefing ainda usa V9. A V11 tem faixa, como o recebimento do teste confirma. Na prévia V11, usar limite de teste numérico, por exemplo `12000`; o valor fictício legado `R$ 3.500` não ativa a faixa nesse contrato atual.

Publicações verificadas:

| Mudança | Evidência |
|---|---|
| Prévia V11 com aliases FIRST_NAME/LIMITE_CRD, nome e header imagem | [PR #49](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/49), merge `8fdbaf9` |
| Correção dos UUIDs de teste e gate TypeScript | [PR #50](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/50), merge `ebc01c4`; deploy `37535902926` aprovado |
| Orientações e cópia de assunto/pré-cabeçalho em Template-fonte | [PR #51](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/51), merge `484286a`; deploy `37537657639` aprovado |

Foram verificadas 12 combinações de rede × toque em simulação local com briefings GaaS, sem imagens quebradas nas capturas finais. A prévia publicada do E1 foi observada com imagem, nome e limite positivo. Isso permanece QA visual, não execução Salesforce.

O painel de assunto/pré-cabeçalho foi confirmado no bundle público; sua conferência visual final ficou pendente por falha da conexão de controle do navegador. Testes de derivação, TypeScript e build passaram. Não afirmar que o clique dos dois botões foi verificado em navegador nesse recorte.

## Configuração do Content Builder

Assunto:

```ampscript
%%=TreatAsContent(@Assunto)=%%
```

Pré-cabeçalho: bloco inicial completo da V11, seguido de:

```ampscript
%%=TreatAsContent(@PreCabecalho)=%%
```

O preparo usa uma guarda de inicialização comum ao pré-cabeçalho e ao corpo. Na Fábrica, o botão “Copiar pré-cabeçalho completo” deriva esse bloco da fonte atual do editor; não mantém uma cópia divergente. Não misturar pré-cabeçalho de outra versão com o corpo V11.

## Fontes e limites

Pacote local: `SFMC_PLURIX_IMPLANTACAO/v11/`. Investigação e matrizes: `SFMC_PLURIX_IMPLANTACAO/investigacao-2026-10-06/`. Não armazenar CPFs, telefones ou e-mails de destinatários nesta documentação.

[Personalização por dados atualizados](https://help.salesforce.com/s/articleView?id=sf.mc_jb_personalization_in_the_journey_builder_send_email_activity.htm&language=en_US&type=5), [Update Contact](https://help.salesforce.com/s/articleView?id=mktg.mc_jb_update_a_contact.htm&language=en_US&type=5), [ordem de operações AMPscript](https://developer.salesforce.com/docs/marketing/marketing-cloud-ampscript/guide/mc-ampscript-guide-language-basics-order-of-operations.html).

## Próxima evolução

[[Fabrica-XLSX-TOPO-CRM-3]] registra a especificação alinhada após o teste. Ela externaliza a mensagem de limite, remove o nome repetido no corpo dos novos toques e prepara a importação enriquecida por IA. O usuário pediu um prompt para Claude e depois a documentação; a implementação anterior de textos fixos no template foi interrompida e não promovida.

Relacionados: [[Emails-Dinamicos-Plurix]] · [[Emails-Dinamicos-SFMC]] · [[Fabrica-de-Emails-GaaS]] · [[Servico-Emails-Dinamicos]].
