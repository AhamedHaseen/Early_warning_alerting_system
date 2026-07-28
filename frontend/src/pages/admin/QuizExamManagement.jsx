import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Download, Eye, ArrowLeft, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';

const QuizExamManagement = () => {
  const [assessments, setAssessments] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Submissions State
  const [viewingAssessment, setViewingAssessment] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  // Form State
  const [formData, setFormData] = useState({ title: '', type: 'quiz', module_id: '', date: '', duration_minutes: 60, total_marks: 100, file_url: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const [assessRes, modRes] = await Promise.all([
      supabase.from('assessments').select('*, modules(name)').order('date', { ascending: true }),
      supabase.from('modules').select('id, name')
    ]);
    
    if (assessRes.data) setAssessments(assessRes.data);
    if (modRes.data) setModules(modRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchSubmissions = async (assessmentId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('student_submissions')
      .select('*, profiles(full_name)')
      .eq('assessment_id', assessmentId)
      .order('submitted_at', { ascending: false });
      
    if (data) setSubmissions(data);
    setLoading(false);
  };

  const openSubmissionsView = (assessment) => {
    setViewingAssessment(assessment);
    fetchSubmissions(assessment.id);
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setFormData({ 
        title: item.title, 
        type: item.type || 'quiz',
        module_id: item.module_id || '', 
        date: item.date || '', 
        duration_minutes: item.duration_minutes || 60,
        total_marks: item.total_marks || 100,
        file_url: item.file_url || ''
      });
      setEditingId(item.id);
    } else {
      setFormData({ title: '', type: 'quiz', module_id: '', date: '', duration_minutes: 60, total_marks: 100, file_url: '' });
      setEditingId(null);
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalFileUrl = formData.file_url;
      
      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `exams/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, selectedFile);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
        finalFileUrl = publicUrl;
      }

      const payload = { ...formData, file_url: finalFileUrl };

      if (editingId) {
        const { error } = await supabase.from('assessments').update(payload).eq('id', editingId);
        if (error) throw error;
        Swal.fire('Updated!', 'Assessment updated successfully.', 'success');
      } else {
        const { error } = await supabase.from('assessments').insert([payload]);
        if (error) throw error;
        Swal.fire('Added!', 'Assessment added successfully.', 'success');
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
        const { error } = await supabase.from('assessments').delete().eq('id', id);
        if (error) throw error;
        Swal.fire('Deleted!', 'Assessment has been deleted.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const handleGradeSubmit = async (submissionId, currentMarks, currentFeedback, isReleased) => {
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
        Swal.fire('Graded!', 'Submission graded successfully.', 'success');
        fetchSubmissions(viewingAssessment.id);
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
      fetchSubmissions(viewingAssessment.id);
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  if (viewingAssessment) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center space-x-4">
          <button onClick={() => setViewingAssessment(null)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Submissions: {viewingAssessment.title}</h1>
            <p className="text-slate-500">Scheduled: {new Date(viewingAssessment.date).toLocaleString()}</p>
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
                <tr><td colSpan="7" className="text-center py-8 text-slate-500">No submissions yet.</td></tr>
              ) : submissions.map((sub) => {
                // For exams, late is if submitted after date + duration_minutes
                const examEndTime = new Date(new Date(viewingAssessment.date).getTime() + viewingAssessment.duration_minutes * 60000);
                const isLate = new Date(sub.submitted_at) > examEndTime;
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
                    <td className="px-6 py-4 font-medium">{sub.marks !== null ? `${sub.marks} / ${viewingAssessment.total_marks}` : '-'}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleRelease(sub.id, sub.is_released)} className={`flex items-center ${sub.is_released ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                        <CheckCircle className="w-5 h-5 mr-1" />
                        {sub.is_released ? 'Released' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleGradeSubmit(sub.id, sub.marks, sub.feedback, sub.is_released)} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors">
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Quizzes & Exams</h1>
        <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Assessment
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Module</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">File</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="7" className="text-center py-8">Loading...</td></tr>
            ) : assessments.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{item.title}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    item.type === 'exam' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-blue-600">{item.modules?.name || 'N/A'}</td>
                <td className="px-6 py-4">{new Date(item.date).toLocaleString()}</td>
                <td className="px-6 py-4 font-medium">{item.duration_minutes} mins</td>
                <td className="px-6 py-4">
                  {item.file_url ? (
                    <a href={item.file_url} target="_blank" rel="noreferrer" className="flex items-center text-blue-600 hover:underline">
                      <Download className="w-4 h-4 mr-1" /> View
                    </a>
                  ) : <span className="text-slate-400">-</span>}
                </td>
                <td className="px-6 py-4 text-right space-x-2 flex items-center justify-end">
                  <button onClick={() => openSubmissionsView(item)} className="px-3 py-1.5 mr-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors">
                    Submissions
                  </button>
                  <button onClick={() => openModal(item)} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{editingId ? 'Edit Assessment' : 'Add Assessment'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input required type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. Midterm Exam" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select required name="type" value={formData.type} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg bg-white">
                    <option value="quiz">Quiz</option>
                    <option value="exam">Exam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Module</label>
                  <select required name="module_id" value={formData.module_id} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg bg-white">
                    <option value="">Select Module...</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date & Time</label>
                <input required type="datetime-local" name="date" value={formData.date ? formData.date.substring(0, 16) : ''} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (mins)</label>
                  <input required type="number" name="duration_minutes" value={formData.duration_minutes} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Marks</label>
                  <input required type="number" name="total_marks" value={formData.total_marks} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Exam File (PDF, Word, Excel)</label>
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

export default QuizExamManagement;
