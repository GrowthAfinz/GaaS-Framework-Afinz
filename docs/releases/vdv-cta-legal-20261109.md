# Pool Visa: CTA final e aviso legal · 09/11/2026

A fonte única continua com desktop 2+1 e mobile em coluna. O botão adicional “Ver mais ofertas” fica após os cards, antes das condições. O campo LINK da linha TEMA controla seu destino; vazio oculta o bloco. Os links dos cards continuam específicos de cada oferta. O editor mostra o campo como “Link de Ver mais ofertas”. O contrato continua com 41 colunas, sem criação de campos no SFMC.

O destino recebido na referência é https://www.visa.com.br/promotions/visa-best-november.html (normalizado para HTTPS). O aviso solicitado foi acrescentado após as condições preexistentes de cada uma das 66 ofertas, uma única vez por registro. O tema mantém V2 herdando o envelope compartilhado quando não há override.

- Assunto: Black Afinz: confira as ofertas do seu {CARTAO} 💳💙
- Pré-cabeçalho: Ofertas selecionadas para você e mais benefícios no site da Visa. Confira!

O snapshot editorial da alteração está em `src/modules/dynamic-email/fixtures/vdvBF26CtaLegal.json`. A fonte do editor/exportador está em `vaiDeVisaPoolTemplate.ts`. O gerador recebe snapshot e destino por argumentos; não conecta ao banco.

## Aplicação na Fábrica

67 registros atualizados pelo RPC transacional `save_vdv_factory`, com versões esperadas. Os e-mails afetados foram versionados pelo fluxo nativo e marcados para revisão quando necessário. Slot `builtin-vdv-pool` atualizado de r3 para r4, MD5 `f38d0afea173e7de9b14f5d9b80a7bd7`, 49.335 bytes. Nenhum slot histórico, hero, cupom, URL de marca, vigência, posição, audiência ou automação foi alterado.

## Importação no SFMC

O CSV parcial tem 66 ofertas e um tema, com todas as 41 colunas atuais. Importar por ID em Adicionar/Atualizar, UTF-8, vírgula e qualificador aspas duplas. Não usar Overwrite com o arquivo parcial. O pacote inclui cópia completa de 89 linhas, HTML/AMPscript completo em HTML/TXT e pré-cabeçalho com inicialização protegida. Substituir o código-fonte completo e realizar novo Test Send; o recebimento da versão anterior não certifica esta alteração.

## Validação

57 testes de seleção, envelope, contratos e layout passaram. O CSV fez round-trip pelo importador/exportador nativo com 41 colunas, preservando aspas e caracteres. V1 e V2 foram renderizados com um, dois e três cards; cada marca mantém o aviso, há um único CTA adicional, e tema sem LINK não cria botão vazio. Inspeção visual local confirmou CTA e condições; mobile de 390 px permaneceu sem overflow horizontal. Test Send desta revisão continua pendente.
