import React, { useState, useEffect } from 'react';
import { Search, TrendingDown, TrendingUp, AlertTriangle, UserCheck, Activity, FileText, CheckCircle, Plus, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { sendEmail } from '../../services/EmailService';

const RiskAndAnalysis = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [batchesList, setBatchesList] = useState([]);
  
  // Data States
  const [attendanceData, setAttendanceData] = useState([]);
  const [submissionsData, setSubmissionsData] = useState([]);
  const [interventionsData, setInterventionsData] = useState([]);
  
  // Form State
  const [showLogForm, setShowLogForm] = useState(false);
  const [interventionForm, setInterventionForm] = useState({ reason: '', action_taken: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Tabs State
  const [activeTab, setActiveTab] = useState('individual'); // 'individual' or 'batch'
  const [batchData, setBatchData] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // Fetch all students for the dropdown
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [studentRes, deptRes, batchRes] = await Promise.all([
        supabase.from('student_profiles').select('user_id, batch_id, enrollment_date, profiles(full_name, email), courses(id, name, department_id)'),
        supabase.from('departments').select('id, name'),
        supabase.from('batches').select('id, name, year').order('name')
      ]);
      
      if (studentRes.data) setStudents(studentRes.data);
      if (deptRes.data) setDepartments(deptRes.data);
      if (batchRes.data) setBatchesList(batchRes.data);
      
      setLoading(false);
    };
    fetchData();
  }, []);

  // Fetch metrics for selected student
  useEffect(() => {
    if (!selectedStudentId) return;

    const fetchStudentMetrics = async () => {
      setLoading(true);
      try {
        // 1. Fetch Attendance
        const { data: attData } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('student_id', selectedStudentId)
        .order('date', { ascending: true });

      // Process attendance for chart (e.g. cumulative attendance %)
      let presentCount = 0;
      let total = 0;
      const attChartData = (attData || []).map(record => {
        total++;
        if (record.status === 'present') presentCount++;
        return {
          date: new Date(record.date).toLocaleDateString(),
          attendanceRate: Math.round((presentCount / total) * 100),
          status: record.status
        };
      });
      setAttendanceData(attChartData);

      // 2. Fetch Submissions (Assignments / Exams)
      const { data: subData } = await supabase
        .from('student_submissions')
        .select('marks, assignments(title)')
        .eq('student_id', selectedStudentId)
        .not('marks', 'is', null);

      const { data: examData } = await supabase
        .from('exam_results')
        .select('marks, modules(name)')
        .eq('student_id', selectedStudentId)
        .eq('released', true);

      const allGrades = [];
      
      (subData || []).forEach(s => {
        allGrades.push({
          assignment: s.assignments?.title || 'Assignment',
          grade: Number(s.marks)
        });
      });

      (examData || []).forEach(e => {
        allGrades.push({
          assignment: `${e.modules?.name || 'Unknown'} Exam`,
          grade: Number(e.marks)
        });
      });

      setSubmissionsData(allGrades);

      // 3. Fetch Interventions
      const { data: intData } = await supabase
        .from('risk_interventions')
        .select('*')
        .eq('student_id', selectedStudentId)
        .order('created_at', { ascending: false });

      if (intData) setInterventionsData(intData);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentMetrics();
  }, [selectedStudentId, activeTab]);

  // Fetch metrics for selected batch
  useEffect(() => {
    if (activeTab !== 'batch') return;
    
    const fetchBatchMetrics = async () => {
      setBatchLoading(true);
      try {
        let studentsToQuery = students;
        if (selectedDepartmentId) {
          studentsToQuery = studentsToQuery.filter(s => s.courses?.department_id === selectedDepartmentId);
        }
        
        // Group students by batch
        const batchMap = {};
        studentsToQuery.forEach(s => {
          let bId = s.batch_id;
          if (!bId) {
            const studentYear = s.enrollment_date ? new Date(s.enrollment_date).getFullYear().toString() : null;
            const fallbackBatch = batchesList.find(b => b.year && b.year.toString() === studentYear);
            bId = fallbackBatch ? fallbackBatch.id : 'unknown';
          }
          if (selectedBatchId && bId !== selectedBatchId) return; // Filter by specific batch if selected
          
          if (!batchMap[bId]) batchMap[bId] = [];
          batchMap[bId].push(s.user_id);
        });

        const newBatchData = [];
        
        for (const [bId, sIds] of Object.entries(batchMap)) {
          if (sIds.length === 0) continue;
          const batchInfo = batchesList.find(b => b.id === bId) || { name: 'Unknown Batch' };
          
          // Fetch attendance for these students
          const { data: attData } = await supabase.from('attendance').select('status').in('student_id', sIds);
          let attRate = 0;
          if (attData && attData.length > 0) {
            const present = attData.filter(a => ['present', 'late'].includes(a.status)).length;
            attRate = Math.round((present / attData.length) * 100);
          }
          
          // Fetch grades for these students
          const { data: subData } = await supabase.from('submissions').select('grade').in('student_id', sIds);
          let avgGrade = 0;
          const graded = (subData || []).filter(s => s.grade !== null);
          if (graded.length > 0) {
            avgGrade = Math.round(graded.reduce((acc, curr) => acc + Number(curr.grade), 0) / graded.length);
          }
          
          newBatchData.push({
            batchId: bId,
            name: batchInfo.name,
            'Avg Attendance (%)': attRate,
            'Avg Grade (%)': avgGrade,
            studentsCount: sIds.length
          });
        }
        
        setBatchData(newBatchData);
      } catch (err) {
        console.error(err);
      } finally {
        setBatchLoading(false);
      }
    };
    
    fetchBatchMetrics();
  }, [selectedDepartmentId, selectedBatchId, activeTab, students, batchesList]);

  // KPIs Calculation
  const currentAttRate = attendanceData.length > 0 ? attendanceData[attendanceData.length - 1].attendanceRate : 0;
  const avgGrade = submissionsData.length > 0 
    ? Math.round(submissionsData.reduce((acc, curr) => acc + curr.grade, 0) / submissionsData.length)
    : 0;

  let riskLevel = 'Low';
  let riskColor = 'text-emerald-600';
  let riskBg = 'bg-emerald-50 border-emerald-200';
  
  if ((currentAttRate < 75 && attendanceData.length > 0) || (avgGrade < 50 && submissionsData.length > 0)) {
    riskLevel = 'Medium';
    riskColor = 'text-orange-600';
    riskBg = 'bg-orange-50 border-orange-200';
  }
  if ((currentAttRate < 60 && attendanceData.length > 0) || (avgGrade < 40 && submissionsData.length > 0)) {
    riskLevel = 'High';
    riskColor = 'text-red-600';
    riskBg = 'bg-red-50 border-red-200';
  }

  const handleAutoNotify = async () => {
    if (riskLevel === 'Low') {
      Swal.fire('Info', 'Student is currently at Low Risk. No automated notification needed.', 'info');
      return;
    }
    
    setSaving(true);
    try {
      const isLecturer = window.location.pathname.includes('/lecturer');
      
      const reason = `Automated Risk Assessment: ${riskLevel} Risk`;
      const action = `System identified ${riskLevel} Risk based on recent academic data. Student advised to contact academic support.`;

      const { error } = await supabase.from('risk_interventions').insert([{
        student_id: selectedStudentId,
        lecturer_id: isLecturer ? user.id : null,
        reason: reason,
        action_taken: action,
        status: 'open'
      }]);
      
      if (error) throw error;
      
      const notifications = [{
        user_id: selectedStudentId,
        title: `Risk Alert (${riskLevel} Risk)`,
        message: `Your academic standing is currently at ${riskLevel} Risk. Please review your attendance and grades, and contact your lecturer or academic advisor.`,
        is_read: false
      }];

      // Notify Admins
      const { data: admins } = await supabase.from('profiles').select('id, email').eq('role', 'admin');
      if (admins) {
        admins.forEach(admin => {
          notifications.push({
            user_id: admin.id,
            title: `Student Risk Alert (${riskLevel})`,
            message: `Student ${selectedStudent?.profiles?.full_name || 'Unknown'} has been identified as ${riskLevel} risk.`,
            is_read: false
          });
        });
      }

      // Notify Lecturer (the one initiating it, if they are a lecturer)
      if (isLecturer && user?.id) {
        notifications.push({
          user_id: user.id,
          title: `Student Risk Alert (${riskLevel})`,
          message: `You have flagged student ${selectedStudent?.profiles?.full_name || 'Unknown'} as ${riskLevel} risk.`,
          is_read: false
        });
      }

      await supabase.from('notifications').insert(notifications);
      
      // Dispatch email
      const studentEmail = selectedStudent?.profiles?.email || 'student@example.com';
      await sendEmail({
        to: studentEmail,
        subject: `Important: Academic Risk Alert (${riskLevel})`,
        body: `Dear ${selectedStudent?.profiles?.full_name},\n\nSystem identified ${riskLevel} Risk based on recent academic data. Please contact your academic support team.\n\nBest,\nAcademic System`
      });

      Swal.fire('Sent', 'Automated risk notification has been sent to the student via app and email.', 'success');
      
      // Refresh interventions
      const { data } = await supabase
        .from('risk_interventions')
        .select('*')
        .eq('student_id', selectedStudentId)
        .order('created_at', { ascending: false });
      if (data) setInterventionsData(data);
      
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoNotifyBatch = async (batchInfo) => {
    setSaving(true);
    try {
      const { data: admins } = await supabase.from('profiles').select('id, email').eq('role', 'admin');
      const adminIds = (admins || []).map(a => a.id);
      
      const adminAlerts = adminIds.map(adminId => ({
        user_id: adminId,
        title: 'Batch Risk Alert',
        message: `Batch "${batchInfo.name}" has been flagged for low performance (Att: ${batchInfo['Avg Attendance (%)']}%, Grade: ${batchInfo['Avg Grade (%)']}%). Please investigate.`,
        is_read: false
      }));

      const isLecturer = window.location.pathname.includes('/lecturer');
      if (isLecturer && user?.id) {
        adminAlerts.push({
          user_id: user.id,
          title: 'Batch Risk Alert',
          message: `You have flagged Batch "${batchInfo.name}" for low performance (Att: ${batchInfo['Avg Attendance (%)']}%, Grade: ${batchInfo['Avg Grade (%)']}%).`,
          is_read: false
        });
      }

      if (adminAlerts.length > 0) {
        const { error } = await supabase.from('notifications').insert(adminAlerts);
        if (error) throw error;

        // Dispatch email to all admins
        const adminEmails = (admins || []).map(a => a.email || 'admin@example.com');
        for (const email of adminEmails) {
          await sendEmail({
            to: email,
            subject: `Batch Risk Alert: ${batchInfo.name}`,
            body: `Batch "${batchInfo.name}" has been flagged for low performance.\nAttendance: ${batchInfo['Avg Attendance (%)']}%\nAverage Grade: ${batchInfo['Avg Grade (%)']}%\n\nPlease investigate this batch immediately.`
          });
        }

        Swal.fire('Sent', `Consultants have been notified via app and email about Batch "${batchInfo.name}".`, 'success');
      } else {
        Swal.fire('Info', 'No consultants found to notify.', 'info');
      }
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const markInterventionResolved = async (id) => {
    try {
      const { error } = await supabase
        .from('risk_interventions')
        .update({ status: 'resolved' })
        .eq('id', id);
        
      if (error) throw error;
      
      setInterventionsData(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'resolved' } : inv));
    } catch (error) {
      Swal.fire('Error', 'Could not update status', 'error');
    }
  };



  const selectedStudent = students.find(s => s.user_id === selectedStudentId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Analytics & Interventions</h1>
          <p className="text-slate-500 text-sm mt-1">Detailed trending analysis and risk management.</p>
        </div>
      </div>

      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('individual')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'individual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          Individual Student
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'batch' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          Batch Analysis
        </button>
      </div>

      {activeTab === 'individual' && (
        <>
          {/* Student Selector */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Department</label>
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => {
                    setSelectedDepartmentId(e.target.value);
                    setSelectedBatchId(''); // Reset batch when dept changes
                    setSelectedStudentId(''); // Reset student
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Batch</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => {
                    setSelectedBatchId(e.target.value);
                    setSelectedStudentId(''); // Reset student when batch changes
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                >
                  <option value="">All Batches</option>
                  {batchesList.map(batch => (
                    <option key={batch.id} value={batch.id}>{batch.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 font-medium"
                >
                  <option value="">-- Search and select a student --</option>
                  {students
                    .filter(s => !selectedDepartmentId || s.courses?.department_id === selectedDepartmentId)
                    .filter(s => {
                      if (!selectedBatchId) return true;
                      if (s.batch_id === selectedBatchId) return true;
                      const selectedBatch = batchesList.find(b => b.id === selectedBatchId);
                      const studentYear = s.enrollment_date ? new Date(s.enrollment_date).getFullYear().toString() : 'Unknown';
                      return !s.batch_id && selectedBatch && selectedBatch.year && selectedBatch.year.toString() === studentYear;
                    })
                    .map(s => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.profiles?.full_name} ({s.profiles?.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {!selectedStudentId ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center text-slate-500">
              <Activity className="w-16 h-16 mx-auto text-slate-200 mb-4" />
              <p className="text-lg font-medium">Please select a student to view their analytics.</p>
            </div>
          ) : loading ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center text-slate-500">
              Loading analytics...
            </div>
          ) : (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              
              {/* Profile & KPI Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-6 rounded-2xl border flex flex-col justify-center items-center text-center ${riskBg}`}>
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                    <span className={`text-2xl font-bold ${riskColor}`}>{selectedStudent?.profiles?.full_name?.charAt(0) || 'U'}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">{selectedStudent?.profiles?.full_name}</h2>
                  <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${riskLevel === 'High' ? 'bg-red-200 text-red-800' : riskLevel === 'Medium' ? 'bg-orange-200 text-orange-800' : 'bg-emerald-200 text-emerald-800'}`}>
                    {riskLevel} RISK
                  </span>
                </div>
    
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                  <span className="text-sm font-medium text-slate-500 mb-1">Current Attendance</span>
                  <div className="flex items-end space-x-2">
                    <span className={`text-4xl font-bold ${currentAttRate < 75 ? 'text-red-600' : 'text-emerald-600'}`}>{currentAttRate}%</span>
                  </div>
                  <span className="text-xs text-slate-400 mt-2">Based on {attendanceData.length} recorded sessions</span>
                </div>
    
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                  <span className="text-sm font-medium text-slate-500 mb-1">Average Grade (Exams/Assigns)</span>
                  <div className="flex items-end space-x-2">
                    <span className={`text-4xl font-bold ${avgGrade < 50 ? 'text-red-600' : 'text-blue-600'}`}>{avgGrade}%</span>
                  </div>
                  <span className="text-xs text-slate-400 mt-2">Based on {submissionsData.length} graded submissions</span>
                </div>
    
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                  <span className="text-sm font-medium text-slate-500 mb-1">Open Interventions</span>
                  <span className="text-4xl font-bold text-orange-600">
                    {interventionsData.filter(i => i.status === 'open').length}
                  </span>
                  <button 
                    onClick={handleAutoNotify}
                    disabled={saving || riskLevel === 'Low'}
                    className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" /> Auto-Notify Student
                  </button>
                </div>
              </div>
    
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attendance Trend Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-500" /> Attendance Trend (Cumulative %)
                  </h3>
                  <div className="h-72 w-full">
                    {attendanceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Area type="monotone" dataKey="attendanceRate" name="Attendance %" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">No attendance data available.</div>
                    )}
                  </div>
                </div>
    
                {/* Submissions / Exam Results Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-purple-500" /> Academic Performance (Grades)
                  </h3>
                  <div className="h-72 w-full">
                    {submissionsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={submissionsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="assignment" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <RechartsTooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="grade" name="Grade" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">No graded submissions available.</div>
                    )}
                  </div>
                </div>
              </div>
    
              {/* Intervention History */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" /> Intervention History
                </h3>
                
                {interventionsData.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                    No interventions recorded for this student.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interventionsData.map((inv) => (
                      <div key={inv.id} className="p-4 bg-white border border-slate-200 rounded-xl flex items-start justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-start">
                          <div className={`mt-1 w-2 h-2 rounded-full mr-3 ${inv.status === 'open' ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
                          <div>
                            <p className="font-semibold text-slate-800">{inv.reason}</p>
                            <p className="text-sm text-slate-600 mt-1"><span className="font-medium text-slate-700">Action:</span> {inv.action_taken}</p>
                            <p className="text-xs text-slate-400 mt-2 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" /> {new Date(inv.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {inv.status === 'open' ? (
                          <button 
                            onClick={() => markInterventionResolved(inv.id)}
                            className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded hover:bg-emerald-100 transition-colors flex items-center"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> Mark Resolved
                          </button>
                        ) : (
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-semibold rounded flex items-center">
                            Resolved
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
    
            </div>
          )}
        </>
      )}

      {activeTab === 'batch' && (
        <div className="space-y-6 animate-in zoom-in-95 duration-300">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 flex items-center">
                <UserCheck className="w-5 h-5 mr-2 text-indigo-500" /> Batch Performance Analysis
              </h3>
            </div>
            
            {batchLoading ? (
              <div className="py-12 text-center text-slate-500">Loading batch metrics...</div>
            ) : batchData.length === 0 ? (
              <div className="py-12 text-center text-slate-500">No batches found for the selected department.</div>
            ) : (
              <>
                <div className="h-80 w-full mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={batchData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend />
                      <Bar dataKey="Avg Attendance (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Avg Grade (%)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-6 py-4">Batch Name</th>
                        <th className="px-6 py-4">Total Students</th>
                        <th className="px-6 py-4">Avg Attendance</th>
                        <th className="px-6 py-4">Avg Grade</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batchData.map(batch => {
                        const isAtRisk = batch['Avg Attendance (%)'] < 75 || batch['Avg Grade (%)'] < 50;
                        return (
                          <tr key={batch.batchId} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800">{batch.name}</td>
                            <td className="px-6 py-4">{batch.studentsCount}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded font-medium ${batch['Avg Attendance (%)'] < 75 ? 'bg-red-100 text-red-700' : 'text-slate-700'}`}>
                                {batch['Avg Attendance (%)']}%
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded font-medium ${batch['Avg Grade (%)'] < 50 ? 'bg-red-100 text-red-700' : 'text-slate-700'}`}>
                                {batch['Avg Grade (%)']}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {isAtRisk ? (
                                <button 
                                  onClick={() => handleAutoNotifyBatch(batch)}
                                  disabled={saving}
                                  className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-xs font-semibold transition-colors flex items-center justify-end w-full"
                                >
                                  <AlertTriangle className="w-3 h-3 mr-1" /> Alert Consultant
                                </button>
                              ) : (
                                <span className="text-emerald-600 text-xs font-medium flex items-center justify-end">
                                  <CheckCircle className="w-3 h-3 mr-1" /> On Track
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskAndAnalysis;
