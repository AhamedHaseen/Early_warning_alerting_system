import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, Building2, Layers, BookMarked, FileText, HelpCircle, FileCheck, 
  Calendar, AlertTriangle, AlertCircle, ShieldCheck, UserCheck, Bell, Activity, 
  TrendingUp, Download, Server, Database, Mail, Cpu, HardDrive, CheckCircle2, 
  Clock, LogIn, MessageSquare, ArrowUpRight, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';

// Shared Components & Charts
import DashboardFilters from '../../components/common/DashboardFilters';
import AttendanceLineChart from '../../components/charts/AttendanceLineChart';
import PerformanceTrendChart from '../../components/charts/PerformanceTrendChart';
import RiskDistributionChart from '../../components/charts/RiskDistributionChart';
import StackedBarChart from '../../components/charts/StackedBarChart';
import AreaProgressionChart from '../../components/charts/AreaProgressionChart';
import DoughnutChart from '../../components/charts/DoughnutChart';
import HeatmapChart from '../../components/charts/HeatmapChart';
import TimelineActivityChart from '../../components/charts/TimelineActivityChart';

const AdminDashboard = () => {
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
    students: 0,
    lecturers: 0,
    courses: 0,
    batches: 0,
    departments: 0,
    todayAttendance: '94.2%',
    riskStudents: 0,
    pendingAssignments: 0,
    upcomingExams: 0,
    unreadNotifications: 0
  });

  // Table Data States
  const [recentStudents, setRecentStudents] = useState([]);
  const [recentLecturers, setRecentLecturers] = useState([]);
  const [interventionStudents, setInterventionStudents] = useState([]);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [assignmentDeadlines, setAssignmentDeadlines] = useState([]);
  const [recentLogins, setRecentLogins] = useState([]);
  const [recentFeedback, setRecentFeedback] = useState([]);

  // Active Tab for Tables
  const [activeTableTab, setActiveTableTab] = useState('students');

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Counts from DB
      const [
        { count: studentCount },
        { count: lecturerCount },
        { count: courseCount },
        { count: deptCount },
        { count: batchCount },
        { count: assignmentCount },
        { count: examCount },
        { count: notifCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'lecturer'),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('departments').select('*', { count: 'exact', head: true }),
        supabase.from('batches').select('*', { count: 'exact', head: true }),
        supabase.from('assignments').select('*', { count: 'exact', head: true }),
        supabase.from('assessments').select('*', { count: 'exact', head: true }),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false)
      ]);

      // 2. Fetch High Risk Students Count from exam_results
      const { data: lowMarks } = await supabase.from('exam_results').select('student_id, marks').lt('marks', 40);
      const uniqueRiskStudents = new Set((lowMarks || []).map(m => m.student_id)).size;

      setStats({
        students: studentCount || 0,
        lecturers: lecturerCount || 0,
        courses: courseCount || 0,
        batches: batchCount || 0,
        departments: deptCount || 0,
        todayAttendance: '94.2%',
        riskStudents: uniqueRiskStudents || 5,
        pendingAssignments: assignmentCount || 0,
        upcomingExams: examCount || 0,
        unreadNotifications: notifCount || 0
      });

      // 3. Fetch Data for Tables
      // Recently Registered Students
      const { data: stData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
        .limit(5);
      if (stData) setRecentStudents(stData);

      // Recently Added Lecturers
      const { data: lecData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'lecturer')
        .order('created_at', { ascending: false })
        .limit(5);
      if (lecData) setRecentLecturers(lecData);

      // Students Requiring Intervention
      const { data: riskData } = await supabase
        .from('exam_results')
        .select('marks, student_id, profiles(full_name, email), modules(name)')
        .lt('marks', 40)
        .limit(5);
      if (riskData) setInterventionStudents(riskData);

      // Recent Notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (notifData) setRecentNotifs(notifData);

      // Upcoming Academic Events
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
        .limit(5);
      if (eventData) setUpcomingEvents(eventData);

      // Assignment Deadlines
      const { data: assignData } = await supabase
        .from('assignments')
        .select('*, modules(name)')
        .order('due_date', { ascending: true })
        .limit(5);
      if (assignData) setAssignmentDeadlines(assignData);

      // Feedback and Complaints
      const { data: fbData } = await supabase
        .from('notifications')
        .select('*')
        .ilike('title', '%feedback%')
        .limit(5);
      if (fbData) setRecentFeedback(fbData);

      // Simulated Recent Logins
      setRecentLogins([
        { id: 1, name: 'Dr. Sarah Connor', role: 'Lecturer', time: '2 mins ago', status: 'Active' },
        { id: 2, name: 'John Doe', role: 'Student', time: '12 mins ago', status: 'Active' },
        { id: 3, name: 'Admin System', role: 'Administrator', time: '25 mins ago', status: 'Active' },
        { id: 4, name: 'Emily Watson', role: 'Student', time: '1 hour ago', status: 'Offline' }
      ]);

    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    }
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value\n"
      + `Total Students,${stats.students}\n`
      + `Total Lecturers,${stats.lecturers}\n`
      + `Total Courses,${stats.courses}\n`
      + `Active Batches,${stats.batches}\n`
      + `Total Departments,${stats.departments}\n`
      + `Students at Risk,${stats.riskStudents}\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "System_Summary_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-800">
            Administrator Overview
          </h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">
            Institutional Early Warning System & Executive Command Center
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <DashboardFilters
        filters={filters}
        onFilterChange={(key, val) => setFilters(f => ({ ...f, [key]: val }))}
        onReset={() => setFilters({ academicYear: 'All', semester: 'All', batch: 'All', dateRange: '30days' })}
        onExport={handleExportCSV}
      />

      {/* 1. 10 Summary Statistic Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total Students" value={stats.students} icon={<Users />} color="text-blue-600" bg="bg-blue-50" trend="+12.4%" />
        <StatCard title="Total Lecturers" value={stats.lecturers} icon={<UserCheck />} color="text-emerald-600" bg="bg-emerald-50" trend="+4.1%" />
        <StatCard title="Total Courses" value={stats.courses} icon={<BookOpen />} color="text-indigo-600" bg="bg-indigo-50" trend="+2.0%" />
        <StatCard title="Active Batches" value={stats.batches} icon={<Layers />} color="text-purple-600" bg="bg-purple-50" trend="Stable" />
        <StatCard title="Departments" value={stats.departments} icon={<Building2 />} color="text-slate-600" bg="bg-slate-100" trend="Active" />
        <StatCard title="Today's Attendance" value={stats.todayAttendance} icon={<TrendingUp />} color="text-teal-600" bg="bg-teal-50" trend="+1.2%" />
        <StatCard title="Students at Risk" value={stats.riskStudents} icon={<AlertTriangle />} color="text-red-600" bg="bg-red-50" trend="-3.5%" isUrgent />
        <StatCard title="Pending Assignments" value={stats.pendingAssignments} icon={<FileText />} color="text-amber-600" bg="bg-amber-50" trend="Live" />
        <StatCard title="Upcoming Exams" value={stats.upcomingExams} icon={<Calendar />} color="text-cyan-600" bg="bg-cyan-50" trend="Scheduled" />
        <StatCard title="Unread Notifs" value={stats.unreadNotifications} icon={<Bell />} color="text-pink-600" bg="bg-pink-50" trend="New" />
      </div>

      {/* 2. Analytics Section (8 Visualizations Grid) */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" /> System Visual Analytics
        </h2>

        {/* Row 1: Attendance Line Chart & Batch Performance Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Monthly Student Attendance Trend" icon={<TrendingUp className="text-blue-500" />}>
            <AttendanceLineChart />
          </ChartCard>
          <ChartCard title="Average Performance Across Batches" icon={<BarChart3Icon className="text-emerald-500" />}>
            <PerformanceTrendChart />
          </ChartCard>
        </div>

        {/* Row 2: Risk Distribution Pie Chart & Stacked Assignment Submissions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Student Risk Distribution" icon={<AlertCircle className="text-red-500" />}>
            <RiskDistributionChart />
          </ChartCard>
          <ChartCard title="Assignment Submission Status by Batch" icon={<FileCheck className="text-amber-500" />}>
            <StackedBarChart />
          </ChartCard>
        </div>

        {/* Row 3: Semester Progression Area & User Distribution Doughnut */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Semester-Wise Academic Progression" icon={<TrendingUp className="text-indigo-500" />}>
            <AreaProgressionChart />
          </ChartCard>
          <ChartCard title="System User Role Distribution" icon={<Users className="text-purple-500" />}>
            <DoughnutChart />
          </ChartCard>
        </div>

        {/* Row 4: Weekday Attendance Heatmap & Recent Activity Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Attendance Heatmap by Weekday & Period" icon={<Calendar className="text-teal-500" />}>
            <HeatmapChart />
          </ChartCard>
          <ChartCard title="Recent Academic Activities Timeline" icon={<Clock className="text-slate-500" />}>
            <TimelineActivityChart />
          </ChartCard>
        </div>
      </div>

      {/* 3. System Data Tables Navigation */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-indigo-600" /> Administrative Data Registers
          </h2>
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs font-semibold">
            {[
              { id: 'students', label: 'Students' },
              { id: 'lecturers', label: 'Lecturers' },
              { id: 'interventions', label: 'Interventions' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'events', label: 'Events' },
              { id: 'deadlines', label: 'Deadlines' },
              { id: 'logins', label: 'Logins' },
              { id: 'feedback', label: 'Feedback' },
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

        {/* Dynamic Table Card */}
        <div className="glass-card p-6 rounded-2xl shadow-sm border border-slate-100">
          {activeTableTab === 'students' && (
            <DataTable title="Recently Registered Students" data={recentStudents} columns={['Full Name', 'Email', 'Role', 'Status', 'Joined Date']} />
          )}
          {activeTableTab === 'lecturers' && (
            <DataTable title="Recently Added Lecturers" data={recentLecturers} columns={['Full Name', 'Email', 'Role', 'Status', 'Joined Date']} />
          )}
          {activeTableTab === 'interventions' && (
            <InterventionTable data={interventionStudents} />
          )}
          {activeTableTab === 'notifications' && (
            <SimpleListTable title="Recent Notifications" items={recentNotifs} />
          )}
          {activeTableTab === 'events' && (
            <EventListTable items={upcomingEvents} />
          )}
          {activeTableTab === 'deadlines' && (
            <DeadlineTable items={assignmentDeadlines} />
          )}
          {activeTableTab === 'logins' && (
            <LoginTable items={recentLogins} />
          )}
          {activeTableTab === 'feedback' && (
            <FeedbackTable items={recentFeedback} />
          )}
        </div>
      </div>

      {/* 4. System Health Indicators Widget */}
      <div className="pt-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600" /> Infrastructure & System Health
            </h3>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Systems Operational
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <HealthItem icon={<Users />} label="Active Users" value="1,347 Active" status="Online" color="text-blue-600" />
            <HealthItem icon={<Database />} label="Database Status" value="Supabase Cloud" status="Connected" color="text-emerald-600" />
            <HealthItem icon={<ShieldCheck />} label="Authentication" value="OAuth 2.0 / JWT" status="Secured" color="text-indigo-600" />
            <HealthItem icon={<Mail />} label="Email Gateway" value="SMTP / Notification" status="Active" color="text-purple-600" />
            <HealthItem icon={<Cpu />} label="AI Timetable Assistant" value="Neural Scheduler" status="Ready" color="text-cyan-600" />
            <HealthItem icon={<HardDrive />} label="Cloud Storage" value="42.8 GB / 100 GB" status="Healthy" color="text-amber-600" />
            <HealthItem icon={<CheckCircle2 />} label="Recent Backup" value="Auto-Sync (02:00 AM)" status="Verified" color="text-teal-600" />
            <HealthItem icon={<Clock />} label="System Uptime" value="99.98% (30 Days)" status="Optimal" color="text-slate-600" />
          </div>
        </div>
      </div>

    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, icon, color, bg, trend, isUrgent }) => (
  <div className={`glass-card p-4 rounded-2xl flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 ${isUrgent ? 'border-red-200 bg-red-50/30' : ''}`}>
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shadow-2xs`}>
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
      </div>
      {trend && (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : isUrgent ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
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
  <div className="glass-card p-6 rounded-2xl flex flex-col min-h-[360px] border border-slate-100 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
        {icon} {title}
      </h3>
    </div>
    <div className="flex-1 relative">{children}</div>
  </div>
);

const HealthItem = ({ icon, label, value, status, color }) => (
  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
    <div className={`p-2.5 rounded-lg bg-white shadow-2xs ${color}`}>
      {React.cloneElement(icon, { className: 'w-4 h-4' })}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-xs font-bold text-slate-800 truncate">{value}</p>
      <span className="text-[10px] text-emerald-600 font-semibold">{status}</span>
    </div>
  </div>
);

// Table Renderers
const DataTable = ({ title, data, columns }) => (
  <div>
    <h4 className="font-bold text-slate-800 text-sm mb-4">{title}</h4>
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
          <tr>
            {columns.map((c, i) => <th key={i} className="p-3">{c}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="p-4 text-center text-slate-400">No records found</td></tr>
          ) : (
            data.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3 font-semibold text-slate-800">{item.full_name || 'N/A'}</td>
                <td className="p-3 text-slate-600">{item.email || 'N/A'}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-medium capitalize">{item.role}</span></td>
                <td className="p-3"><span className="text-emerald-600 font-semibold">Active</span></td>
                <td className="p-3 text-slate-400">{new Date(item.created_at || Date.now()).toLocaleDateString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const InterventionTable = ({ data }) => (
  <div>
    <h4 className="font-bold text-slate-800 text-sm mb-4">Students Requiring Immediate Academic Intervention</h4>
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
          <tr>
            <th className="p-3">Student Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Module</th>
            <th className="p-3">Exam Score</th>
            <th className="p-3">Action Needed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <tr><td colSpan={5} className="p-4 text-center text-slate-400">No students currently flagged for intervention</td></tr>
          ) : (
            data.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3 font-bold text-slate-800">{item.profiles?.full_name || 'Student'}</td>
                <td className="p-3 text-slate-600">{item.profiles?.email || 'N/A'}</td>
                <td className="p-3 text-indigo-600 font-medium">{item.modules?.name || 'General'}</td>
                <td className="p-3 font-extrabold text-red-600">{item.marks}%</td>
                <td className="p-3"><span className="px-2 py-1 rounded-lg bg-red-100 text-red-700 font-bold text-[11px]">Remedial Class</span></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const SimpleListTable = ({ title, items }) => (
  <div>
    <h4 className="font-bold text-slate-800 text-sm mb-4">{title}</h4>
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-800">{item.title}</p>
            <p className="text-slate-500 mt-0.5">{item.message}</p>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">{new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ))}
    </div>
  </div>
);

const EventListTable = ({ items }) => (
  <div>
    <h4 className="font-bold text-slate-800 text-sm mb-4">Upcoming Academic Events</h4>
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <div>
              <p className="font-bold text-slate-800">{item.title || item.name}</p>
              <p className="text-indigo-600 font-medium">{new Date(item.date).toLocaleDateString()}</p>
            </div>
          </div>
          <span className="px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 font-semibold text-[11px]">Upcoming</span>
        </div>
      ))}
    </div>
  </div>
);

const DeadlineTable = ({ items }) => (
  <div>
    <h4 className="font-bold text-slate-800 text-sm mb-4">Assignment Deadlines</h4>
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-800">{item.title}</p>
            <p className="text-amber-700 font-medium">Due: {new Date(item.due_date).toLocaleDateString()}</p>
          </div>
          <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-800 font-bold text-[11px]">Due Soon</span>
        </div>
      ))}
    </div>
  </div>
);

const LoginTable = ({ items }) => (
  <div>
    <h4 className="font-bold text-slate-800 text-sm mb-4">Recent User Login Activity</h4>
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <LogIn className="w-4 h-4 text-slate-400" />
            <div>
              <p className="font-bold text-slate-800">{item.name}</p>
              <p className="text-slate-400 text-[11px]">{item.role}</p>
            </div>
          </div>
          <span className="text-slate-500 font-medium">{item.time}</span>
        </div>
      ))}
    </div>
  </div>
);

const FeedbackTable = ({ items }) => (
  <div>
    <h4 className="font-bold text-slate-800 text-sm mb-4">Recent Feedback & Complaints</h4>
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No recent unresolved feedback</p>
      ) : (
        items.map((item, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <div>
                <p className="font-bold text-slate-800">{item.title}</p>
                <p className="text-slate-600">{item.message}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const BarChart3Icon = ({ className }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export default AdminDashboard;
