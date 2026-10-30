# Cruzamento com Framework e activities

## Princípio

Tratar `activities` como fonte semântica oficial das dimensões do Framework. A imagem descreve a comunicação; o histórico resolve seu contexto operacional.

Não transformar uma alegação visível, como “R$100 em créditos Vibe”, diretamente em `Oferta=Vibe`. Primeiro encontrar atividades historicamente equivalentes e copiar o par oficial `Oferta + Promocional`.

## Colunas oficiais

### Identidade e contexto

- `BU`
- `jornada`
- `Activity name / Taxonomia`
- `Canal`
- `Data de Disparo`
- `Safra`

### Segmentação

- `Segmento`
- `Parceiro`
- `SIGLA_Parceiro`
- `Subgrupos`
- `Etapa de aquisição`
- `Perfil de Crédito`

### Produto e oferta

- `Produto`
- `Oferta`
- `Promocional`
- `SIGLA_Oferta`
- `Oferta 2`
- `Promocional 2`

## Precedência de correspondência

1. Activity Name exato, quando fornecido.
2. `communication_slot`: jornada + Activity Name + canal.
3. Jornada + canal + BU + segmento.
4. BU + segmento + canal + período aproximado.
5. Pasta e nome do arquivo como pistas para buscar candidatos.
6. Sem correspondência: manter campos oficiais não resolvidos.

## Regra de decisão

- Correspondência exata com valores históricos consistentes: usar os valores com `activities_exact`.
- Correspondência contextual com pelo menos 3 linhas e um par `Oferta + Promocional` representando 80% ou mais: sugerir com `activities_contextual` e exigir revisão.
- Empate, baixa cobertura ou valores divergentes: retornar candidatos com contagem e participação; não escolher automaticamente.
- Resolver `Oferta + Promocional` como chave composta.
- Resolver `Oferta 2 + Promocional 2` em conjunto quando relevantes.
- `Padrao` e `N/A` são valores físicos válidos do banco, não campos vazios.
- `#DIV/0!` é erro de origem e deve gerar `invalid_historical_value`.

## Snapshot observado em 2026-06-21

Em 4.935 activities:

- `Oferta` e `Promocional` aparecem juntas em 4.930 linhas.
- Pares mais frequentes: `Vibe + Padrao`, `Padrao + N/A`, `Padrao + Copa`, `Padrao + Padrao` e `Vibe + Em dobro`.
- Valores de `Oferta`: `Vibe`, `Padrao`, `Seguro Cartonistas`, `Limite`.
- Valores de `Promocional`: `Padrao`, `N/A`, `Copa`, `Em dobro`, `Upgrade`.
- `Promocional 2` contém cinco ocorrências inválidas de `#DIV/0!`; nunca propagá-las.

Este snapshot é orientação, não enum permanente. Consultar os valores vivos sempre que houver acesso ao Supabase.

## Exemplo de separação

Imagem mostra:

```text
Ganhe R$100 em créditos Vibe na primeira compra.
```

Saída criativa:

```json
{"type":"vibe_credits","value":100,"unit":"BRL"}
```

Saída Framework somente após match histórico:

```json
{"Oferta":"Vibe","Promocional":"Padrao"}
```

ou, em uma variante histórica:

```json
{"Oferta":"Vibe","Promocional":"Em dobro"}
```
