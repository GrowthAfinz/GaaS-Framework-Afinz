import { supabase } from './src/services/supabaseClient';

async function checkDates() {
    const { data } = await supabase
        .from('paid_media_metrics')
        .select('date')
        .order('date', { ascending: false })
        .limit(5);

    console.log("Últimas 5 datas no banco:", data);
}

checkDates();
