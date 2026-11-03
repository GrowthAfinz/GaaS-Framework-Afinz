---
tags: [operacao,sfmc,crm,emails-dinamicos,ampscript]
tipo: operacao
camada: operacao
atualizado: 2026-11-03
status: confirmado
fonte: gaas-supabase
---

# Emails Dinâmicos — Motor de Content Builder (SFMC)

> **Rota de leitura (revisão editorial 02/10/2026):** [[Servico-Emails-Dinamicos]] explica o fluxo completo; [[Briefing-e-Regua-de-Aquisicao]] explica a intenção; esta nota detalha o contrato técnico. Revisar o texto não equivale a recertificar a operação SFMC.

**Definição (1 frase precisa, para IA):** motor de e-mail único no SFMC Content Builder que, via AMPscript, busca o conteúdo de um e-mail numa Data Extension de briefing a partir de 3 campos do destinatário (produto, tipo de campanha, sequência), eliminando a necessidade de criar um e-mail novo por campanha.

## Contexto

Existe **um único** e-mail dinâmico no Content Builder (ex.: `afz_car_vis_aqs_email_anc_joraquisicaotestedinamicoseq1_diario`). Ele não tem copy fixa — todo o conteúdo vem de `LookupOrderedRows` numa Data Extension de briefing, filtrado pelos 3 campos que o destinatário carrega consigo. Isso substitui "criar 1 e-mail por campanha" por "criar 1 linha por campanha" em duas planilhas.

Validado ponta a ponta em 2026-08-10 com o caso Plurix (parceiro `+amigo`/Amigão Supermercados): audiência de teste (Pablo, Pietra, Mariana) recebendo conteúdo Plurix via Test Send, reaproveitando o mesmo template que serve o Afinz Visa institucional.

## As 3 peças

**Grãos diferentes:** audiência = uma pessoa e seu estado no contrato documental corrigido; briefing = uma combinação produto × tipo de campanha × sequência; variante de assinatura = identidade contextual; template = código que consome os dados. Confirmar chaves e configuração na DE real antes de qualquer carga.

1. **DE de Audiência — `TB_CAMPANHA_AQUISICAO`** (quem recebe). Colunas: `CPF, PRI_NOME, EMAIL, CELULAR, LOCAL, LIMITE, PRODUTO, TP_CAMPANHA, SEQUENCIA, CAMPANHA`. **1 linha por pessoa**, com `CPF` como chave primária. `SEQUENCIA` é campo de estado: a régua avança atualizando a linha no lugar (`Update Contact` na jornada), não carregando linha nova.

   > **Correção 2026-08-19.** A versão original desta nota dizia que `CPF` **não** era único e que a pessoa aparecia várias vezes. Estava errado — a duplicidade observada veio de testes fechados iniciais com CPFs fabricados, não do modelo de produção. A confusão gerou um desenho de carga por sequência que foi descartado. Ver [[Emails-Dinamicos-Plurix]] §12.
2. **DE de Briefing — `TB_BRIEFING_CAMPANHA_AQUISICAO`** (o que é enviado). 36 colunas: datas de vigência, assunto, pré-cabeçalho, header, cartão, produto interno, 2 blocos de copy+CTA, até 3 banners, nota legal, rodapé. Cada linha = 1 e-mail completo.
3. **E-mail dinâmico** (Content Builder, AMPscript) — motor que casa as duas DEs.

## A chave composta (regra de ouro)

O lookup no e-mail é:
```
LookupOrderedRows("TB_BRIEFING_CAMPANHA_AQUISICAO", 1, "DT_INICIO DESC",
  "NM_PRODUTO_INTERNO", @Produto, "SEQUENCIA", @Sequencia, "TP_CAMPANHA", @TpCampanha)
```
`PRODUTO` (audiência) = `NM_PRODUTO_INTERNO` (briefing) · `TP_CAMPANHA` = `TP_CAMPANHA` · `SEQUENCIA` = `SEQUENCIA` — precisam ser **idênticos caractere a caractere** (maiúscula/acento) nos dois arquivos. Sem isso, o e-mail dá `RaiseError("Dados de briefing da campanha não encontrados.")`. Além da chave, a data de hoje precisa estar entre `DT_INICIO` e `DT_FIM` da linha do briefing, senão `RaiseError("Campanha fora do prazo de vigência.")`.

