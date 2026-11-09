begin;
do $migration$
declare definition text; marker text := 'if n.relative_path<>''05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md'' and exists';
begin
 definition:=pg_get_functiondef('public.gaas_wiki_pilot_save(uuid,integer,text,jsonb,uuid,text,boolean)'::regprocedure);
 if strpos(definition,marker)=0 then raise exception 'wiki_strategy_writer_contract_changed';end if;
 definition:=replace(definition,marker,'if n.relative_path not in (''05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md'',''05-Estrategia/Estrategia-de-Segmentacao-de-Seguros.md'') and exists');
 execute definition;
end $migration$;
commit;
