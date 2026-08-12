import React, { useState, useEffect } from 'react';
import { PlayCircle, ExternalLink, Search } from 'lucide-react';
import { supabase } from '../../config/supabase';

const StudentStudyVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [courses, setCourses] = useState([]);

  useEffect(() => {
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
        console.error('Error fetching study videos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCourse = selectedCourse === 'all' || video.course_id === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <PlayCircle className="w-6 h-6 mr-2 text-blue-600" /> Study Videos
        </h1>
        <p className="text-slate-500 text-sm mt-1">Watch recorded lectures and educational materials</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search videos by title or description..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <select 
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        >
          <option value="all">All Courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Loading videos...</div>
        ) : filteredVideos.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <PlayCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600">No videos found</h3>
            <p className="text-slate-500 text-sm mt-2">Check back later for new study materials.</p>
          </div>
        ) : filteredVideos.map((video) => {
          const ytId = getYouTubeId(video.video_url);
          const thumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800&auto=format&fit=crop';
          
          return (
            <div key={video.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group">
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                <img src={thumbnailUrl} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="p-4 bg-blue-600/90 backdrop-blur-sm rounded-full text-white hover:bg-blue-600 transition-colors transform hover:scale-110 shadow-lg">
                    <PlayCircle className="w-8 h-8" />
                  </a>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors" title={video.title}>
                  {video.title}
                </h3>
                {video.courses && (
                  <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md mb-3 self-start">
                    {video.courses.name}
                  </span>
                )}
                <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">
                  {video.description || 'No description provided.'}
                </p>
                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                   <span className="font-medium text-slate-500">Released: {new Date(video.created_at).toLocaleDateString()}</span>
                   <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 font-medium hover:text-blue-700 transition-colors">
                     Watch <ExternalLink className="w-3.5 h-3.5 ml-1" />
                   </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentStudyVideos;
