# Plano de aceite e testes — Loop de aprendizado Growth

## 1. Princípio

Validar transições e rastreabilidade antes de polimento. Uma tela bonita não compensa loop que não fecha.

## 2. Teste vertical obrigatório

```text
sinal detectado
→ post no feed
→ aposta criada
→ execução registrada
→ janela vencida
→ outcome calculado
→ veredito confirmado/contestado
→ aprendizado criado
→ aprendizado recuperado em novo caso
```

O teste preserva IDs e evidências de ponta a ponta.

## 3. Contratos unitários

### Feed

- dedupe por chave estável;
- append-only;
- prioridade reproduzível;
- recentes por timestamp;
- relevância por dimensões;
- agrupamento não esconde bloqueio/falha;
- card sem evidência fica bloqueado.

### Aposta

- não aprovar sem hipótese, ação, métrica, expectativa, janela e critério;
- owner individual pode ser nulo;
- time/frente não pode ser nulo;
- expectativa original permanece no belief snapshot;
- transições inválidas são rejeitadas.

### Outcome

- janela aberta não avalia;
- missing não vira zero;
- ação não executada não vira `not_confirmed`;
- mudança de regime pode produzir `invalid_premise`;
- `maior_melhor`, `menor_melhor` e `atingir_meta` preservam equivalência com o motor atual;
- contestação preserva veredito sistêmico e resultado resolvido.

### Memória

- todo outcome resolvido produz exatamente um aprendizado;
- fracasso e inconclusão não são descartados;
- `review_at` é obrigatório;
- memória expirada não orienta caso novo sem aviso;
- revisão preserva histórico;
- substituição não apaga o anterior;
- contradição permanece explícita.

## 4. Integração

- candidata existente gera evento de feed uma vez;
- candidato aceito liga sinal e aposta;
- aposta liga snapshot/artefato correto;
- outcome usa evidência do período contratado;
- materializador é idempotente;
- alteração via LLM/Supabase cria revisão;
- filtros compartilhados mantêm semântica entre feed e telas analíticas.

## 5. Report Live

- output publicado permanece em Relatórios;
- operações aparecem apenas em Aprendizado Growth;
- estado ativo coincide nos dois componentes;
- build/certify/publish/recovery mantêm comportamento;
- abrir a nova navegação não dispara job;
- evento `report_published` ocorre depois do commit, não no início;
- falha/bloqueio gera um evento, não um por polling.

## 6. UX

### Fila

- primeira leitura identifica prioridade em até 10 segundos;
- ação principal é visível sem tooltip;
- filtros ativos aparecem;
- drawer preserva scroll e ordenação;
- agrupamento pode ser expandido;
- empty explica por que não há itens.

### Apostas/outcomes/memória

- URL abre item específico;
- back fecha drawer sem resetar lista;
- estados stale/partial/blocked/conflict/reviewed são distinguíveis;
- nenhum estado depende apenas de cor.

## 7. Dados adversariais

Fixtures:

- zero real;
- missing;
- denominador zero;
- cutoff divergente;
- mês parcial;
- baixa amostra;
- mudança de regime;
- entidade sem parceiro;
- outcome sem execução;
- outcome inconclusivo;
- memória contraditória;
- memória expirada;
- dois eventos concorrentes com mesma dedupe key.

## 8. Métricas de aceite do piloto

- ao menos um loop fechado real;
- 100% das apostas aprovadas com contrato de verificação completo;
- nenhum outcome vencido invisível na fila;
- nenhum outcome resolvido sem aprendizado;
- nenhuma memória ativa sem `review_at`;
- nenhuma operação de publicação na aba Relatórios;
- zero regressão nos gates existentes do Report Live.

## 9. Fora do gate inicial

- qualidade de busca vetorial;
- recomendação generativa aberta;
- causalidade;
- automação externa;
- notificações fora do GaaS;
- deep dive de frentes adicionais.