`TB_BRIEFING_JORNADAS` (produto × banners de onboarding/desbloqueio) é uma **camada separada**, não usada por este template — não confundir. Confirmado por varredura do repositório em 2026-08-18: a DE aparece **apenas em prosa** no vault, zero referências em código (`.ts`, `.tsx`, `.html`), e o e-mail de aquisição faz **um único** `LookupOrderedRows`. Ela é consumida por outros e-mails que vivem só no Content Builder.

## Institucional B2C — dívida arquitetural resolvida (2026-09-01)

**Constatado no Supabase** (`dynamic_email_briefings` + `dynamic_email_template_slots`): os dois modelos convivem hoje em produção, em extremos opostos.

| | Plurix | Institucional B2C |
|---|---:|---:|
| Campos preenchidos no briefing (contagem histórica a reconciliar; não é schema de exportação) | **38** | **10** |
| Templates no Content Builder | **1** (`builtin-plurix-acquisition-ux-v2`) | **8** (`b2c-classic-vibe-email-01..08-control`) |
| O que varia por dado | copies, cores, banners, CTAs, rodapé | só assunto, pré-cabeçalho, header, vigência |
| Marca | 6 assinaturas sobre 1 layout | layout próprio por e-mail |

O diagnóstico de 2026-08-26 encontrou oito templates dedicados. A migração concluída em 2026-09-01 consolidou os oito e-mails Classic + Vibe em **um template dinâmico canônico**, com as linhas de briefing carregando o conteúdo variável. Os oito slots legados foram arquivados para auditoria, não apagados.

O contrato de 36 campos e a chave composta foram preservados. A migração foi validada no GaaS por testes automatizados e build; os oito e-mails permanecem dependentes de Test Send no SFMC para receber certificação operacional.

### O contrato mínimo (achado do mesmo cruzamento)

Cruzando os campos usados pelas duas BUs, **exatamente 10 são comuns** — e formam o núcleo obrigatório de qualquer briefing dinâmico:

| Função | Campos |
|---|---|
| Chave composta | `NM_PRODUTO_INTERNO` · `TP_CAMPANHA` · `SEQUENCIA` |
| Vigência | `DT_INICIO` · `DT_FIM` |
| Envelope | `ASSUNTO` · `PRE_CABECALHO` |
| Identidade | `HEADER` · `CARTAO_NM_COMERCIAL` |
| Rastreamento | `UTM_CAMPANHA` |

No contrato de **36 colunas**, os outros **26** são campos de corpo/apresentação: presentes conforme o template delegue conteúdo ao dado. A contagem histórica de 38 acima não autoriza acrescentar duas colunas à exportação; sua origem precisa ser reconciliada. Quantos campos a frente usa define onde ela está no espectro "template dedicado ↔ template único".

Esse é o eixo real de modularização — não a frente de negócio.

## Modelo de escala — quantos templates a operação precisa

A pergunta que determina o número de templates **não é "quantas BUs?"**, é **"quantas identidades visuais distintas o e-mail precisa servir?"**

| BU | Identidades | O que varia entre elas | Templates | Status |
|---|---|---|---|---|
| **B2C** | 1 — Afinz Visa | nada | 1 | resolvido: nada precisa virar dado |
| **Plurix** | 1 marca (`+amigo`), 6 assinaturas de varejo | rodapé + deeplink | 1 | **resolvido** — viraram coluna do briefing (ver [[Emails-Dinamicos-Plurix]]) |
| **B2B2C** | N marcas de cartão próprias | logo, cores, nome do cartão | 1 por parceiro | **em aberto** |

Plurix parecia o caso difícil e não era: as 6 bandeiras vendem o mesmo cartão, com o mesmo logo e as mesmas cores. Só o rodapé e o deeplink mudam — e ambos couberam em colunas que já existiam.

B2B2C é o caso ainda não resolvido. Lá os parceiros têm cartão de marca própria (`Bem Barato` → *Bem Mais Afinz Visa*); o campo `FLAG_WHITELABEL` em `TB_BRIEFING_JORNADAS` existe para marcar exatamente isso.

