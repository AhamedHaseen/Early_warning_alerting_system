import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:haseen%400428@db.vallxlozcpowbkrbysoy.supabase.co:5432/postgres";

const client = new Client({
  connectionString,
});

async function addCategoryColumn() {
  try {
    console.log("Connecting to the database...");
    await client.connect();
    
    console.log("Adding target_category column to feedback_complaints...");
    await client.query(`
      ALTER TABLE public.feedback_complaints 
      ADD COLUMN IF NOT EXISTS target_category TEXT;
    `);
    
    console.log("✅ Column added successfully!");
  } catch (err) {
    console.error("❌ Error executing SQL:", err);
  } finally {
    await client.end();
  }
}

addCategoryColumn();
