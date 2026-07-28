import React, { useState, useEffect } from 'react';
import { Plus, BookMarked, Edit, Trash2, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';

const CourseModules = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ module_code: '', module_name: '', credits: '', description: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchModules(selectedCourseId);
    } else {
      setModules([]);
    }
  }, [selectedCourseId]);

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('id, code, name').order('name');
    if (data) setCourses(data);
  };

  const fetchModules = async (courseId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(error);
    } else {
      setModules(data || []);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Auto-generate module code if they are typing the module name
      if (name === 'module_name') {
        const courseCode = courses.find(c => c.id === selectedCourseId)?.code || 'CRS';
        // Generate code like CS101-PROG
        const namePart = value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
        newData.module_code = namePart ? `${courseCode}-${namePart}` : '';
      }
      return newData;
    });
  };

  const openModal = (mod = null) => {
    if (mod) {
      setFormData({ 
        module_code: mod.module_code || '', 
        module_name: mod.module_name, 
        credits: mod.credits || '' 
      });
      setEditingId(mod.id);
    } else {
      setFormData({ module_code: '', module_name: '', credits: '' });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      Swal.fire('Error', 'Please select a course first', 'error');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('course_modules')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        Swal.fire('Updated!', 'Module updated successfully.', 'success');
      } else {
        const { error } = await supabase
          .from('course_modules')
          .insert([{ ...formData, course_id: selectedCourseId }]);
        if (error) throw error;
        Swal.fire('Added!', 'Module added successfully.', 'success');
      }
      setIsModalOpen(false);
      fetchModules(selectedCourseId);
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
        const { error } = await supabase.from('course_modules').delete().eq('id', id);
        if (error) throw error;
        Swal.fire('Deleted!', 'Module has been deleted.', 'success');
        fetchModules(selectedCourseId);
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Course Modules</h1>
        {selectedCourseId && (
          <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Module
          </button>
        )}
      </div>

      {/* Course Selection */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Course</label>
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <select 
            value={selectedCourseId} 
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none"
          >
            <option value="">-- Choose a Course to view its modules --</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.code ? `[${c.code}] ` : ''}{c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Modules Grid (divide by 4 4 4 4 layout) */}
      {selectedCourseId && (
        <div className="mt-6">
          {loading ? (
            <div className="text-center py-10 text-slate-500">Loading modules...</div>
          ) : modules.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center shadow-sm">
              <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-lg">No modules found for this course.</p>
              <button onClick={() => openModal()} className="mt-4 text-blue-600 font-medium hover:underline">
                Add the first module
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {modules.map((mod) => (
                <div key={mod.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
                      {mod.module_code || 'No Code'}
                    </span>
                    <div className="flex space-x-1">
                      <button onClick={() => openModal(mod)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(mod.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">{mod.module_name}</h3>
                  <div className="mt-auto border-t border-slate-100 pt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Credits:</span>
                    <span className="font-bold text-slate-800">{mod.credits || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (() => {
        const selectedCourse = courses.find(c => c.id === selectedCourseId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4">{editingId ? 'Edit Module' : 'Add Module'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Course Name</label>
                  <input readOnly type="text" value={selectedCourse?.name || ''} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Module Code</label>
                  <input readOnly type="text" name="module_code" value={formData.module_code} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed outline-none" placeholder="Auto-generated" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Module Name</label>
                  <input required type="text" name="module_name" value={formData.module_name} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Advanced Programming" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Credits</label>
                  <input required type="number" name="credits" value={formData.credits} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 15" />
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">Save Module</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default CourseModules;
