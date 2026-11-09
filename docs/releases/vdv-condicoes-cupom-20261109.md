# Pool Visa: condições compactas e cupom selecionável · 09/11/2026 (r6)

## O que mudou

**Condições.** O bloco volta à apresentação compacta: título “Condições das ofertas”, uma linha por marca exibida (texto específico de cada oferta, vindo de `CONDICOES` da oferta) e, depois de todos os resumos, o aviso legal **uma única vez**, em bloco separado. O aviso continua vindo do campo `CONDICOES` do registro `TEMA_BF26_V1` (280 caracteres), o que respeita o limite de 500 caracteres das condições de cada oferta. O rodapé `RODAPE_CONDICOES` do tema (“Ofertas e cupons de responsabilidade de cada parceiro…”) foi preservado, abaixo do aviso; é uma frase diferente, então não há texto duplicado. O texto legal não está fixo no HTML.

**Cupom.** O código segue como texto visível. Ganhou `user-select:all` (seleção de um toque/clique, onde o cliente aceita) e a dica “Selecione o código para copiar”, que só existe dentro do bloco de cupom (resgate `CUPOM` com código preenchido). Não há JavaScript, botão, formulário nem `mailto`.

## Por que não há botão “Copiar”

Copiar para a área de transferência exige JavaScript e a API de clipboard. Clientes de e-mail removem scripts (Gmail, Outlook, Apple Mail e demais). Um botão desses pareceria funcionar e falharia em silêncio. Uma cópia de um toque de verdade só é possível em uma página web (LP ou CloudPage) aberta pelo link do card. A seleção por CSS é melhoria progressiva: onde não for suportada, o código continua sendo texto comum, selecionável do modo normal.

Referência de suporte (Can I Email, `user-select`, consultado em 09/11/2026; documentação, não teste próprio): suportado em Apple Mail macOS (prefixo `-webkit-`), Gmail Android e webmail mobile, Outlook Windows e Android, Samsung Email; no Apple Mail iOS o valor `all` não funciona; o ProtonMail ignora `all`; Gmail desktop/iOS e Outlook.com/macOS/iOS retiram a propriedade quando ela está em `<style>`, o que não é o caso aqui (está inline). Nenhum cliente real foi testado por mim.

## Alterações

- `fixtures/vaiDeVisaPoolTemplate.ts`: condições e cupom (gerado por `scripts/email-factory/update_vdv_conditions_coupon.py`, com âncoras estritas).
- `components/PoolEmailEditor.tsx`: rótulo do campo `CONDICOES` agora “Aviso legal (aparece uma vez, após as condições das marcas)”.
- Testes: `vdvCtaLegal.test.ts` ajustado (aviso 1x); novo `vdvConditionsCoupon.test.ts`.

Sem mudança de dados: as 41 colunas, o TEMA e as 66 ofertas permanecem como estavam; nenhum CSV precisa ser reimportado. Assunto e pré-cabeçalho são os mesmos (o bloco de inicialização AMPscript não mudou).

## Validação local (não substitui o Test Send)

Testes de V1 e V2 com 1, 2 e 3 ofertas, com e sem cupom: aviso uma vez, linhas na ordem, links e aliases das ofertas, CTA “Ver mais ofertas” único, dica só com cupom. Inspeção em navegador: desktop 2+1 com a terceira centralizada, mobile de 390 px em coluna, sem rolagem horizontal. Test Send no SFMC desta revisão: pendente.
