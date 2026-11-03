---
tags: [dados, comunicacoes, amostras, llm-extraction]
tipo: dados-brutos
camada: dados
atualizado: 2026-08-17
status: confirmado
fonte: analise-manual-llm
---

# Amostras de Comunicações Reais — dataset extraído por LLM vision

**Definição:** dataset bruto de 73 disparos reais (WhatsApp, Push, E-mail, SMS) de aquisição de cartão Afinz, extraído por leitura visual (LLM) dos prints armazenados nas pastas pessoais do Pablo `WHATSAPP AQUISIÇÃO COPA` e `COMUNICAÇÕES` (fora do vault, no OneDrive). Informação bruta — sem curadoria adicional além da extração em si.

## Arquivos

- `dataset_completo.json` — os 73 registros, um por imagem, campo a campo.
- `afinz_briefing_dataset.csv` — mesmo dataset em formato tabular.

## Como foi extraído

Snapshot em 2026-08-12. 8 subagentes rodaram em paralelo, cada um lendo um lote de imagens e devolvendo JSON estruturado com um prompt padronizado (mesmo schema, mesmas instruções, para todos os lotes). Nenhuma curadoria humana foi feita sobre o conteúdo extraído — é leitura direta do que está escrito/desenhado em cada print.

## Campos por registro

`caminho_arquivo` · `bu` · `segmento_etapa` · `sub_jornada` · `variante_publico` (Institucional/Serasa) · `canal_pasta` (o que a estrutura de pasta original sugeria) · `canal_detectado` (o que a imagem realmente mostra ser) · `produto_nome` · `texto_completo` · `oferta` · `promocional` · `cta_principal` · `cta_secundario` · `elementos_visuais` · `tom` · `campos_personalizacao_visiveis` · `indicio_teste_qa` · `campanha_provavel` · `confianca_extracao`.

## Cobertura e limites — ler antes de usar

- **Cobre as 73 imagens que existiam nas duas pastas em 2026-08-12.** Se novas imagens foram adicionadas às pastas originais desde então, elas **não** estão neste dataset — isto é um snapshot pontual, não uma sincronização contínua.
- **73% (53/73) foram flagadas `indicio_teste_qa = true`** — nomes tipo "Pablo"/"Pietra"/"pablooooo" e limites de crédito com cara de placeholder (ex. R$32423). Isso sugere que boa parte do lote `WHATSAPP AQUISIÇÃO COPA` são prints de validação/QA, não confirmadamente disparos reais para a base de clientes. Tratar `indicio_teste_qa=true` como "não confirmado como envio real", não como "confirmado como teste".
- **6 imagens têm `canal_pasta` divergente de `canal_detectado`** — todas em `B2C/CARRINHO/DIÁRIO`, marcadas como WhatsApp pela pasta mas com conteúdo visual de push notification. Não confiar no caminho da pasta como fonte de verdade de canal.
- Nenhum registro deste dataset foi vinculado a um `template_id` real da tabela `communication_templates` — essa tabela usa `template_id` como chave primária (`NOT NULL`, com validação de formato), então não é possível promover estas linhas para lá sem antes atribuir um `template_id` de verdade vindo da planilha de governança (`gaas-governanca-comunicacoes`). Ver decisão aberta em [[Galeria-de-Templates]].

## Relacionado

- [[communication_templates]] · [[communication_slots]] · [[Galeria-de-Templates]] · [[Decisões-Abertas]] · skill `afinz-copy-aquisicao` (`references/exemplos_reais.md` resume os padrões encontrados aqui em prosa)
