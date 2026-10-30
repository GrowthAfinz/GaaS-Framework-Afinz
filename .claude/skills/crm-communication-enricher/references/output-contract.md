# Contrato de saída

Usar `schema_version: 2.0` e um objeto por imagem.

```json
{
  "schema_version": "2.0",
  "source_file": "C:/caminho/imagem.png",
  "preview_path": "C:/caminho/imagem.png",
  "file_name": "imagem.png",
  "width": 0,
  "height": 0,
  "framework_match": {
    "status": "unresolved",
    "match_level": null,
    "match_keys": {},
    "matched_rows": 0,
    "values": {
      "BU": null,
      "jornada": null,
      "Activity name / Taxonomia": null,
      "Canal": null,
      "Segmento": null,
      "Parceiro": null,
      "Subgrupos": null,
      "Etapa de aquisição": null,
      "Perfil de Crédito": null,
      "Produto": null,
      "Oferta": null,
      "Promocional": null,
      "SIGLA_Oferta": null,
      "Oferta 2": null,
      "Promocional 2": null
    },
    "field_provenance": {},
    "offer_promotion_candidates": [],
    "confidence": 0.0,
    "review_required": true,
    "review_reasons": []
  },
  "creative_extraction": {
    "detected_channel": "unknown",
    "channel_conflict": false,
    "raw_transcription": "",
    "normalized_message": "",
    "sections": {
      "headline": null,
      "greeting": null,
      "body": null,
      "legal_text": null
    },
    "placeholders": [],
    "ctas": [],
    "offer_claims": [],
    "benefits": [],
    "intent": "unknown",
    "urgency": "none",
    "themes": [],
    "visual_summary": "",
    "quality_flags": [],
    "confidence": {
      "transcription": 0.0,
      "classification": 0.0,
      "overall": 0.0
    },
    "review_required": true,
    "review_reasons": []
  }
}
```

## Proveniência

Usar um dos valores por campo oficial:

- `user_provided`
- `activities_exact`
- `activities_contextual`
- `folder_hint`
- `image_inferred`
- `unresolved`

`Oferta`, `Promocional`, `Oferta 2` e `Promocional 2` não podem usar `image_inferred` como valor final. A imagem pode apenas produzir `creative_extraction.offer_claims`.

## Regras de serialização

- Usar UTF-8.
- Usar `null` para valor ausente e lista vazia para coleção sem itens.
- Não incluir propriedades fora do contrato sem registrar nova `schema_version`.
- Em CSV, serializar listas como JSON compacto e manter a transcrição em uma única célula escapada.
- Manter as colunas físicas do Framework com a grafia exata do banco.
- `normalized_message` pode remover rótulos de documento e chrome da interface, mas não pode reescrever a copy.