**O que trava tecnicamente:** no template Plurix, quatro valores estão chumbados no HTML — logo, `#2C3490`, `#D1D4EB` e `#efefef`. Promover esses quatro a colunas do briefing faria o mesmo motor servir B2B2C. **Gatilho para fazer:** a terceira identidade, não antes.

## Sintaxe de personalização

Dentro dos campos de texto do briefing (Copy 1, Copy 2 etc.), a personalização é `%%=v(@FirstName)=%%`, nunca `%%FIRST_NAME%%` (essa é sintaxe de Triggered Send/Email Studio, não funciona aqui — envia o texto literal pro cliente). `TreatAsContent()` reprocessa o campo, então o AMPscript embutido no texto do CSV é resolvido na hora da renderização. **Achado real:** a planilha-modelo da analista (matriz de governança) tinha essa sintaxe errada até 2026-08-10 — corrigir na fonte, não só linha a linha.

## Pitfalls confirmados (custaram ~6 rodadas de import até descobrir)

> Regras gerais de importação (data, aspas, separador, Overwrite) valem para qualquer DE e têm lugar canônico em [[SFMC-Salesforce-Marketing-Cloud]]. Conteúdo que varia **por CPF** (ofertas): ver [[Emails-Dinamicos-Vai-de-Visa]].

- **Import do wizard não autodetecta o formato de data.** A tela "Formato de data" (dropdown "English (United States)") interpreta como **MM/DD/AAAA**, não DD/MM. Datas com dia >12 (ex. `31/08/2026`) falham com "Data inválida"; datas com dia ≤12 passam silenciosamente com o dia/mês trocados (risco de vigência errada sem erro nenhum). **Correção:** escrever as datas do CSV já em MM/DD/AAAA (ex. 31 de agosto = `08/31/2026`), ou selecionar "Outro" no dropdown e digitar `dd/MM/yyyy HH:mm:ss` explicitamente.
- **Checkbox "Respeitar as aspas duplas como qualificadores de texto"** vem desmarcada por padrão a cada nova importação (não é lembrada). Sem ela, qualquer vírgula dentro de um campo (`NOTA_LEGAL`, `COPY_2_PRETO` etc.) quebra a contagem de colunas e invalida a linha inteira.
- **Quebra de linha crua (`\n`) dentro de um campo quoted** é válida em CSV (RFC4180) mas o importador do SFMC conta linha física, não lógica — vira "arquivo inválido". Usar `<br>` em vez de `\n` nos campos de copy (o template já tem `white-space: pre-line` no CSS de Copy1/Copy2 Preto, então `<br>` funciona igual).
- **Placeholders da analista** (`"PEGAR NA BASE"` em `NM_PRODUTO_INTERNO`, `"CRIAR"` em `UTM_CAMPANHA`) precisam virar valor real antes de subir — não bloqueiam o CSV tecnicamente, mas quebram o lookup silenciosamente se ninguém resolver.
- **A Jornada tem filtro de entrada próprio**, independente da chave do briefing. Ex.: `JOR_AQUISICAO_TESTE_DINAMICO3` só aceita `TP_CAMPANHA = Repescagem AND SEQUENCIA = E-mail 1` — uma campanha nova com `TP_CAMPANHA = Aquisição` pode estar 100% correta nas duas DEs e ainda assim nunca disparar, porque nenhuma jornada ativa a filtra. Confirmar isso **antes** de considerar uma campanha "pronta".

## Como testar uma campanha nova

1. **Test Send no Content Builder** (`Visualizar e testar` → Test Send, escolhendo o CPF na DE de audiência) — valida renderização sem depender de jornada nenhuma. Caminho mais rápido.
2. **Via Jornada** (fluxo real automatizado) — exige confirmar/criar uma jornada com filtro de entrada batendo `TP_CAMPANHA` + `SEQUENCIA` da campanha nova.

