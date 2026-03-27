import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://mipiwxadnpwtcgfcedym.supabase.co';
// Note: The key provided involves a 'sb_publishable_' prefix which is unusual for standard Supabase Anon keys (usually 'eyJ...').
// usage might require verify, but we will proceed with provided key.
export const supabaseKey = 'sb_publishable_kOxFYyTTDbp9sHMhol9aDQ_SrGUsrmc';

export const supabase = createClient(supabaseUrl, supabaseKey);
