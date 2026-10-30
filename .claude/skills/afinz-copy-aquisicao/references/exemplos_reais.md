# Exemplos reais de disparo — padrões observados em prints

Este arquivo não é uma coleção de imagens (a skill não lê imagens em tempo real). É uma **transcrição de padrões** encontrados numa amostragem de 12 prints reais de disparo (pastas pessoais do Pablo `WHATSAPP AQUISIÇÃO COPA` e `COMUNICAÇÕES`, analisados em 2026-08-12), pra dar ao LLM exemplos calibrados do que "boa copy de aquisição Afinz" parece na prática — não só regras abstratas.

⚠️ **Cobertura parcial.** Só 12 imagens de um arquivo bem maior foram vistas. Isto documenta padrões *encontrados*, não um catálogo completo. Não tratar como exaustivo — se um padrão novo aparecer numa peça real que não bate com o que está aqui, o padrão real vence, não este arquivo.

⚠️ **Proveniência mista.** Parte do material (pasta Copa 2026) tem indícios de ser envio de teste/QA para o próprio Pablo (nome "Pablo"/"pablooooo"/"Pietra" no corpo, limites de crédito com cara de placeholder tipo R$32.423) — não necessariamente confirmado como disparo real pra base de clientes. Os *padrões estruturais* (troca de CTA, nome de produto por BU, ganchos por campanha) são válidos independente disso; os *valores exatos* (limite, nomes) não devem ser copiados literalmente como se fossem dado real.

## Padrão 1 — CTA muda conforme a fonte do lead (mesmo slot, audiência diferente)

Mesmo slot (B2C, Carrinho, D+21, fechamento), duas variantes de audiência:

- **Institucional** (lead sem conta confirmada no app): CTA = "Pedir agora". Mensagem não assume que a pessoa já tem cadastro.
- **Serasa** (lead que veio de parceria com bureau de crédito, já tem conta no app): CTA = "Continuar pedido". A mensagem inclui instrução explícita de reengajamento — "Volte ao app Afinz", "Clique em 'Já sou cliente'", menção ao fluxo de "esqueci minha senha".

**Regra pra copy nova:** antes de escrever o CTA, perguntar "esse público já tem conta no app ou não?" — se sim, o CTA e o corpo devem reconhecer isso (retomar/continuar, não iniciar do zero) e incluir o caminho de login. Se não, CTA de primeira ação ("Pedir cartão", "Pedir agora").

## Padrão 2 — nome de produto muda por BU (ver `parceiros.md`)

B2C = "cartão Afinz Visa" · Bem Barato = "cartão Bem Mais Afinz Visa" · Plurix = "cartão +amigo Afinz Visa". A copy sempre nomeia o produto explicitamente no corpo e no botão do CTA (ex: "Pedir meu Bem Mais", "Pedir cartão +amigo") — não usa só "cartão Afinz" genérico quando existe nome de produto específico do parceiro.

## Padrão 3 — dois ganchos de oferta distintos, não misturar

- **Gancho promocional/sazonal** (ex.: campanha Copa 2026 "Meu Afinz Visa Bate um Bolão" — R$50 mil/mês + R$300/dia em prêmios): usado nos disparos de 2026 vistos, sempre com o texto de regulamento obrigatório ("Sujeito à análise de crédito. Consulte regulamento em [site]").
- **Gancho de benefício recorrente** (cashback Vibe "Ganhe R$100 em créditos Vibe na 1ª compra", desconto de até 70% em consultas/exames/medicamentos): usado no material de 2025 (campanha "Aniversário Afinz 35 anos"), presente nos três canais (WhatsApp, e-mail, SMS) da mesma leva.

Os dois ganchos não apareceram misturados na mesma peça — cada campanha parece escolher um gancho principal e sustentar ele em todos os canais daquela onda. Ao escrever, checar qual campanha/gancho está ativo (ver `campaign_context` / decisão do vault sobre Vibe virando tema-líder a partir de 2026-08-17) antes de decidir qual usar.

## Padrão 4 — sempre dois CTAs, nunca um só

Todo exemplo de WhatsApp visto tem CTA duplo: ação positiva ("Pedir meu cartão" / "Pedir agora" / "Continuar pedido") **e** ação de saída explícita ("Não tenho interesse agora"). Nenhum exemplo forçava só uma saída.

## Padrão 5 — campos de personalização variam por canal (evidência do lote 2025, tags cruas)

Vistos como merge tags não resolvidas nos prints de template (não em disparo renderizado):

- WhatsApp: `%%FirstName%%`, `%%ZipCode%%`
- E-mail: `%%FIRST_NAME%%`, `%%limite_novo%%`
- SMS: `%%LIMITE%%`

Nomenclatura de tag não é 100% consistente entre canais (`FirstName` vs `FIRST_NAME`, `ZipCode` vs nada equivalente em e-mail/SMS) — não assumir que existe um dicionário único de merge fields cross-canal sem confirmar contra o sistema de disparo real de cada canal.

## Nota sobre rótulo de canal pela pasta

Um arquivo (`.../CARRINHO/DIÁRIO/.../*.png`) estava na árvore de pastas do WhatsApp mas o conteúdo era claramente um **push notification** (banner curto, cabeçalho "APP NAME · Agora"), não uma tela de WhatsApp. **Não confiar no caminho da pasta como fonte de verdade do canal** em qualquer pipeline automatizado — validar pelo formato visual do próprio print.

## Relacionado

- `parceiros.md` (nomes de produto por BU)
- Vault: `Galeria-de-Templates.md` (decisão aberta "pipeline de captura", achado 2026-08-12 documentado lá)
- Vault: `communication_templates.md`, `communication_slots.md`
