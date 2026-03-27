import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mipiwxadnpwtcgfcedym.supabase.co';
const supabaseKey = 'sb_publishable_kOxFYyTTDbp9sHMhol9aDQ_SrGUsrmc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsights() {
  console.log('--- TESTANDO FETCH DE INSIGHTS ---');
  
  const { data: allData, error: allErr } = await supabase
    .from('paid_media_insights')
    .select('*');
    
  if (allErr) {
    console.error('ERRO AO BUSCAR TODAS AS ROWS (RLS?):', allErr);
  } else {
    console.log(`TOTAL DE ROWS NA TABELA: ${allData?.length}`);
    if (allData?.length) console.log(allData[0]);
  }

  const { data: filteredData, error: filterErr } = await supabase
    .from('paid_media_insights')
    .select('*')
    .eq('status', 'active')
    .gte('score', 6);

  if (filterErr) {
    console.error('ERRO NO FILTER QUERY:', filterErr);
  } else {
    console.log(`ROWS FILTERED: ${filteredData?.length}`);
    if (filteredData?.length === 0 && allData?.length > 0) {
        console.log('As rows existem, mas NENHUMA atende as condições de status="active" e score >= 6.');
    }
  }
}

testInsights();
