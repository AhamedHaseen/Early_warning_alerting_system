import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:haseen%400428@db.vallxlozcpowbkrbysoy.supabase.co:5432/postgres";

const client = new Client({
  connectionString,
});

const sql = `
  CREATE TABLE IF NOT EXISTS public.lecturer_attendance (
    id uuid primary key default gen_random_uuid(),
    timetable_id uuid references public.timetables(id) on delete cascade,
    lecturer_id uuid references public.lecturer_profiles(user_id) on delete cascade,
    date date not null,
    status text check (status in ('present', 'absent', 'late', 'excused')) not null,
    unique(timetable_id, lecturer_id, date)
  );
`;

async function runMigrations() {
  try {
    console.log("Connecting to the database for migrations...");
    await client.connect();
    console.log("Connected. Executing CREATE TABLE statements...");
    await client.query(sql);
    console.log("✅ Migrations applied successfully!");
  } catch (err) {
    console.error("❌ Error executing SQL:", err);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

runMigrations();
