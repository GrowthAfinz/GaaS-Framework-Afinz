import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mipiwxadnpwtcgfcedym.supabase.co';
const supabaseKey = 'sb_publishable_kOxFYyTTDbp9sHMhol9aDQ_SrGUsrmc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('--- TESTANDO INSERÇÃO COM NOVAS COLUNAS ---');
  
  const testActivity = {
    prog_gaas: false,
    status: 'Realizado',
    "Activity name / Taxonomia": "TEST_INSERT_DYNAMIC_COLUMNS",
    "Data de Disparo": new Date().toISOString(),
    "BU": "Plurix",
    "Canal": "Push",
    "Segmento": "Novos",
    "jornada": "Boas-vindas",
    "Emissões Independentes": 150,
    "Emissões Assistidas": 50,
    "Cartões Gerados": 200
  };

  const { data, error } = await supabase
    .from('activities')
    .insert([testActivity])
    .select();

  if (error) {
    console.error('ERRO AO INSERIR:', error);
  } else {
    console.log('SUCESSO! DADO INSERIDO:', JSON.stringify(data[0], null, 2));
    
    // Agora deletamos para não sujar o banco
    const { error: delErr } = await supabase
        .from('activities')
        .delete()
        .eq('Activity name / Taxonomia', 'TEST_INSERT_DYNAMIC_COLUMNS');
    
    if (delErr) console.error('Erro ao limpar teste:', delErr);
    else console.log('Teste limpo com sucesso.');
  }
}

testInsert();
