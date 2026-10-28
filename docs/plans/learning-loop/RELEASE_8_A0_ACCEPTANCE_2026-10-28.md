# Release 8 — A0 homologado

Em 28/10/2026, Pablo respondeu **“podemos seguir essas sugestões”** à proposta de homologação do piloto no chat desta implementação.

Aceite de negócio:

- `CRM-92fbd40403`: BU Plurix, segmento Negados, parceiro Plurix.
- `CRM-a695575900`: BU B2C, segmento Aprovados_nao_convertidos, parceiro Proprietaria.
- Responsável inicial pela revisão: Pablo Prado.
- Sensibilidade Moderada mantida; frescor de 7 dias para CRM/B2C/funis e 3 dias por plataforma de mídia.
- Backtest explicado aceito para o piloto; quatro sinais com cartões ausentes em três operações permanecem bloqueados até esclarecimento com a origem BI.

O aceite confirma esses dois escopos e permite prosseguir com a implantação em observação descrita na proposta. Não confirma os demais escopos, não converte ausências em zero, não autoriza criação automática de apostas e não ativa emissão de candidatas na Fila. A ativação continua uma etapa própria, conforme explicitado antes do aceite.

`pilot-approved.json` é o manifesto de aplicação restrito. Instantes de gravação/implantação são valores de sistema do banco; a data do aceite não deve ser convertida em um horário humano inventado. A configuração numérica T1/T2 não mudou; somente a proposta provisória de tolerâncias T5 passou a homologada.
