import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Eye, Edit, Trash2, TrendingUp, TrendingDown, Users, BookOpen } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';
import StudentContactModal from '../../components/common/StudentContactModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const StudentManagement = () => {
  const isLecturer = window.location.pathname.includes('/lecturer');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', guardian_contact: '', password: '', status: 'active', course_id: '', batch_id: '', department_id: ''
  });
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, student_profiles(status, course_id, batch_id, guardian_contact, courses(name, department_id, departments(name)))')
      .eq('role', 'student');
    if (data) setStudents(data);
  };

  const fetchDropdownData = async () => {
    const [coursesRes, batchesRes, deptsRes] = await Promise.all([
      supabase.from('courses').select('id, name, department_id, departments(name)'),
      supabase.from('batches').select('id, name, year').order('name'),
      supabase.from('departments').select('id, name').order('name')
    ]);
    if (coursesRes.data) setCourses(coursesRes.data);
    if (batchesRes.data) setBatches(batchesRes.data);
    if (deptsRes.data) setDepartments(deptsRes.data);
  };

  useEffect(() => {
    fetchStudents();
    fetchDropdownData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        // Update
        await supabase.from('profiles').update({ full_name: formData.full_name, email: formData.email, phone: formData.phone }).eq('id', editingId);
        await supabase.from('student_profiles').update({ status: formData.status, course_id: formData.course_id || null, batch_id: formData.batch_id || null, guardian_contact: formData.guardian_contact }).eq('user_id', editingId);
        Swal.fire('Updated!', 'Student has been updated.', 'success');
      } else {
        // Create via backend
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, role: 'student' })
        });
        const result = await res.json();
        if (result.status === 'error') throw new Error(result.message);
        Swal.fire('Created!', 'Student has been added.', 'success');
      }
      
      setFormData({ full_name: '', email: '', phone: '', guardian_contact: '', password: '', status: 'active', course_id: '' });
      setEditingId(null);
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/users/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.status === 'error') throw new Error(data.message);
        
        Swal.fire('Deleted!', 'Student has been deleted.', 'success');
        fetchStudents();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const departmentStats = React.useMemo(() => {
    const stats = {};
    students.forEach(student => {
      const deptName = student.student_profiles?.courses?.departments?.name || 'Unassigned';
      if (!stats[deptName]) {
        stats[deptName] = { name: deptName, total: 0, courses: {} };
      }
      stats[deptName].total++;
      
      const courseName = student.student_profiles?.courses?.name || 'Unassigned';
      if (!stats[deptName].courses[courseName]) {
        stats[deptName].courses[courseName] = 0;
      }
      stats[deptName].courses[courseName]++;
    });
    
    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [students]);

  const highestDept = departmentStats.length > 0 ? departmentStats[0] : null;
  const lowestDept = departmentStats.length > 0 ? departmentStats[departmentStats.length - 1] : null;
  
  const courseEnrollmentStats = React.useMemo(() => {
    const stats = {};
    students.forEach(student => {
      const courseName = student.student_profiles?.courses?.name || 'Unassigned';
      if (!stats[courseName]) stats[courseName] = 0;
      stats[courseName]++;
    });
    return Object.entries(stats).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  }, [students]);

  const openModal = (student = null) => {
    if (student && isLecturer) {
      Swal.fire('Access Denied', 'Please contact an Administrator to edit student details.', 'warning');
      return;
    }
    if (student) {
      setFormData({
        full_name: student.full_name,
        email: student.email,
        phone: student.phone || '',
        guardian_contact: student.student_profiles?.guardian_contact || '',
        status: student.student_profiles?.status || 'active',
        department_id: student.student_profiles?.courses?.department_id || '',
        course_id: student.student_profiles?.course_id || '',
        batch_id: student.student_profiles?.batch_id || '',
        password: '' // Don't allow editing password here for simplicity
      });
      setEditingId(student.id);
    } else {
      setFormData({ full_name: '', email: '', phone: '', guardian_contact: '', password: '', status: 'active', course_id: '', batch_id: '', department_id: '' });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <StudentContactModal 
        isOpen={!!selectedStudent} 
        onClose={() => setSelectedStudent(null)} 
        student={selectedStudent ? {
          id: selectedStudent.id,
          name: selectedStudent.full_name,
          email: selectedStudent.email,
          phone: selectedStudent.phone || 'N/A',
          guardianContact: selectedStudent.student_profiles?.guardian_contact || 'N/A',
          course: selectedStudent.student_profiles?.courses?.name || ''
        } : null} 
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Student Management</h1>
        <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Student
        </button>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Highest Enrollment Dept</p>
            <h3 className="text-2xl font-bold text-slate-800">{highestDept ? highestDept.name : 'N/A'}</h3>
            <p className="text-sm text-slate-600 mt-2">{highestDept ? `${highestDept.total} Students` : '0 Students'}</p>
          </div>
          <div className="mt-4 flex items-center text-emerald-600 bg-emerald-50 w-fit px-3 py-1 rounded-full text-sm font-medium">
            <TrendingUp className="w-4 h-4 mr-1" /> Top Performing
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Lowest Enrollment Dept</p>
            <h3 className="text-2xl font-bold text-slate-800">{lowestDept ? lowestDept.name : 'N/A'}</h3>
            <p className="text-sm text-slate-600 mt-2">{lowestDept ? `${lowestDept.total} Students` : '0 Students'}</p>
          </div>
          <div className="mt-4 flex items-center text-red-600 bg-red-50 w-fit px-3 py-1 rounded-full text-sm font-medium">
            <TrendingDown className="w-4 h-4 mr-1" /> Needs Attention
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Enrolled Students</p>
            <h3 className="text-2xl font-bold text-slate-800">{students.length}</h3>
            <p className="text-sm text-slate-600 mt-2">Across {departmentStats.length} Departments</p>
          </div>
          <div className="mt-4 flex items-center text-blue-600 bg-blue-50 w-fit px-3 py-1 rounded-full text-sm font-medium">
            <Users className="w-4 h-4 mr-1" /> Total Students
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><BookOpen className="w-5 h-5 mr-2 text-indigo-500"/> Department Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {departmentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === departmentStats.length - 1 ? '#ef4444' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><Users className="w-5 h-5 mr-2 text-blue-500"/> Course Enrollment Totals</h3>
          <div className="space-y-3 flex-1 overflow-y-auto pr-2" style={{ maxHeight: '256px' }}>
            {courseEnrollmentStats.map((course, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">{course.name}</span>
                <span className="px-3 py-1 bg-white rounded-lg text-sm font-bold text-slate-800 shadow-sm border border-slate-200">{course.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-800">{student.full_name}</td>
                    <td className="px-6 py-4">{student.email}</td>
                    <td className="px-6 py-4">{student.student_profiles?.courses?.name || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${student.student_profiles?.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {student.student_profiles?.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => setSelectedStudent(student)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View Contact Details"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openModal(student)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg" title="Edit"><Edit className="w-4 h-4" /></button>
                      {!isLecturer && (
                        <button onClick={() => handleDelete(student.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{editingId ? 'Edit Student' : 'Add New Student'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input required type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+44 123 456 789" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Guardian Contact</label>
                <input type="text" name="guardian_contact" value={formData.guardian_contact} onChange={handleInputChange} placeholder="Name - Phone" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input required type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select name="department_id" value={formData.department_id} onChange={(e) => {
                  setFormData({...formData, department_id: e.target.value, course_id: ''})
                }} className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="">Select a department...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Course</label>
                <select name="course_id" value={formData.course_id} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="">Select a course...</option>
                  {courses
                    .filter(c => !formData.department_id || c.department_id === formData.department_id)
                    .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Batch</label>
                <select name="batch_id" value={formData.batch_id} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="">Select a batch...</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.year})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
              <button type="submit" disabled={loading} className="px-5 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                {loading ? 'Saving...' : 'Save Student'}
              </button>
            </div>
          </form>
        </div>
        </div>
      )}
    </div>
  );
};
export default StudentManagement;
