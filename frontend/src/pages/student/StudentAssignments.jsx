import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Download, Upload, CheckCircle, AlertCircle, FileText, ChevronRight, Loader2, Search } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const StudentAssignments = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      // 1. Fetch Student Department
      const { data: studentData } = await supabase
        .from('student_profiles')
        .select('courses(department_id)')
        .eq('user_id', user.id)
        .single();
      const studentDeptId = studentData?.courses?.department_id;

      // 2. Fetch Assignments with Module and Course Info
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*, modules(name, courses(department_id))');
      
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('student_submissions')
        .select('*')
        .eq('student_id', user.id);

      if (assignmentsError) throw assignmentsError;
      if (submissionsError) throw submissionsError;
      
      const submissionsMap = {};
      (submissionsData || []).forEach(sub => {
        submissionsMap[sub.assignment_id] = sub;
      });

      // Filter assignments to only include those matching student's department
      const filteredAssignments = (assignmentsData || []).filter(a => {
        if (!studentDeptId) return true; // If student has no department, show all (or could hide all)
        const assignmentDeptId = a.modules?.courses?.department_id;
        if (!assignmentDeptId) return true; // If assignment has no department linked, assume general
        return assignmentDeptId === studentDeptId;
      });

      const mapped = filteredAssignments.map(a => {
        const submission = submissionsMap[a.id];
        const isSubmitted = !!submission;
        const due = new Date(a.due_date);
        const isLate = !isSubmitted && due < new Date();
        
        return {
          id: a.id,
          title: a.title,
          course: a.modules?.name || 'General Assignment',
          deadline: due.toLocaleDateString(),
          time: due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: isSubmitted ? 'Submitted' : (isLate ? 'Overdue' : 'Pending'),
          type: 'Assignment',
          marks: submission ? (submission.marks !== null ? submission.marks : 'Pending Grading') : null,
          feedback: submission?.feedback || null,
          file_url: a.file_url,
          submission_file_url: submission?.file_url || null,
          raw_date: due,
          description: a.description || 'No instructions provided.'
        };
      });

      mapped.sort((a, b) => b.raw_date - a.raw_date);
      setAssignments(mapped);
      
      if (selectedAssignment) {
        const updatedSelected = mapped.find(a => a.id === selectedAssignment.id);
        if (updatedSelected) {
          setSelectedAssignment(updatedSelected);
        }
      } else if (mapped.length > 0) {
        setSelectedAssignment(mapped[0]);
      }
    } catch (err) {
      console.error('Failed to fetch assignments', err);
    } finally {
      setLoading(false);
    }
  };



  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      Swal.fire('Error', 'Please select a file to upload', 'error');
      return;
    }
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${selectedAssignment.id}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `submissions/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
      
      const { error: insertError } = await supabase
        .from('student_submissions')
        .insert([{
          assignment_id: selectedAssignment.id,
          student_id: user.id,
          file_url: publicUrl,
          submitted_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;
      
      await supabase.from('notifications').insert([{
        user_id: user.id,
        title: 'Assignment Submitted',
        message: `Your submission for "${selectedAssignment.title}" was successful.`,
        is_read: false
      }]);
      
      Swal.fire('Success', 'Assignment submitted successfully', 'success');
      setFile(null);
      fetchAssignments();
    } catch (error) {
      console.error('Upload error:', error);
      Swal.fire('Error', 'Failed to submit assignment', 'error');
    } finally {
      setUploading(false);
    }
  };

  const getTimeLeftText = (date) => {
    const diff = date.getTime() - new Date().getTime();
    if (diff < 0) return 'Overdue';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} days left`;
    return `${hours} hrs left`;
  };

  const upcomingCount = assignments.filter(a => a.status === 'Pending' || a.status === 'Overdue').length;
  const completedCount = assignments.filter(a => a.status === 'Submitted').length;

  const filteredViewAssignments = assignments.filter(a => {
    const matchesTab = activeTab === 'upcoming' ? a.status !== 'Submitted' : a.status === 'Submitted';
    const matchesSearch = a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.course?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Assignments</h1>
        
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="bg-slate-100 p-1 rounded-xl inline-flex shrink-0">
            <button 
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'upcoming' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Upcoming ({upcomingCount})
            </button>
            <button 
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'completed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              History ({completedCount})
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col - Assignment List */}
        <div className="lg:col-span-2 space-y-4">
          
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
          ) : filteredViewAssignments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center flex flex-col items-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {activeTab === 'upcoming' ? "You're all caught up!" : "No history found."}
              </h3>
              <p className="text-slate-500 text-sm">
                {activeTab === 'upcoming' 
                  ? "You don't have any pending assignments at the moment."
                  : "No completed assignments match your search."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredViewAssignments.map((assignment) => (
            <div 
              key={assignment.id} 
              onClick={() => setSelectedAssignment(assignment)}
              className={`bg-white rounded-2xl border ${selectedAssignment?.id === assignment.id ? 'border-blue-400 ring-4 ring-blue-50' : 'border-slate-100'} shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    assignment.status === 'Pending' ? 'bg-orange-50 text-orange-600' :
                    assignment.status === 'Overdue' ? 'bg-red-50 text-red-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {assignment.status === 'Submitted' ? <CheckCircle className="w-6 h-6" /> : (assignment.status === 'Overdue' ? <AlertCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{assignment.title}</h3>
                    <p className="text-sm text-slate-500 font-medium">{assignment.course}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  assignment.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                  assignment.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {assignment.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                  Due: <span className="font-semibold text-slate-800 ml-1">{assignment.deadline}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-slate-400" />
                  <span className="font-semibold text-slate-800">{assignment.time}</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-slate-400" />
                  Type: <span className="font-semibold text-slate-800 ml-1">{assignment.type}</span>
                </div>
              </div>

              {assignment.status === 'Submitted' && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Marks Obtained</p>
                    <p className="text-lg font-bold text-slate-800">{assignment.marks || 'Pending Grading'}</p>
                  </div>
                  {assignment.feedback && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAssignment(assignment);
                        Swal.fire({
                          title: 'Lecturer Feedback',
                          text: assignment.feedback,
                          icon: 'info',
                          confirmButtonColor: '#2563eb'
                        });
                      }}
                      className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View Feedback <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
              </div>
            )}
          </div>

          {/* Right Col - Details & Upload */}
        <div className="lg:col-span-1">
          {selectedAssignment ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-24">
              
              <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
                {selectedAssignment.status === 'Pending' && (
                  <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold mb-3 inline-block">Upcoming</span>
                )}
                {selectedAssignment.status === 'Overdue' && (
                  <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold mb-3 inline-block">Overdue</span>
                )}
                {selectedAssignment.status === 'Submitted' && (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold mb-3 inline-block">Submitted</span>
                )}
                
                <h2 className="text-xl font-bold text-slate-800 mb-2">{selectedAssignment.title}</h2>
                <p className="text-sm text-slate-500 font-medium mb-4">{selectedAssignment.course}</p>
                
                <div className="flex items-center text-sm text-slate-600 bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                  <Clock className={`w-4 h-4 mr-2 ${selectedAssignment.status === 'Overdue' ? 'text-red-500' : 'text-orange-500'}`} />
                  <span className="font-medium text-slate-800 mr-2">{selectedAssignment.deadline}, {selectedAssignment.time}</span>
                  ({getTimeLeftText(selectedAssignment.raw_date)})
                </div>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Instructions */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-2">Instructions</h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {selectedAssignment.description}
                  </p>
                </div>

                {/* Resources */}
                {selectedAssignment.file_url && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-2">Reference Materials</h3>
                    <a href={selectedAssignment.file_url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center mr-3">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Assignment_Document</span>
                      </div>
                      <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                    </a>
                  </div>
                )}

                {/* Upload Section */}
                {selectedAssignment.status !== 'Submitted' ? (
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-2">Your Submission</h3>
                    <label className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group block">
                      <input type="file" className="hidden" onChange={handleFileChange} />
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mb-1">
                        {file ? file.name : 'Click to upload file'}
                      </p>
                      <p className="text-xs text-slate-500">or drag and drop here (Max 50MB)</p>
                    </label>

                    <button 
                      onClick={handleUpload}
                      disabled={uploading || !file}
                      className="w-full mt-4 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {uploading ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>
                      ) : 'Submit Assignment'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 mb-2">Your Submission</h3>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-emerald-500 mr-2" />
                          <span className="text-sm font-medium text-emerald-700">Assignment Submitted</span>
                        </div>
                        {selectedAssignment.submission_file_url && (
                          <a href={selectedAssignment.submission_file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 font-bold hover:underline">
                            View File
                          </a>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-800 mb-2">Grading Details</h3>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Marks Obtained</p>
                          <p className={`text-lg font-bold ${selectedAssignment.marks !== 'Pending Grading' ? 'text-blue-600' : 'text-slate-700'}`}>
                            {selectedAssignment.marks || 'Pending Grading'}
                          </p>
                        </div>
                        {selectedAssignment.feedback && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Lecturer Feedback</p>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {selectedAssignment.feedback}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 flex flex-col items-center text-center">
              <FileText className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500">Select an assignment to view details</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentAssignments;
