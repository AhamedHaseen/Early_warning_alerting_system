import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';

const AdminExamResults = () => {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [modules, setModules] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const [formData, setFormData] = useState({
    student_id: '',
    module_id: '',
    marks: '',
    grade: '',
    released: false
  });
  const [editingId, setEditingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const [resRes, stuRes, modRes, batRes, crsRes] = await Promise.all([
      supabase.from('exam_results').select('*, profiles(full_name), modules(name)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, student_profiles(batch_id, course_id)').eq('role', 'student').order('full_name'),
      supabase.from('modules').select('id, name, course_id, lecturer_id').order('name'),
      supabase.from('batches').select('id, name').order('name'),
      supabase.from('courses').select('id, name').order('name')
    ]);
    
    if (resRes.data) setResults(resRes.data);
    if (stuRes.data) setStudents(stuRes.data);
    if (modRes.data) setModules(modRes.data);
    if (batRes.data) setBatches(batRes.data);
    if (crsRes.data) setCourses(crsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (result = null) => {
    if (result) {
      const student = students.find(s => s.id === result.student_id);
      const sBatchId = Array.isArray(student?.student_profiles) ? student?.student_profiles[0]?.batch_id : student?.student_profiles?.batch_id;
      const sCourseId = Array.isArray(student?.student_profiles) ? student?.student_profiles[0]?.course_id : student?.student_profiles?.course_id;
      
      setSelectedBatchId(sBatchId || '');
      setSelectedCourseId(sCourseId || '');

      setFormData({
        student_id: result.student_id,
        module_id: result.module_id,
        marks: result.marks || '',
        grade: result.grade || '',
        released: result.released || false
      });
      setEditingId(result.id);
    } else {
      setSelectedBatchId('');
      setSelectedCourseId('');
      setFormData({ student_id: '', module_id: '', marks: '', grade: '', released: false });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBatchId('');
    setSelectedCourseId('');
    setFormData({ student_id: '', module_id: '', marks: '', grade: '', released: false });
    setEditingId(null);
  };

  const calculateGrade = (marks) => {
    const p = parseInt(marks, 10);
    if (isNaN(p)) return '';
    if (p >= 75) return 'A';
    if (p >= 65) return 'B';
    if (p >= 50) return 'C';
    return 'F';
  };

  const handleMarksChange = (e) => {
    const val = e.target.value;
    setFormData({
      ...formData,
      marks: val,
      grade: calculateGrade(val)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_id || !formData.module_id || !formData.marks) {
      Swal.fire('Error', 'Please fill all required fields.', 'error');
      return;
    }
    
    const payload = {
      student_id: formData.student_id,
      module_id: formData.module_id,
      marks: parseInt(formData.marks, 10),
      grade: formData.grade,
      released: formData.released
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('exam_results').update(payload).eq('id', editingId);
        if (error) throw error;
        Swal.fire('Success', 'Exam result updated', 'success');
      } else {
        const { error } = await supabase.from('exam_results').insert([payload]);
        if (error) throw error;
        Swal.fire('Success', 'Exam result added', 'success');
      }
      
      if (payload.released) {
        const moduleObj = modules.find(m => m.id === payload.module_id);
        const modName = moduleObj?.name || 'a module';
        const notifications = [{
            user_id: payload.student_id,
            title: 'Exam Results Released',
            message: `Your exam results for ${modName} have been released.`,
            is_read: false
        }];
        if (moduleObj?.lecturer_id) {
            notifications.push({
                user_id: moduleObj.lecturer_id,
                title: 'Exam Results Released',
                message: `Exam results for your module ${modName} have been released.`,
                is_read: false
            });
        }
        await supabase.from('notifications').insert(notifications);
      }
      handleCloseModal();
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
        const { error } = await supabase.from('exam_results').delete().eq('id', id);
        if (error) throw error;
        Swal.fire('Deleted!', 'Exam result has been deleted.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const handleToggleRelease = async (result) => {
    try {
      const { error } = await supabase
        .from('exam_results')
        .update({ released: !result.released })
        .eq('id', result.id);
        
      if (error) throw error;
      Swal.fire('Success', `Result is now ${!result.released ? 'Released' : 'Hidden'}`, 'success');
      
      if (!result.released) {
        const moduleObj = modules.find(m => m.id === result.module_id);
        const modName = result.modules?.name || 'a module';
        const notifications = [{
            user_id: result.student_id,
            title: 'Exam Results Released',
            message: `Your exam results for ${modName} have been released.`,
            is_read: false
        }];
        if (moduleObj?.lecturer_id) {
            notifications.push({
                user_id: moduleObj.lecturer_id,
                title: 'Exam Results Released',
                message: `Exam results for your module ${modName} have been released.`,
                is_read: false
            });
        }
        await supabase.from('notifications').insert(notifications);
      }
      
      fetchData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const filteredResults = results.filter(r => 
    r.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.modules?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Exam Results Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 transition-all font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Result
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student or module name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading exam results...</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-white text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4 text-center">Marks</th>
                  <th className="px-6 py-4 text-center">Grade</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                      No exam results found.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((result) => (
                    <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800">{result.profiles?.full_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600 font-medium">{result.modules?.name}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-slate-800">{result.marks}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                          result.grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                          result.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                          result.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {result.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleRelease(result)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                            result.released
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          }`}
                        >
                          {result.released ? 'Released' : 'Hidden'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenModal(result)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Result"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(result.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Result"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? 'Edit Exam Result' : 'Add Exam Result'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Batch Filter</label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => {
                      setSelectedBatchId(e.target.value);
                      setFormData({ ...formData, student_id: '' });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">All Batches</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Course Filter</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      setFormData({ ...formData, student_id: '', module_id: '' });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">All Courses</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select a student</option>
                  {students
                    .filter(s => {
                      const sBatchId = Array.isArray(s.student_profiles) ? s.student_profiles[0]?.batch_id : s.student_profiles?.batch_id;
                      const sCourseId = Array.isArray(s.student_profiles) ? s.student_profiles[0]?.course_id : s.student_profiles?.course_id;
                      if (selectedBatchId && sBatchId !== selectedBatchId) return false;
                      if (selectedCourseId && sCourseId !== selectedCourseId) return false;
                      return true;
                    })
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Module <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formData.module_id}
                  onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select a module</option>
                  {modules
                    .filter(m => !selectedCourseId || m.course_id === selectedCourseId)
                    .map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Marks (out of 100) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={formData.marks}
                    onChange={handleMarksChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. 85"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Calculated Grade</label>
                  <input
                    type="text"
                    readOnly
                    value={formData.grade}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  id="released"
                  checked={formData.released}
                  onChange={(e) => setFormData({ ...formData, released: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="released" className="ml-2 block text-sm text-slate-700 cursor-pointer">
                  Release result to student immediately
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  {editingId ? 'Update Result' : 'Save Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExamResults;
