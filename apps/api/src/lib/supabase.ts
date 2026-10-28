import { createClient } from '@supabase/supabase-js';
import type { Database } from '@distribuidora/tipos-compartidos';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en variables de entorno');
}

export const supabase = createClient<Database>(url, key);
