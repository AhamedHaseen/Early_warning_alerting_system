import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ title: '', description: '', date: '', location: '', type: 'academic' });
  const [editingId, setEditingId] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
    if (!error && data) setEvents(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openModal = (event = null) => {
    if (event) {
      setFormData({ 
        title: event.title, 
        description: event.description || '', 
        date: event.date || '', 
        location: event.location || '', 
        type: event.type || 'academic' 
      });
      setEditingId(event.id);
    } else {
      setFormData({ title: '', description: '', date: '', location: '', type: 'academic' });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase.from('events').update(formData).eq('id', editingId);
        if (error) throw error;
        Swal.fire('Updated!', 'Event updated successfully.', 'success');
      } else {
        const { error } = await supabase.from('events').insert([formData]);
        if (error) throw error;
        
        const { data: students } = await supabase.from('profiles').select('id').eq('role', 'student');
        if (students && students.length > 0) {
            const notifications = students.map(s => ({
                user_id: s.id,
                title: 'New Event Scheduled',
                message: `${formData.title} is scheduled on ${new Date(formData.date).toLocaleDateString()} at ${formData.location}.`,
                is_read: false
            }));
            await supabase.from('notifications').insert(notifications);
        }

        Swal.fire('Added!', 'Event added successfully.', 'success');
      }
      setIsModalOpen(false);
      fetchEvents();
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
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) throw error;
        Swal.fire('Deleted!', 'Event has been deleted.', 'success');
        fetchEvents();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Events</h1>
        <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Event
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-8">Loading...</td></tr>
            ) : events.map((event) => (
              <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{event.title}</td>
                <td className="px-6 py-4 text-slate-600">{new Date(event.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    event.type === 'academic' ? 'bg-blue-50 text-blue-700' :
                    event.type === 'holiday' ? 'bg-emerald-50 text-emerald-700' :
                    'bg-purple-50 text-purple-700'
                  }`}>
                    {event.type}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium">{event.location}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openModal(event)} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(event.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{editingId ? 'Edit Event' : 'Add Event'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input required type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. Science Fair" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input required type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select required name="type" value={formData.type} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg bg-white">
                    <option value="academic">Academic</option>
                    <option value="holiday">Holiday</option>
                    <option value="extracurricular">Extracurricular</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input required type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. Main Auditorium" />
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
export default EventManagement;
