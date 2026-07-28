import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Users, ClipboardCheck, FileText, AlertTriangle, Bell, Mail, Phone, Clock, Building, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';

const LecturerDashboard = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      fetchSchedules();
      fetchEvents();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      // Get today's day of week
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDay = days[new Date().getDay()];
      const todayDate = new Date().toISOString().split('T')[0];

      const { data } = await supabase
        .from('timetables')
        .select('*, lecture_halls(name), batches(name)')
        .eq('lecturer_id', user.id)
        .or(`day_of_week.eq.${todayDay},specific_date.eq.${todayDate}`)
        .order('start_time', { ascending: true })
        .limit(5);
        
      if (data) {
        setSchedules(data);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(3);
        
      if (data) {
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };
  
  // Extract initials for avatar
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'L';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Lecturer Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile & Notifications */}
        <div className="space-y-6">
          
          {/* Profile Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4">
              {initials}
            </div>
            <h2 className="text-xl font-bold text-slate-800">{user?.full_name || 'Lecturer'}</h2>
            <p className="text-sm text-slate-500 mb-6 capitalize">{user?.role || 'Lecturer'}</p>
            
            <div className="w-full space-y-3 text-left">
              <div className="flex items-center text-sm text-slate-600">
                <Building className="w-4 h-4 mr-3 text-slate-400" />
                <span>Assigned Department</span>
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Mail className="w-4 h-4 mr-3 text-slate-400" />
                <span>{user?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Phone className="w-4 h-4 mr-3 text-slate-400" />
                <span>N/A</span>
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Clock className="w-4 h-4 mr-3 text-slate-400" />
                <span>Office: TBD</span>
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <MapPin className="w-4 h-4 mr-3 text-slate-400" />
                <span>Room TBD</span>
              </div>
            </div>
            
            <button className="w-full mt-6 px-4 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium border border-slate-200">
              Edit Profile
            </button>
          </div>

          {/* Notifications */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-slate-400" /> Recent Notifications
            </h3>
            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div key={notif.id} className="flex items-start p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 mr-3 shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No recent notifications</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: KPIs & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard title="Assigned Courses" value="4" icon={<BookOpen />} color="text-blue-600" bg="bg-blue-50" />
            <StatCard title="Today's Classes" value="3" icon={<Calendar />} color="text-indigo-600" bg="bg-indigo-50" />
            <StatCard title="Total Students" value="180" icon={<Users />} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard title="Attendance Pending" value="1" icon={<ClipboardCheck />} color="text-orange-600" bg="bg-orange-50" />
            <StatCard title="Assignments Pending" value="12" icon={<FileText />} color="text-purple-600" bg="bg-purple-50" />
            <StatCard title="High Risk Students" value="5" icon={<AlertTriangle />} color="text-red-600" bg="bg-red-50" />
          </div>

          {/* Today's Schedule */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-6 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-slate-400" /> Today's Schedule
            </h3>
            <div className="space-y-4">
              {schedules.length > 0 ? schedules.map((schedule) => {
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinutes = now.getMinutes();
                const startParts = schedule.start_time.split(':');
                const endParts = schedule.end_time.split(':');
                
                let status = 'upcoming';
                if (currentHour > parseInt(endParts[0]) || (currentHour === parseInt(endParts[0]) && currentMinutes >= parseInt(endParts[1]))) {
                    status = 'completed';
                } else if ((currentHour > parseInt(startParts[0]) || (currentHour === parseInt(startParts[0]) && currentMinutes >= parseInt(startParts[1]))) && 
                           (currentHour < parseInt(endParts[0]) || (currentHour === parseInt(endParts[0]) && currentMinutes < parseInt(endParts[1])))) {
                    status = 'active';
                }

                // Format time e.g., 10:00:00 -> 10:00 AM
                const formatTime = (timeStr) => {
                    const [h, m] = timeStr.split(':');
                    const hh = parseInt(h);
                    const ampm = hh >= 12 ? 'PM' : 'AM';
                    const h12 = hh % 12 || 12;
                    return `${h12}:${m} ${ampm}`;
                };
                const timeString = `${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}`;

                return (
                  <ScheduleItem 
                    key={schedule.id}
                    time={timeString} 
                    course={schedule.module_name || 'N/A'} 
                    batch={schedule.batches?.name || schedule.batch_name || 'N/A'} 
                    room={schedule.lecture_halls?.name || schedule.room || 'TBD'} 
                    status={status} 
                  />
                );
              }) : (
                <div className="text-center py-6 text-slate-500">
                  <p>No classes scheduled for today.</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-6 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-slate-400" /> Upcoming Events
            </h3>
            <div className="space-y-4">
              {events.length > 0 ? events.map((event) => (
                <div key={event.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{event.type} • {event.location}</p>
                  </div>
                  <div className="mt-3 md:mt-0 md:text-right">
                    <p className="text-sm font-medium text-blue-600">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-slate-500">
                  <p>No upcoming events.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, bg }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${color} mb-4`}>
      {React.cloneElement(icon, { className: 'w-5 h-5' })}
    </div>
    <span className="text-2xl font-bold text-slate-800 mb-1">{value}</span>
    <span className="text-xs font-medium text-slate-500">{title}</span>
  </div>
);

const ScheduleItem = ({ time, course, batch, room, status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'completed': return 'border-l-4 border-slate-300 bg-slate-50 opacity-75';
      case 'active': return 'border-l-4 border-emerald-500 bg-emerald-50/50';
      case 'upcoming': return 'border-l-4 border-blue-500 bg-white';
      default: return 'border-l-4 border-slate-200 bg-white';
    }
  };

  return (
    <div className={`p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between ${getStatusStyles()}`}>
      <div>
        <p className="text-sm font-semibold text-slate-800">{course}</p>
        <p className="text-xs text-slate-500 mt-1">{batch} • {room}</p>
      </div>
      <div className="mt-3 md:mt-0 md:text-right">
        <p className="text-sm font-medium text-slate-700">{time}</p>
        {status === 'active' && <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full animate-pulse">HAPPENING NOW</span>}
      </div>
    </div>
  );
};

export default LecturerDashboard;
