import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const parts = line.split('=');
  const key = parts[0];
  const val = parts.slice(1).join('=');
  if (key) acc[key.trim()] = val.trim().replace(/['"]/g, '');
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: students, error: stuErr } = await supabase.from('profiles').select('id').eq('role', 'student');
  if (stuErr) { console.error(stuErr); return; }
  const studentIds = students.map(s => s.id);
  if (studentIds.length > 0) {
    const { error: delErr } = await supabase.from('notifications').delete().in('user_id', studentIds);
    if (delErr) console.error(delErr);
    else console.log('Successfully deleted student notifications.');
  } else {
    console.log('No students found.');
  }
}
run();
