-- Metas globais ou de frente podem abranger os dois canais; por isso channel
-- não pode ser obrigatório. Objective também é derivado de entity_key nos
-- novos escopos, mas permanece preenchido para compatibilidade quando existe.
alter table public.paid_media_targets
  alter column channel drop not null,
  alter column objective drop not null;