## Relacionado
- [[Emails-Dinamicos-Plurix]] (implementação completa da BU Plurix, autocontida) · [[Bandeiras-Plurix]] · [[SFMC-Salesforce-Marketing-Cloud]] · [[Taxonomia-Activity-Name]] · [[Ingestão-de-Dados]] · [[Modal-de-Disparo]] · [[Repescagem]] · [[BUs|BU Plurix]]

## Workspace editorial no GaaS (2026-08-11)

O menu **Comunicações → Fábrica de E-mails** funciona como uma área editorial para preparar e revisar as linhas de `TB_BRIEFING_CAMPANHA_AQUISICAO` antes da importação no SFMC. No menu de Comunicação, **Performance do Conteúdo** usa um ícone analítico e a Fábrica preserva o ícone de e-mail, evitando ambiguidade visual entre as duas funções.

- **Caixa de briefings ampliada:** apresenta parceiro/produto, campanha, sequência, assunto, pré-cabeçalho e estado de validação com busca e filtros, em uma organização semelhante a uma caixa de entrada.
- **Header operacional único:** usa o mesmo verde-petróleo de Cadastro e templates e concentra nome da área, quantidade de briefings, ajustes bloqueantes e revisões sugeridas. As abas **Campanhas** e **Template-fonte** ficam acima das ações de importar, duplicar, criar, excluir e exportar.
- **Workspace em três painéis:** caixa de briefings, editor e prévia permanecem visíveis lado a lado. A caixa tem largura estável; editor e prévia dividem o espaço restante.
- **Divisor ajustável e persistente:** o usuário pode arrastar o separador entre editor e prévia, ajustar com as setas do teclado e restaurar a proporção padrão com duplo clique. A largura escolhida fica salva localmente no navegador daquele usuário.
- **Edição na ordem do e-mail:** campanha e vigência → assunto e pré-cabeçalho → header → primeiro bloco com CTA e banner → segundo bloco com CTA e banner → banner final → nota legal e rodapé.
- **Seções minimizáveis:** cada grupo vindo do CSV pode ser recolhido individualmente. Os antigos contadores numéricos de preenchimento por seção foram removidos por não representarem uma decisão útil para a analista.
- **Rótulos orientados à analista:** a interface usa nomes legíveis e mantém o nome físico da coluna do CSV como referência secundária para governança.
- **Imagens por URL pública:** header e banners aceitam link HTTPS público, exibem prévia, dimensões e validação de carregamento; quando aplicável, o destino clicável permanece separado.
- **Duplicação segura:** a cópia preserva o conteúdo, cria um novo identificador local, remove a confirmação manual da jornada e exige revisão de sequência/vigência antes da exportação.
- **Exclusão governada:** a remoção exige confirmação explícita, identifica o briefing afetado e informa que ele não aparecerá no próximo CSV exportado.
- **Prévia com contexto real:** o terceiro painel exibe assunto, pré-cabeçalho, remetente definido no SFMC, destinatário de teste, parceiro, campanha, sequência e a renderização completa. O botão **Ampliar** fica dentro do cabeçalho da própria prévia e abre um modal central sem retirar o painel do workspace. A renderização no navegador é uma simulação; o **Test Send do SFMC continua sendo a certificação final**.

O rascunho continua sendo preservado localmente. A partir da V2 (2026-08-18), o botão **Salvar briefing** também persiste metadados editoriais e versões no Supabase para uso compartilhado e auditoria; não altera a DE nem o motor do SFMC.

## Fábrica de E-mails V2 (2026-08-18)

