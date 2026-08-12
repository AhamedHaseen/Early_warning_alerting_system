import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, CalendarDays, BookOpen, FileText, TrendingUp, Activity, 
  Bell, Clock, CheckCircle, AlertCircle, Award, Lightbulb, Sparkles, CheckCircle2, 
  ArrowUpRight, Target, MessageSquare, AlertTriangle, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';

// Shared Components & Charts
import DashboardFilters from '../../components/common/DashboardFilters';
import AttendanceLineChart from '../../components/charts/AttendanceLineChart';
import PerformanceTrendChart from '../../components/charts/PerformanceTrendChart';
import ProgressRingChart from '../../components/charts/ProgressRingChart';
import AreaProgressionChart from '../../components/charts/AreaProgressionChart';
import HeatmapChart from '../../components/charts/HeatmapChart';
import TimelineActivityChart from '../../components/charts/TimelineActivityChart';
import DoughnutChart from '../../components/charts/DoughnutChart';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const StudentDashboard = () => {
  const { user } = useAuth();

  // Filters State
  const [filters, setFilters] = useState({
    academicYear: 'All',
    semester: 'All',
    batch: 'All',
    dateRange: '30days'
  });

  // KPI Summary Stats
  const [stats, setStats] = useState({
    attendancePct: '92.0%',
    completedAssignments: 14,
    pendingAssignments: 3,
    gpa: '3.62',
    unreadNotifs: 2,
    upcomingClasses: 4,
    upcomingExams: 2,
    recommendationStatus: 'Good Standing'
  });

  // Table Data States
  const [timetable, setTimetable] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [examSchedule, setExamSchedule] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);

  // Active Tab for Tables
  const [activeTableTab, setActiveTableTab] = useState('timetable');

  useEffect(() => {
    if (user?.id) {
      fetchStudentDashboardData();
    }
  }, [user, filters]);

  const fetchStudentDashboardData = async () => {
    try {
      // 1. Attendance Records
      const { data: attData } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user.id);

      let attPct = 92;
      if (attData && attData.length > 0) {
        const present = attData.filter(a => a.status === 'Present' || a.status === 'Late').length;
        attPct = Math.round((present / attData.length) * 100);
      }

      // 2. Exam Results
      const { data: examData } = await supabase
        .from('exam_results')
        .select('*, modules(name)')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });
      if (examData) setRecentResults(examData);

      // Calculate GPA & Pass Rate
      let calcGpa = '3.62';
      if (examData && examData.length > 0) {
        const totalMarks = examData.reduce((acc, curr) => acc + Number(curr.marks || 0), 0);
        const avg = totalMarks / examData.length;
        calcGpa = ((avg / 100) * 4.0).toFixed(2);
      }

      // 3. Timetable Schedule
      const { data: timeData } = await supabase
        .from('timetables')
        .select('*, lecture_halls(name)')
        .limit(5);
      if (timeData) setTimetable(timeData);

      // 4. Assignments & Deadlines
      const { data: assignData } = await supabase
        .from('assignments')
        .select('*, modules(name)')
        .order('due_date', { ascending: true })
        .limit(5);
      if (assignData) setDeadlines(assignData);

      // 5. Assessments / Exams
      const { data: assessData } = await supabase
        .from('assessments')
        .select('*, modules(name)')
        .order('date', { ascending: true })
        .limit(5);
      if (assessData) setExamSchedule(assessData);

      // 6. Notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (notifData) setNotifications(notifData);

      // 7. Generate Personalized Rule-Based Recommendations
      const ruleEngineRecs = [];
      
      if (attPct < 80) {
        ruleEngineRecs.push({
          id: 1,
          type: 'urgent',
          title: 'Improve Attendance in Key Modules',
          message: `Your current attendance is ${attPct}%. Maintain above 80% to avoid academic warning penalties.`,
          action: 'View Attendance Log'
        });
      }
      if (assignData && assignData.length > 0) {
        ruleEngineRecs.push({
          id: 2,
          type: 'warning',
          title: 'Pending Assignment Due Soon',
          message: `You have ${assignData.length} pending assignments. Submit before the upcoming deadline.`,
          action: 'Go to Submissions'
        });
      }
      ruleEngineRecs.push({
        id: 3,
        type: 'info',
        title: 'Lecturer Consultation Session Available',
        message: 'Book a 1-on-1 consultation slot to review your Database Systems coursework feedback.',
        action: 'Book Slot'
      });
      ruleEngineRecs.push({
        id: 4,
        type: 'success',
        title: 'Prepare for Upcoming Examinations',
        message: `You have ${assessData?.length || 2} scheduled assessments this semester. Access revision notes in Course Modules.`,
        action: 'Revision Hub'
      });

      setRecommendations(ruleEngineRecs);

      setStats({
        attendancePct: `${attPct}%`,
        completedAssignments: 14,
        pendingAssignments: assignData?.length || 3,
        gpa: calcGpa,
        unreadNotifs: notifData?.filter(n => !n.is_read).length || 2,
        upcomingClasses: timeData?.length || 4,
        upcomingExams: assessData?.length || 2,
        recommendationStatus: attPct < 75 ? 'Intervention Needed' : 'Good Standing'
      });

    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-800 flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-indigo-600 inline-block" /> Student Academic Portal
          </h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">
            Welcome back, <span className="text-indigo-600 font-bold">{user?.full_name || 'Student'}</span> • Academic Progress & Performance Hub
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <DashboardFilters
        filters={filters}
        onFilterChange={(key, val) => setFilters(f => ({ ...f, [key]: val }))}
        onReset={() => setFilters({ academicYear: 'All', semester: 'All', batch: 'All', dateRange: '30days' })}
      />

      {/* 1. 8 Summary Statistic Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Attendance Rate" value={stats.attendancePct} icon={<TrendingUp />} color="text-blue-600" bg="bg-blue-50" trend="Active" />
        <StatCard title="Current GPA" value={stats.gpa} icon={<Award />} color="text-emerald-600" bg="bg-emerald-50" trend="4.0 Scale" />
        <StatCard title="Completed Assignments" value={stats.completedAssignments} icon={<CheckCircle2 />} color="text-indigo-600" bg="bg-indigo-50" trend="Done" />
        <StatCard title="Pending Assignments" value={stats.pendingAssignments} icon={<FileText />} color="text-amber-600" bg="bg-amber-50" trend="Due Soon" isUrgent />
        <StatCard title="Upcoming Classes" value={stats.upcomingClasses} icon={<CalendarDays />} color="text-teal-600" bg="bg-teal-50" trend="This Week" />
        <StatCard title="Upcoming Exams" value={stats.upcomingExams} icon={<Clock />} color="text-purple-600" bg="bg-purple-50" trend="Scheduled" />
        <StatCard title="Unread Notifs" value={stats.unreadNotifs} icon={<Bell />} color="text-pink-600" bg="bg-pink-50" trend="Inbox" />
        <StatCard title="Academic Status" value={stats.recommendationStatus} icon={<Target />} color="text-emerald-700" bg="bg-emerald-100/50" trend="Verified" />
      </div>

      {/* 2. Personalized Rule-Based Recommendation Engine Banner */}
      <div className="glass-card p-6 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/50 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" /> AI Early Warning Recommendations
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">Rule-Based Engine Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendations.map(rec => (
            <div key={rec.id} className="p-4 rounded-xl bg-white border border-slate-100 shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  {rec.type === 'urgent' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  {rec.type === 'warning' && <Clock className="w-4 h-4 text-amber-500" />}
                  {rec.type === 'info' && <Lightbulb className="w-4 h-4 text-blue-500" />}
                  {rec.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  <h4 className="font-bold text-slate-800 text-xs truncate">{rec.title}</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{rec.message}</p>
              </div>
              <button className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                {rec.action} <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Analytics Visualizations Grid (8 Charts) */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" /> Personal Academic Analytics
        </h2>

        {/* Row 1: Attendance Trend & Subject Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Personal Attendance Trend Line" icon={<TrendingUp className="text-blue-500" />}>
            <AttendanceLineChart />
          </ChartCard>
          <ChartCard title="Subject-Wise Performance Distribution" icon={<BookOpen className="text-emerald-500" />}>
            <PerformanceTrendChart />
          </ChartCard>
        </div>

        {/* Row 2: Completion Progress Ring & Semester Area Progression */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Assignment Completion Progress" icon={<CheckCircle2 className="text-emerald-500" />}>
            <div className="h-full flex items-center justify-center py-6">
              <ProgressRingChart percentage={85} label="Assignments Completed" color="#6366f1" size={140} />
            </div>
          </ChartCard>
          <div className="lg:col-span-2">
            <ChartCard title="Semester Performance GPA Progression" icon={<TrendingUp className="text-indigo-500" />}>
              <AreaProgressionChart />
            </ChartCard>
          </div>
        </div>

        {/* Row 3: Study Activity Heatmap & Academic Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Weekly Study & Class Activity Calendar" icon={<Calendar className="text-teal-500" />}>
            <HeatmapChart />
          </ChartCard>
          <ChartCard title="Academic Progress & Events Timeline" icon={<Clock className="text-purple-500" />}>
            <TimelineActivityChart />
          </ChartCard>
        </div>
      </div>

      {/* 4. Data Tables Navigation */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" /> Student Records & Schedules
          </h2>
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs font-semibold">
            {[
              { id: 'timetable', label: 'Current Timetable' },
              { id: 'deadlines', label: 'Assignment Deadlines' },
              { id: 'exams', label: 'Exam Schedule' },
              { id: 'results', label: 'Academic Results' },
              { id: 'notifications', label: 'Notifications' },
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
          {activeTableTab === 'timetable' && (
            <TimetableTable items={timetable} />
          )}
          {activeTableTab === 'deadlines' && (
            <DeadlineTable items={deadlines} />
          )}
          {activeTableTab === 'exams' && (
            <ExamTable items={examSchedule} />
          )}
          {activeTableTab === 'results' && (
            <ResultsTable items={recentResults} />
          )}
          {activeTableTab === 'notifications' && (
            <NotifTable items={notifications} />
          )}
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
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isUrgent ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
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
const TimetableTable = ({ items }) => (
  <div>
    <h4 className="font-bold text-slate-800 text-sm mb-3">Weekly Timetable Schedule</h4>
    <table className="w-full text-xs text-left">
      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
        <tr>
          <th className="p-3">Module</th>
          <th className="p-3">Day</th>
          <th className="p-3">Time</th>
          <th className="p-3">Lecture Hall</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <tr><td colSpan={4} className="p-4 text-center text-slate-400">No timetable entries available</td></tr>
        ) : (
          items.map((t, idx) => (
            <tr key={idx} className="hover:bg-slate-50/80">
              <td className="p-3 font-bold text-slate-800">{t.module_name}</td>
              <td className="p-3 text-slate-600">{t.day_of_week || 'Weekday'}</td>
              <td className="p-3 font-medium text-slate-700">{t.start_time} - {t.end_time}</td>
              <td className="p-3 text-indigo-600 font-medium">{t.lecture_halls?.name || 'Main Hall'}</td>
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
            <p className="text-slate-500">{item.modules?.name || 'Module'}</p>
          </div>
          <span className="font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">Due: {new Date(item.due_date).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  </div>
);

const ExamTable = ({ items }) => (
  <div>
    <h4 className="font-bold text-slate-800 text-sm mb-3">Examination & Quiz Schedule</h4>
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-800">{item.title || item.modules?.name || 'Assessment'}</p>
            <p className="text-indigo-600 font-medium">{new Date(item.date).toLocaleDateString()}</p>
          </div>
          <span className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-700 font-bold text-[11px]">Scheduled</span>
        </div>
      ))}
    </div>
  </div>
);

const ResultsTable = ({ items }) => (
  <div>
    <h4 className="font-bold text-slate-800 text-sm mb-3">Recent Examination & Assignment Results</h4>
    <table className="w-full text-xs text-left">
      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
        <tr>
          <th className="p-3">Module</th>
          <th className="p-3">Marks Score</th>
          <th className="p-3">Grade Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <tr><td colSpan={3} className="p-4 text-center text-slate-400">No results logged yet</td></tr>
        ) : (
          items.map((res, idx) => (
            <tr key={idx} className="hover:bg-slate-50/80">
              <td className="p-3 font-bold text-slate-800">{res.modules?.name || 'Course Module'}</td>
              <td className="p-3 font-extrabold text-indigo-600">{res.marks}%</td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded font-bold ${Number(res.marks) >= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {Number(res.marks) >= 50 ? 'Passed' : 'Remedial Needed'}
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const NotifTable = ({ items }) => (
  <div>
    <h4 className="font-bold text-slate-800 text-sm mb-3">Recent Notifications & Alerts</h4>
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-800">{item.title}</p>
            <p className="text-slate-500">{item.message}</p>
          </div>
          <span className="text-[10px] text-slate-400">{new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ))}
    </div>
  </div>
);

export default StudentDashboard;
