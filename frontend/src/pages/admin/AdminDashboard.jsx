import React from 'react';
import { Users, BookOpen, Building2, Layers, BookMarked, FileText, HelpCircle, FileCheck, Calendar, AlertTriangle, AlertCircle, ShieldCheck, UserCheck, Bell, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
const AdminDashboard = () => {
  const { user } = useAuth();
  const [recentCourses, setRecentCourses] = React.useState([]);

  React.useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await supabase.from('courses').select('*, departments(name)').limit(5).order('created_at', { ascending: false });
      if (data) setRecentCourses(data);
    };
    fetchCourses();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.full_name || 'Administrator'}</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm shadow-blue-200">
          Download Report
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value="1,248" icon={<Users />} color="text-blue-600" bg="bg-blue-50" trend="+12%" />
        <StatCard title="Total Lecturers" value="84" icon={<Users />} color="text-emerald-600" bg="bg-emerald-50" trend="+3%" />
        <StatCard title="Total Courses" value="126" icon={<BookOpen />} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard title="Today's Attendance" value="92.4%" icon={<UserCheck />} color="text-purple-600" bg="bg-purple-50" trend="+1.2%" />
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SmallStatCard title="Departments" value="12" icon={<Building2 />} />
        <SmallStatCard title="Batches" value="48" icon={<Layers />} />
        <SmallStatCard title="Subjects" value="340" icon={<BookMarked />} />
        <SmallStatCard title="Assignments" value="85" icon={<FileText />} />
        <SmallStatCard title="Quizzes" value="42" icon={<HelpCircle />} />
        <SmallStatCard title="Exams" value="16" icon={<FileCheck />} />
      </div>

      {/* Risk Assessment Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-6 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-slate-400" /> Student Risk Analysis
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center">
              <span className="block text-sm font-medium text-red-600 mb-1">High Risk</span>
              <span className="text-3xl font-bold text-red-700">42</span>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
              <span className="block text-sm font-medium text-orange-600 mb-1">Medium Risk</span>
              <span className="text-3xl font-bold text-orange-700">156</span>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <span className="block text-sm font-medium text-emerald-600 mb-1">Low Risk</span>
              <span className="text-3xl font-bold text-emerald-700">1,050</span>
            </div>
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 min-h-[150px]">
            [Risk Distribution Chart]
          </div>
        </div>

        {/* Total Events */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-6 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-slate-400" /> Upcoming Events
          </h3>
          <div className="text-center mb-6">
            <span className="text-4xl font-bold text-blue-600">8</span>
            <span className="block text-sm text-slate-500 mt-1">Events scheduled this month</span>
          </div>
          <div className="space-y-4 flex-1">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm font-medium text-slate-800">Tech Symposium 2024</p>
              <p className="text-xs text-slate-500 mt-1">Oct 15 • Main Auditorium</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm font-medium text-slate-800">Staff Training</p>
              <p className="text-xs text-slate-500 mt-1">Nov 02 • Conf Room B</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-80">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-slate-400" /> Recent Notifications
          </h3>
          <div className="space-y-4 overflow-y-auto pr-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 shrink-0">
                  <Bell className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">System Update Scheduled</p>
                  <p className="text-xs text-slate-500 mt-0.5">The system will undergo maintenance tonight at 2 AM.</p>
                  <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-80">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-slate-400" /> System Activity
          </h3>
          <div className="space-y-4 overflow-y-auto pr-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3 shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Dr. Turing uploaded grades</p>
                  <p className="text-xs text-slate-500 mt-0.5">Grades for CS101 have been published.</p>
                  <p className="text-xs text-slate-400 mt-1">5 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Overview */}
      <div className="mt-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-slate-400" /> Course Overview
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All Courses</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Course Code</th>
                  <th className="px-4 py-3">Course Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 rounded-tr-lg">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCourses.length === 0 ? (
                  <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-500">No courses found</td></tr>
                ) : recentCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{course.code || 'N/A'}</td>
                    <td className="px-4 py-3">{course.name}</td>
                    <td className="px-4 py-3">{course.departments?.name || 'N/A'}</td>
                    <td className="px-4 py-3 truncate max-w-xs">{course.description || 'No description'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, bg, trend }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-medium text-slate-500">{title}</span>
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${color}`}>
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
      </div>
    </div>
    <span className="text-3xl font-bold text-slate-800">{value}</span>
    {trend && (
      <div className="mt-3 text-sm flex items-center">
        <span className={`px-2 py-0.5 rounded-md font-medium ${color} ${bg}`}>{trend} from last month</span>
      </div>
    )}
  </div>
);

const SmallStatCard = ({ title, value, icon }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-3">
    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
      {React.cloneElement(icon, { className: 'w-5 h-5' })}
    </div>
    <div>
      <span className="block text-xs font-medium text-slate-500">{title}</span>
      <span className="block text-lg font-bold text-slate-800 leading-tight">{value}</span>
    </div>
  </div>
);

export default AdminDashboard;
