import React, { useState, useEffect } from 'react';
import { CalendarDays, Filter, PieChart, Download, CheckCircle, XCircle, Clock, PlusCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [summary, setSummary] = useState({
    totalConducted: 0,
    totalAttended: 0,
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
    totalExcused: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchAttendance();
    }
  }, [user]);

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          id,
          status,
          date,
          timetables (
            module_name
          )
        `)
        .eq('student_id', user.id);

      if (attendanceError) throw attendanceError;

      const moduleStats = {};
      let totalConducted = 0;
      let totalPresent = 0;
      let totalAbsent = 0;
      let totalLate = 0;
      let totalExcused = 0;

      attendanceRecords.forEach(record => {
        const subjectName = record.timetables?.module_name;
        if (!subjectName) return; // Skip invalid records

        if (!moduleStats[subjectName]) {
          moduleStats[subjectName] = {
            id: subjectName,
            subject: subjectName,
            conducted: 0,
            attended: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            percentage: 0
          };
        }

        const stats = moduleStats[subjectName];
        stats.conducted += 1;
        totalConducted += 1;

        if (record.status === 'present') {
          stats.present += 1;
          stats.attended += 1;
          totalPresent += 1;
        } else if (record.status === 'absent') {
          stats.absent += 1;
          totalAbsent += 1;
        } else if (record.status === 'late') {
          stats.late += 1;
          stats.attended += 1; 
          totalLate += 1;
        } else if (record.status === 'excused') {
          stats.excused += 1;
          totalExcused += 1;
        }

        stats.percentage = Math.round((stats.attended / stats.conducted) * 100) || 0;
      });

      const aggregatedData = Object.values(moduleStats);
      setAttendanceData(aggregatedData);

      const totalAttended = totalPresent + totalLate;
      const overallPercentage = totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 100) : 0;

      setSummary({
        totalConducted,
        totalAttended,
        totalPresent,
        totalAbsent,
        totalLate,
        totalExcused,
        percentage: overallPercentage
      });

    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // SVG calculations for the circular progress chart
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (summary.percentage / 100) * circumference;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Attendance Overview</h1>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center shadow-sm">
            <Filter className="w-4 h-4 mr-2" /> Semester 2
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm shadow-blue-200 flex items-center">
            <Download className="w-4 h-4 mr-2" /> Report
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center shadow-sm border border-red-100">
          <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
          <span className="font-medium">Failed to load attendance data: {error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Overall Summary Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center">
              <h2 className="text-sm font-semibold text-slate-800 mb-6 self-start flex items-center">
                <PieChart className="w-4 h-4 mr-2 text-blue-500" /> Overall Attendance
              </h2>
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="70" 
                    fill="transparent" 
                    stroke="#3b82f6" 
                    strokeWidth="16" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={strokeDashoffset} 
                    className="transition-all duration-1000 ease-out" 
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-slate-800">{summary.percentage}%</span>
                  <span className="text-xs text-slate-500 mt-1">Average</span>
                </div>
              </div>
              <div className="w-full grid grid-cols-2 gap-4 mt-8">
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Total Conducted</p>
                  <p className="text-xl font-bold text-slate-800">{summary.totalConducted}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Total Attended</p>
                  <p className="text-xl font-bold text-slate-800">{summary.totalAttended}</p>
                </div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center border-l-4 border-l-emerald-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-800 mb-1">{summary.totalPresent}</p>
                <p className="text-sm font-medium text-slate-500">Total Present Days</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center border-l-4 border-l-red-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                    <XCircle className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-800 mb-1">{summary.totalAbsent}</p>
                <p className="text-sm font-medium text-slate-500">Total Absent Days</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center border-l-4 border-l-orange-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-800 mb-1">{summary.totalLate}</p>
                <p className="text-sm font-medium text-slate-500">Late Arrivals</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-800 mb-1">{summary.totalExcused}</p>
                <p className="text-sm font-medium text-slate-500">Excused</p>
              </div>
            </div>
          </div>

          {/* Subject-wise Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <CalendarDays className="w-5 h-5 mr-2 text-slate-400" /> Subject-wise Breakdown
              </h2>
            </div>
            {attendanceData.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                No attendance records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4 text-center">Conducted</th>
                      <th className="px-6 py-4 text-center">Attended</th>
                      <th className="px-6 py-4 text-center">Absent</th>
                      <th className="px-6 py-4 text-center">Late</th>
                      <th className="px-6 py-4 text-center">Excused</th>
                      <th className="px-6 py-4 text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceData.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800">{row.subject}</td>
                        <td className="px-6 py-4 text-center">{row.conducted}</td>
                        <td className="px-6 py-4 text-center text-emerald-600 font-medium">{row.attended}</td>
                        <td className="px-6 py-4 text-center text-red-600">{row.absent}</td>
                        <td className="px-6 py-4 text-center text-orange-500">{row.late}</td>
                        <td className="px-6 py-4 text-center text-blue-500">{row.excused}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            row.percentage >= 80 ? 'bg-emerald-100 text-emerald-700' :
                            row.percentage >= 70 ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {row.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentAttendance;
