import React, { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle, XCircle, Clock, PlusCircle, Search, Save, User, Calendar, BookOpen } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('all');

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

  // Fetch all batches for filtering
  useEffect(() => {
    const fetchBatches = async () => {
      const { data } = await supabase.from('batches').select('id, name').order('name');
      setBatches(data || []);
    };
    fetchBatches();
  }, []);

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
          .select('id, full_name, student_profiles!inner(course_id, batch_id)')
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
            timetable_id: null,
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

      const conflictKeys = activeTab === 'students' ? 'timetable_id, student_id, date' : 'lecturer_id, date';
      const { error } = await supabase.from(table).upsert(recordsToUpsert, { onConflict: conflictKeys });

      if (error) {
        if (error.message.includes("conflict") || error.code === 'P0001' || error.code === '23505') {
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
          const { data: attData } = await supabase.from('attendance').select('status').eq('student_id', rec.student_id);
          if (attData && attData.length > 0) {
            const presentCount = attData.filter(a => ['present', 'late'].includes(a.status)).length;
            const rate = Math.round((presentCount / attData.length) * 100);

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
                for (const email of adminEmails) {
                  await sendEmail({
                    to: email,
                    subject: 'High Risk Alert: Low Attendance',
                    body: `A student (${stuData?.full_name}) has an attendance rate of ${rate}%, which is below the 75% threshold. Please investigate.`
                  });
                }
              }
            } else if (rate === 100 && attData.length >= 3 && rec.status === 'present') {
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

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.full_name.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesBatch = true;
    if (activeTab === 'students' && selectedBatch !== 'all') {
      const studentProfile = Array.isArray(record.student_profiles) ? record.student_profiles[0] : record.student_profiles;
      if (studentProfile?.batch_id !== selectedBatch) {
        matchesBatch = false;
      }
    }

    return matchesSearch && matchesBatch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-white">
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <CalendarDays className="w-8 h-8 mr-3 opacity-90" />
              Attendance Monitoring
            </h1>
            <p className="text-blue-100 opacity-90 max-w-lg">Track, manage, and monitor attendance records seamlessly. Mark status for students or lecturers.</p>
          </div>

          <button 
            onClick={saveAttendance} 
            disabled={loading || (activeTab === 'students' && !selectedTimetable)} 
            className="self-start md:self-center px-6 py-3 bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-all font-semibold flex items-center shadow-md disabled:opacity-70"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-2"></div>
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Save Attendance
          </button>
        </div>
      </div>

      {/* Controls & Selectors */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">

        {/* Tabs */}
        <div className="flex flex-wrap space-x-2 bg-slate-100 p-1.5 rounded-xl w-fit mb-6">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'students' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            Student Attendance
          </button>
          {!isLecturer && (
            <button
              onClick={() => setActiveTab('lecturers')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'lecturers' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              Lecturer (Daily)
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center">
              <Calendar className="w-4 h-4 mr-1.5 text-blue-500" /> Select Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 bg-slate-50 transition-all outline-none"
            />
          </div>

          {activeTab === 'students' ? (
            <>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center">
                  <BookOpen className="w-4 h-4 mr-1.5 text-blue-500" /> Timetabled Session
                </label>
                <div className="relative">
                  <select
                    value={selectedTimetable}
                    onChange={(e) => setSelectedTimetable(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 bg-slate-50 transition-all outline-none appearance-none cursor-pointer"
                  >
                    {timetables.length === 0 && <option value="">No classes scheduled on this date</option>}
                    {timetables.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.module_name || t.modules?.name || 'Unknown Module'} ({t.start_time.substring(0, 5)} - {t.end_time.substring(0, 5)})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center">
                  <User className="w-4 h-4 mr-1.5 text-blue-500" /> Filter by Batch
                </label>
                <div className="relative">
                  <select
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 bg-slate-50 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="all">All Batches</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2 lg:col-span-3">
              <label className="text-sm font-semibold text-slate-400">Session Type</label>
              <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 flex items-center">
                <Clock className="w-4 h-4 mr-2" /> Daily Attendance (Applies to the entire day)
              </div>
            </div>
          )}
        </div>
      </div>

      {((activeTab === 'students' && selectedTimetable) || activeTab === 'lecturers') && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl text-white shadow-md relative overflow-hidden group">
              <div className="absolute right-0 top-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-emerald-100 font-medium">Present</p>
                  <CheckCircle className="w-6 h-6 text-emerald-100 opacity-80" />
                </div>
                <h3 className="text-4xl font-bold">{stats.present}</h3>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-rose-600 p-5 rounded-2xl text-white shadow-md relative overflow-hidden group">
              <div className="absolute right-0 top-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-red-100 font-medium">Absent</p>
                  <XCircle className="w-6 h-6 text-red-100 opacity-80" />
                </div>
                <h3 className="text-4xl font-bold">{stats.absent}</h3>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-400 to-amber-500 p-5 rounded-2xl text-white shadow-md relative overflow-hidden group">
              <div className="absolute right-0 top-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-orange-100 font-medium">Late</p>
                  <Clock className="w-6 h-6 text-orange-100 opacity-80" />
                </div>
                <h3 className="text-4xl font-bold">{stats.late}</h3>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-400 to-sky-500 p-5 rounded-2xl text-white shadow-md relative overflow-hidden group">
              <div className="absolute right-0 top-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-blue-100 font-medium">Excused</p>
                  <PlusCircle className="w-6 h-6 text-blue-100 opacity-80" />
                </div>
                <h3 className="text-4xl font-bold">{stats.excused}</h3>
              </div>
            </div>
          </div>

          {/* Attendance List Area */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="font-bold text-lg text-slate-800">
                {activeTab === 'students' ? 'Student List' : 'Lecturer List'}
                <span className="ml-2 inline-flex items-center justify-center bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  {filteredRecords.length}
                </span>
              </h2>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredRecords.map((record) => {
                const status = attendanceData[record.id];
                return (
                  <div key={record.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">

                    {/* User Info */}
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-inner">
                        {getInitials(record.full_name)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">{record.full_name}</h4>
                        <p className="text-xs text-slate-500 flex items-center mt-0.5">
                          <User className="w-3 h-3 mr-1" /> {activeTab === 'students' ? 'Student' : 'Lecturer'}
                        </p>
                      </div>
                    </div>

                    {/* Modern Segmented Control for Attendance */}
                    <div className="flex items-center p-1 bg-slate-100 rounded-xl shadow-inner ml-0 lg:ml-auto overflow-x-auto">
                      <button
                        onClick={() => handleStatusChange(record.id, 'present')}
                        className={`flex-1 lg:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center whitespace-nowrap ${status === 'present'
                            ? 'bg-emerald-500 text-white shadow-md transform scale-100'
                            : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-700 scale-95'
                          }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(record.id, 'absent')}
                        className={`flex-1 lg:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center whitespace-nowrap ${status === 'absent'
                            ? 'bg-red-500 text-white shadow-md transform scale-100'
                            : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-700 scale-95'
                          }`}
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => handleStatusChange(record.id, 'late')}
                        className={`flex-1 lg:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center whitespace-nowrap ${status === 'late'
                            ? 'bg-orange-500 text-white shadow-md transform scale-100'
                            : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-700 scale-95'
                          }`}
                      >
                        Late
                      </button>
                      <button
                        onClick={() => handleStatusChange(record.id, 'excused')}
                        className={`flex-1 lg:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center whitespace-nowrap ${status === 'excused'
                            ? 'bg-blue-500 text-white shadow-md transform scale-100'
                            : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-700 scale-95'
                          }`}
                      >
                        Excused
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredRecords.length === 0 && (
                <div className="py-16 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <User className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-1">No records found</h3>
                  <p className="text-slate-500 text-sm">
                    {searchQuery
                      ? "Try adjusting your search criteria."
                      : (activeTab === 'students' ? 'No students enrolled in this module.' : 'No active lecturers found.')
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAttendanceManagement;
