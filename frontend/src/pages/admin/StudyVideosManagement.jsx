import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, PlayCircle, ExternalLink } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';

const StudyVideosManagement = () => {
  const [videos, setVideos] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ title: '', description: '', video_url: '', course_id: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [videosRes, coursesRes] = await Promise.all([
        supabase.from('study_videos').select('*, courses(name)').order('created_at', { ascending: false }),
        supabase.from('courses').select('id, name').order('name')
      ]);
      
      if (videosRes.error) throw videosRes.error;
      if (coursesRes.error) throw coursesRes.error;

      setVideos(videosRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.code === '42P01') {
        Swal.fire('Database Error', 'The study_videos table does not exist. Please run the SQL migration script.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openModal = (video = null) => {
    if (video) {
      setFormData({ 
        title: video.title || '', 
        description: video.description || '', 
        video_url: video.video_url || '', 
        course_id: video.course_id || '' 
      });
      setEditingId(video.id);
    } else {
      setFormData({ title: '', description: '', video_url: '', course_id: '' });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare payload and handle empty course_id
      const payload = { ...formData };
      if (payload.course_id === '') {
        payload.course_id = null;
      }

      if (editingId) {
        const { error } = await supabase.from('study_videos').update(payload).eq('id', editingId);
        if (error) throw error;
        Swal.fire('Updated!', 'Study video updated successfully.', 'success');
      } else {
        const { error } = await supabase.from('study_videos').insert([payload]);
        if (error) throw error;
        Swal.fire('Added!', 'Study video added successfully.', 'success');
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
        const { error } = await supabase.from('study_videos').delete().eq('id', id);
        if (error) throw error;
        Swal.fire('Deleted!', 'Study video has been deleted.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  // Helper to extract YouTube video ID for thumbnail
  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <PlayCircle className="w-6 h-6 mr-2 text-blue-600" /> Study Videos
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage and release study videos for courses</p>
        </div>
        <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Video
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {loading ? (
              <div className="col-span-full text-center py-8 text-slate-500">Loading videos...</div>
            ) : videos.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <PlayCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-600">No videos found</h3>
                <p className="text-slate-500 text-sm mt-1">Click "Add Video" to release a new study video.</p>
              </div>
            ) : videos.map((video) => {
              const ytId = getYouTubeId(video.video_url);
              const thumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800&auto=format&fit=crop';
              
              return (
                <div key={video.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  <div className="relative aspect-video bg-slate-100 group">
                    <img src={thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
                        <PlayCircle className="w-8 h-8" />
                      </a>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800 line-clamp-2" title={video.title}>{video.title}</h3>
                      <div className="flex space-x-1 shrink-0 ml-2">
                        <button onClick={() => openModal(video)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(video.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    {video.courses && (
                      <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md mb-2 self-start">
                        {video.courses.name}
                      </span>
                    )}
                    <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">
                      {video.description || 'No description provided.'}
                    </p>
                    <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                       <span>{new Date(video.created_at).toLocaleDateString()}</span>
                       <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-blue-600 transition-colors">
                         Open Link <ExternalLink className="w-3 h-3 ml-1" />
                       </a>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{editingId ? 'Edit Video' : 'Add Study Video'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Video Title</label>
                <input required type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="e.g. Introduction to React" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Course (Optional)</label>
                <select name="course_id" value={formData.course_id} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                  <option value="">Select Course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Video URL (YouTube, Vimeo, etc.)</label>
                <input required type="url" name="video_url" value={formData.video_url} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="https://youtube.com/watch?v=..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" rows="3" placeholder="Brief description of the video content..."></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm">Save Video</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudyVideosManagement;
