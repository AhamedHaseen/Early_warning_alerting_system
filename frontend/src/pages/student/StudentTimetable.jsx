import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CalendarDays, Users, Star, Loader2 } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import LecturerContactModal from '../../components/common/LecturerContactModal';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const StudentTimetable = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('timetable');
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [timetableData, setTimetableData] = useState([]);
  const [eventsData, setEventsData] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Student's batch_id
      const { data: profileData, error: profileError } = await supabase
        .from('student_profiles')
        .select('batch_id')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
      const batchId = profileData?.batch_id;

      // 2. Fetch Timetable if batchId exists
      if (batchId) {
        // We use lecturer_profiles to get the user_id, then join with profiles to get full_name
        const { data: ttData, error: ttError } = await supabase
          .from('timetables')
          .select(`
            *,
            modules (name),
            lecture_halls (name),
            lecturer_profiles (
              user_id,
              profiles (full_name, email, phone)
            )
          `)
          .eq('batch_id', batchId);

        if (ttError) throw ttError;

        // Process and group timetable data
        const grouped = {};
        DAYS_OF_WEEK.forEach(day => grouped[day] = []);

        (ttData || []).forEach(slot => {
          const day = slot.day_of_week || 'Monday';
          if (!grouped[day]) grouped[day] = [];
          
          let lecturerDetails = null;
          if (slot.lecturer_profiles?.profiles) {
            lecturerDetails = {
              name: slot.lecturer_profiles.profiles.full_name,
              email: slot.lecturer_profiles.profiles.email,
              phone: slot.lecturer_profiles.profiles.phone,
              department: 'Lecturer' // placeholder if we don't fetch dept
            };
          }

          // Format times
          const formatTime = (timeStr) => {
            if (!timeStr) return '';
            // timeStr format usually "HH:MM:SS"
            const [hours, minutes] = timeStr.split(':');
            let h = parseInt(hours, 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12;
            return `${h}:${minutes} ${ampm}`;
          };

          grouped[day].push({
            id: slot.id,
            subject: slot.module_name || slot.modules?.name || 'Unknown Module',
            type: 'Class', // Could derive from module type or room
            time: `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`,
            rawStartTime: slot.start_time,
            location: slot.room || slot.lecture_halls?.name || 'TBA',
            lecturer: lecturerDetails || { name: 'TBA' }
          });
        });

        // Sort slots by start time
        Object.keys(grouped).forEach(day => {
          grouped[day].sort((a, b) => {
            if (!a.rawStartTime) return 1;
            if (!b.rawStartTime) return -1;
            return a.rawStartTime.localeCompare(b.rawStartTime);
          });
        });

        // Convert grouped object to array format
        const ttArray = DAYS_OF_WEEK.map(day => ({
          day,
          slots: grouped[day]
        })).filter(dayPlan => dayPlan.slots.length > 0 || dayPlan.day !== 'Sunday'); // Keep all days, maybe filter out Sunday if empty

        setTimetableData(ttArray);
      } else {
        // No batch assigned
        setTimetableData(DAYS_OF_WEEK.slice(0,5).map(day => ({ day, slots: [] })));
      }

      // 3. Fetch Events
      const today = new Date().toISOString();
      const { data: evData, error: evError } = await supabase
        .from('events')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true });

      if (evError) throw evError;

      const formattedEvents = (evData || []).map(ev => {
        const d = new Date(ev.date);
        return {
          id: ev.id,
          title: ev.title,
          description: ev.description,
          location: ev.location || 'TBA',
          type: ev.type || 'University Event',
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
      });

      setEventsData(formattedEvents);

    } catch (error) {
      console.error('Error fetching timetable/events data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      <LecturerContactModal 
        isOpen={!!selectedLecturer} 
        onClose={() => setSelectedLecturer(null)} 
        lecturer={selectedLecturer || {}} 
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Timetable & Events</h1>
        <div className="bg-slate-100 p-1 rounded-xl inline-flex">
          <button 
            onClick={() => setActiveTab('timetable')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'timetable' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Weekly Timetable
          </button>
          <button 
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'events' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Events
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : activeTab === 'timetable' ? (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <CalendarDays className="w-5 h-5 mr-2 text-blue-500" /> Current Week Schedule
              </h2>
            </div>
            
            <div className="divide-y divide-slate-100">
              {timetableData.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  You are not assigned to any batch. Please contact administration.
                </div>
              ) : timetableData.map((dayPlan, idx) => (
                <div key={idx} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-6">
                  <div className="md:w-48 shrink-0">
                    <h3 className="text-xl font-bold text-slate-800">{dayPlan.day}</h3>
                    <p className="text-sm text-slate-500">{dayPlan.slots.length} Classes</p>
                  </div>
                  
                  {dayPlan.slots.length > 0 ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {dayPlan.slots.map((slot, sIdx) => (
                        <div key={sIdx} className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-100 text-blue-700">
                              {slot.type}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800 mb-1 leading-tight">{slot.subject}</h4>
                          <div className="space-y-1.5 mt-3">
                            <p className="text-xs text-slate-600 flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-2 text-slate-400" /> {slot.time}
                            </p>
                            <p className="text-xs text-slate-600 flex items-center">
                              <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400" /> {slot.location}
                            </p>
                            {slot.lecturer.name !== 'TBA' ? (
                              <button 
                                onClick={() => setSelectedLecturer(slot.lecturer)}
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center transition-colors text-left"
                              >
                                <Users className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" /> <span className="truncate">{slot.lecturer.name}</span>
                              </button>
                            ) : (
                              <p className="text-xs text-slate-400 flex items-center">
                                <Users className="w-3.5 h-3.5 mr-2 text-slate-300" /> TBA
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center text-sm font-medium text-slate-400 opacity-70">
                      No classes scheduled. Enjoy your day off!
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {eventsData.length > 0 ? eventsData.map(event => (
              <div key={event.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className={`h-2 ${
                  event.type.toLowerCase().includes('university') ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                  event.type.toLowerCase().includes('workshop') ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                  'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}></div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      event.type.toLowerCase().includes('university') ? 'bg-blue-50 text-blue-700' :
                      event.type.toLowerCase().includes('workshop') ? 'bg-emerald-50 text-emerald-700' :
                      'bg-purple-50 text-purple-700'
                    }`}>
                      {event.type}
                    </span>
                    <button className="text-slate-300 hover:text-yellow-400 transition-colors">
                      <Star className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{event.title}</h3>
                  <p className="text-sm text-slate-600 mb-6 flex-1">{event.description}</p>
                  
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-700 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-slate-400" /> {event.date}
                    </p>
                    <p className="text-xs font-medium text-slate-700 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-slate-400" /> {event.time}
                    </p>
                    <p className="text-xs font-medium text-slate-700 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-slate-400" /> {event.location}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <button className="w-full py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-sm">
                    Register Now
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-1 lg:col-span-3 text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No upcoming events scheduled at the moment.</p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default StudentTimetable;
