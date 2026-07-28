import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = pg;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Role Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const connectionString = "postgresql://postgres:haseen%400428@db.vallxlozcpowbkrbysoy.supabase.co:5432/postgres";
const pgClient = new Client({ connectionString });

async function seedDatabase() {
  try {
    console.log("Connecting to the database...");
    await pgClient.connect();

    console.log("1. Creating Auth Users via Supabase Admin API...");
    const users = [
      { email: 'admin@ams.com', password: 'password123', role: 'admin', name: 'System Admin' },
      { email: 'lecturer@ams.com', password: 'password123', role: 'lecturer', name: 'Dr. Jane Smith' },
      { email: 'student@ams.com', password: 'password123', role: 'student', name: 'John Doe' }
    ];

    const createdUsers = {};

    for (const u of users) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true
      });

      if (error) {
        if (error.message.includes('already been registered')) {
           console.log(`User ${u.email} already exists.`);
           // Fetch the user to get ID
           const { data: existingUsers } = await supabase.auth.admin.listUsers();
           const user = existingUsers.users.find(x => x.email === u.email);
           createdUsers[u.role] = { id: user.id, ...u };
        } else {
           console.error("Error creating user:", error);
        }
      } else {
        console.log(`Created user ${u.email} with ID: ${data.user.id}`);
        createdUsers[u.role] = { id: data.user.id, ...u };
      }
    }

    const adminId = createdUsers['admin'].id;
    const lecturerId = createdUsers['lecturer'].id;
    const studentId = createdUsers['student'].id;

    console.log("\n2. Executing SQL INSERT Queries (Max 15)...");

    const queries = [
      // 3 Queries for Profiles
      `INSERT INTO public.profiles (id, role, full_name, email) VALUES ('${adminId}', 'admin', 'System Admin', 'admin@ams.com') ON CONFLICT (id) DO NOTHING;`,
      `INSERT INTO public.profiles (id, role, full_name, email) VALUES ('${lecturerId}', 'lecturer', 'Dr. Jane Smith', 'lecturer@ams.com') ON CONFLICT (id) DO NOTHING;`,
      `INSERT INTO public.profiles (id, role, full_name, email) VALUES ('${studentId}', 'student', 'John Doe', 'student@ams.com') ON CONFLICT (id) DO NOTHING;`,

      // 3 Queries for Departments
      `INSERT INTO public.departments (id, name) VALUES ('d1000000-0000-0000-0000-000000000001', 'Computer Science') ON CONFLICT (id) DO NOTHING;`,
      `INSERT INTO public.departments (id, name) VALUES ('d1000000-0000-0000-0000-000000000002', 'Business Administration') ON CONFLICT (id) DO NOTHING;`,
      `INSERT INTO public.departments (id, name) VALUES ('d1000000-0000-0000-0000-000000000003', 'Engineering') ON CONFLICT (id) DO NOTHING;`,

      // 3 Queries for Courses
      `INSERT INTO public.courses (id, name, department_id, description) VALUES ('c1000000-0000-0000-0000-000000000001', 'BSc Computer Science', 'd1000000-0000-0000-0000-000000000001', 'Undergraduate CS') ON CONFLICT (id) DO NOTHING;`,
      `INSERT INTO public.courses (id, name, department_id, description) VALUES ('c1000000-0000-0000-0000-000000000002', 'BBA Marketing', 'd1000000-0000-0000-0000-000000000002', 'Undergraduate Business') ON CONFLICT (id) DO NOTHING;`,
      `INSERT INTO public.courses (id, name, department_id, description) VALUES ('c1000000-0000-0000-0000-000000000003', 'BEng Mechanical', 'd1000000-0000-0000-0000-000000000003', 'Undergraduate Engineering') ON CONFLICT (id) DO NOTHING;`,

      // 3 Queries for Modules
      `INSERT INTO public.modules (id, name, course_id, credits) VALUES ('e1000000-0000-0000-0000-000000000001', 'Introduction to Programming', 'c1000000-0000-0000-0000-000000000001', 3) ON CONFLICT (id) DO NOTHING;`,
      `INSERT INTO public.modules (id, name, course_id, credits) VALUES ('e1000000-0000-0000-0000-000000000002', 'Marketing Principles', 'c1000000-0000-0000-0000-000000000002', 3) ON CONFLICT (id) DO NOTHING;`,
      `INSERT INTO public.modules (id, name, course_id, credits) VALUES ('e1000000-0000-0000-0000-000000000003', 'Thermodynamics', 'c1000000-0000-0000-0000-000000000003', 4) ON CONFLICT (id) DO NOTHING;`,

      // 1 Query for Lecturer Profile
      `INSERT INTO public.lecturer_profiles (user_id, department_id, specialization) VALUES ('${lecturerId}', 'd1000000-0000-0000-0000-000000000001', 'Artificial Intelligence') ON CONFLICT (user_id) DO NOTHING;`,

      // 1 Query for Student Profile
      `INSERT INTO public.student_profiles (user_id, course_id, enrollment_date, status) VALUES ('${studentId}', 'c1000000-0000-0000-0000-000000000001', CURRENT_DATE, 'active') ON CONFLICT (user_id) DO NOTHING;`
    ];

    let queryCount = 0;
    for (const q of queries) {
      await pgClient.query(q);
      queryCount++;
    }

    console.log(`✅ Successfully executed ${queryCount} INSERT queries (Under 15 max limit).`);
    console.log("Database seeded completely!");

  } catch (err) {
    console.error("❌ Error seeding database:", err);
  } finally {
    await pgClient.end();
  }
}

seedDatabase();