- A caixa é organizada por **parceiro → segmento → semana editorial → e-mail → assinaturas**. Parceiro e segmento usam a taxonomia observada em `activities`; a semana é um organizador editorial controlado e não deve ser confundida com `Safra`.
- `Activity Name` é opcional, porém destacado no salvamento. Salvar sem ele exige confirmação explícita e essa decisão entra no histórico.
- Para a Fábrica, `activities.BU = Plurix` governa **Plurix** como parceiro sem alterar o dado bruto `activities.Parceiro = N/A`. `Institucional B2C` é uma opção editorial distinta; `N/A` nunca é convertido automaticamente em Proprietária.
- A **Biblioteca de ativos** armazena somente URL pública do Salesforce Content Builder, link clicável opcional e metadados leves. Não há upload de imagem nem uso do Supabase Storage.
- Plurix é a identidade principal. Cada e-mail editorial governa seis assinaturas (Amigão, Boa, Avenida, Compre Mais, Paraná e Superpão) e exporta uma linha técnica por bandeira para preservar a chave composta atual. Assim, os dois e-mails existentes aparecem como **2 e-mails editoriais e 12 variantes técnicas**.
- Conteúdo comum é propagado entre assinaturas; imagens, rodapé, deeplink, UTM e produto interno podem variar por bandeira. Não existem e-mails editoriais separados por bandeira.
- A nota legal usa texto compartilhado por padrão. Um override avançado permite edição por linha/bandeira e registra essa exceção na auditoria.
- O CSV exportado continua contendo exatamente as 36 colunas de `TB_BRIEFING_CAMPANHA_AQUISICAO`; metadados, versões e auditoria não entram na DE.

### Biblioteca visual e carga histórica (2026-08-19)

- O editor abre uma galeria visual no contexto de cada campo de imagem, substituindo a seleção textual por miniaturas pesquisáveis.
- A aba **Recomendados** prioriza posição do e-mail e produto/bandeira do briefing; **Todos** mantém o acervo completo disponível.
- Carga inicial governada: 17 URLs aprovadas encontradas nos CSVs Plurix, HTMLs legados e render institucional — 3 headers, 4 banners principais, 2 banners complementares, 6 assinaturas e 2 logos de marca.
- Todos os 17 links foram validados com resposta HTTP 200 antes do cadastro e receberam as tags `historico` e `aprovado`.
- A URL externa continua sendo a identidade de deduplicação. Selecionar um ativo também aplica seu link clicável quando esse destino está governado no acervo.

### Fluxo operacional do editor e biblioteca (2026-08-18)

- A aba principal do header passa a se chamar **E-mails**. O botão **Salvar briefing** fica no encerramento do formulário, depois das informações legais, para representar a conclusão da revisão editorial.
- Em cada posição visual, **Selecionar imagem salva** é a ação primária. A URL pública deixa de ser editada diretamente dentro do briefing; **Subir novo ativo** leva à Biblioteca de ativos, onde a referência do Salesforce é cadastrada.
- A Biblioteca de ativos possui barra persistente com busca textual e filtros por posição, parceiro e subgrupo, além de contagem do recorte e ação para limpar filtros.
- Ao lado de **Ampliar**, **Abrir em nova aba** entrega a simulação HTML completa e **Salvar em PDF** usa a impressão nativa do navegador. Isso evita o corte e as restrições de CORS da conversão para JPEG. O Test Send do SFMC continua sendo a certificação de renderização e personalização.
- O seletor de `Activity Name` oferece o histórico de `activities` e uma ação controlada para cadastrar um novo identificador no briefing. Falha de consulta à taxonomia é exibida com tentativa de recarga; o placeholder dos seletores obrigatórios não pode apagar valores existentes.

### Árvore editorial e ciclo de vida das assinaturas (2026-08-19)

- A caixa de briefings é uma árvore expansível e persistente: **parceiro → segmento → semana → e-mail → assinatura**. O e-mail informa a proporção de assinaturas ativas e oferece acesso contextual ao gerenciador.
- O menu contextual da semana permite **criar um e-mail já dentro da semana**, **duplicar a semana completa** para a próxima semana disponível — incluindo todos os e-mails e suas variações de assinatura — ou arquivar o conjunto mediante confirmação. No e-mail, o mesmo menu concentra **Gerenciar assinaturas**, **Duplicar e-mail** e **Arquivar e-mail**.
- **Novo e-mail editorial** solicita segmento, semana, sequência, origem do conteúdo e assinaturas participantes. Assinaturas globalmente inativas não aparecem na criação.
- O **Gerenciador de assinaturas** diferencia: adicionar ao e-mail, desativar somente naquele e-mail, restaurar uma variação e desativar/reativar globalmente para Plurix.
- Desativação não apaga histórico. Variação já salva recebe `status = archived`, sai do CSV e fica disponível no filtro **Arquivadas** em modo somente leitura. Somente rascunho nunca salvo pode ser removido fisicamente da sessão.
- A governança global fica em `dynamic_email_signature_settings`, com parceiro, chave, nome, status e vigência. Desativar uma assinatura impede sua criação futura e arquiva as variações ativas existentes, sem alterar a DE do SFMC.

