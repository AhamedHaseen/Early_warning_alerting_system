import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Bell, AlertCircle, Info, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ title: '', message: '' });
  const [targetType, setTargetType] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [editingId, setEditingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const [notifRes, userRes, batchRes] = await Promise.all([
      supabase.from('notifications').select('*, profiles(full_name)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, role, student_profiles(batch_id)').order('full_name'),
      supabase.from('batches').select('id, name, year').order('name')
    ]);
    
    if (notifRes.data) setNotifications(notifRes.data);
    if (userRes.data) setUsers(userRes.data);
    if (batchRes.data) setBatches(batchRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openModal = (item = null) => {
    if (item) {
      setFormData({ 
        title: item.title, 
        message: item.message
      });
      if (item.user_id === null) {
          setTargetType('all');
          setSelectedUser('all');
      } else {
          const u = users.find(x => x.id === item.user_id);
          if (u) {
              if (u.role === 'student') {
                  setTargetType('batch');
                  setSelectedBatch(u.student_profiles?.batch_id || '');
                  setSelectedUser(u.id);
              } else if (u.role === 'lecturer') {
                  setTargetType('lecturer');
                  setSelectedUser(u.id);
              } else {
                  setTargetType('all');
                  setSelectedUser('all');
              }
          } else {
              setTargetType('all');
              setSelectedUser('all');
          }
      }
      setEditingId(item.id);
    } else {
      setFormData({ title: '', message: '' });
      setTargetType('all');
      setSelectedBatch('');
      setSelectedUser('all');
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let payload = [];
      
      if (targetType === 'all') {
        payload.push({ title: formData.title, message: formData.message, user_id: null });
      } else if (targetType === 'batch') {
        if (selectedUser === 'all') {
          const batchStudents = users.filter(u => u.role === 'student' && u.student_profiles?.batch_id === selectedBatch);
          if (batchStudents.length === 0) throw new Error("No students found in this batch");
          batchStudents.forEach(u => payload.push({ title: formData.title, message: formData.message, user_id: u.id }));
        } else {
          payload.push({ title: formData.title, message: formData.message, user_id: selectedUser });
        }
      } else if (targetType === 'lecturer') {
        if (selectedUser === 'all') {
          const lecturers = users.filter(u => u.role === 'lecturer');
          if (lecturers.length === 0) throw new Error("No lecturers found");
          lecturers.forEach(u => payload.push({ title: formData.title, message: formData.message, user_id: u.id }));
        } else {
          payload.push({ title: formData.title, message: formData.message, user_id: selectedUser });
        }
      }

      if (editingId) {
        if (payload.length > 1) {
          throw new Error("Cannot change recipient to multiple users when editing. Please create a new notification.");
        }
        const { error } = await supabase.from('notifications').update(payload[0]).eq('id', editingId);
        if (error) throw error;
        Swal.fire('Updated!', 'Notification updated successfully.', 'success');
      } else {
        const { error } = await supabase.from('notifications').insert(payload);
        if (error) throw error;
        Swal.fire('Sent!', 'Notification sent successfully.', 'success');
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
        const { error } = await supabase.from('notifications').delete().eq('id', id);
        if (error) throw error;
        Swal.fire('Deleted!', 'Notification has been deleted.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-4 bg-red-100 text-red-600 text-sm py-1 px-3 rounded-full font-bold">
              {unreadCount} Unread
            </span>
          )}
        </h1>
        <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm">
          <Bell className="w-4 h-4 mr-2" /> Send Notification
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Title & Message</th>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8">Loading...</td></tr>
              ) : notifications.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500 truncate max-w-xs">{item.message}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-blue-600">{item.profiles?.full_name || 'All Users'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.is_read ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-700'}`}>
                      {item.is_read ? 'Read' : 'Unread'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openModal(item)} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{editingId ? 'Edit Notification' : 'Send Notification'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input required type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. System Maintenance" />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Recipient Type</label>
                  <select disabled={!!editingId} value={targetType} onChange={(e) => {
                    setTargetType(e.target.value);
                    setSelectedUser('all');
                    setSelectedBatch('');
                  }} className="w-full px-4 py-2 border rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-500">
                    <option value="all">All Users</option>
                    <option value="batch">Students (Batch Wise)</option>
                    <option value="lecturer">Lecturers</option>
                  </select>
                </div>

                {targetType === 'batch' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Batch</label>
                    <select disabled={!!editingId} required value={selectedBatch} onChange={(e) => {
                      setSelectedBatch(e.target.value);
                      setSelectedUser('all');
                    }} className="w-full px-4 py-2 border rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-500">
                      <option value="">Select Batch...</option>
                      {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.year})</option>)}
                    </select>
                  </div>
                )}

                {targetType === 'batch' && selectedBatch && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Student</label>
                    <select disabled={!!editingId} required value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-500">
                      {!editingId && <option value="all">All Students in this Batch</option>}
                      {users.filter(u => u.role === 'student' && u.student_profiles?.batch_id === selectedBatch).map(u => (
                        <option key={u.id} value={u.id}>{u.full_name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {targetType === 'lecturer' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Lecturer</label>
                    <select disabled={!!editingId} required value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-500">
                      {!editingId && <option value="all">All Lecturers</option>}
                      {users.filter(u => u.role === 'lecturer').map(u => (
                        <option key={u.id} value={u.id}>{u.full_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea required name="message" value={formData.message} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" rows="4"></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Send</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Notifications;
