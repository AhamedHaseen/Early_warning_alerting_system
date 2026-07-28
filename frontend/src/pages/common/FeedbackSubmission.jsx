import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import { MessageSquare, AlertCircle, Send, CheckCircle, Clock, Search, Eye, X, Tag } from 'lucide-react';

const FeedbackSubmission = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [batches, setBatches] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Form State
  const [type, setType] = useState('feedback');
  const [targetCategory, setTargetCategory] = useState('Individual Lecturer');
  
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedLecturer, setSelectedLecturer] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('All Students');
  
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // View State
  const [selectedItem, setSelectedItem] = useState(null);

  // Categories based on role
  const lecturerCategories = [
    "Individual Lecturer",
    "Student",
    "Batch Voice",
    "Subject",
    "University Development"
  ];

  const studentCategories = [
    "Individual Lecturer",
    "Student",
    "University Development"
  ];

  const availableCategories = user?.role === 'lecturer' ? lecturerCategories : studentCategories;

  // Ensure default category is valid for role
  useEffect(() => {
    if (user && availableCategories.length > 0 && !availableCategories.includes(targetCategory)) {
      setTargetCategory(availableCategories[0]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchItems();
      fetchBatches();
      fetchLecturers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBatch) {
      fetchStudentsForBatch(selectedBatch);
    }
  }, [selectedBatch]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedback_complaints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('year', { ascending: false })
        .order('name');
      if (error) throw error;
      setBatches(data || []);
      if (data && data.length > 0) {
        setSelectedBatch(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  const fetchLecturers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'lecturer')
        .order('full_name');
      if (error) throw error;
      setLecturers(data || []);
      if (data && data.length > 0) {
        setSelectedLecturer(data[0].full_name);
      }
    } catch (error) {
      console.error("Error fetching lecturers:", error);
    }
  };

  const fetchStudentsForBatch = async (batchId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, student_profiles!inner(batch_id)')
        .eq('role', 'student')
        .eq('student_profiles.batch_id', batchId)
        .order('full_name');
      if (error) throw error;
      setStudents(data || []);
      setSelectedStudent('All Students');
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      Swal.fire('Error', 'Please fill in all fields.', 'error');
      return;
    }

    if (targetCategory === 'Batch Voice' && !selectedBatch) {
      Swal.fire('Error', 'Please select a batch.', 'error');
      return;
    }

    if (targetCategory === 'Individual Lecturer' && !selectedLecturer) {
      Swal.fire('Error', 'Please select a lecturer.', 'error');
      return;
    }

    if (targetCategory === 'Student' && !selectedBatch) {
      Swal.fire('Error', 'Please select a batch.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let finalSubject = subject;
      
      const batchObj = batches.find(b => b.id === selectedBatch);
      const batchName = batchObj ? `${batchObj.name} (${batchObj.year})` : '';

      if (targetCategory === 'Batch Voice') {
        finalSubject = `[${batchName}] ${subject}`;
      } else if (targetCategory === 'Individual Lecturer') {
        finalSubject = `[${selectedLecturer}] ${subject}`;
      } else if (targetCategory === 'Student') {
        finalSubject = `[${batchName} - ${selectedStudent}] ${subject}`;
      }

      const { error } = await supabase
        .from('feedback_complaints')
        .insert([{
          user_id: user.id,
          type,
          target_category: targetCategory,
          subject: finalSubject,
          description,
          status: 'pending'
        }]);

      if (error) throw error;

      Swal.fire('Submitted!', 'Your submission has been sent successfully.', 'success');
      setSubject('');
      setDescription('');
      setType('feedback');
      setTargetCategory(availableCategories[0]);
      fetchItems();
    } catch (error) {
      console.error("Submission error:", error);
      Swal.fire('Error', error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full border border-yellow-200 flex items-center w-fit"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
      case 'investigating': return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200 flex items-center w-fit"><Search className="w-3 h-3 mr-1" /> Investigating</span>;
      case 'resolved': return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 flex items-center w-fit"><CheckCircle className="w-3 h-3 mr-1" /> Resolved</span>;
      case 'dismissed': return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200 flex items-center w-fit"><X className="w-3 h-3 mr-1" /> Dismissed</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Feedback & Complaints</h1>
          <p className="text-sm text-slate-500 mt-1">Submit your concerns or feedback directly to the administration.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Submission Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <Send className="w-5 h-5 mr-2 text-blue-600" /> New Submission
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      value="feedback" 
                      checked={type === 'feedback'}
                      onChange={() => setType('feedback')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-700 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1 text-blue-500" /> Feedback
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      value="complaint" 
                      checked={type === 'complaint'}
                      onChange={() => setType('complaint')}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-700 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1 text-red-500" /> Complaint
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <select 
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Selectors based on Category */}
              {targetCategory === 'Individual Lecturer' && lecturers.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Lecturer</label>
                  <select 
                    value={selectedLecturer}
                    onChange={(e) => setSelectedLecturer(e.target.value)}
                    className="w-full px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                  >
                    {lecturers.map(lec => (
                      <option key={lec.id} value={lec.full_name}>{lec.full_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {(targetCategory === 'Batch Voice' || targetCategory === 'Student') && batches.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Batch</label>
                  <select 
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    className="w-full px-4 py-2 bg-purple-50 border border-purple-200 text-purple-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm transition-all"
                  >
                    {batches.map(batch => (
                      <option key={batch.id} value={batch.id}>{batch.name} ({batch.year})</option>
                    ))}
                  </select>
                </div>
              )}

              {targetCategory === 'Student' && selectedBatch && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Student</label>
                  <select 
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-4 py-2 bg-pink-50 border border-pink-200 text-pink-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none text-sm transition-all"
                  >
                    <option value="All Students">All Students</option>
                    {students.map(std => (
                      <option key={std.id} value={std.full_name}>{std.full_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief title of your submission"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed information here..."
                  rows="5"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all resize-none"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center justify-center disabled:opacity-70"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
        </div>

        {/* History List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-slate-500" /> Submission History
              </h2>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto bg-slate-50/50">
              {loading ? (
                <div className="text-center py-10 text-slate-500">Loading...</div>
              ) : items.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-base font-bold text-slate-700">No Submissions Yet</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                    You haven't submitted any feedback or complaints yet. Use the form to create one.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-3">
                          {item.type === 'complaint' ? <AlertCircle className="w-5 h-5 text-red-500" /> : <MessageSquare className="w-5 h-5 text-blue-500" />}
                          <h3 className="font-bold text-slate-800">{item.subject}</h3>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                      
                      {item.target_category && (
                        <div className="mb-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <Tag className="w-3 h-3 mr-1" />
                            {item.target_category}
                          </span>
                        </div>
                      )}

                      <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                        {item.description}
                      </p>
                      
                      <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        <button 
                          onClick={() => setSelectedItem(item)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" /> View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm overflow-y-auto py-10 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                {selectedItem.type === 'complaint' ? <AlertCircle className="w-5 h-5 text-red-500" /> : <MessageSquare className="w-5 h-5 text-blue-500" />}
                <h2 className="text-xl font-bold text-slate-800 capitalize">{selectedItem.type} Details</h2>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Date Submitted</p>
                  <p className="text-sm font-medium text-slate-800">{new Date(selectedItem.created_at).toLocaleString()}</p>
                </div>
                <div>
                  {getStatusBadge(selectedItem.status)}
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

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Subject</p>
                <h3 className="text-base font-bold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedItem.subject}</h3>
              </div>
              
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Description</p>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                  {selectedItem.description}
                </div>
              </div>

              {selectedItem.admin_response && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-blue-600" /> Admin Response
                  </h3>
                  <div className="text-sm text-blue-900 whitespace-pre-wrap">
                    {selectedItem.admin_response}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50/50 rounded-b-2xl">
               <button 
                  onClick={() => setSelectedItem(null)} 
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                  Close
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FeedbackSubmission;
