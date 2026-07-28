import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:haseen%400428@db.vallxlozcpowbkrbysoy.supabase.co:5432/postgres";

const client = new Client({
  connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to DB.");

    await client.query(`
      ALTER TABLE public.messages 
      ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
    `);
    
    console.log("Added is_read column to messages.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
