import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  CalendarDays, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Activity, 
  Bell,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [attendanceAlerts, setAttendanceAlerts] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardAlerts();
    }
  }, [user]);

  const fetchDashboardAlerts = async () => {
    try {
      // 1. Fetch DB notifications
      const { data: dbNotifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      // 2. Fetch attendance to generate dynamic alerts
      const { data: attendanceRecords } = await supabase
        .from('attendance')
        .select(`id, status, date, timetables (module_name)`)
        .eq('student_id', user.id)
        .order('date', { ascending: false });

      const moduleStats = {};
      
      (attendanceRecords || []).forEach(record => {
        const subjectName = record.timetables?.module_name;
        if (!subjectName) return;
        if (!moduleStats[subjectName]) {
          moduleStats[subjectName] = { conducted: 0, attended: 0, subject: subjectName };
        }
        moduleStats[subjectName].conducted += 1;
        if (record.status === 'present' || record.status === 'late' || record.status === 'excused') {
          moduleStats[subjectName].attended += 1;
        }
      });

      const newNotifs = [];

      Object.keys(moduleStats).forEach(moduleId => {
        const stat = moduleStats[moduleId];
        const percentage = Math.round((stat.attended / stat.conducted) * 100) || 0;
        if (percentage <= 50) {
          const expectedTitle = 'Critical Attendance Warning';
          const expectedMessage = `Your attendance in ${stat.subject} is at ${percentage}%. Please contact your lecturer immediately.`;
          const exists = dbNotifs?.find(n => n.title === expectedTitle && n.message === expectedMessage);
          if (!exists) {
            newNotifs.push({ user_id: user.id, title: expectedTitle, message: expectedMessage, is_read: false });
          }
        }
      });

      const recentRecords = (attendanceRecords || []).slice(0, 5);
      recentRecords.forEach(record => {
        if (record.status === 'absent') {
          const moduleId = record.timetables?.module_id;
          if (!moduleId || !moduleMap[moduleId]) return;
          const subject = moduleMap[moduleId];
          const expectedTitle = 'Recent Absence Logged';
          const expectedMessage = `You were marked absent for ${subject} on ${new Date(record.date).toLocaleDateString()}.`;
          const exists = dbNotifs?.find(n => n.title === expectedTitle && n.message === expectedMessage);
          if (!exists) {
            newNotifs.push({ user_id: user.id, title: expectedTitle, message: expectedMessage, is_read: false });
          }
        }
      });

      if (newNotifs.length > 0) {
        if (!sessionStorage.getItem('attendance_alerts_generated')) {
          sessionStorage.setItem('attendance_alerts_generated', 'true');
          await supabase.from('notifications').insert(newNotifs);
        }
        const { data: updatedNotifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setAttendanceAlerts(updatedNotifs || []);
      } else {
        setAttendanceAlerts(dbNotifs || []);
      }

    } catch (err) {
      console.error('Failed to fetch dashboard alerts:', err);
    }
  };

  const getAlertStyle = (title) => {
    if (!title) return { icon: 'Bell', colorClass: 'bg-blue-50 text-blue-500' };
    if (title.includes('Warning') || title.includes('Absence')) {
      return { icon: 'AlertCircle', colorClass: 'bg-red-50 text-red-500' };
    }
    if (title.includes('Assignment')) {
      return { icon: 'BookOpen', colorClass: 'bg-blue-50 text-blue-500' };
    }
    if (title.includes('Timetable')) {
      return { icon: 'CalendarDays', colorClass: 'bg-indigo-50 text-indigo-500' };
    }
    if (title.includes('Leave')) {
      return { icon: 'CheckCircle', colorClass: 'bg-emerald-50 text-emerald-500' };
    }
    return { icon: 'Bell', colorClass: 'bg-blue-50 text-blue-500' };
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}! 👋</h1>
          <p className="text-slate-500 text-sm mt-1">Here's an overview of your academic progress.</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-medium text-xs rounded-full">
            Active Student
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 font-medium text-xs rounded-full">
            {user?.email}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Attendance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <CalendarDays className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500 mb-1">Attendance</p>
          <p className="text-2xl font-bold text-slate-800">85%</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>

        {/* Assignment Average */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500 mb-1">Assignment Avg</p>
          <p className="text-2xl font-bold text-slate-800">78%</p>
          <p className="text-[10px] text-emerald-600 font-medium mt-2 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> +2% from last sem
          </p>
        </div>

        {/* Quiz Average */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500 mb-1">Quiz Avg</p>
          <p className="text-2xl font-bold text-slate-800">82%</p>
        </div>

        {/* Exam Average */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500 mb-1">Exam Avg</p>
          <p className="text-2xl font-bold text-slate-800">71%</p>
        </div>

        {/* GPA */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500 mb-1">Current GPA</p>
          <p className="text-2xl font-bold text-slate-800">3.4</p>
          <p className="text-[10px] text-slate-400 font-medium mt-2">Out of 4.0</p>
        </div>

        {/* Risk Level */}
        <div className="bg-white p-4 rounded-2xl border-2 border-emerald-100 shadow-sm flex flex-col bg-emerald-50/20">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
            <Activity className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500 mb-1">Risk Level</p>
          <p className="text-xl font-bold text-emerald-600">Low Risk</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Performance Trend</h2>
            <div className="h-64 flex items-end justify-between px-2 gap-2">
              {[65, 70, 68, 75, 82, 78, 85, 80].map((val, i) => (
                <div key={i} className="w-full flex flex-col items-center group">
                  <div className="text-[10px] text-slate-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{val}%</div>
                  <div 
                    className="w-full bg-blue-100 group-hover:bg-blue-500 transition-colors rounded-t-sm" 
                    style={{ height: `${val}%` }}
                  ></div>
                  <div className="text-xs text-slate-500 mt-2 font-medium">W{i+1}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center">
              <h2 className="text-sm font-semibold text-slate-800 mb-4 self-start">Semester Progress</h2>
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
                  <circle cx="64" cy="64" r="56" fill="transparent" stroke="#3b82f6" strokeWidth="16" strokeDasharray="351.858" strokeDashoffset="140.74" className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-bold text-slate-800">60%</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center">Week 9 of 15 completed</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center">
              <h2 className="text-sm font-semibold text-slate-800 mb-4 self-start">Attendance Trend</h2>
              <div className="w-full space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Programming (CS101)</span>
                    <span className="text-slate-500">92%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Databases (CS102)</span>
                    <span className="text-slate-500">85%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Mathematics (MA101)</span>
                    <span className="text-slate-500">68%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: '68%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Notifications & Upcoming */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 flex items-center">
                <Bell className="w-4 h-4 mr-2 text-blue-600" /> Notifications
              </h2>
              <button className="text-xs text-blue-600 font-medium hover:underline">View All</button>
            </div>
            <div className="p-4 space-y-4">
              {attendanceAlerts.map(alert => {
                const style = getAlertStyle(alert.title);
                return (
                  <div key={alert.id} className="flex items-start space-x-3 animate-in fade-in">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${style.colorClass}`}>
                      {style.icon === 'AlertCircle' ? <AlertCircle className="w-4 h-4" /> : 
                       style.icon === 'Activity' ? <Activity className="w-4 h-4" /> :
                       style.icon === 'BookOpen' ? <BookOpen className="w-4 h-4" /> :
                       style.icon === 'CalendarDays' ? <CalendarDays className="w-4 h-4" /> :
                       style.icon === 'CheckCircle' ? <CheckCircle className="w-4 h-4" /> :
                       <Bell className="w-4 h-4" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{alert.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{alert.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {alert.created_at ? new Date(alert.created_at).toLocaleDateString() : alert.time || 'Recently'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-orange-500" /> Upcoming Deadlines
              </h2>
            </div>
            <div className="p-0">
              <div className="flex items-center p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <div className="w-12 text-center mr-4 shrink-0">
                  <p className="text-xs font-bold text-red-500 uppercase">Oct</p>
                  <p className="text-lg font-bold text-slate-800 leading-tight">24</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">CS101 Final Project</p>
                  <p className="text-xs text-slate-500">Assignment</p>
                </div>
                <div className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded">Tomorrow</div>
              </div>
              <div className="flex items-center p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <div className="w-12 text-center mr-4 shrink-0">
                  <p className="text-xs font-bold text-blue-500 uppercase">Oct</p>
                  <p className="text-lg font-bold text-slate-800 leading-tight">28</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">SE201 Mid Term</p>
                  <p className="text-xs text-slate-500">Quiz</p>
                </div>
                <div className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">In 5 Days</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
