import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://mipiwxadnpwtcgfcedym.supabase.co';
export const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcGl3eGFkbnB3dGNnZmNlZHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NjU1NDUsImV4cCI6MjA4NTA0MTU0NX0.kIPhFfqvcJJh2S4yS2PsopmSYsZfC7ZNausumJGtmrM';

export const supabase = createClient(supabaseUrl, supabaseKey);
