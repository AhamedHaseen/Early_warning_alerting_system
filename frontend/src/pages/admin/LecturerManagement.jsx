import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';
import LecturerContactModal from '../../components/common/LecturerContactModal';
import { Eye } from 'lucide-react';

const LecturerManagement = () => {
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', password: '', department_id: '', specialization: ''
  });
  const [departments, setDepartments] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const fetchLecturers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, lecturer_profiles(department_id, specialization, departments(name))')
      .eq('role', 'lecturer');
    if (data) setLecturers(data);
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('id, name');
    if (data) setDepartments(data);
  };

  useEffect(() => {
    fetchLecturers();
    fetchDepartments();
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
        await supabase.from('lecturer_profiles').update({ 
          department_id: formData.department_id || null, 
          specialization: formData.specialization 
        }).eq('user_id', editingId);
        Swal.fire('Updated!', 'Lecturer has been updated.', 'success');
      } else {
        // Create via backend
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, role: 'lecturer' })
        });
        const result = await res.json();
        if (result.status === 'error') throw new Error(result.message);
        Swal.fire('Created!', 'Lecturer has been added.', 'success');
      }
      
      setFormData({ full_name: '', email: '', phone: '', password: '', department_id: '', specialization: '' });
      setEditingId(null);
      setIsModalOpen(false);
      fetchLecturers();
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
        
        Swal.fire('Deleted!', 'Lecturer has been deleted.', 'success');
        fetchLecturers();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const openModal = (lecturer = null) => {
    if (lecturer) {
      setFormData({
        full_name: lecturer.full_name,
        email: lecturer.email,
        phone: lecturer.phone || '',
        department_id: lecturer.lecturer_profiles?.department_id || '',
        specialization: lecturer.lecturer_profiles?.specialization || '',
        password: '' 
      });
      setEditingId(lecturer.id);
    } else {
      setFormData({ full_name: '', email: '', phone: '', password: '', department_id: '', specialization: '' });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <LecturerContactModal 
        isOpen={!!selectedLecturer} 
        onClose={() => setSelectedLecturer(null)} 
        lecturer={selectedLecturer ? {
          id: selectedLecturer.id,
          name: selectedLecturer.full_name,
          email: selectedLecturer.email,
          phone: selectedLecturer.phone || 'N/A',
          department: selectedLecturer.lecturer_profiles?.departments?.name || 'N/A',
          officeHours: 'TBD'
        } : null} 
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Lecturer Management</h1>
        <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Lecturer
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Specialization</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lecturers.map((lect) => (
                  <tr key={lect.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-800">{lect.full_name}</td>
                    <td className="px-6 py-4">{lect.email}</td>
                    <td className="px-6 py-4">{lect.lecturer_profiles?.departments?.name || 'N/A'}</td>
                    <td className="px-6 py-4">{lect.lecturer_profiles?.specialization || 'N/A'}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => setSelectedLecturer(lect)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View Contact Details"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openModal(lect)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(lect.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
            <h2 className="text-xl font-bold text-slate-800 mb-4">{editingId ? 'Edit Lecturer' : 'Add New Lecturer'}</h2>
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
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input required type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select name="department_id" value={formData.department_id} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="">Select a department...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Specialization</label>
                <input type="text" name="specialization" value={formData.specialization} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
              <button type="submit" disabled={loading} className="px-5 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                {loading ? 'Saving...' : 'Save Lecturer'}
              </button>
            </div>
          </form>
        </div>
        </div>
      )}
    </div>
  );
};
export default LecturerManagement;
