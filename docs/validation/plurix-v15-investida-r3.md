# V15 revisao 3: nome tratado da investida

Pedido de 28/10/2026: manter o corpo em HTML e substituir a referencia generica ao supermercado por uma variavel com nome tratado da investida. Publicar na main e no template V15 existente.

## Contrato

`@NomeInvestida` deriva de `@Produto`, ja normalizado a partir de `PRODUTO` da audiencia. Nao cria coluna na DE nem usa dado pessoal em URL.

| Chave | Nome de exibicao |
|---|---|
| AMIGAO | Amigão |
| BOA | Boa |
| AVENIDA | Avenida |
| COMPRE MAIS | Compre Mais |
| PARANA | Paraná |
| SUPERPAO | Superpão |

Os nomes acima atendem ao pedido explicito desta revisao. O mapeamento editorial global do importador, que mantinha generico em Compre Mais e Superpao, nao foi alterado.

Nos 24 briefings da V3, somente `COPY_1_PRETO` recebe `%%=v(@NomeInvestida)=%%` no ponto que menciona a rede. Preserva do/no, tags HTML, pontuacao e todo o resto do texto. Exemplo: `dentro e fora do Supermercado` vira `dentro e fora do %%=v(@NomeInvestida)=%%`.

Preserva imagens, faixas, links, CTAs, corpo HTML, mensagens de limite, cores da revisao anterior, datas e `TP_CAMPANHA=CRM`. Nao altera V2, audiencia ou jornada SFMC. A referencia a mercado nos titulos de beneficios permanece editorial, sem substituicao ampla.

## Evidencia

- V15 revisao 3: MD5 `f53a3890fc3e18dcd469e6d05d420b50`, 60851 caracteres.
- SQL com guarda da fonte anterior e das 24 versoes/textos antes de atualizar.
- Snapshot anterior quando ausente e nova versao de cada briefing gravados no historico.
- Testes de normalizacao, acentos, aliases, preposicoes e idempotencia.
- Teste do AMPscript versus espelho de preview para as seis redes; render usa PRODUTO da audiencia, mesmo quando o briefing do teste diverge.
- 275 testes do modulo e 96 renders locais. Sem variavel vazada, overflow ou imagem quebrada.
- Preparo anterior preservado, exceto o bloco explicito do nome. Destinos href/src identicos.
- Simulacao transacional completa com rollback antes da aplicacao.

## Entrega SFMC

O pacote contem HTML/TXT R3, assunto, pre-cabecalho com preparo atualizado e CSV das 24 linhas. Atualizar o HTML e o pre-cabecalho no Content Builder e importar o novo CSV, pois a referencia dinamica vive no briefing.

Corpo continua em HTML por escolha do usuario. Esta revisao nao promete impedir a recoloracao pelo Outlook. Test Send com os seis produtos continua sendo a validacao operacional final.

Migration aplicada: 20261028205939_plurix_v15_investida_name.sql. Banco confirmou revisao 3 e variavel nos 24 briefings. Typecheck sem erros novos e build local passaram.