### Slots de Template-fonte e testes AMPscript (atualizado em 2026-09-01)

- A área **Template-fonte** funciona como uma biblioteca compartilhada de fontes do Content Builder. Cada slot possui identificador, nome, HTML/AMPscript, versão e data da última alteração; os slots ficam em `dynamic_email_template_slots` no Supabase e são iguais para os usuários autenticados.
- O template único legado em `gaas-dynamic-email-template-v1` é migrado automaticamente para o primeiro slot, chamado **Template principal**, preservando o código já usado pelo operador.
- O operador pode **Novo slot** para começar a partir do template-base, **Subir HTML** para carregar `.html`, `.htm` ou `.txt`, renomear, editar, salvar, duplicar ou apagar slots. Pelo menos um slot deve permanecer disponível.
- **Definir como principal para visualização** salva o conteúdo atual do slot e o torna a única fonte usada pelo renderizador AMPscript-lite na prévia da Fábrica. Salvar um slot secundário não muda a visualização até essa promoção explícita.
- Se o slot principal for apagado após confirmação, um slot remanescente deve assumir a visualização. A exclusão afeta o catálogo compartilhado do GaaS, mas não exclui conteúdo do Content Builder.
- A decisão operacional destravada é testar variações de HTML/AMPscript no GaaS antes de copiar o código ao SFMC. O preview continua sendo uma simulação local: construções não suportadas falham visivelmente e o **Test Send do SFMC** permanece a certificação final.
- A prévia dos briefings também possui um seletor direto de template. Ele alterna o slot principal renderizado e oferece atalho para abrir a edição integral de seu HTML + AMPscript, sem exigir que o operador procure novamente a versão na biblioteca.

### Template Plurix aquisição UX v2 (2026-08-19)

- A Fábrica distribui um slot editável chamado **Plurix aquisição UX v2**. A migração acrescenta a versão aos slots existentes uma única vez e preserva o template principal escolhido pelo operador; nenhuma versão anterior é sobrescrita.
- O topo passa a apresentar a logo comum do produto `+amigo`, antes do hero. **Plurix** continua sendo o parceiro operacional e o banner final continua sendo a assinatura variável da bandeira; logo de produto e assinatura de varejo não são confundidas.
- A direção visual do slot 2 usa o azul-violeta `#2C3490` do cartão `+amigo` nos CTAs, substituindo o ciano associado à Afinz B2C. A abertura tem título e apoio centralizados; o segundo bloco usa fundo lavanda `#F6F6FB`, título centralizado e benefícios alinhados à esquerda para preservar a leitura comparativa.
- A ordem dos blocos passa a ser **copy → apoio visual → CTA** nos dois momentos do e-mail. Isso coloca a ação depois de sua evidência/explicação e reduz espaços artificiais deixados por imagens ou campos vazios.
- O HTML usa tabelas de apresentação, largura de 600 px com comportamento fluido, padding mobile, botões com largura integral em telas pequenas, texto essencial em HTML vivo, descrições alternativas e `opencounter` preservado.
- A V2 reutiliza integralmente as mesmas 36 colunas e os 12 briefings técnicos existentes. Não cria campo, não altera DE, não muda chave composta e não publica automaticamente no Content Builder.
- O mesmo AMPscript escolhe a composição por `SEQUENCIA`: o E-mail 1 usa descoberta dos benefícios → passo a passo → fechamento; o E-mail 2 usa introdução → CTA → benefícios → painel de conversão com os cartões. Títulos e CTAs já presentes nas artes não são repetidos em HTML.
- Status operacional apó auditoria local: **ready_for_test_send**. A promoção para `sfmc_certified` exige Test Send aprovado nas seis assinaturas e nos dois e-mails.

### Aprendizados do comparativo visual e teste real Plurix (2026-08-19)

