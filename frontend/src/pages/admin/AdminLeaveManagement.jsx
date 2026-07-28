import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Filter, Paperclip, PieChart as PieChartIcon } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AdminLeaveManagement = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchLeaveRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, profiles(full_name, role)')
      .order('created_at', { ascending: false });

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      setLeaveRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  useEffect(() => {
    let result = leaveRequests;

    if (roleFilter !== 'all') {
      result = result.filter(req => req.profiles?.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(req => req.status === statusFilter);
    }

    setFilteredRequests(result);
  }, [leaveRequests, roleFilter, statusFilter]);

  const handleAction = async (id, status) => {
    const actionText = status === 'approved' ? 'Approve' : 'Reject';
    const confirmColor = status === 'approved' ? '#10b981' : '#ef4444';

    const result = await Swal.fire({
      title: `${actionText} Leave Request?`,
      text: `Are you sure you want to ${actionText.toLowerCase()} this leave request?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      cancelButtonColor: '#64748b',
      confirmButtonText: `Yes, ${actionText}`
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('leave_requests')
          .update({ status })
          .eq('id', id);

        if (error) throw error;

        const req = leaveRequests.find(r => r.id === id);
        if (req) {
          await supabase.from('notifications').insert([{
            user_id: req.user_id,
            title: 'Leave Request Update',
            message: `Your leave request from ${req.start_date} to ${req.end_date} has been ${status}.`,
            is_read: false
          }]);
        }

        Swal.fire(
          `${actionText}d!`,
          `The leave request has been ${status}.`,
          'success'
        );
        fetchLeaveRequests();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  // Chart Data Calculations
  const getStatusData = () => {
    const counts = { pending: 0, approved: 0, rejected: 0 };
    leaveRequests.forEach(req => {
      if (counts[req.status] !== undefined) counts[req.status]++;
    });
    return [
      { name: 'Approved', value: counts.approved, color: '#10b981' },
      { name: 'Pending', value: counts.pending, color: '#f59e0b' },
      { name: 'Rejected', value: counts.rejected, color: '#ef4444' }
    ].filter(item => item.value > 0);
  };

  const getRoleData = () => {
    const counts = { lecturer: 0, student: 0 };
    leaveRequests.forEach(req => {
      const role = req.profiles?.role;
      if (role === 'lecturer' || role === 'student') counts[role]++;
    });
    return [
      { name: 'Lecturers', value: counts.lecturer, color: '#3b82f6' },
      { name: 'Students', value: counts.student, color: '#a855f7' }
    ].filter(item => item.value > 0);
  };

  const statusData = getStatusData();
  const roleData = getRoleData();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Leave Requests</h1>
      </div>

      {/* Charts Section */}
      {!loading && leaveRequests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
            <h3 className="text-sm font-semibold text-slate-600 mb-4 flex items-center w-full">
              <PieChartIcon className="w-4 h-4 mr-2 text-slate-400" /> Requests by Status
            </h3>
            <div className="w-full h-64">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#334155', fontWeight: 500 }}
                    />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data available</div>
              )}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
            <h3 className="text-sm font-semibold text-slate-600 mb-4 flex items-center w-full">
              <PieChartIcon className="w-4 h-4 mr-2 text-slate-400" /> Requests by Role
            </h3>
            <div className="w-full h-64">
              {roleData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#334155', fontWeight: 500 }}
                    />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-semibold text-slate-700">All Leave Requests</h2>
          
          {/* Filters */}
          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white border border-slate-200 focus:border-blue-500 focus:ring-0 rounded-lg text-xs font-medium text-slate-600 px-2 py-1.5 shadow-sm"
            >
              <option value="all">All Roles</option>
              <option value="lecturer">Lecturers</option>
              <option value="student">Students</option>
            </select>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 focus:border-blue-500 focus:ring-0 rounded-lg text-xs font-medium text-slate-600 px-2 py-1.5 shadow-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Staff / Student Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Reason & Attachment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    Loading leave requests...
                  </div>
                </td></tr>
              ) : filteredRequests.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-500">No leave requests found.</td></tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-800">{req.profiles?.full_name || 'Unknown'}</td>
                    <td className="px-6 py-4 capitalize">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${req.profiles?.role === 'student' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        {req.profiles?.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{req.type}</td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <div className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {req.start_date} <br/> to <br/> {req.end_date}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="truncate mb-1">{req.reason}</p>
                      {req.attachment_url && (
                        <a 
                          href={req.attachment_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md transition-colors w-max"
                        >
                          <Paperclip className="w-3 h-3 mr-1" /> View Attachment
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        req.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                        req.status === 'rejected' ? 'bg-red-50 text-red-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {req.status === 'pending' && (
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => handleAction(req.id, 'approved')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Approve">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleAction(req.id, 'rejected')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaveManagement;
