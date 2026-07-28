import pg from 'pg';
const { Client } = pg;

// We use the direct database connection string provided by the user, with the password URL-encoded
const connectionString = "postgresql://postgres:haseen%400428@db.vallxlozcpowbkrbysoy.supabase.co:5432/postgres";

const client = new Client({
  connectionString,
});

const sql = `
-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null check (role in ('admin', 'lecturer', 'student')),
  full_name text,
  email text,
  created_at timestamp with time zone default now()
);

-- Departments
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default now()
);

-- Courses
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid references public.departments(id) on delete set null,
  description text,
  created_at timestamp with time zone default now()
);

-- Modules
CREATE TABLE IF NOT EXISTS public.modules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  course_id uuid references public.courses(id) on delete cascade,
  credits integer not null default 3,
  created_at timestamp with time zone default now()
);

-- Student Profiles
CREATE TABLE IF NOT EXISTS public.student_profiles (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  course_id uuid references public.courses(id) on delete set null,
  enrollment_date date,
  status text check (status in ('active', 'graduated', 'suspended')) default 'active'
);

-- Lecturer Profiles
CREATE TABLE IF NOT EXISTS public.lecturer_profiles (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  department_id uuid references public.departments(id) on delete set null,
  specialization text
);

-- Enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.student_profiles(user_id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(student_id, module_id)
);

-- Lecturer Assignments
CREATE TABLE IF NOT EXISTS public.lecturer_assignments (
  id uuid primary key default gen_random_uuid(),
  lecturer_id uuid references public.lecturer_profiles(user_id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(lecturer_id, module_id)
);

-- Timetables
CREATE TABLE IF NOT EXISTS public.timetables (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.modules(id) on delete cascade,
  lecturer_id uuid references public.lecturer_profiles(user_id) on delete set null,
  room text,
  day_of_week text,
  start_time time,
  end_time time
);

-- Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid primary key default gen_random_uuid(),
  timetable_id uuid references public.timetables(id) on delete cascade,
  student_id uuid references public.student_profiles(user_id) on delete cascade,
  date date not null,
  status text check (status in ('present', 'absent', 'late', 'excused')) not null,
  unique(timetable_id, student_id, date)
);

-- Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.modules(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamp with time zone
);

-- Submissions
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.assignments(id) on delete cascade,
  student_id uuid references public.student_profiles(user_id) on delete cascade,
  file_url text,
  grade numeric,
  feedback text,
  submitted_at timestamp with time zone default now(),
  unique(assignment_id, student_id)
);

-- Assessments
CREATE TABLE IF NOT EXISTS public.assessments (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.modules(id) on delete cascade,
  title text not null,
  type text check (type in ('quiz', 'exam')),
  date timestamp with time zone,
  total_marks numeric
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text,
  start_date date,
  end_date date,
  reason text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default now()
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  sent_at timestamp with time zone default now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text,
  message text,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- Risk Interventions
CREATE TABLE IF NOT EXISTS public.risk_interventions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.student_profiles(user_id) on delete cascade,
  lecturer_id uuid references public.lecturer_profiles(user_id) on delete cascade,
  reason text,
  action_taken text,
  status text check (status in ('open', 'resolved', 'in_progress')) default 'open',
  created_at timestamp with time zone default now()
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date timestamp with time zone,
  location text,
  created_at timestamp with time zone default now()
);
`;

async function setupDatabase() {
  try {
    console.log("Connecting to the database...");
    await client.connect();
    console.log("Connected. Executing SQL schema...");
    await client.query(sql);
    console.log("✅ SQL schema created successfully!");
  } catch (err) {
    console.error("❌ Error executing SQL:", err);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

setupDatabase();
