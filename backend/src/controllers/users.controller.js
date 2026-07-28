import { supabase } from '../config/supabase.js';

// Create a new user in Supabase Auth (Admin only)
export const createUser = async (req, res) => {
  try {
    const { email, password, role, full_name, phone, department_id, course_id, specialization, status, guardian_contact, batch_id } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ status: 'error', message: 'Email, password, and role are required' });
    }

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({ status: 'error', message: authError.message });
    }

    const userId = authData.user.id;

    // 2. Insert into Profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: userId, role, full_name, email, phone }]);

    if (profileError) {
      // Rollback Auth User creation if profile fails
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({ status: 'error', message: profileError.message });
    }

    // 3. Insert into Role-Specific Tables
    if (role === 'student') {
      await supabase.from('student_profiles').insert([{ 
        user_id: userId, 
        course_id: course_id || null, 
        batch_id: batch_id || null,
        enrollment_date: new Date().toISOString().split('T')[0],
        status: status || 'active',
        guardian_contact: guardian_contact || null
      }]);
    } else if (role === 'lecturer') {
      await supabase.from('lecturer_profiles').insert([{ 
        user_id: userId, 
        department_id: department_id || null, 
        specialization: specialization || null 
      }]);
    }

    res.status(201).json({ status: 'success', data: { id: userId, email, role, full_name, phone } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Delete a user from Supabase Auth
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ status: 'error', message: 'User ID is required' });
    }

    // This will cascade delete profiles, student_profiles, etc. due to our SQL schema
    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.status(200).json({ status: 'success', message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
