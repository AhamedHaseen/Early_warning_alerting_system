import React, { useState, useEffect } from 'react';
import { CalendarDays, PlusCircle, Paperclip, CheckCircle, Clock, XCircle, Trash2, Filter } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const LeaveManagement = () => {
  const { user } = useAuth();
  
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [leaveType, setLeaveType] = useState('Annual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Balances
  const totalAnnual = 21;
  const totalCasual = 7;
  const totalMedical = 14;

  const [balances, setBalances] = useState({
    annualUsed: 0,
    casualUsed: 0,
    medicalUsed: 0
  });

  const fetchLeaveHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setLeaveHistory(data || []);
      calculateBalances(data || []);
    } catch (err) {
      console.error('Error fetching leave history:', err.message);
      Swal.fire('Error', 'Failed to fetch leave history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveHistory();
  }, [user]);

  useEffect(() => {
    let result = leaveHistory;

    if (statusFilter !== 'all') {
      result = result.filter(leave => leave.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter(leave => leave.type === typeFilter);
    }

    setFilteredHistory(result);
  }, [leaveHistory, statusFilter, typeFilter]);

  const calculateBalances = (leaves) => {
    let annual = 0;
    let casual = 0;
    let medical = 0;

    leaves.forEach(leave => {
      // Only deduct balance for approved leaves
      if (leave.status === 'approved') {
        const start = new Date(leave.start_date);
        const end = new Date(leave.end_date);
        // Calculate days inclusive of start and end
        const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (leave.type === 'Annual Leave') annual += days;
        if (leave.type === 'Casual Leave') casual += days;
        if (leave.type === 'Medical Leave') medical += days;
      }
    });

    setBalances({
      annualUsed: annual,
      casualUsed: casual,
      medicalUsed: medical
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    } else {
      setAttachment(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      Swal.fire('Error', 'Please fill in all required fields.', 'error');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      Swal.fire('Error', 'End date must be after or equal to start date.', 'error');
      return;
    }

    if (leaveType === 'Medical Leave' && !attachment) {
      Swal.fire('Error', 'Medical leave requires a doctor\'s medical attachment.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let attachmentUrl = null;

      // Upload attachment if present
      if (attachment) {
        const fileExt = attachment.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('leave-attachments')
          .upload(filePath, attachment);

        if (uploadError) {
          throw new Error(`Attachment upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('leave-attachments')
          .getPublicUrl(filePath);

        attachmentUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase
        .from('leave_requests')
        .insert([{
          user_id: user.id,
          type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason: reason,
          status: 'pending',
          attachment_url: attachmentUrl
        }]);

      if (error) throw error;

      // Notify all admins about the new leave request
      const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          title: 'New Leave Request',
          message: `A new ${leaveType} request has been submitted for ${startDate} to ${endDate}.`,
          type: 'info',
          is_read: false
        }));
        await supabase.from('notifications').insert(notifications);
      }

      Swal.fire('Success', 'Leave request submitted successfully.', 'success');
      
      // Reset form
      setLeaveType('Annual Leave');
      setStartDate('');
      setEndDate('');
      setReason('');
      setAttachment(null);
      
      const fileInput = document.getElementById('attachment-input');
      if (fileInput) fileInput.value = '';
      
      // Refresh data
      fetchLeaveHistory();
    } catch (err) {
      console.error('Error submitting leave:', err.message);
      Swal.fire('Error', err.message || 'Failed to submit leave request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    const result = await Swal.fire({
      title: 'Cancel Leave Request?',
      text: "Are you sure you want to cancel this pending request?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, cancel it'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('leave_requests')
          .delete()
          .eq('id', id);

        if (error) throw error;

        Swal.fire('Cancelled!', 'Your leave request has been cancelled.', 'success');
        fetchLeaveHistory();
      } catch (err) {
        Swal.fire('Error', 'Failed to cancel request.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Leave Management</h1>
        <p className="text-slate-500 text-sm bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <span className="font-semibold text-blue-600">Medical leaves require a doctor's attachment.</span>
        </p>
      </div>

      {/* Leave Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border-t-4 border-t-blue-500 border-l border-r border-b border-slate-100 shadow-sm flex flex-col">
          <span className="text-sm font-medium text-slate-500">Annual Leave Balance</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-slate-800">{totalAnnual - balances.annualUsed}</span>
            <span className="text-sm font-medium text-slate-500">/ {totalAnnual} Days</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${(balances.annualUsed / totalAnnual) * 100}%` }}></div>
          </div>
          <span className="text-xs text-slate-400 mt-2 text-right">{balances.annualUsed} days used</span>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border-t-4 border-t-emerald-500 border-l border-r border-b border-slate-100 shadow-sm flex flex-col">
          <span className="text-sm font-medium text-slate-500">Casual Leave Balance</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-slate-800">{totalCasual - balances.casualUsed}</span>
            <span className="text-sm font-medium text-slate-500">/ {totalCasual} Days</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${(balances.casualUsed / totalCasual) * 100}%` }}></div>
          </div>
          <span className="text-xs text-slate-400 mt-2 text-right">{balances.casualUsed} days used</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border-t-4 border-t-purple-500 border-l border-r border-b border-slate-100 shadow-sm flex flex-col">
          <span className="text-sm font-medium text-slate-500">Medical Leave Balance</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-slate-800">{totalMedical - balances.medicalUsed}</span>
            <span className="text-sm font-medium text-slate-500">/ {totalMedical} Days</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${(balances.medicalUsed / totalMedical) * 100}%` }}></div>
          </div>
          <span className="text-xs text-slate-400 mt-2 text-right">{balances.medicalUsed} days used</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Apply Leave Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
              <PlusCircle className="w-5 h-5 mr-2 text-blue-500" /> Apply for Leave
            </h2>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
                <select 
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Medical Leave">Medical Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
                  <input 
                    type="date" 
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
                  <input 
                    type="date" 
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Leave</label>
                <textarea 
                  rows={4} 
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm" 
                  placeholder="Briefly explain the reason for your leave request..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Attachment {leaveType === 'Medical Leave' ? <span className="text-red-500">* (Required)</span> : '(Optional)'}
                </label>
                <div className="border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 relative group hover:bg-slate-100 transition-colors">
                  <input 
                    id="attachment-input"
                    type="file" 
                    onChange={handleFileChange}
                    required={leaveType === 'Medical Leave'}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <div className="flex items-center text-sm text-slate-600">
                    <Paperclip className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="truncate">
                      {attachment ? attachment.name : "Upload medical certificate..."}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Submitting...</>
                ) : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>

        {/* Leave History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <CalendarDays className="w-5 h-5 mr-2 text-slate-400" /> Leave History
              </h2>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-0 rounded-lg text-xs font-medium text-slate-600 px-2 py-1.5"
                >
                  <option value="all">All Types</option>
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Medical Leave">Medical Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-0 rounded-lg text-xs font-medium text-slate-600 px-2 py-1.5"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Leave Type</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Days</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                          Loading your leave history...
                        </div>
                      </td>
                    </tr>
                  ) : filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                        No leave history found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((leave) => {
                      const start = new Date(leave.start_date);
                      const end = new Date(leave.end_date);
                      const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                      
                      return (
                        <tr key={leave.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-medium text-slate-800">{leave.type}</span>
                            {leave.attachment_url && (
                              <a href={leave.attachment_url} target="_blank" rel="noreferrer" className="block text-xs text-blue-600 hover:underline mt-1 flex items-center w-max">
                                <Paperclip className="w-3 h-3 mr-1" /> View Attachment
                              </a>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                            {leave.start_date} <span className="mx-1 text-slate-400">to</span> {leave.end_date}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium">{days}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`flex items-center text-xs font-medium w-max px-2.5 py-1 rounded-full capitalize ${
                              leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              leave.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {leave.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {leave.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                              {leave.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                              {leave.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {leave.status === 'pending' ? (
                              <button 
                                onClick={() => handleCancel(leave.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors flex items-center justify-end w-full"
                                title="Cancel Request"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">--</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LeaveManagement;

