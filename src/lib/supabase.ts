import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'] || 'https://wzmzgrorrzslumnurwos.supabase.co';
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] || 'sb_publishable_q3YY9dkBrYujgihlCLMHIQ_oXvO9MXm';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

