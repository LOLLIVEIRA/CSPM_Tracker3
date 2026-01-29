import { createClient } from '@supabase/supabase-js';

// URL da API do Supabase (extraída do dashboard URL fornecido)
const SUPABASE_URL = 'https://xowoaqnrygkposummqnh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tJe4ObvaMVw5Fo2-ZYpWpQ_9S5Yvc1u';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

