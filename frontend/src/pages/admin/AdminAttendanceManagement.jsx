import React, { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle, XCircle, Clock, PlusCircle, Search, Save } from 'lucide-react';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { sendEmail } from '../../services/EmailService';

const AdminAttendanceManagement = () => {
  const isLecturer = window.location.pathname.includes('/lecturer');
  const [activeTab, setActiveTab] = useState('students');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetable, setSelectedTimetable] = useState('');

  const [records, setRecords] = useState([]); // Users (students or lecturers)
  const [attendanceData, setAttendanceData] = useState({}); // mapping id -> status
  const [loading, setLoading] = useState(false);

  // Fetch timetables for the selected day
  useEffect(() => {
    const fetchTimetables = async () => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = days[new Date(date).getDay()];

      const { data } = await supabase
        .from('timetables')
        .select('*, modules(name, course_id), lecturer_profiles(user_id, profiles(full_name))')
        .or(`specific_date.eq.${date},and(specific_date.is.null,day_of_week.eq.${dayOfWeek})`);

      setTimetables(data || []);
      if (data && data.length > 0) {
        setSelectedTimetable(data[0].id);
      } else {
        setSelectedTimetable('');
      }
    };
    if (date) fetchTimetables();
  }, [date]);

  // Fetch users and their attendance
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      if (activeTab === 'students') {
        if (!selectedTimetable) {
          setRecords([]);
          setAttendanceData({});
          setLoading(false);
          return;
        }

        const timetable = timetables.find(t => t.id === selectedTimetable);
        const courseId = timetable?.course_id || timetable?.modules?.course_id;

        // Fetch students enrolled in the assigned course (since timetables use manual module_name and course_id)
        const { data: studentsData } = await supabase
          .from('profiles')
          .select('id, full_name, student_profiles!inner(course_id)')
          .eq('role', 'student')
          .eq('student_profiles.course_id', courseId);

        const students = studentsData || [];

        // Fetch existing attendance
        const { data: att } = await supabase
          .from('attendance')
          .select('student_id, status')
          .eq('timetable_id', selectedTimetable)
          .eq('date', date);

        const attMap = {};
        att?.forEach(a => attMap[a.student_id] = a.status);

        setRecords(students);
        setAttendanceData(attMap);

      } else {
        // Lecturer Attendance (Daily - Not tied to a specific class)
        const { data: lecturers } = await supabase
          .from('profiles')
          .select('id, full_name, lecturer_profiles!inner(department_id)')
          .eq('role', 'lecturer');

        // Fetch existing daily attendance
        const { data: att } = await supabase
          .from('lecturer_attendance')
          .select('lecturer_id, status')
          .eq('date', date);

        const attMap = {};
        att?.forEach(a => attMap[a.lecturer_id] = a.status);

        setRecords(lecturers || []);
        setAttendanceData(attMap);
      }

      setLoading(false);
    };

    fetchData();
  }, [selectedTimetable, activeTab, date, timetables]);

  const handleStatusChange = (id, status) => {
    setAttendanceData(prev => ({ ...prev, [id]: status }));
  };

  const saveAttendance = async () => {
    if (activeTab === 'students' && !selectedTimetable) return;
    setLoading(true);

    try {
      const recordsToUpsert = records.map(rec => {
        if (activeTab === 'students') {
          return {
            timetable_id: selectedTimetable,
            student_id: rec.id,
            date: date,
            status: attendanceData[rec.id] || 'absent'
          };
        } else {
          return {
            timetable_id: null, // No longer tied to a specific timetable for daily attendance
            lecturer_id: rec.id,
            date: date,
            status: attendanceData[rec.id] || 'absent'
          };
        }
      });

      if (recordsToUpsert.length === 0) {
        Swal.fire('Info', 'No records to save.', 'info');
        setLoading(false);
        return;
      }

      const table = activeTab === 'students' ? 'attendance' : 'lecturer_attendance';
      
      // Try direct upsert first (note: lecturer_attendance now uses lecturer_id + date constraint)
      const conflictKeys = activeTab === 'students' ? 'timetable_id, student_id, date' : 'lecturer_id, date';
      const { error } = await supabase.from(table).upsert(recordsToUpsert, { onConflict: conflictKeys });
      
      if (error) {
        if (error.message.includes("conflict") || error.code === 'P0001' || error.code === '23505') {
          // Fallback: Delete existing for this context and re-insert
          if (activeTab === 'students') {
            await supabase.from(table).delete().eq('timetable_id', selectedTimetable).eq('date', date);
          } else {
            await supabase.from(table).delete().eq('date', date);
          }
          const { error: insertError } = await supabase.from(table).insert(recordsToUpsert);
          if (insertError) throw insertError;
        } else {
          throw error;
        }
      }

      if (activeTab === 'students') {
        const timetable = timetables.find(t => t.id === selectedTimetable);
        const moduleName = timetable?.module_name || timetable?.modules?.name || 'Unknown Module';
        
        // Handle Notifications
        const absentNotifications = recordsToUpsert
          .filter(rec => rec.status === 'absent')
          .map(rec => ({
            user_id: rec.student_id,
            title: 'Attendance Alert',
            message: `You have been marked absent for ${moduleName} on ${date}.`,
            is_read: false
          }));

        if (absentNotifications.length > 0) {
          await supabase.from('notifications').insert(absentNotifications);
        }
          
        // Automated Risk & Praise Notification Check
        const { data: admins } = await supabase.from('users').select('id, email').eq('role', 'admin');
        const adminIds = (admins || []).map(a => a.id);
        const adminEmails = (admins || []).map(a => a.email);
        
        for (let rec of recordsToUpsert) {
          // Check overall attendance
          const { data: attData } = await supabase.from('attendance').select('status').eq('student_id', rec.student_id);
          if (attData && attData.length > 0) {
            const presentCount = attData.filter(a => ['present', 'late'].includes(a.status)).length;
            const rate = Math.round((presentCount / attData.length) * 100);
            
            // Get student email for notifications
            let studentEmail = 'student@example.com';
            const { data: stuData } = await supabase.from('profiles').select('email, full_name').eq('id', rec.student_id).single();
            if (stuData && stuData.email) studentEmail = stuData.email;

            if (rate < 75 && rec.status === 'absent') {
              const adminAlerts = adminIds.map(adminId => ({
                user_id: adminId,
                title: 'High Risk Alert: Low Attendance',
                message: `A student's attendance has dropped to ${rate}% (High Risk).`,
                is_read: false
              }));
              if (adminAlerts.length > 0) {
                await supabase.from('notifications').insert(adminAlerts);
                // Dispatch emails to admins
                for (const email of adminEmails) {
                  await sendEmail({
                    to: email,
                    subject: 'High Risk Alert: Low Attendance',
                    body: `A student (${stuData?.full_name}) has an attendance rate of ${rate}%, which is below the 75% threshold. Please investigate.`
                  });
                }
              }
            } else if (rate === 100 && attData.length >= 3 && rec.status === 'present') {
              // Praise notification for perfect attendance
              await supabase.from('notifications').insert([{
                user_id: rec.student_id,
                title: 'Perfect Attendance! 🏆',
                message: `Great job! Your overall attendance is a perfect ${rate}%. Keep up the dedication!`,
                is_read: false
              }]);
              await sendEmail({
                to: studentEmail,
                subject: 'Perfect Attendance! 🏆',
                body: `Dear ${stuData?.full_name},\n\nGreat job! Your overall attendance is a perfect ${rate}%. Keep up the dedication and hard work!\n\nBest,\nAcademic System`
              });
            }
          }
        }
      }

      Swal.fire('Saved!', `${activeTab === 'students' ? 'Student' : 'Lecturer'} attendance has been saved.`, 'success');
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const stats = { present: 0, absent: 0, late: 0, excused: 0 };
    Object.values(attendanceData).forEach(status => {
      if (stats[status] !== undefined) stats[status]++;
    });
    return stats;
  };

  const stats = getStats();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Attendance Monitoring</h1>
        <button onClick={saveAttendance} disabled={loading || (activeTab === 'students' && !selectedTimetable)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center shadow-sm disabled:opacity-50">
          <Save className="w-4 h-4 mr-2" /> Save Attendance
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'students' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'}`}
        >
          Student Attendance
        </button>
        {!isLecturer && (
          <button
            onClick={() => setActiveTab('lecturers')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'lecturers' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'}`}
          >
            Lecturer (Daily)
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50" />
        </div>
        
        {/* Only show Timetable selector for Students */}
        {activeTab === 'students' ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Timetabled Session</label>
            <select value={selectedTimetable} onChange={(e) => setSelectedTimetable(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50">
              {timetables.length === 0 && <option value="">No classes scheduled on this date</option>}
              {timetables.map(t => (
                <option key={t.id} value={t.id}>
                  {t.module_name || t.modules?.name || 'Unknown Module'} ({t.start_time.substring(0, 5)} - {t.end_time.substring(0, 5)})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Session</label>
            <div className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-100 text-sm text-slate-500">
              Daily Attendance (Applies to the entire day)
            </div>
          </div>
        )}
      </div>

      {((activeTab === 'students' && selectedTimetable) || activeTab === 'lecturers') && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 flex items-center justify-between">
              <div><p className="text-xs font-medium text-emerald-600 mb-1">Present</p><p className="text-2xl font-bold text-emerald-700">{stats.present}</p></div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-red-100 bg-red-50/30 flex items-center justify-between">
              <div><p className="text-xs font-medium text-red-600 mb-1">Absent</p><p className="text-2xl font-bold text-red-700">{stats.absent}</p></div>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-orange-100 bg-orange-50/30 flex items-center justify-between">
              <div><p className="text-xs font-medium text-orange-600 mb-1">Late</p><p className="text-2xl font-bold text-orange-700">{stats.late}</p></div>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"><Clock className="w-5 h-5 text-orange-600" /></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-100 bg-blue-50/30 flex items-center justify-between">
              <div><p className="text-xs font-medium text-blue-600 mb-1">Excused</p><p className="text-2xl font-bold text-blue-700">{stats.excused}</p></div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><PlusCircle className="w-5 h-5 text-blue-600" /></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4 text-center">Present</th>
                    <th className="px-6 py-4 text-center">Absent</th>
                    <th className="px-6 py-4 text-center">Late</th>
                    <th className="px-6 py-4 text-center">Excused</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{record.full_name}</td>
                      <td className="px-6 py-4 text-center">
                        <input type="radio" checked={attendanceData[record.id] === 'present'} onChange={() => handleStatusChange(record.id, 'present')} className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input type="radio" checked={attendanceData[record.id] === 'absent'} onChange={() => handleStatusChange(record.id, 'absent')} className="w-4 h-4 text-red-600 border-slate-300 focus:ring-red-500 cursor-pointer" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input type="radio" checked={attendanceData[record.id] === 'late'} onChange={() => handleStatusChange(record.id, 'late')} className="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500 cursor-pointer" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input type="radio" checked={attendanceData[record.id] === 'excused'} onChange={() => handleStatusChange(record.id, 'excused')} className="w-4 h-4 text-blue-500 border-slate-300 focus:ring-blue-500 cursor-pointer" />
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                        {activeTab === 'students' ? 'No students enrolled in this module.' : 'No active lecturers found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAttendanceManagement;