- Um único AMPscript deve atender os dois e-mails, mas a composição visual precisa mudar por `SEQUENCIA`; reutilizar mecanicamente todos os slots em ambos repete textos, CTAs e informações já presentes nas artes.
- O E-mail 1 funciona melhor como descoberta: logo comum → hero → personalização curta → benefícios visuais → passo a passo → fechamento e CTA. O E-mail 2 funciona melhor como conversão: logo comum → hero → personalização → CTA → benefícios em HTML → painel final com CTA e cartões.
- Texto já presente numa imagem não deve reaparecer imediatamente em HTML. Imagens são evidência ou apoio; a hierarquia, personalização e ação essenciais continuam em texto vivo.
- A identidade principal do conteúdo é o cartão `+amigo`; **Plurix** é o parceiro operacional e a bandeira é a assinatura variável no encerramento. A assinatura não deve dominar a abertura do e-mail.
- A base real Plurix já informa a bandeira na coluna `INVESTIDA`. Para o motor atual, esse valor precisa ser normalizado para uma das seis chaves canônicas do briefing: `AMIGAO`, `BOA`, `AVENIDA`, `COMPRE MAIS`, `PARANA` ou `SUPERPAO`.
- Enquanto o lookup permanecer em `NM_PRODUTO_INTERNO = @Produto`, a DE de audiência deve gravar a chave canônica da bandeira em `PRODUTO`; `TP_CAMPANHA` e `SEQUENCIA` completam a chave. `PRODUTO = PLURIX` não distingue a assinatura e não encontra as 12 variantes atuais.
- Mapeamento recomendado da origem: `Amigao → AMIGAO`, `Boa → BOA`, `Avenida → AVENIDA`, `Compre Mais → COMPRE MAIS`, `Parana → PARANA`, `Superpao → SUPERPAO`. Valor vazio ou desconhecido deve ir para quarentena, nunca receber uma bandeira por fallback silencioso.
- O teste controlado deve cobrir a matriz completa de **6 bandeiras × 2 sequências**, confirmar logo, hero, CTA, links, assinatura, legal e responsividade, e só então receber status `sfmc_certified` após Test Send no SFMC.

### Padrão de exportação CSV para o SFMC (corrigido em 2026-09-03)

- A comparação byte a byte de 03/09/2026 mostrou que o CSV gerado pelo GaaS usava `;`, enquanto o arquivo baixado da DE e aceito pelo SFMC usa **vírgula (`,`)**. A decisão anterior de padronizar `;` estava errada e foi revertida.
- O contrato reproduzido pela Fábrica é: UTF-8 sem BOM, delimitador `,`, CRLF, 36 colunas na ordem oficial, uma linha física por registro e aspas duplas somente quando o valor contém vírgula, aspas ou outro caractere que exige qualificação.
- As datas de importação saem em `MM/DD/YYYY HH:mm:ss`, conforme o wizard English (United States) desta BU. O download da DE é localizado em DD/MM e não deve ser usado como prova do formato de reimportação. Em 03/09/2026, 56 linhas iniciadas em `17/08/2026` produziram exatamente 56 erros de data; `01/10/2028` não acusou erro por ser ambígua.
- Vírgulas editoriais como `Olá, PABLO!` permanecem intactas dentro de campos qualificados. Não substituir pontuação do conteúdo para contornar o parser.
- Antes da entrega, validar: 36 colunas após parsing CSV, nenhuma quebra de linha crua dentro do registro, CRLF, ausência de BOM, datas no padrão acordado e round-trip sem perda de copy.
- Para uma DE isolada de homologação, preferir **Sobrescrever** ao reenviar a matriz completa, evitando duplicidade de chaves. Em produção incremental, usar Adicionar e Atualizar somente após validar a chave composta e a configuração da DE.

### Skill de design e engenharia de e-mails de aquisição (2026-08-19)

