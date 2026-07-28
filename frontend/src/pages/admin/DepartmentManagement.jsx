import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchDepartments = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('departments').select('*').order('name');
    if (!error && data) setDepartments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openModal = (dept = null) => {
    if (dept) {
      setFormData({ name: dept.name, code: dept.code || '', description: dept.description || '' });
      setEditingId(dept.id);
    } else {
      setFormData({ name: '', code: '', description: '' });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase.from('departments').update(formData).eq('id', editingId);
        if (error) throw error;
        Swal.fire('Updated!', 'Department updated successfully.', 'success');
      } else {
        const { error } = await supabase.from('departments').insert([formData]);
        if (error) throw error;
        Swal.fire('Added!', 'Department added successfully.', 'success');
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
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
        const { error } = await supabase.from('departments').delete().eq('id', id);
        if (error) throw error;
        Swal.fire('Deleted!', 'Department has been deleted.', 'success');
        fetchDepartments();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Departments</h1>
        <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Department
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Department Name</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="4" className="text-center py-8">Loading...</td></tr>
            ) : departments.map((dept) => (
              <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-blue-600">{dept.code || 'N/A'}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{dept.name}</td>
                <td className="px-6 py-4 text-slate-500 max-w-md truncate">{dept.description || 'No description'}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openModal(dept)} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(dept.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{editingId ? 'Edit Department' : 'Add Department'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <input required type="text" name="code" value={formData.code} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. CS" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. Computer Science" />
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
export default DepartmentManagement;
