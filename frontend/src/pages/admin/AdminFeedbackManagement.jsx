import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';
import { 
  MessageSquare, AlertCircle, CheckCircle, Clock, 
  Search, Filter, Eye, X, Send, User, Tag
} from 'lucide-react';

const AdminFeedbackManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'feedback', 'complaint'
  const [filterCategory, setFilterCategory] = useState('all'); // 'all' or specific category
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'investigating', 'resolved', 'dismissed'
  const [search, setSearch] = useState('');

  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // All possible categories
  const categories = [
    "Individual Lecturer",
    "Student",
    "Batch Voice",
    "Subject",
    "University Development"
  ];

  useEffect(() => {
    fetchItems();
  }, [filterType, filterCategory, filterStatus]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('feedback_complaints')
        .select(`
          *,
          profiles(full_name, role, email)
        `)
        .order('created_at', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      if (filterCategory !== 'all') {
        query = query.eq('target_category', filterCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      Swal.fire('Error', 'Failed to load feedback and complaints.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.subject.toLowerCase().includes(search.toLowerCase()) ||
    item.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (item) => {
    setSelectedItem(item);
    setAdminResponse(item.admin_response || '');
    setUpdateStatus(item.status);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('feedback_complaints')
        .update({
          status: updateStatus,
          admin_response: adminResponse
        })
        .eq('id', selectedItem.id);

      if (error) throw error;
      
      Swal.fire('Updated!', 'The feedback status has been updated.', 'success');
      setSelectedItem(null);
      fetchItems();
    } catch (error) {
      console.error("Update error:", error);
      Swal.fire('Error', error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full border border-yellow-200">Pending</span>;
      case 'investigating': return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">Investigating</span>;
      case 'resolved': return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">Resolved</span>;
      case 'dismissed': return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200">Dismissed</span>;
      default: return null;
    }
  };

  const getTypeIcon = (type) => {
    return type === 'complaint' 
      ? <AlertCircle className="w-5 h-5 text-red-500" />
      : <MessageSquare className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Feedback & Complaints</h1>
          <p className="text-sm text-slate-500 mt-1">Review and manage submissions from students and lecturers.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4 justify-between items-center">
        <div className="flex w-full xl:w-auto items-center space-x-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by subject or name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
            <Filter className="w-4 h-4 text-slate-400 ml-2" />
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-sm py-1.5 pr-8 pl-2 outline-none text-slate-700 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="feedback">Feedback</option>
              <option value="complaint">Complaints</option>
            </select>
          </div>

          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg text-sm py-2 px-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg text-sm py-2 px-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Type & Category</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Submitted By</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
                      <p className="text-slate-500 font-medium">No feedback or complaints found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1.5">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(item.type)}
                          <span className="capitalize font-medium text-slate-700">{item.type}</span>
                        </div>
                        {item.target_category && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 w-fit">
                            <Tag className="w-2.5 h-2.5 mr-1" />
                            {item.target_category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 line-clamp-1">{item.subject}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-slate-400 mr-2" />
                        <div>
                          <p className="font-medium text-slate-700">{item.profiles?.full_name}</p>
                          <p className="text-xs text-slate-500 capitalize">{item.profiles?.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openModal(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 mr-1.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm overflow-y-auto py-10 px-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                {getTypeIcon(selectedItem.type)}
                <h2 className="text-xl font-bold text-slate-800 capitalize">{selectedItem.type} Details</h2>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Info Section */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Submitted By</p>
                  <p className="font-medium text-slate-800">{selectedItem.profiles?.full_name}</p>
                  <p className="text-sm text-slate-500 capitalize">{selectedItem.profiles?.role}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Date Submitted</p>
                  <p className="font-medium text-slate-800">{new Date(selectedItem.created_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedItem.target_category && (
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Category</p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-slate-100 text-slate-800 border border-slate-200">
                    <Tag className="w-4 h-4 mr-1.5 text-slate-400" />
                    {selectedItem.target_category}
                  </span>
                </div>
              )}

              {/* Content Section */}
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Subject</p>
                <h3 className="text-lg font-bold text-slate-800">{selectedItem.subject}</h3>
              </div>
              
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Description</p>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                  {selectedItem.description}
                </div>
              </div>

              {/* Admin Action Section */}
              <form onSubmit={handleUpdate} className="border-t border-slate-100 pt-6 mt-6">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-600" /> 
                  Admin Actions
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Update Status</label>
                    <select 
                      value={updateStatus} 
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Admin Response (Visible to User)</label>
                    <textarea 
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      placeholder="Type your official response here..."
                      rows="4"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm resize-none"
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <button 
                      type="button" 
                      onClick={() => setSelectedItem(null)} 
                      className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors mr-3"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center disabled:opacity-70"
                    >
                      {submitting ? 'Saving...' : (
                        <>
                          <Send className="w-4 h-4 mr-2" /> Save Updates
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackManagement;
