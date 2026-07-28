import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, AlertTriangle, CheckCircle, Info, Clock, Target, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';

const StudentProgress = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('progress');
  const [loading, setLoading] = useState(true);

  // Data states
  const [metrics, setMetrics] = useState({
    attendanceRate: 100,
    overallGrade: 0,
    readiness: 0,
    riskLevel: 'Low Risk',
    riskScore: 0
  });

  const [trendData, setTrendData] = useState([]);
  const [impactData, setImpactData] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [interventions, setInterventions] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchProgressData();
    }
  }, [user]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Attendance
      const { data: attData } = await supabase
        .from('attendance')
        .select('status, date, timetables(module_name)')
        .eq('student_id', user.id);

      // 2. Fetch Submissions (Assignments)
      const { data: subData } = await supabase
        .from('student_submissions')
        .select('marks, created_at, assignments(title, module_id, modules(name))')
        .eq('student_id', user.id)
        .not('marks', 'is', null)
        .order('created_at', { ascending: false });

      // 3. Fetch Exam Results
      const { data: examData } = await supabase
        .from('exam_results')
        .select('marks, created_at, module_id, modules(name)')
        .eq('student_id', user.id)
        .eq('released', true)
        .order('created_at', { ascending: false });

      // 4. Fetch Risk Interventions
      const { data: intData } = await supabase
        .from('risk_interventions')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      processMetrics(attData || [], subData || [], examData || [], intData || []);
    } catch (err) {
      console.error('Error fetching progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  const processMetrics = (attData, subData, examData, intData) => {
    // Process Attendance
    let presentCount = 0;
    const moduleStats = {}; // { moduleId: { moduleName, attTotal, attPresent, totalMarks, markCount } }

    attData.forEach(a => {
      const isPresent = a.status === 'present' || a.status === 'late' || a.status === 'excused';
      if (a.status === 'present' || a.status === 'late') presentCount++; // late counts as present for rate
      
      const modName = a.timetables?.module_name;
      if (modName) {
        if (!moduleStats[modName]) {
          moduleStats[modName] = { name: modName, attTotal: 0, attPresent: 0, totalMarks: 0, markCount: 0 };
        }
        moduleStats[modName].attTotal++;
        if (a.status === 'present' || a.status === 'late') moduleStats[modName].attPresent++;
      }
    });

    const attendanceRate = attData.length > 0 ? Math.round((presentCount / attData.length) * 100) : 100;

    // Process Grades (Submissions + Exams)
    const allGrades = [];
    
    subData.forEach(s => {
      if (s.marks !== null) {
        const p = Number(s.marks);
        allGrades.push({ date: s.created_at, val: p, name: s.assignments?.title || 'Assignment' });
        
        const modName = s.assignments?.modules?.name || s.assignments?.module_id; // fallback if name isn't there
        if (modName && moduleStats[modName]) {
          moduleStats[modName].totalMarks += p;
          moduleStats[modName].markCount++;
        }
      }
    });

    examData.forEach(e => {
      if (e.marks !== null) {
        const p = Number(e.marks);
        allGrades.push({ date: e.created_at, val: p, name: `${e.modules?.name || ''} Exam` });
        
        const modName = e.modules?.name || e.module_id;
        if (modName && moduleStats[modName]) {
          moduleStats[modName].totalMarks += p;
          moduleStats[modName].markCount++;
        }
      }
    });

    const overallGrade = allGrades.length > 0 
      ? Math.round(allGrades.reduce((sum, item) => sum + item.val, 0) / allGrades.length) 
      : 0;

    // Recent assignments
    setRecentAssignments(subData.slice(0, 4));

    // Performance Trend Chart Data
    // Sort all grades by date ascending
    allGrades.sort((a, b) => new Date(a.date) - new Date(b.date));
    const trend = allGrades.slice(-10).map((g, i) => ({
      name: `T${i+1}`,
      tooltipName: g.name,
      Score: g.val
    }));
    setTrendData(trend);

    // Attendance vs Performance Chart Data
    const impact = Object.values(moduleStats)
      .filter(m => m.attTotal > 0)
      .map(m => ({
        subject: m.name,
        Attendance: Math.round((m.attPresent / m.attTotal) * 100),
        Performance: m.markCount > 0 ? Math.round(m.totalMarks / m.markCount) : 0
      }));
    setImpactData(impact);

    // Risk Calculation
    let riskLvl = 'Low Risk';
    const openInterventions = intData.filter(i => i.status === 'open').length;

    const hasAttendance = attData.length > 0;
    const hasGrades = allGrades.length > 0;

    const isHighRiskAtt = hasAttendance && attendanceRate < 60;
    const isHighRiskGrade = hasGrades && overallGrade < 40;
    const isMedRiskAtt = hasAttendance && attendanceRate < 75;
    const isMedRiskGrade = hasGrades && overallGrade < 50;

    if (isHighRiskAtt || isHighRiskGrade) {
      riskLvl = 'High Risk';
    } else if (isMedRiskAtt || isMedRiskGrade) {
      riskLvl = 'Medium Risk';
    }

    const readiness = Math.round((attendanceRate + (overallGrade || 50)) / 2);

    setMetrics({
      attendanceRate,
      overallGrade,
      readiness,
      riskLevel: riskLvl
    });

    setInterventions(intData);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Academic Progress & Risk</h1>
        <div className="bg-slate-100 p-1 rounded-xl inline-flex">
          <button 
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'progress' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Academic Progress
          </button>
          <button 
            onClick={() => setActiveTab('risk')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'risk' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Risk Analysis
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : activeTab === 'progress' ? (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Performance Trend */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-500" /> Overall Performance
              </h2>
              <div className="h-64 w-full">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value, name, props) => [value + '%', props.payload.tooltipName]}
                      />
                      <Area type="monotone" dataKey="Score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">No performance data yet</div>
                )}
              </div>
            </div>

            {/* Attendance vs Performance */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <Target className="w-5 h-5 mr-2 text-purple-500" /> Attendance Impact
              </h2>
              <div className="h-64 w-full">
                {impactData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={impactData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="Attendance" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Performance" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">No impact data yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Component Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Recent Graded Assignments</h3>
              <div className="space-y-4">
                {recentAssignments.length > 0 ? recentAssignments.map((a, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-600 truncate mr-2">{a.assignments?.title}</span>
                      <span className="text-blue-600 font-bold">{a.marks}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${a.marks}%` }}></div>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400">No graded assignments found.</p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
              <h3 className="text-sm font-bold text-slate-800 mb-4 text-center">Calculated Exam Readiness</h3>
              <div className="flex items-center justify-center h-32">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                    <circle 
                      cx="56" 
                      cy="56" 
                      r="48" 
                      fill="transparent" 
                      stroke={metrics.readiness >= 75 ? "#10b981" : metrics.readiness >= 50 ? "#f59e0b" : "#ef4444"} 
                      strokeWidth="12" 
                      strokeDasharray="301.59" 
                      strokeDashoffset={301.59 - (301.59 * metrics.readiness) / 100} 
                      strokeLinecap="round" 
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-800">{metrics.readiness}%</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-slate-500 mt-4 font-medium">Weighted average of attendance and performance</p>
            </div>
          </div>

        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className={`border-2 p-6 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden ${
              metrics.riskLevel === 'Low Risk' ? 'bg-emerald-50 border-emerald-100' :
              metrics.riskLevel === 'Medium Risk' ? 'bg-orange-50 border-orange-100' :
              'bg-red-50 border-red-100'
            }`}>
              <Activity className={`w-32 h-32 absolute -right-6 -bottom-6 opacity-20 ${
                metrics.riskLevel === 'Low Risk' ? 'text-emerald-500' :
                metrics.riskLevel === 'Medium Risk' ? 'text-orange-500' :
                'text-red-500'
              }`} />
              <div className="relative z-10 flex flex-col items-center">
                <span className={`px-3 py-1 text-xs font-bold rounded-full mb-4 uppercase tracking-wider ${
                  metrics.riskLevel === 'Low Risk' ? 'bg-emerald-100 text-emerald-700' :
                  metrics.riskLevel === 'Medium Risk' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>Current Status</span>
                <p className={`text-4xl font-bold mb-2 ${
                  metrics.riskLevel === 'Low Risk' ? 'text-emerald-600' :
                  metrics.riskLevel === 'Medium Risk' ? 'text-orange-600' :
                  'text-red-600'
                }`}>{metrics.riskLevel}</p>
                <p className="text-sm font-medium opacity-80">
                  {metrics.riskLevel === 'Low Risk' ? 'Your academic standing is currently healthy.' :
                   metrics.riskLevel === 'Medium Risk' ? 'Some areas require your attention.' :
                   'Immediate action required to improve your standing.'}
                </p>
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-blue-500" /> Automated Risk Factors
              </h2>
              
              <div className="space-y-4">
                {metrics.attendanceRate < 80 && (
                  <div className="flex items-start p-4 bg-orange-50 border border-orange-100 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 mr-3 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Low Attendance</h4>
                      <p className="text-xs text-slate-600 mt-1">Your overall attendance is at {metrics.attendanceRate}%, which is below the 80% requirement.</p>
                    </div>
                  </div>
                )}
                
                {metrics.overallGrade < 50 && metrics.overallGrade > 0 && (
                  <div className="flex items-start p-4 bg-red-50 border border-red-100 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Poor Academic Performance</h4>
                      <p className="text-xs text-slate-600 mt-1">Your overall performance average is {metrics.overallGrade}%. Consider seeking academic support.</p>
                    </div>
                  </div>
                )}

                {metrics.attendanceRate >= 80 && metrics.overallGrade >= 50 && interventions.filter(i => i.status === 'open').length === 0 && (
                  <div className="flex items-start p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 mr-3 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">No Automated Warnings</h4>
                      <p className="text-xs text-slate-600 mt-1">You are currently meeting all academic requirements. Keep up the good work!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-slate-400" /> Lecturer Interventions & History
              </h2>
            </div>
            <div className="p-6">
              {interventions.length > 0 ? (
                <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
                  {interventions.map((inv) => (
                    <div key={inv.id} className="relative pl-6">
                      <div className={`w-4 h-4 rounded-full absolute -left-[9px] top-1 border-4 border-white ${
                        inv.status === 'resolved' ? 'bg-emerald-500' : 'bg-red-500'
                      }`}></div>
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-bold text-slate-800">Lecturer Note</p>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          inv.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 mb-2">{new Date(inv.created_at).toLocaleDateString()}</p>
                      
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm">
                        <p className="font-semibold text-slate-700 mb-1">Reason:</p>
                        <p className="text-slate-600 mb-2">{inv.reason}</p>
                        
                        {inv.action_taken && (
                          <>
                            <p className="font-semibold text-slate-700 mb-1">Action Suggested:</p>
                            <p className="text-slate-600">{inv.action_taken}</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-slate-500">No interventions have been logged by your lecturers.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default StudentProgress;
