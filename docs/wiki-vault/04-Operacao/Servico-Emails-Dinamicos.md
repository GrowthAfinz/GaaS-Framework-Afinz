---
tags: [servico, crm, email, sfmc, onboarding]
tipo: operacao
camada: operacao
atualizado: 2026-10-02
status: confirmado
fonte: codigo-gaas
publico: [pessoas-novas, ias, operacao-interna]
---

# Serviço Interno de E-mails Dinâmicos

**Definição:** processo interno que transforma produto, público e intenção de comunicação em e-mails versionados, exportáveis e testados no SFMC.

## Quando usar e qual é a entrega

Usar para criar, adaptar ou revisar réguas de e-mail com conteúdo variável por produto, campanha e sequência. O serviço entrega o plano, os briefings técnicos, os ativos referenciados, o CSV e o registro das validações. O envio real exige operação no SFMC.

Uma régua é o conjunto organizado de toques; um briefing é o conteúdo de um toque; uma assinatura adapta sua identidade à bandeira; o template é o HTML/AMPscript que transforma os dados em peça. Esses objetos não são intercambiáveis.

## Entradas necessárias

| Entrada | Fonte / verificação |
|---|---|
| Produto comercial, parceiro e bandeira | [[Dicionario-de-Produtos]] e [[Bandeiras-Plurix]] |
| Benefícios e restrições | [[Beneficios-e-Vigencia]], [[Pode-Dizer-Nao-Pode-Dizer]] e guardrails ativos do GaaS |
| Público e momento | [[Segmentos]], regra da régua e elegibilidade real no SFMC |
| Objetivo e progressão | [[Briefing-e-Regua-de-Aquisicao]] |
| Conteúdo e ativos | [[Fabrica-de-Emails-GaaS]], URLs governadas e validade da oferta |
| Contrato técnico | [[Emails-Dinamicos-SFMC]] e DE aplicável |
| Critério de sucesso | evento de negócio, janela e referência de comparação |

Se uma entrada faltar, registrar a lacuna e o efeito no trabalho. Não inventar limite, tamanho de audiência, intervalo entre toques ou condições comerciais.

## Procedimento completo

1. **Entender o produto:** confirmar marca, público, benefício principal, prova e restrições. Separar regra de aquisição de requisito para pedir o cartão.
2. **Planejar a régua:** dar um papel a cada toque, definir o comportamento esperado, o sinal de entrada, a cadência aplicável e as supressões.
3. **Preparar o briefing:** preencher conteúdo, campos técnicos, ativos, CTA e legal por sequência e assinatura. Preservar a chave composta.
4. **Revisar:** confrontar planejado e peça, resolver placeholders e conferir validade, marca, renderização e destinos de todos os CTAs.
5. **Exportar:** validar o CSV de 36 colunas, datas e integridade de registros; metadados editoriais ficam no GaaS.
6. **Importar e testar no SFMC:** conferir a DE, a unicidade, o template ativo, o lookup e as amostras de Test Send.
7. **Operar a jornada:** verificar entrada, reentrada, atualização da sequência e supressões. Test Send não certifica a configuração da jornada.
8. **Medir:** reconciliar a versão enviada, o identificador, o público e os eventos; separar diagnóstico de e-mail de resultado de aquisição.

## Responsabilidades

CRM prepara e opera; Produto/Negócio valida benefícios e audiência; Criação entrega os ativos; responsável pela operação SFMC registra o Test Send e a configuração de jornada. Os nomes dos responsáveis não estão consolidados nesta nota: identificar o dono por campanha antes de executar. Uma IA pode reunir evidências e sugerir alterações dentro do pedido; aceite editorial e certificação continuam explícitos.

## Critérios de conclusão

- Plano e briefing correspondem à mesma régua e versão.
- Benefícios, imagens, marca e legal têm fonte e escopo.
- Não há duplicidade de chave de briefing ou placeholder pendente.
- CSV foi validado e importado sem perda de conteúdo.
- Test Send aprovado tem data, template/versão, sequência/assinatura e evidência.
- Jornada real foi verificada quando houver disparo automático.

Se só o CSV estiver entregue, registrar **exportado**. Se só a prévia estiver correta, registrar **QA local**. Não declarar **certificado no SFMC** sem a evidência correspondente.

## Exemplo documentado e limites

[[Emails-Dinamicos-Plurix]] registra a implementação Plurix e o teste de 10/08/2026. É evidência histórica de funcionamento daquele recorte; não certifica mudanças posteriores. As seis assinaturas operacionais não equivalem a todas as redes comerciais do Clube.

## Erros e recuperação

| Sintoma | Conferir | Recuperação |
|---|---|---|
| Briefing não encontrado | produto, campanha e sequência nos dois lados | corrigir a chave e repetir teste |
| Data inválida na importação | locale da BU e formato de entrada | gerar no padrão homologado e conferir datas não ambíguas |
| Arquivo inválido / colunas deslocadas | BOM, delimitador, aspas e quebras cruas | reexportar e validar round-trip |
| Sequência não muda | Journey Data congelado versus leitura da DE atual | revisar lookup e Update Contact no template/jornada real |
| Peça correta, nenhum envio | filtro, ativação, entrada e supressões | revisar jornada; não recarregar audiência às cegas |
| Marca antiga em arte/rodapé | guardrail e ativo por assinatura | substituir ativo e repetir QA/Test Send |

## Fontes e lacunas

Fontes: [[Fabrica-de-Emails-GaaS]], [[Emails-Dinamicos-SFMC]], [[Emails-Dinamicos-Plurix]], código `src/modules/dynamic-email` do GaaS e leitura de governança de produto no Supabase em 02/10/2026. Não houve acesso ao SFMC nesta revisão. Permanecem a confirmar: configuração atual de cada DE/jornada, evidências dos testes mais recentes e responsável nominal.

## Relacionado

- [[Enciclopedia-Servicos-Growth]] · [[Briefing-e-Regua-de-Aquisicao]] · [[Ficha-de-Produto-Guia]]
- [[SFMC-Salesforce-Marketing-Cloud]] · [[Fontes-e-Proveniencia-Growth]]
