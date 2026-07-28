import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar as CalendarIcon, Clock, MapPin, Users, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';

const getLocalISODate = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const TimetableManagement = () => {
  const [timetables, setTimetables] = useState([]);
  const [courseModules, setCourseModules] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [lectureHalls, setLectureHalls] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    module_name: '',
    course_id: '',
    lecturer_id: '',
    lecture_hall_id: '',
    batch_id: '',
    specific_date: '',
    start_time: '',
    end_time: ''
  });
  const [editingId, setEditingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [timeRes, lectRes, hallRes, courseRes, batchRes, leaveRes, modulesRes] = await Promise.all([
        supabase.from('timetables').select(`
          *, 
          courses(name),
          batches(name),
          lecturer_profiles(profiles(full_name)),
          lecture_halls(name, capacity)
        `).order('start_time'),
        supabase.from('profiles').select('id, full_name').eq('role', 'lecturer'),
        supabase.from('lecture_halls').select('id, name, capacity'),
        supabase.from('courses').select('id, name').order('name'),
        supabase.from('batches').select('id, name, year').order('name'),
        supabase.from('leave_requests').select('*, profiles(full_name, role)').eq('status', 'approved'),
        supabase.from('course_modules').select('id, course_id, module_name, module_code').order('module_name')
      ]);

      // Fallback for lecture_halls if table doesn't exist yet
      if (hallRes.error && hallRes.error.code !== '42P01') {
        console.error('Error fetching lecture halls:', hallRes.error);
      } else if (hallRes.data) {
        setLectureHalls(hallRes.data);
      }

      if (timeRes.data) setTimetables(timeRes.data);
      if (lectRes.data) setLecturers(lectRes.data);
      if (courseRes.data) setCourses(courseRes.data);
      if (batchRes?.data) setBatches(batchRes.data);
      if (leaveRes.data) setApprovedLeaves(leaveRes.data.filter(l => l.profiles?.role === 'lecturer'));
      if (modulesRes.data) setCourseModules(modulesRes.data);
    } catch (error) {
      console.error("Error fetching timetable data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'course_id' ? { module_name: '' } : {})
    }));
  };

  const openModal = (item = null, defaultDate = null) => {
    const todayStr = getLocalISODate(new Date());
    let targetDateStr = '';

    if (item) {
      targetDateStr = item.specific_date || '';
    } else {
      targetDateStr = defaultDate ? getLocalISODate(defaultDate) : (selectedDate ? getLocalISODate(selectedDate) : '');
    }

    if (targetDateStr && targetDateStr < todayStr) {
      Swal.fire('Invalid Date', 'You cannot schedule or edit classes for past dates.', 'warning');
      return;
    }

    if (item) {
      setFormData({
        module_name: item.module_name || item.modules?.name || '',
        course_id: item.course_id || '',
        lecturer_id: item.lecturer_id || '',
        lecture_hall_id: item.lecture_hall_id || '',
        batch_id: item.batch_id || '',
        specific_date: targetDateStr,
        start_time: item.start_time || '',
        end_time: item.end_time || ''
      });
      setEditingId(item.id);
    } else {
      setFormData({
        module_name: '',
        course_id: '',
        lecturer_id: '',
        lecture_hall_id: '',
        batch_id: '',
        specific_date: targetDateStr,
        start_time: '',
        end_time: ''
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const checkTimeOverlap = (start1, end1, start2, end2) => {
    if (!start1 || !end1 || !start2 || !end2) return false;

    const s1 = timeToMinutes(start1);
    let e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    let e2 = timeToMinutes(end2);

    // If end time is 00:00 (midnight), treat it as 24:00 for the overlap check
    if (e1 === 0) e1 = 24 * 60;
    if (e2 === 0) e2 = 24 * 60;

    return (s1 < e2 && e1 > s2);
  };

  const hasHallConflict = (hallId, date, startTime, endTime, excludeId) => {
    if (!hallId || !date || !startTime || !endTime) return false;
    return timetables.some(t =>
      t.lecture_hall_id?.toString() === hallId?.toString() &&
      t.specific_date === date &&
      t.id !== excludeId &&
      checkTimeOverlap(t.start_time, t.end_time, startTime, endTime)
    );
  };

  const hasBatchConflict = (batchId, date, startTime, endTime, excludeId) => {
    if (!batchId || !date || !startTime || !endTime) return false;
    return timetables.some(t =>
      t.batch_id?.toString() === batchId?.toString() &&
      t.specific_date === date &&
      t.id !== excludeId &&
      checkTimeOverlap(t.start_time, t.end_time, startTime, endTime)
    );
  };

  const hasLecturerConflict = (lecturerId, date, startTime, endTime, excludeId) => {
    if (!lecturerId || !date || !startTime || !endTime) return false;
    return timetables.some(t =>
      t.lecturer_id?.toString() === lecturerId?.toString() &&
      t.specific_date === date &&
      t.id !== excludeId &&
      checkTimeOverlap(t.start_time, t.end_time, startTime, endTime)
    );
  };

  const isLecturerOnLeave = (lecturerId, date) => {
    if (!lecturerId || !date) return false;
    return approvedLeaves.some(l =>
      (l.user_id?.toString() === lecturerId?.toString() || l.profile_id?.toString() === lecturerId?.toString() || l.staff_id?.toString() === lecturerId?.toString()) &&
      date >= l.start_date && date <= l.end_date
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate past dates
    const todayDateString = getLocalISODate(new Date());
    if (formData.specific_date < todayDateString) {
      return Swal.fire('Invalid Date', 'You cannot schedule or update classes for past dates.', 'error');
    }

    // Validate times
    let formStartMins = timeToMinutes(formData.start_time);
    let formEndMins = timeToMinutes(formData.end_time);
    if (formEndMins === 0) formEndMins = 24 * 60; // Treat 00:00 as midnight end of day

    if (formEndMins <= formStartMins) {
      return Swal.fire('Invalid Time', 'End time must be after start time.', 'error');
    }

    // Validate conflicts before submitting
    if (hasHallConflict(formData.lecture_hall_id, formData.specific_date, formData.start_time, formData.end_time, editingId)) {
      return Swal.fire('Conflict Detected', 'The selected lecture hall is already booked for another class during this time.', 'error');
    }

    if (hasBatchConflict(formData.batch_id, formData.specific_date, formData.start_time, formData.end_time, editingId)) {
      return Swal.fire('Conflict Detected', 'The selected batch already has a class scheduled during this time.', 'error');
    }

    if (hasLecturerConflict(formData.lecturer_id, formData.specific_date, formData.start_time, formData.end_time, editingId)) {
      return Swal.fire('Conflict Detected', 'The selected lecturer is already scheduled for another class during this time.', 'error');
    }

    if (isLecturerOnLeave(formData.lecturer_id, formData.specific_date)) {
      return Swal.fire('Lecturer Unavailable', 'The selected lecturer is on leave on this date.', 'error');
    }

    try {
      // Create a payload that ignores fields if they are empty and column might not exist (defensive)
      const payload = { ...formData };

      // We assume the SQL has been run by the user, so lecture_hall_id and batch_id and specific_date are valid
      if (!payload.lecture_hall_id) payload.lecture_hall_id = null;
      if (!payload.lecturer_id) payload.lecturer_id = null;
      if (!payload.course_id) payload.course_id = null;
      if (!payload.batch_id) payload.batch_id = null;

      // Add a fallback day_of_week just in case the db still requires it or it's NOT NULL
      if (payload.specific_date) {
        const dateObj = new Date(payload.specific_date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        payload.day_of_week = days[dateObj.getDay()];
      }

      if (editingId) {
        const { error } = await supabase.from('timetables').update(payload).eq('id', editingId);
        if (error) throw error;
        Swal.fire('Updated!', 'Timetable entry updated successfully.', 'success');
      } else {
        const { error } = await supabase.from('timetables').insert([payload]);
        if (error) throw error;
        Swal.fire('Added!', 'Timetable entry added successfully.', 'success');
      }

      // Notify students in the batch
      if (payload.batch_id) {
        const { data: students } = await supabase.from('student_profiles').select('user_id').eq('batch_id', payload.batch_id);
        if (students && students.length > 0) {
            const notifications = students.map(s => ({
                user_id: s.user_id,
                title: 'Timetable Updated',
                message: `A class for ${payload.module_name || 'your course'} has been scheduled on ${payload.specific_date} at ${payload.start_time}.`,
                is_read: false
            }));
            await supabase.from('notifications').insert(notifications);
        }
      }

      // Trigger email notification quietly in the background
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      fetch(`${apiUrl}/api/email/notify-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(e => console.error('Failed to trigger email:', e));

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase.from('timetables').delete().eq('id', id);
        if (error) throw error;
        Swal.fire('Deleted!', 'Timetable entry has been deleted.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5); // 09:00:00 -> 09:00
  };

  // --- Calendar Logic ---
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Headers
    const headers = weekDays.map(day => (
      <div key={day} className="text-center font-semibold text-slate-500 py-2 text-sm uppercase">{day}</div>
    ));

    // Empty slots before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border border-transparent"></div>);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateString = getLocalISODate(date);
      const isSelected = selectedDate && getLocalISODate(selectedDate) === dateString;
      const isToday = getLocalISODate(new Date()) === dateString;

      // Check if there are any classes on this day
      const dayClasses = timetables.filter(t => t.specific_date === dateString);
      const hasClasses = dayClasses.length > 0;

      days.push(
        <div
          key={d}
          onClick={() => setSelectedDate(date)}
          className={`min-h-[80px] p-2 border border-slate-100 cursor-pointer transition-all hover:bg-blue-50 relative group
            ${isSelected ? 'bg-blue-50 border-blue-200 shadow-inner' : 'bg-white'}
          `}
        >
          <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
            ${isToday ? 'bg-blue-600 text-white' : (isSelected ? 'text-blue-700' : 'text-slate-700')}
          `}>
            {d}
          </span>
          {hasClasses && (
            <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1">
              <div className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded truncate font-medium">
                {dayClasses.length} Class{dayClasses.length > 1 ? 'es' : ''}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex space-x-2">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-medium hover:bg-slate-100 rounded-lg transition-colors">Today</button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {headers}
        </div>
        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>
    );
  };

  // --- Daily Schedule View ---
  const renderDailySchedule = () => {
    if (!selectedDate) return null;

    const dateString = getLocalISODate(selectedDate);
    const dayClasses = timetables.filter(t => t.specific_date === dateString);

    // Calculate Free Lecture Halls (Basic logic: if a hall is not in dayClasses during standard hours, it's free. 
    // For simplicity, we just list all halls and mark them "Occupied" or "Free" based on any class today, 
    // or better, list the exact occupied times).

    return (
      <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Schedule for {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <p className="text-sm text-slate-500 mt-1">{dayClasses.length} classes scheduled today</p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => openModal(null, selectedDate)} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium">
              <Plus className="w-4 h-4 mr-2" /> Add Class
            </button>
            <button onClick={() => setSelectedDate(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Classes Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-semibold text-slate-700 flex items-center mb-4">
              <Clock className="w-4 h-4 mr-2" /> Today's Classes
            </h4>

            {dayClasses.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500">No classes scheduled for this date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayClasses.map(cls => (
                  <div key={cls.id} className="flex p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow bg-white group">
                    <div className="w-24 shrink-0 flex flex-col justify-center border-r border-slate-100 pr-4">
                      <span className="font-bold text-slate-800">{formatTime(cls.start_time)}</span>
                      <span className="text-sm text-slate-500">{formatTime(cls.end_time)}</span>
                    </div>
                    <div className="pl-4 flex-1">
                      <div className="flex justify-between items-start">
                        <h5 className="font-bold text-blue-700">{cls.module_name || cls.modules?.name || 'Unknown Module'}</h5>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal(cls)} className="p-1 text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(cls.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-600">
                        <div className="flex items-center"><Users className="w-4 h-4 mr-1.5 text-slate-400" /> Batch: {cls.batches?.name || cls.batch_name || 'N/A'}</div>
                        <div className="flex items-center"><MapPin className="w-4 h-4 mr-1.5 text-slate-400" /> {cls.lecture_halls?.name || cls.room || 'N/A'}</div>
                        <div className="col-span-2 flex items-center text-xs text-slate-500 mt-1">
                          Lecturer: {cls.lecturer_profiles?.profiles?.full_name || 'Unknown'} &bull; Course: {cls.courses?.name || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lecture Hall Availability */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h4 className="font-semibold text-slate-700 flex items-center mb-4">
              <MapPin className="w-4 h-4 mr-2" /> Lecture Hall Status
            </h4>
            <div className="space-y-3">
              {lectureHalls.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No lecture halls configured.</p>
              ) : (
                lectureHalls.map(hall => {
                  // Find if hall is occupied today
                  const occupiedClasses = dayClasses.filter(c => c.lecture_hall_id === hall.id);
                  const isOccupied = occupiedClasses.length > 0;

                  return (
                    <div key={hall.id} className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-slate-800">{hall.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isOccupied ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {isOccupied ? 'Has Classes' : 'Free All Day'}
                        </span>
                      </div>
                      {isOccupied && (
                        <div className="text-xs text-slate-500 space-y-1 mt-2 border-t border-slate-50 pt-2">
                          <p className="font-medium text-slate-600 mb-1">Occupied Times:</p>
                          {occupiedClasses.map((c, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{formatTime(c.start_time)} - {formatTime(c.end_time)}</span>
                              <span className="text-slate-400">{c.batches?.name || c.batch_name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Timetable Management</h1>
        <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Add Session
        </button>
      </div>

      {/* Calendar Section */}
      {renderCalendar()}

      {/* Daily Details Section */}
      {renderDailySchedule()}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm overflow-y-auto py-10">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-xl animate-in zoom-in-95 duration-200 flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-800 mb-6">{editingId ? 'Edit Session' : 'Add Session'}</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700">Course</label>
                    <select required name="course_id" value={formData.course_id} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all">
                      <option value="">Select Course...</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700">Module</label>
                    <select required name="module_name" value={formData.module_name} onChange={handleInputChange} disabled={!formData.course_id} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:opacity-50">
                      <option value="">Select Module...</option>
                      {courseModules.filter(m => m.course_id === formData.course_id).map(m => (
                        <option key={m.id} value={m.module_name}>{m.module_name} ({m.module_code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700">Lecturer</label>
                    <select required name="lecturer_id" value={formData.lecturer_id} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all">
                      <option value="">Select Lecturer...</option>
                      {lecturers.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700">Date</label>
                    <input required type="date" name="specific_date" min={getLocalISODate(new Date())} value={formData.specific_date} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700">Batch Name</label>
                    <select required name="batch_id" value={formData.batch_id} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all">
                      <option value="">Select Batch...</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.year})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700">Start Time</label>
                    <input required type="time" name="start_time" value={formData.start_time} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700">End Time</label>
                    <input required type="time" name="end_time" value={formData.end_time} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1.5 text-slate-700">Lecture Hall</label>
                    <select required name="lecture_hall_id" value={formData.lecture_hall_id} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all">
                      <option value="">Select Lecture Hall...</option>
                      {lectureHalls.map(h => <option key={h.id} value={h.id}>{h.name} (Cap: {h.capacity})</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm">Save Session</button>
                </div>
              </form>
            </div>

            {/* Availability Overview Sidebar */}
            <div className="w-full md:w-80 bg-slate-50 rounded-xl p-5 border border-slate-100 h-fit space-y-6">
              <h3 className="font-bold text-slate-800 flex items-center border-b border-slate-200 pb-2">
                <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" /> Availability Check
              </h3>

              {formData.specific_date && formData.start_time && formData.end_time ? (
                <>
                  {/* Free Halls */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Free Lecture Halls
                    </h4>
                    <div className="text-xs space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                      {lectureHalls.filter(hall => !hasHallConflict(hall.id, formData.specific_date, formData.start_time, formData.end_time, editingId)).length > 0 ? (
                        lectureHalls.filter(hall => !hasHallConflict(hall.id, formData.specific_date, formData.start_time, formData.end_time, editingId)).map(h => (
                          <div key={h.id} className="bg-emerald-50 text-emerald-700 px-2 py-1.5 rounded flex justify-between items-center border border-emerald-100">
                            <span className="font-medium">{h.name}</span>
                            <span>Cap: {h.capacity}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 italic p-2 bg-white rounded border border-slate-100">No halls available</div>
                      )}
                    </div>
                  </div>

                  {/* Free Batches */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                      <Users className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Available Batches
                    </h4>
                    <div className="text-xs space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                      {batches.filter(batch => !hasBatchConflict(batch.id, formData.specific_date, formData.start_time, formData.end_time, editingId)).length > 0 ? (
                        batches.filter(batch => !hasBatchConflict(batch.id, formData.specific_date, formData.start_time, formData.end_time, editingId)).map(b => (
                          <div key={b.id} className="bg-emerald-50 text-emerald-700 px-2 py-1.5 rounded border border-emerald-100">
                            <span className="font-medium">{b.name}</span> ({b.year})
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 italic p-2 bg-white rounded border border-slate-100">No batches available</div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-500 p-4 bg-white rounded-lg border border-slate-100 text-center">
                  Select a date, start time, and end time to view availability.
                </div>
              )}

              {/* Lecturers on Leave */}
              {formData.specific_date && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    <X className="w-3.5 h-3.5 mr-1.5 text-red-600" /> Lecturers on Leave
                  </h4>
                  <div className="text-xs space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                    {approvedLeaves.filter(leave => {
                      return formData.specific_date >= leave.start_date && formData.specific_date <= leave.end_date;
                    }).length > 0 ? (
                      approvedLeaves.filter(leave => {
                        return formData.specific_date >= leave.start_date && formData.specific_date <= leave.end_date;
                      }).map(l => (
                        <div key={l.id} className="bg-red-50 text-red-700 px-2 py-1.5 rounded border border-red-100">
                          {l.profiles?.full_name || 'Unknown'} ({l.type})
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 italic p-2 bg-white rounded border border-slate-100">No lecturers on leave today</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableManagement;
