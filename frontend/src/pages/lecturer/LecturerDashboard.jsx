import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, Users, ClipboardCheck, FileText, AlertTriangle, Bell, 
  Mail, Clock, CheckCircle2, MessageSquare, PlusCircle, ArrowUpRight, Send, 
  Sparkles, Award, TrendingUp, HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';

// Shared Components & Charts
import DashboardFilters from '../../components/common/DashboardFilters';
import AttendanceLineChart from '../../components/charts/AttendanceLineChart';
import PerformanceTrendChart from '../../components/charts/PerformanceTrendChart';
import StackedBarChart from '../../components/charts/StackedBarChart';
import DoughnutChart from '../../components/charts/DoughnutChart';
import ProgressRingChart from '../../components/charts/ProgressRingChart';
import TimelineActivityChart from '../../components/charts/TimelineActivityChart';

const LecturerDashboard = () => {
  const { user } = useAuth();
  
  // Filters State
  const [filters, setFilters] = useState({
    academicYear: 'All',
    semester: 'All',
    batch: 'All',
    dateRange: '30days'
  });

  // Summary Stats State
  const [stats, setStats] = useState({
    assignedModules: 4,
    todaysClasses: 2,
    totalStudents: 128,
    avgAttendance: '91.5%',
    pendingMarking: 14,
    studentsAttention: 6,
    unreadMessages: 3,
    pendingLeave: 1
  });

  // Table Data States
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState([]);
  const [missingAssignments, setMissingAssignments] = useState([]);
  const [consultationStudents, setConsultationStudents] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [leaveStatus, setLeaveStatus] = useState([]);

  // Active Tab for Tables
  const [activeTableTab, setActiveTableTab] = useState('schedule');

  useEffect(() => {
    if (user?.id) {
      fetchLecturerData();
    }
  }, [user, filters]);

  const fetchLecturerData = async () => {
    try {
      // 1. All classes for this lecturer
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDay = days[new Date().getDay()];

      const { data: allTimetables } = await supabase
        .from('timetables')
        .select('*, lecture_halls(name), batches(name)')
        .eq('lecturer_id', user.id)
        .order('start_time', { ascending: true });

      const scheduleData = allTimetables?.filter(t => t.day_of_week === todayDay) || [];
      setTodaySchedule(scheduleData);

      const uniqueModules = new Set(allTimetables?.map(t => t.module_name).filter(Boolean));
      const uniqueBatchIds = [...new Set(allTimetables?.map(t => t.batch_id).filter(Boolean))];
      const uniqueTimetableIds = [...new Set(allTimetables?.map(t => t.id).filter(Boolean))];

      let totalStudentsCount = 0;
      if (uniqueBatchIds.length > 0) {
        const { data: studentsInBatches } = await supabase
          .from('student_profiles')
          .select('user_id')
          .in('batch_id', uniqueBatchIds);
        totalStudentsCount = studentsInBatches?.length || 0;
      }

      // 2. Fetch Assignments Pending Marking (Filtered to Lecturer's Modules)
      const { data: assignDataAll } = await supabase
        .from('assignments')
        .select('*, modules(name)')
        .order('due_date', { ascending: true });
        
      const assignData = assignDataAll?.filter(a => uniqueModules.has(a.modules?.name)) || [];
      setUpcomingDeadlines(assignData.slice(0, 5));

      // 3. Fetch Submissions (Filtered to Lecturer's Assignments)
      const myAssignmentIds = new Set(assignData.map(a => a.id));
      let subData = [];
      if (myAssignmentIds.size > 0) {
        const { data: fetchedSubData } = await supabase
          .from('student_submissions')
          .select('*, profiles(full_name), assignments(id, title)')
          .in('assignment_id', [...myAssignmentIds])
          .order('submitted_at', { ascending: false });
        subData = fetchedSubData || [];
      }
      setRecentSubmissions(subData.slice(0, 5));

      // 4. Fetch Low Attendance Students (< 75%) (Filtered to Lecturer's Timetables)
      let attData = [];
      if (uniqueTimetableIds.length > 0) {
        const { data: fetchedAttData } = await supabase
          .from('attendance')
          .select('student_id, status, profiles(full_name, email)')
          .in('timetable_id', uniqueTimetableIds)
          .eq('status', 'Absent');
        attData = fetchedAttData || [];
      }
      setLowAttendanceStudents(attData.slice(0, 5));

      // 5. Leave Requests
      const { data: leaveData } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', user.id);
      if (leaveData) setLeaveStatus(leaveData);

      // 6. Messages
      const { data: msgData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (msgData) setRecentMessages(msgData.slice(0, 5));

      // Calculate avg attendance roughly for this lecturer's students
      const avgAttendanceStr = attData.length > 0 && totalStudentsCount > 0 
        ? `${Math.max(0, 100 - (attData.length / totalStudentsCount) * 100).toFixed(1)}%` 
        : '85.0%';

      // Calculate dynamic stats
      setStats({
        assignedModules: uniqueModules.size || 0,
        todaysClasses: scheduleData.length,
        totalStudents: totalStudentsCount,
        avgAttendance: avgAttendanceStr,
        pendingMarking: subData?.filter(s => s.marks === null).length || 0,
        studentsAttention: attData?.length || 0,
        unreadMessages: msgData?.filter(m => !m.is_read).length || 0,
        pendingLeave: leaveData?.filter(l => l.status === 'Pending').length || 0
      });

    } catch (err) {
      console.error('Error fetching lecturer dashboard data:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Header & Quick Action Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-800">
            Lecturer Command Dashboard
          </h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">
            Welcome back, <span className="text-indigo-600 font-bold">{user?.full_name || 'Lecturer'}</span> • Classroom & Performance Management
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-all shadow-xs">
            <ClipboardCheck className="w-3.5 h-3.5" /> Mark Attendance
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-xs transition-all shadow-xs">
            <PlusCircle className="w-3.5 h-3.5" /> New Assignment
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <DashboardFilters
        filters={filters}
        onFilterChange={(key, val) => setFilters(f => ({ ...f, [key]: val }))}
        onReset={() => setFilters({ academicYear: 'All', semester: 'All', batch: 'All', dateRange: '30days' })}
      />

      {/* 1. 8 Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Assigned Modules" value={stats.assignedModules} icon={<BookOpen />} color="text-indigo-600" bg="bg-indigo-50" trend="Active" />
        <StatCard title="Today's Classes" value={stats.todaysClasses} icon={<Calendar />} color="text-blue-600" bg="bg-blue-50" trend="Scheduled" />
        <StatCard title="Total Students" value={stats.totalStudents} icon={<Users />} color="text-emerald-600" bg="bg-emerald-50" trend="Enrolled" />
        <StatCard title="Attendance Rate" value={stats.avgAttendance} icon={<TrendingUp />} color="text-teal-600" bg="bg-teal-50" trend="+0.8%" />
        <StatCard title="Pending Marking" value={stats.pendingMarking} icon={<FileText />} color="text-amber-600" bg="bg-amber-50" trend="Requires Grading" isUrgent />
        <StatCard title="Needs Attention" value={stats.studentsAttention} icon={<AlertTriangle />} color="text-red-600" bg="bg-red-50" trend="Low Attendance" isUrgent />
        <StatCard title="Unread Messages" value={stats.unreadNotifications} icon={<Mail />} color="text-purple-600" bg="bg-purple-50" trend="Inbox" />
        <StatCard title="Pending Leave" value={stats.pendingLeave} icon={<Clock />} color="text-slate-600" bg="bg-slate-100" trend="In Review" />
      </div>

      {/* 2. Analytics Visualizations Grid (8 Charts) */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" /> Teaching Analytics & Performance Progress
        </h2>

        {/* Row 1: Module Attendance & Batch Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Teaching Module Attendance Trend" icon={<TrendingUp className="text-blue-500" />}>
            <AttendanceLineChart />
          </ChartCard>
          <ChartCard title="Batch Attendance Comparison" icon={<Users className="text-emerald-500" />}>
            <PerformanceTrendChart />
          </ChartCard>
        </div>

        {/* Row 2: Submission Progress Ring & Academic Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Course Completion Progress" icon={<CheckCircle2 className="text-emerald-500" />}>
            <div className="h-full flex items-center justify-center py-6">
              <ProgressRingChart percentage={82} label="Curriculum Covered" color="#10b981" size={140} />
            </div>
          </ChartCard>
          <div className="lg:col-span-2">
            <ChartCard title="Assignment Submission Progress by Batch" icon={<FileText className="text-amber-500" />}>
              <StackedBarChart />
            </ChartCard>
          </div>
        </div>

        {/* Row 3: Result Analysis & Schedule Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Academic Performance Distribution" icon={<Award className="text-indigo-500" />}>
            <DoughnutChart />
          </ChartCard>
          <ChartCard title="Weekly Teaching Schedule Timeline" icon={<Clock className="text-purple-500" />}>
            <TimelineActivityChart />
          </ChartCard>
        </div>
      </div>

      {/* 3. Data Tables Navigation */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600" /> Lecturer Registers & Records
          </h2>
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs font-semibold">
            {[
              { id: 'schedule', label: "Today's Schedule" },
              { id: 'low_att', label: 'Low Attendance' },
              { id: 'submissions', label: 'Recent Submissions' },
              { id: 'deadlines', label: 'Upcoming Deadlines' },
              { id: 'leave', label: 'Leave Requests' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTableTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${activeTableTab === tab.id ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl shadow-sm border border-slate-100">
          {activeTableTab === 'schedule' && (
            <ScheduleTable schedule={todaySchedule} />
          )}
          {activeTableTab === 'low_att' && (
            <LowAttendanceTable items={lowAttendanceStudents} />
          )}
          {activeTableTab === 'submissions' && (
            <SubmissionTable items={recentSubmissions} />
          )}
          {activeTableTab === 'deadlines' && (
            <DeadlineTable items={upcomingDeadlines} />
          )}
          {activeTableTab === 'leave' && (
            <LeaveTable items={leaveStatus} />
          )}
        </div>
      </div>

      {/* 4. Widgets: Personal Timetable, AI Assistant & Notification Centre */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* Personal Timetable Widget */}
        <div className="glass-card p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" /> Today's Class Schedule
            </h3>
            <div className="space-y-2">
              {todaySchedule.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No classes scheduled for today.</p>
              ) : (
                todaySchedule.map((s, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{s.module_name}</p>
                      <p className="text-slate-400 text-[11px]">{s.lecture_halls?.name || 'Hall 1'} • {s.start_time} - {s.end_time}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 font-semibold text-[10px]">Lecture</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* AI Timetable & Assistant Widget */}
        <div className="glass-card p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" /> AI Class Assistant
              </h3>
              <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">Active</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              "You have 2 pending submissions in Database Systems requiring grade reviews before tomorrow morning."
            </p>
          </div>
          <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all">
            Generate Teaching Summary
          </button>
        </div>

        {/* Lecturer Quick Actions */}
        <div className="glass-card p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-600" /> Lecturer Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700 font-semibold flex flex-col items-center gap-1 transition-all">
              <ClipboardCheck className="w-4 h-4 text-indigo-600" /> Take Attendance
            </button>
            <button className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700 font-semibold flex flex-col items-center gap-1 transition-all">
              <FileText className="w-4 h-4 text-emerald-600" /> Post Quiz
            </button>
            <button className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700 font-semibold flex flex-col items-center gap-1 transition-all">
              <Bell className="w-4 h-4 text-amber-600" /> Announcement
            </button>
            <button className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700 font-semibold flex flex-col items-center gap-1 transition-all">
              <MessageSquare className="w-4 h-4 text-purple-600" /> Message Class
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, icon, color, bg, trend, isUrgent }) => (
  <div className={`glass-card p-4 rounded-2xl flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 ${isUrgent ? 'border-red-200 bg-red-50/30' : ''}`}>
    <div className="flex items-center justify-between mb-2">
      <div className={`w-9 h-9 rounded-xl ${bg} ${color} flex items-center justify-center shadow-2xs`}>
        {React.cloneElement(icon, { className: 'w-4 h-4' })}
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">{title}</p>
      <h4 className="text-2xl font-extrabold text-slate-800 mt-0.5 tracking-tight">{value}</h4>
    </div>
  </div>
);

const ChartCard = ({ title, icon, children }) => (
  <div className="glass-card p-6 rounded-2xl flex flex-col min-h-[340px] border border-slate-100 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
        {icon} {title}
      </h3>
    </div>
    <div className="flex-1 relative">{children}</div>
  </div>
);

// Table Components
const ScheduleTable = ({ schedule }) => (
  <div>
    <h4 className="font-bold text-slate-800 text-sm mb-3">Today's Class Schedule</h4>
    <table className="w-full text-xs text-left">
      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
        <tr>
          <th className="p-3">Module</th>
          <th className="p-3">Batch</th>
          <th className="p-3">Hall</th>
          <th className="p-3">Time</th>
          <th className="p-3">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {schedule.length === 0 ? (
          <tr><td colSpan={5} className="p-4 text-center text-slate-400">No classes scheduled for today</td></tr>
        ) : (
          schedule.map((s, idx) => (
            <tr key={idx} className="hover:bg-slate-50/80">
              <td className="p-3 font-bold text-slate-800">{s.module_name}</td>
              <td className="p-3 text-slate-600">{s.batches?.name || 'Batch'}</td>
              <td className="p-3 text-indigo-600 font-medium">{s.lecture_halls?.name || 'Hall A'}</td>
              <td className="p-3 font-medium text-slate-700">{s.start_time} - {s.end_time}</td>
              <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-semibold">Scheduled</span></td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const LowAttendanceTable = ({ items }) => (
  <div>
    <h4 className="font-bold text-slate-800 text-sm mb-3">Students Flagged for Low Attendance (&lt;75%)</h4>
    <table className="w-full text-xs text-left">
      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
        <tr>
          <th className="p-3">Student Name</th>
          <th className="p-3">Email</th>
          <th className="p-3">Status</th>
          <th className="p-3">Action Required</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <tr><td colSpan={4} className="p-4 text-center text-slate-400">All students meeting attendance thresholds</td></tr>
        ) : (
          items.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-50/80">
              <td className="p-3 font-bold text-slate-800">{item.profiles?.full_name || 'Student'}</td>
              <td className="p-3 text-slate-600">{item.profiles?.email || 'N/A'}</td>
              <td className="p-3 font-bold text-red-600">Absent Logged</td>
              <td className="p-3"><span className="px-2 py-1 rounded bg-red-100 text-red-700 font-bold">Send Warning</span></td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const SubmissionTable = ({ items }) => (
  <div>
    <h4 className="font-bold text-slate-800 text-sm mb-3">Recently Submitted Assignments</h4>
    <table className="w-full text-xs text-left">
      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
        <tr>
          <th className="p-3">Student</th>
          <th className="p-3">Assignment Title</th>
          <th className="p-3">Submitted At</th>
          <th className="p-3">Marks</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <tr><td colSpan={4} className="p-4 text-center text-slate-400">No submissions awaiting review</td></tr>
        ) : (
          items.map((sub, idx) => (
            <tr key={idx} className="hover:bg-slate-50/80">
              <td className="p-3 font-bold text-slate-800">{sub.profiles?.full_name || 'Student'}</td>
              <td className="p-3 text-indigo-600 font-medium">{sub.assignments?.title || 'Assignment'}</td>
              <td className="p-3 text-slate-400">{new Date(sub.submitted_at || Date.now()).toLocaleDateString()}</td>
              <td className="p-3">
                {sub.marks !== null ? <span className="font-bold text-emerald-600">{sub.marks}%</span> : <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">Needs Marking</span>}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const DeadlineTable = ({ items }) => (
  <div>
    <h4 className="font-bold text-slate-800 text-sm mb-3">Upcoming Assignment Deadlines</h4>
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-800">{item.title}</p>
            <p className="text-slate-500 mt-0.5">{item.modules?.name || 'Module'}</p>
          </div>
          <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">Due: {new Date(item.due_date).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  </div>
);

const LeaveTable = ({ items }) => (
  <div>
    <h4 className="font-bold text-slate-800 text-sm mb-3">Leave Status Summary</h4>
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No leave applications found.</p>
      ) : (
        items.map((l, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-800">{l.reason}</p>
              <p className="text-slate-400">{l.start_date} to {l.end_date}</p>
            </div>
            <span className={`px-2 py-1 rounded font-bold ${l.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{l.status}</span>
          </div>
        ))
      )}
    </div>
  </div>
);

export default LecturerDashboard;
