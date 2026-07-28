import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ code: '', name: '', department_id: '', description: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const [coursesRes, deptsRes] = await Promise.all([
      supabase.from('courses').select('*, departments(name)').order('name'),
      supabase.from('departments').select('id, name').order('name')
    ]);
    
    if (coursesRes.data) setCourses(coursesRes.data);
    if (deptsRes.data) setDepartments(deptsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openModal = (course = null) => {
    if (course) {
      setFormData({ code: course.code || '', name: course.name, department_id: course.department_id || '', description: course.description || '' });
      setEditingId(course.id);
    } else {
      setFormData({ code: '', name: '', department_id: '', description: '' });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase.from('courses').update(formData).eq('id', editingId);
        if (error) throw error;
        Swal.fire('Updated!', 'Course updated successfully.', 'success');
      } else {
        const { error } = await supabase.from('courses').insert([formData]);
        if (error) throw error;
        Swal.fire('Added!', 'Course added successfully.', 'success');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      let errorMessage = err.message || 'An error occurred';
      if (err.code === '23505' || errorMessage.includes('duplicate key value') || errorMessage.includes('courses_code_key')) {
        errorMessage = 'A course with this Course Code already exists. Course codes must be unique.';
      }
      Swal.fire('Error', errorMessage, 'error');
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
        const { error } = await supabase.from('courses').delete().eq('id', id);
        if (error) throw error;
        Swal.fire('Deleted!', 'Course has been deleted.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Courses</h1>
        <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Course
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Course Code</th>
              <th className="px-6 py-4">Course Name</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-8">Loading...</td></tr>
            ) : courses.map((course) => (
              <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{course.code || 'N/A'}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{course.name}</td>
                <td className="px-6 py-4 font-medium text-blue-600">{course.departments?.name || 'N/A'}</td>
                <td className="px-6 py-4 text-slate-500 max-w-md truncate">{course.description || 'No description'}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openModal(course)} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(course.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{editingId ? 'Edit Course' : 'Add Course'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Course Code</label>
                <input required type="text" name="code" value={formData.code} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. CS101" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Course Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. BSc Computer Science" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select required name="department_id" value={formData.department_id} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="">Select Department...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" rows="3"></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CourseManagement;
