# Régua de Comunicação — layout de referência

Este arquivo documenta a estrutura de um deck "régua de comunicação": um deck operacional que
mostra, disparo por disparo, o que foi (ou vai ser) enviado numa jornada — não é um deck de
apresentação estratégica, é documentação viva de cadência. Referência real:
`assets/afinz_exemplo_regua_vibe_topo_funil.pptx` (10 slides, "Régua de Comunicação — Vibe,
Topo de Funil B2C", Julho/2026, 8 e-mails documentados, atualizado em 14/08/26 — deck real de
produção, não mockup).

Use este layout sempre que o pedido for "régua de [segmento]", "documenta os disparos de X",
ou similar — não confundir com o deck de `afinz-pptx-campanha` (aquele é pitch/campanha para
audiência externa; este é documentação interna operacional para o time de CRM).

## Anatomia (3 tipos de slide, sempre nesta ordem)

**1 — Capa** (layout `Capa`). Título curto do tema (ex. "Vibe"), subtítulo "Régua de
Comunicação", mês/ano.

**2 — Divisória** (o exemplo real usou o layout genérico `Título e Conteúdo` — **isso é um
desvio do padrão da marca**; o layout correto conforme `brand_spec.md`/SKILL.md principal é
`Slide respiro / Título` ou `Sub-Capa / Seção`. Ao gerar uma régua nova, use o layout correto
da marca, não repita esse desvio). Conteúdo: "Régua de Comunicação" + segmento (ex. "Topo de
Funil - B2C").

**3 — Um slide por disparo** (layout `Gráfico + TXT`, repurpuseado — o placeholder de gráfico
vira o placeholder da imagem/mockup). Geometria exata (polegadas, a partir do canto superior
esquerdo, slide 13,33"×7,5"):

| Elemento | Posição (x, y) | Tamanho (l × a) | Formatação |
|---|---|---|---|
| Título 2 linhas | 1.13, 0.67 | 5.96 × 0.98 | Linha 1 bold 28pt ("Régua de Aquisição - {BU}"), linha 2 bold 24pt (segmento) |
| Label do disparo | 1.13, 2.15 | 4.23 × 0.44 | Bold 20pt (ex. "E-mail 1") |
| Bloco de campos | 1.13, 2.78 | 4.67 × 2.52 | Ver campos por canal abaixo — rótulo bold 16pt, valor regular 16pt, mesma linha |
| Link/identificador técnico | 1.13, 5.72 | 4.28 × 1.43 | Rótulo bold 16pt + valor 10.5pt (fonte menor pq é URL/ID longo) |
| Screenshot/mockup | 6.42, 1.87 | 2.75 × 5.63 | Imagem em pé (proporção de tela de celular), alinhada à direita |
| "Atualizado em DD/MM/AA" | 10.28, 2.59 | 2.48 × 0.37 | Bold 16pt, canto superior direito |

## Campos por canal — o que muda no bloco de texto

O exemplo real é 100% e-mail (porque a régua de Topo de Funil roda em E-mail/SMS, conforme
`Estrutura BAU CRM - OFERTA VIBE`). Para adaptar a mesma anatomia a WhatsApp/SMS/Push, troque
o conteúdo do "bloco de campos" e mantenha a geometria:

| Campo (e-mail, real) | Equivalente WhatsApp/SMS | Equivalente Push |
|---|---|---|
| Assunto | *(não existe — WhatsApp/SMS não têm assunto)* | Título da notificação |
| Pré-cabeçalho | Primeira linha visível da mensagem (o "gancho" antes do corpo) | Corpo resumido |
| Caminho do e-mail no SF | Nome do template (ex. `afz_car_vis_aqs_wpp_car_d0institucional_diario`) + jornada | idem |
| Link do e-mail | Link AppsFlyer do disparo (`onelink.me/...&af_sub3=...`) | idem, se houver deep link |
| *(campo novo)* | Variante de público (Institucional/Ecred/Serasa — ver `reguas_taxonomia.md` da skill `afinz-copy-aquisicao`) | idem |
| *(campo novo)* | Texto completo da mensagem (WhatsApp/SMS têm o texto inteiro visível, diferente do e-mail que é majoritariamente visual) | Corpo completo |

Rótulo "E-mail N" vira "WhatsApp N" / "SMS N" / "Push N" conforme o canal.

## Onde já existe matéria-prima real para Carrinho Abandonado B2C

Antes de gerar essa régua do zero, checar o que já foi extraído nesta mesma sessão de
trabalho — pode evitar reescrever copy que já existe:

- **`Templates-Vibe-Revisao-2026`** (vault, `02-Entidades-Dados/`) — 61 templates reais
  extraídos da planilha oficial `REVISÃO VIBE.xlsx`, incluindo especificamente WhatsApp e SMS
  de Carrinho Abandonado B2C (`REVISÃO CARRINHO ABANDONADO`, imagens `image41` a `image50`
  aprox.) com nome real de template, jornada, texto completo, oferta, CTA e indicação de
  variante (`institucional`/`ecred`/`sabado`/`diario`) já extraídos.
- **`Amostras-Comunicacoes-Reais`** (vault, `02-Entidades-Dados/`) — 73 prints adicionais,
  incluindo Carrinho Abandonado B2C em Push (canal que a planilha de governança cobre mas o
  dataset de screenshots pegou com mais detalhe).
- **`Reguas-Inteligentes-Arquitetura.md`** (vault, `05-Estrategia/`) — a matriz de régua
  completa (`Estrutura BAU CRM - OFERTA VIBE`): Carrinho Abandonado tem 3 sub-jornadas
  (Diário/21D/Sábado), cada uma com 3 disparos, em WhatsApp + SMS + Push — ou seja, uma régua
  completa de Carrinho Abandonado B2C (uma sub-jornada) são **9 slides de disparo** (3 canais ×
  3 disparos), não 3.
- **Skill `afinz-copy-aquisicao`**, `references/reguas_taxonomia.md` — mesma matriz, já em
  formato de consulta rápida pra copy nova.

**Consequência prática**: ao montar a régua de Carrinho Abandonado B2C, primeiro puxar o que
já existe extraído (screenshot real vira o "Screenshot/mockup" do slide, texto real vira o
bloco de campos) e só gerar copy nova via `afinz-copy-aquisicao` para as combinações
canal×disparo×variante que ainda não têm exemplo real — sinalizando no próprio slide (ex. nota
de rodapé "copy proposta, sem disparo real ainda") qual é qual, pra não passar rascunho como
se fosse produção.

## Erros a não repetir

- Divisória usando layout genérico do PowerPoint em vez do layout de marca (`Slide respiro /
  Título`) — ver acima.
- Nenhum QA visual reportado no arquivo original (não há indício de conversão para imagem
  antes da entrega) — sempre rodar o processo de QA da skill `pptx` (converter em imagem e
  inspecionar) antes de entregar uma régua nova.
