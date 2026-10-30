# Registro de Parceiros — Complemento à skill growth-brain-intelligence-engine

Este arquivo só existe para parceiros que **não** estão na tabela "Parceiros e perfis típicos" da skill `growth-brain-intelligence-engine`. Antes de adicionar uma linha aqui, confira se o parceiro já está lá — se estiver, use aquela fonte e não duplique.

Quando a skill `afinz-copy-aquisicao` perguntar os dados de um parceiro novo (Passo 4 do fluxo), adicione a linha correspondente abaixo. Não apague entradas antigas — parceiros podem voltar a ser usados depois de um tempo parado.

| Parceiro | Sigla (se houver) | BU | Tipo | Tom / restrição de marca | Segmento(s) típico(s) | Registrado em |
|---|---|---|---|---|---|---|
| Bem Barato | bbt (e-mail: `bb`, WhatsApp: `bbt` — a governança unifica os dois para `Bem_Barato`) | B2B2C (a confirmar) | Rede varejista | *(a preencher na primeira vez que for usado — perguntar: ordem de menção da marca, tom, restrições)* | CRM / Leads_Parceiros (provável) | — |

> Nota 2026-08-12: a duplicidade "Bem Barato"/"Bem_Barato" que o vault (`Inconsistências-a-Corrigir.md`) registrava como pendente parece resolvida na base ao vivo (consulta ao Supabase em 12/08 só retornou "Bem Barato", grafia única, 173 activities). Confirmar antes de assumir 100% corrigido — a nota do vault ainda não foi atualizada para refletir isso.

## Nomes de produto co-brandados (por BU)

Achado em amostragem de prints reais de disparo em 2026-08-12 (pasta pessoal do Pablo, ver `references/exemplos_reais.md`). Cada BU chama o cartão por um nome diferente na comunicação — isso **não é a mesma coisa que a sigla/BU da taxonomia de Activity Name**, é o nome de produto que aparece no corpo da mensagem pro cliente. Usar o nome certo na copy é obrigatório, não estético (é o nome do produto que a pessoa efetivamente vai pedir).

| BU / Parceiro | Nome do produto na copy | Evidência | Confirmar |
|---|---|---|---|
| B2C (Afinz proprietária) | "cartão Afinz Visa" | Repescagem/Upgrade/Carrinho Copa 2026 | — |
| Bem Barato (BB) | "cartão Bem Mais Afinz Visa" | Repescagem/Carrinho 21D Copa 2026 | Confirmar se "Bem Mais" é nome fixo do produto ou específico da campanha Copa |
| Plurix | "cartão +amigo Afinz Visa" | Repescagem/Upgrade Copa 2026 | Confirmar se "+amigo" é nome fixo do produto Plurix ou só desta campanha |
| Dia | *(sem evidência ainda — nenhum print de Dia foi visto nesta amostragem)* | — | Pendente |

> ⚠️ Essa tabela veio de uma amostra pequena (prints da campanha Copa 2026, ago/2026). Antes de tratar como regra permanente, checar com quem aprova naming de produto se "Bem Mais" e "+amigo" são nomes fixos da linha de produto do parceiro ou apelidos específicos dessa campanha promocional.

## Como preencher uma linha nova

1. **Parceiro** — nome como aparece no Framework (`Parceiro`).
2. **Sigla** — se já existir no dicionário de taxonomia da growth-brain, repita aqui; se não, defina uma sigla de 3 letras consistente com o padrão existente.
3. **BU** — B2C, B2B2C ou Plurix.
4. **Tipo** — base própria / bureau de crédito / rede varejista / outro.
5. **Tom / restrição de marca** — regra de co-branding (ex: "sempre citar nome da loja antes de Afinz"), termos proibidos, obrigatoriedade de logo, etc.
6. **Segmento(s) típico(s)** — em qual etapa de funil esse parceiro costuma entrar (geralmente CRM ou Leads_Parceiros para parceiros externos).
7. **Registrado em** — data (AAAA-MM-DD) de quando a linha foi preenchida, para saber se a informação está desatualizada.
