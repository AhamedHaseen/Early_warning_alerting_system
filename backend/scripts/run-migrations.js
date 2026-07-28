import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:haseen%400428@db.vallxlozcpowbkrbysoy.supabase.co:5432/postgres";

const client = new Client({
  connectionString,
});

const sql = `
  ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS code text;
  ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS description text;

  ALTER TABLE public.events ADD COLUMN IF NOT EXISTS type text;

  ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS total_marks numeric;

  ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS duration_minutes integer;
`;

async function runMigrations() {
  try {
    console.log("Connecting to the database for migrations...");
    await client.connect();
    console.log("Connected. Executing ALTER TABLE statements...");
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
