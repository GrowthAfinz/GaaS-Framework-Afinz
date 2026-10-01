-- Restore the governed primary title in the dedicated E-mail 1 branch.
-- The original V9 source reads TITULO_COPY_1_AZUL but only rendered it in
-- the shared branch used by E-mails 2-8.
update public.dynamic_email_template_slots
set
  source = replace(
    source,
    $old$            <td align="center" class="content-pad" style="padding:30px 32px 8px 32px; text-align:center;">
              %%[ IF NOT EMPTY(@Copy1Preto) THEN ]%%$old$,
    $new$            <td align="center" class="content-pad" style="padding:30px 32px 8px 32px; text-align:center;">
              %%[ IF NOT EMPTY(@TituloCopy1) THEN ]%%
              <h1 class="headline" style="max-width:500px; margin:0 auto 16px auto; color:%%=v(@CorCopy1)=%%; font-size:%%=v(@TamanhoFonteTituloCopy1)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(@TituloCopy1)=%%</h1>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@Copy1Preto) THEN ]%%$new$
  ),
  version = version + 1,
  updated_at = now()
where id = 'builtin-plurix-v9'
  and position($old$            <td align="center" class="content-pad" style="padding:30px 32px 8px 32px; text-align:center;">
              %%[ IF NOT EMPTY(@Copy1Preto) THEN ]%%$old$ in source) > 0
  and position($new$            <td align="center" class="content-pad" style="padding:30px 32px 8px 32px; text-align:center;">
              %%[ IF NOT EMPTY(@TituloCopy1) THEN ]%%
              <h1 class="headline" style="max-width:500px; margin:0 auto 16px auto; color:%%=v(@CorCopy1)=%%; font-size:%%=v(@TamanhoFonteTituloCopy1)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(@TituloCopy1)=%%</h1>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@Copy1Preto) THEN ]%%$new$ in source) = 0;

do $$
begin
  if not exists (
    select 1
    from public.dynamic_email_template_slots
    where id = 'builtin-plurix-v9'
      and position($expected$            <td align="center" class="content-pad" style="padding:30px 32px 8px 32px; text-align:center;">
              %%[ IF NOT EMPTY(@TituloCopy1) THEN ]%%
              <h1 class="headline" style="max-width:500px; margin:0 auto 16px auto; color:%%=v(@CorCopy1)=%%; font-size:%%=v(@TamanhoFonteTituloCopy1)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(@TituloCopy1)=%%</h1>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@Copy1Preto) THEN ]%%$expected$ in source) > 0
  ) then
    raise exception 'PLURIX V9 E-mail 1 primary title was not restored';
  end if;
end;
$$;
