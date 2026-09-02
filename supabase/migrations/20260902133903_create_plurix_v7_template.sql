-- PLURIX V7 keeps V6 available for rollback while restoring the first CTA
-- of E-mail 1 and avoiding the duplicated manual sender block.
do $migration$
declare
  v_source text;
  v_cta_anchor text := E'          </tr>\n          %%[ IF NOT EMPTY(@Banner1Corpo) THEN ]%%';
  v_cta_block text := E'          </tr>\n          %%[ IF NOT EMPTY(@TituloCTA1) AND NOT EMPTY(@LinkCTA1) THEN ]%%\n          <tr>\n            <td align="center" class="content-pad cta-cell" style="padding:14px 32px 30px 32px;">\n              <a class="cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="display:inline-block; min-width:280px; border-radius:10px; background-color:#2C3490; color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA1)=%%</a>\n            </td>\n          </tr>\n          %%[ ENDIF ]%%\n          %%[ IF NOT EMPTY(@Banner1Corpo) THEN ]%%';
  v_manual_footer text := E'              %%[ IF NOT EMPTY(@Rodape) THEN ]%%\n              <div style="margin:0; color:#6b7280; font-size:11px; line-height:1.45; text-align:center;">%%=TreatAsContent(@Rodape)=%%</div>\n              %%[ ENDIF ]%%\n';
begin
  select source
    into v_source
    from public.dynamic_email_template_slots
   where name = 'PLURIX V6'
     and status = 'active'
   order by updated_at desc
   limit 1;

  if v_source is null then
    raise exception 'PLURIX V6 ativo não encontrado; V7 não foi criada.';
  end if;
  if position(v_cta_anchor in v_source) = 0 then
    raise exception 'Âncora do CTA 1 do E-mail 1 não encontrada na PLURIX V6.';
  end if;
  if position(v_manual_footer in v_source) = 0 then
    raise exception 'Bloco manual de rodapé não encontrado na PLURIX V6.';
  end if;

  v_source := replace(v_source, v_cta_anchor, v_cta_block);
  v_source := replace(
    v_source,
    '%%[ IF NOT EMPTY(@NotaLegal) OR NOT EMPTY(@Rodape) THEN ]%%',
    '%%[ IF NOT EMPTY(@NotaLegal) THEN ]%%'
  );
  v_source := replace(v_source, v_manual_footer, '');

  if position(v_cta_block in v_source) = 0
     or position(v_manual_footer in v_source) > 0
     or position('%%[ IF NOT EMPTY(@NotaLegal) OR NOT EMPTY(@Rodape) THEN ]%%' in v_source) > 0 then
    raise exception 'Falha ao validar as transformações da PLURIX V7.';
  end if;

  insert into public.dynamic_email_template_slots (
    id, name, source, is_principal, status, version, created_by, updated_by
  )
  values (
    'builtin-plurix-v7', 'PLURIX V7', v_source, false, 'active', 1, null, null
  )
  on conflict (id) do update set
    name = excluded.name,
    source = excluded.source,
    is_principal = false,
    status = 'active',
    version = public.dynamic_email_template_slots.version + 1,
    updated_at = now();
end
$migration$;