- A skill de projeto `.claude/skills/sfmc-acquisition-email-designer/` cria, altera, refatora e audita HTML/AMPscript de aquisição. Ela cobre dimensões, alinhamento, ordem de blocos, espaçamento, responsividade, ativos, copy, acessibilidade, dark mode, segurança e compatibilidade.
- A skill é complementar a `emails-dinamicos-sfmc`: o designer cuida do conteúdo/código/renderização; a skill operacional continua responsável por DE, CSV, chave composta, importação, vigência e jornada.
- Alterações em código existente seguem estratégia de patch mínimo: inventariar blocos e dependências, traduzir o pedido em operações explícitas, preservar tracking/legal/lógica não solicitada, executar auditoria estática e entregar cenários de teste.
- Regras incorporadas da documentação oficial: validar rowset antes de `Row`/`Field`; usar `RedirectTo` quando necessário para tracking de URLs dinâmicas; tratar `TreatAsContent` como execução de conteúdo governado e sanitizado; reservar `RaiseError` para falha real; considerar a ordem de processamento preheader → HTML → texto → assunto.
- O auditor `scripts/audit_email_source.py` produz achados `blocked`/`review` para delimitadores e IF/ENDIF, JavaScript e meta refresh, links, imagens, tabelas, guards de rowset, `TreatAsContent` e tracking dinâmico. Ele complementa, mas não substitui renderização e Test Send.

### Camada semântica gerencial e revisão externa (2026-08-31)

- A Fábrica mantém `dynamic_email_briefings.briefing_data` como contrato técnico de 36 colunas e adiciona uma camada relacional separada para contexto de produto, guardrails, estratégia da régua, estratégia por e-mail, blocos semânticos, ocorrências de CTA e adaptações.
- O backfill é conservador: os 56 briefings técnicos permanecem intactos; fatos existentes recebem proveniência e campos interpretativos ficam vazios com `needs_enrichment`. A unidade editorial é `campaign_group_id`, portanto uma pendência compartilhada não é multiplicada pelas seis assinaturas Plurix.
- Os estados técnico, editorial, visual e de certificação são independentes. Pronto tecnicamente não significa certificado; o Test Send no SFMC continua sendo a validação final.
- Múltiplos CTAs são registrados como ocorrências individuais e não geram penalidade genérica. A validação deve observar destino, tracking, coerência de ação e papel na régua.
- A aplicação não chama IA, não guarda chave de provedor e não dispara análise automática. Quando necessário, o operador pede a análise diretamente no chat a um agente autorizado a acessar o Supabase.
- O agente externo registra execução, snapshot de contexto e guardrails, valor anterior, sugestão, justificativa, evidência e confiança. A área **Revisões** apenas exibe o diff e exige aceite ou rejeição humana; nenhuma sugestão altera conteúdo silenciosamente.
- Alterações gerenciais usam controle otimista por versão e snapshots em `dynamic_email_management_versions`. Conflito entre sessões exige recarga antes de salvar.
- A área **Estratégia e guardrails** explicita papel na régua, objetivo, mensagem-chave, ação esperada, proposta de valor, benefícios, objeção e estratégia de CTA sem misturar esses dados ao CSV do SFMC.

## Produto Fábrica de E-mails — estado consolidado (2026-09-02)

O motor desta nota é apenas a camada técnica do produto. A definição completa do workspace, Revisor, biblioteca, templates compartilhados, Plano de Comunicação, criação de réguas, fontes Supabase, limites e roadmap está em [[Fabrica-de-Emails-GaaS]].


## Evolução registrada em 06/10/2026

[[Emails-Dinamicos-Plurix-V11]] consolida a investigação do V9, o contrato audiência COMUNICACAO_PLX + estado ESTADO_SEQUENCIA_CRM + briefing, o teste de dois toques confirmado pelo usuário e as melhorias publicadas na Fábrica. A V11 mantém imagem, limite e nenhum pool. Cadastrar a V11 não troca os vínculos dos briefings CRM antigos. O contrato em uso ainda tem 36 colunas e a copy da faixa permanece fixa na versão testada.

[[Fabrica-XLSX-TOPO-CRM-3]] registra a próxima especificação: mensagem de limite como coluna opcional do briefing, escrita por toque no XLSX/GaaS, rascunhos enriquecidos por IA e a nova régua de dois toques TOPO DE FUNIL (CRM) 3. Essa evolução foi alinhada e documentada em prompt, mas não implementada; não tratar a futura coluna 37 ou o importador como disponíveis.
