import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Download, Eye, ArrowLeft, CheckCircle, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { sendEmail } from '../../services/EmailService';
import { useAuth } from '../../context/AuthContext';

const AssignmentManagement = () => {
  const { user } = useAuth();
  const isLecturer = window.location.pathname.includes('/lecturer');
  const [assignments, setAssignments] = useState([]);
  const [modules, setModules] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lecturerDeptId, setLecturerDeptId] = useState(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Submissions State
  const [viewingAssignment, setViewingAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  // Form State
  const [formData, setFormData] = useState({ title: '', module_id: '', module_name_input: '', description: '', due_date: '', total_marks: 100, file_url: '', department_id: '', course_id: '' });
  const [editingId, setEditingId] = useState(null);

  // Tabs & Search State
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [searchQuery, setSearchQuery] = useState('');

  // History Filters & Pagination
  const [historyModuleFilter, setHistoryModuleFilter] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    let deptId = null;
    if (isLecturer && user) {
      const { data } = await supabase.from('lecturer_profiles').select('department_id').eq('user_id', user.id).single();
      if (data) deptId = data.department_id;
      setLecturerDeptId(deptId);
    }

    const [assignRes, modRes, deptRes, courseRes] = await Promise.all([
      supabase.from('assignments').select('*, modules(name, course_id, courses(department_id)), student_submissions(marks)').order('due_date', { ascending: true }),
      supabase.from('modules').select('id, name, course_id, courses(department_id)'),
      supabase.from('departments').select('id, name'),
      supabase.from('courses').select('id, name, department_id')
    ]);

    if (assignRes.data) {
      let fetchedAssignments = assignRes.data;
      if (isLecturer && deptId) {
        // Filter assignments by the lecturer's department
        fetchedAssignments = fetchedAssignments.filter(a => {
            const courseDeptId = a.modules?.courses?.department_id;
            // Also include if no department is linked so it's not completely hidden
            return !courseDeptId || courseDeptId === deptId;
        });
      }
      setAssignments(fetchedAssignments);
    }
    if (modRes.data) setModules(modRes.data);
    if (deptRes.data) setDepartments(deptRes.data);
    if (courseRes.data) setCourses(courseRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAssignments = useMemo(() => {
    let filtered = assignments;

    // Filter by Active/History
    const now = new Date();
    filtered = filtered.filter(a => {
      const isPast = new Date(a.due_date) < now;
      return activeTab === 'history' ? isPast : !isPast;
    });

    // Filter by Search Query
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title?.toLowerCase().includes(lowerQ) ||
        a.modules?.name?.toLowerCase().includes(lowerQ)
      );
    }

    // Advanced Filters for History
    if (activeTab === 'history') {
      if (historyModuleFilter) {
        filtered = filtered.filter(a => a.module_id === historyModuleFilter);
      }
      if (historyDateFilter) {
        const filterDate = new Date(historyDateFilter).toDateString();
        filtered = filtered.filter(a => new Date(a.due_date).toDateString() === filterDate);
      }
    }

    return filtered;
  }, [assignments, activeTab, searchQuery, historyModuleFilter, historyDateFilter]);

  // Pagination for History Table
  const paginatedAssignments = useMemo(() => {
    if (activeTab !== 'history') return filteredAssignments;
    const startIndex = (historyPage - 1) * itemsPerPage;
    return filteredAssignments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAssignments, activeTab, historyPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);

  const historyChartData = useMemo(() => {
    if (activeTab !== 'history') return [];

    return filteredAssignments.map(a => {
      const subs = a.student_submissions || [];
      const gradedSubs = subs.filter(s => s.marks !== null);
      const avgGrade = gradedSubs.length > 0
        ? Math.round(gradedSubs.reduce((acc, curr) => acc + curr.marks, 0) / gradedSubs.length)
        : 0;

      return {
        name: a.title.substring(0, 15) + (a.title.length > 15 ? '...' : ''),
        tooltipName: a.title,
        'Avg Grade (%)': avgGrade,
        'Submissions': subs.length
      };
    }).slice(0, 15); // Show up to 15 recent past assignments
  }, [filteredAssignments, activeTab]);

  const fetchSubmissions = async (assignmentId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('student_submissions')
      .select('*, profiles(full_name)')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (data) setSubmissions(data);
    setLoading(false);
  };

  const openSubmissionsView = (assignment) => {
    setViewingAssignment(assignment);
    fetchSubmissions(assignment.id);
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const openModal = (assignment = null) => {
    if (assignment) {
      const moduleName = modules.find(m => m.id === assignment.module_id)?.name || '';
      setFormData({
        title: assignment.title,
        module_id: assignment.module_id || '',
        module_name_input: moduleName,
        description: assignment.description || '',
        due_date: assignment.due_date || '',
        total_marks: assignment.total_marks || 100,
        file_url: assignment.file_url || '',
        department_id: '',
        course_id: ''
      });
      setEditingId(assignment.id);
    } else {
      setFormData({ title: '', module_id: '', module_name_input: '', description: '', due_date: '', total_marks: 100, file_url: '', department_id: '', course_id: '' });
      setEditingId(null);
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.module_name_input?.trim()) {
      Swal.fire('Error', 'Please enter or select a specific module.', 'error');
      return;
    }

    setUploading(true);
    try {
      let finalModuleId = formData.module_id;

      if (!finalModuleId) {
        // Try to find if they just typed an existing name without selecting
        const existing = modules.find(m => m.name.toLowerCase() === formData.module_name_input.trim().toLowerCase());
        if (existing) {
          finalModuleId = existing.id;
        } else {
          // Create new module on the fly
          const { data: newModule, error: moduleError } = await supabase
            .from('modules')
            .insert([{
              name: formData.module_name_input.trim(),
              course_id: formData.course_id || null
            }])
            .select('id')
            .single();

          if (moduleError) throw moduleError;
          finalModuleId = newModule.id;
        }
      }

      let finalFileUrl = formData.file_url;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `assignments/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
        finalFileUrl = publicUrl;
      }

      const payload = {
        title: formData.title,
        module_id: finalModuleId,
        description: formData.description,
        due_date: formData.due_date,
        total_marks: formData.total_marks,
        file_url: finalFileUrl
      };

      if (editingId) {
        const { error } = await supabase.from('assignments').update(payload).eq('id', editingId);
        if (error) throw error;
        Swal.fire('Updated!', 'Assignment updated successfully.', 'success');
      } else {
        const { error } = await supabase.from('assignments').insert([payload]);
        if (error) throw error;

        let courseIdToNotify = formData.course_id;
        
        if (!courseIdToNotify) {
          const { data: mod } = await supabase.from('modules').select('course_id').eq('id', finalModuleId).single();
          courseIdToNotify = mod?.course_id;
        }

        if (courseIdToNotify || user?.id) {
          let notifications = [];
          if (courseIdToNotify) {
            const { data: students } = await supabase.from('student_profiles').select('user_id').eq('course_id', courseIdToNotify);
            if (students && students.length > 0) {
              students.forEach(s => {
                notifications.push({
                  user_id: s.user_id,
                  title: 'New Assignment Released',
                  message: `A new assignment "${payload.title}" has been released. Deadline: ${new Date(payload.due_date).toLocaleString()}`,
                  is_read: false
                });
              });
            }
          }
          if (user?.id) {
            notifications.push({
              user_id: user.id,
              title: 'Assignment Release Confirmed',
              message: `You successfully released the assignment "${payload.title}". Deadline: ${new Date(payload.due_date).toLocaleString()}`,
              is_read: false
            });
          }

          if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications);
          }
        }

        Swal.fire('Added!', 'Assignment added successfully.', 'success');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setUploading(false);
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
        const { error } = await supabase.from('assignments').delete().eq('id', id);
        if (error) throw error;
        Swal.fire('Deleted!', 'Assignment has been deleted.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const handleGradeSubmit = async (submissionId, currentMarks, currentFeedback, isReleased, studentId) => {
    const { value: formValues } = await Swal.fire({
      title: 'Grade Submission',
      html:
        `<input id="swal-marks" type="number" class="swal2-input" placeholder="Marks" value="${currentMarks || ''}">` +
        `<textarea id="swal-feedback" class="swal2-textarea" placeholder="Feedback" style="margin-top: 10px;">${currentFeedback || ''}</textarea>`,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        return [
          document.getElementById('swal-marks').value,
          document.getElementById('swal-feedback').value
        ]
      }
    });

    if (formValues) {
      const [marks, feedback] = formValues;
      try {
        const { error } = await supabase
          .from('student_submissions')
          .update({ marks, feedback, is_released: isReleased })
          .eq('id', submissionId);

        if (error) throw error;

        // Fetch Module/Lecturer Info and Student Info for Notifications
        let lecturerEmail = 'lecturer@example.com';
        let lecturerId = user?.id; // Default to the grader
        let studentEmail = 'student@example.com';

        if (viewingAssignment?.module_id) {
          // Fallback if needed, but we don't have lecturer_id on modules.
        }

        if (studentId) {
          const { data: stuData } = await supabase.from('profiles').select('email').eq('id', studentId).single();
          if (stuData && stuData.email) studentEmail = stuData.email;
        }

        const numericMarks = parseFloat(marks);

        // Automated Risk Notification Check (Low Performance)
        if (numericMarks < 40 && studentId) {
          // Notify the specific lecturer
          if (lecturerId) {
            await supabase.from('notifications').insert([{
              user_id: lecturerId,
              title: `High Risk Alert: Low Grade`,
              message: `A student has received a poor grade (${marks}) for assignment "${viewingAssignment.title}".`,
              is_read: false
            }]);
            await sendEmail({
              to: lecturerEmail,
              subject: `Action Required: Low Grade Alert`,
              body: `A student has received a poor grade (${marks}%) for your assignment "${viewingAssignment.title}". Please review their progress and consider an intervention.`
            });
          }
        }

        // Automated Praise Notification (High Performance)
        if (numericMarks >= 90 && studentId && isReleased) {
          await supabase.from('notifications').insert([{
            user_id: studentId,
            title: `Outstanding Achievement! 🌟`,
            message: `Congratulations! You scored ${marks}% on "${viewingAssignment.title}". Keep up the excellent work!`,
            is_read: false
          }]);
          await sendEmail({
            to: studentEmail,
            subject: `Outstanding Achievement! 🌟`,
            body: `Congratulations! You scored ${marks}% on your assignment "${viewingAssignment.title}". Your hard work is paying off. Keep it up!`
          });
        }

        Swal.fire('Graded!', 'Submission graded successfully.', 'success');
        fetchSubmissions(viewingAssignment.id);
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const toggleRelease = async (submissionId, currentReleasedState) => {
    try {
      const { error } = await supabase
        .from('student_submissions')
        .update({ is_released: !currentReleasedState })
        .eq('id', submissionId);

      if (error) throw error;
      fetchSubmissions(viewingAssignment.id);
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  if (viewingAssignment) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center space-x-4">
          <button onClick={() => setViewingAssignment(null)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Submissions: {viewingAssignment.title}</h1>
            <p className="text-slate-500">Due: {new Date(viewingAssignment.due_date).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Submitted At</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">File</th>
                <th className="px-6 py-4">Marks</th>
                <th className="px-6 py-4">Released</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8">Loading Submissions...</td></tr>
              ) : submissions.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-500">No submissions yet for this assignment.</td></tr>
              ) : submissions.map((sub) => {
                const isLate = new Date(sub.submitted_at) > new Date(viewingAssignment.due_date);
                return (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{sub.profiles?.full_name || 'Unknown'}</td>
                    <td className="px-6 py-4">{new Date(sub.submitted_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isLate ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {isLate ? 'Late' : 'On Time'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {sub.file_url ? (
                        <a href={sub.file_url} target="_blank" rel="noreferrer" className="flex items-center text-blue-600 hover:underline">
                          <Download className="w-4 h-4 mr-1" /> Download
                        </a>
                      ) : (
                        <span className="text-slate-400">No File</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">{sub.marks !== null ? `${sub.marks} / ${viewingAssignment.total_marks}` : '-'}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleRelease(sub.id, sub.is_released)} className={`flex items-center ${sub.is_released ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                        <CheckCircle className="w-5 h-5 mr-1" />
                        {sub.is_released ? 'Released' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleGradeSubmit(sub.id, sub.marks, sub.feedback, sub.is_released, sub.student_id)} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors">
                        Grade
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Assignments</h1>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
            />
          </div>
          <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" /> Add New
          </button>
        </div>
      </div>

      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
        >
          Active Assignments
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
        >
          Assignment History
        </button>
      </div>

      {activeTab === 'history' && (
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Module</label>
            <select
              value={historyModuleFilter}
              onChange={(e) => { setHistoryModuleFilter(e.target.value); setHistoryPage(1); }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Modules</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Due Date</label>
            <input
              type="date"
              value={historyDateFilter}
              onChange={(e) => { setHistoryDateFilter(e.target.value); setHistoryPage(1); }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setHistoryModuleFilter(''); setHistoryDateFilter(''); setSearchQuery(''); setHistoryPage(1); }}
              className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {activeTab === 'history' && historyChartData.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Historical Performance (Avg Grade)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="Avg Grade (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Module</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">File</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-8">Loading...</td></tr>
            ) : filteredAssignments.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-8 text-slate-500">No assignments found.</td></tr>
            ) : (activeTab === 'history' ? paginatedAssignments : filteredAssignments).map((assign) => (
              <tr key={assign.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{assign.title}</td>
                <td className="px-6 py-4 text-blue-600">{assign.modules?.name || 'N/A'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${new Date(assign.due_date) < new Date() ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                    {new Date(assign.due_date).toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {assign.file_url ? (
                    <a href={assign.file_url} target="_blank" rel="noreferrer" className="flex items-center text-blue-600 hover:underline">
                      <Download className="w-4 h-4 mr-1" /> View
                    </a>
                  ) : <span className="text-slate-400">-</span>}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openSubmissionsView(assign)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors">
                    Submissions
                  </button>
                  <button onClick={() => openModal(assign)} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(assign.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{editingId ? 'Edit Assignment' : 'Add Assignment'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input required type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. Midterm Report" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Target Department</label>
                  <select name="department_id" value={formData.department_id} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg bg-white">
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Course</label>
                  <select name="course_id" value={formData.course_id} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg bg-white">
                    <option value="">All Courses</option>
                    {courses.filter(c => !formData.department_id || c.department_id === formData.department_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Specific Module</label>
                  <input
                    required
                    list="modules-list"
                    name="module_name_input"
                    value={formData.module_name_input || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const selectedMod = modules.find(m => m.name === val);
                      setFormData(prev => ({
                        ...prev,
                        module_name_input: val,
                        module_id: selectedMod ? selectedMod.id : ''
                      }));
                    }}
                    placeholder="Type or select module..."
                    className="w-full px-4 py-2 border rounded-lg bg-white"
                    autoComplete="off"
                  />
                  <datalist id="modules-list">
                    {modules
                      .filter(m => !formData.course_id || m.course_id === formData.course_id)
                      .filter(m => !formData.department_id || m.courses?.department_id === formData.department_id)
                      .map(m => <option key={m.id} value={m.name} />)
                    }
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date & Time</label>
                  <input required type="datetime-local" name="due_date" value={formData.due_date ? formData.due_date.substring(0, 16) : ''} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Marks</label>
                  <input required type="number" name="total_marks" value={formData.total_marks} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" rows="3"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assignment File (PDF, Word, Excel)</label>
                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileChange} className="w-full px-4 py-2 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {formData.file_url && !selectedFile && (
                  <p className="text-xs text-emerald-600 mt-2 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Existing file attached</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                <button type="submit" disabled={uploading} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center">
                  {uploading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManagement;
