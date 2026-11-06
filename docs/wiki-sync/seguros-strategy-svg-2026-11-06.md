# Estratégia de Seguros: revisão editorial e diagramas

Escopo autorizado: publicar a revisão da nota `05-Estrategia/Estrategia-de-Segmentacao-de-Seguros.md` e dois SVGs no GaaS. Não cria DEs, ativa jornadas ou altera automações do SFMC.

## Conteúdo e assets

- Nota viva: `25931632-8994-4550-8333-290419fd9a15`.
- Hash-base para publicação com controle de concorrência: `e607e2dc984735eb9b31ea83f56bb9951f1fe71e138b5da2b75cee3831a188f9`.
- SVGs estáticos em `public/wiki-diagrams/seguros-percurso-v2.svg` e `seguros-sfmc-v2.svg`.
- Geração determinística: `python scripts/build-insurance-wiki-diagrams.py`.
- As imagens usam SVG com título, descrição acessível e viewBox; não contêm scripts nem dependências externas. O Markdown oferece abertura do desenho em tamanho ampliado.

## Decisões preservadas

Mensal por semanas; intervalo configurável de 15 dias; triggers abertos durante o intervalo; mensal ativa descarta novo trigger do mesmo produto; trigger ativo permite mensal; encerramento por mais de 15 dias sem avanço não acrescenta nova espera; formulário suspende ofertas durante processamento; posse confirmada exclui aquisição do produto.

Ordem dos produtos, grupo controle, intervalo entre triggers, detalhes de contratação/MAPA e cadência da fonte MCC continuam como pendências identificadas, sem aprovação implícita.

O registro de decisões de trigger pode ficar no lake. `SEGUROS_TRIGGER_CONTROLE` é uma alternativa proposta somente se a fonte não guardar as decisões; não duplica todas as transações.

## Validação e publicação

SVGs inspecionados visualmente no navegador local; XML válido. Vault local recompilado e lint executado. O drift preexistente fora da nota foi preservado.

Publicar a nota no Supabase somente depois de os SVGs estarem disponíveis no deploy da main. Preservar a revisão anterior e atualizar somente a nota autorizada, com teste do hash-base. Conferir hash final, links e imagens na Wiki autenticada após publicação.

## Referências editoriais

- [Diátaxis: Start here](https://www.diataxis.fr/start-here/): separar explicação da referência técnica.
- [GOV.UK: Understand content design](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/plan-manage-content/understand-content-design/): organizar pela necessidade do leitor e reduzir duplicação.
