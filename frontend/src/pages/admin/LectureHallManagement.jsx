import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';

const LectureHallManagement = () => {
  const [lectureHalls, setLectureHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', capacity: 30 });
  const [editingId, setEditingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lecture_halls')
      .select('*')
      .order('name');
      
    if (error) {
      console.error('Error fetching lecture halls:', error);
      // If there's an error (like table missing or RLS), just set empty and let the UI show the message.
      setLectureHalls([]);
    } else if (data) {
      setLectureHalls(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openModal = (hall = null) => {
    if (hall) {
      setFormData({ name: hall.name, capacity: hall.capacity || 30 });
      setEditingId(hall.id);
    } else {
      setFormData({ name: '', capacity: 30 });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase.from('lecture_halls').update(formData).eq('id', editingId);
        if (error) throw error;
        Swal.fire('Updated!', 'Lecture hall updated successfully.', 'success');
      } else {
        const { error } = await supabase.from('lecture_halls').insert([formData]);
        if (error) throw error;
        Swal.fire('Added!', 'Lecture hall added successfully.', 'success');
      }
      setIsModalOpen(false);
      fetchData();
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
        const { error } = await supabase.from('lecture_halls').delete().eq('id', id);
        if (error) throw error;
        Swal.fire('Deleted!', 'Lecture hall has been deleted.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Lecture Halls</h1>
        <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Lecture Hall
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Hall Name</th>
              <th className="px-6 py-4">Capacity</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="3" className="text-center py-8">Loading...</td></tr>
            ) : lectureHalls.length === 0 ? (
               <tr><td colSpan="3" className="text-center py-8 text-slate-500">No lecture halls found. Make sure the database table exists.</td></tr>
            ) : lectureHalls.map((hall) => (
              <tr key={hall.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800 flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                    <MapPin className="w-4 h-4" />
                  </div>
                  {hall.name}
                </td>
                <td className="px-6 py-4 font-medium text-slate-600">{hall.capacity} Students</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openModal(hall)} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(hall.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{editingId ? 'Edit Lecture Hall' : 'Add Lecture Hall'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Hall Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. Hall A, Room 101" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Capacity</label>
                <input required type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg bg-white" placeholder="e.g. 50" min="1" />
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

export default LectureHallManagement;
