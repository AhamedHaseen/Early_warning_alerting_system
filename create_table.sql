CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  module_code TEXT NOT NULL,
  module_name TEXT NOT NULL,
  credits INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
NOTIFY pgrst, 'reload schema';
