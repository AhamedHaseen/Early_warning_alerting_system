import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase URL or Service Role Key is missing. Database features will not work.');
}

// Initialize the Supabase client with the Service Role Key for backend administrative tasks
export const supabase = createClient(supabaseUrl || 'http://localhost', supabaseServiceKey || 'dummy_key', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
