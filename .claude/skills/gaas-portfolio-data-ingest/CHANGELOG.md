# Changelog

## 0.2.0 — 2026-11-04

- Mapa canônico dos 21 datasets para sete contratos, notas consumidoras, contexto relacionado, responsáveis e produtos de saída.
- Contrato leve compartilhado por Seguros, Wiki e adaptador Office; contratos ainda não implementados permanecem `planned`.
- Impactos de versões certificadas conectados à Fila existente, sem aprovar ou reescrever notas automaticamente.
- Recibo local distingue consumidores potenciais de atualização efetiva; arquivos ignorados não produzem previsão de impacto.

## 0.1.0 — 2026-11-04

- Inventário de 21 famílias de dados e relação com tabelas, modelos Office e visões do GaaS.
- Distinção explícita entre tabelas observadas, propostas, adaptadores brutos e camada de leitura ainda pendentes.
- Contrato de inclusão incremental: preservar chaves e períodos encerrados; sem sobrescrita automática.
- Planejador local de inclusão com classificação de duplicados, histórico, conflitos e mapeamentos ausentes; sem conexão ao banco.
