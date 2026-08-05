import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import Layout from './components/common/Layout';

// Auth Pages
import Login from './pages/auth/Login';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import LecturerManagement from './pages/admin/LecturerManagement';
import CourseManagement from './pages/admin/CourseManagement';
import CourseModules from './pages/admin/CourseModules';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import LectureHallManagement from './pages/admin/LectureHallManagement';
import BatchManagement from './pages/admin/BatchManagement';
import TimetableManagement from './pages/admin/TimetableManagement';
import EventManagement from './pages/admin/EventManagement';
import AssignmentManagement from './pages/admin/AssignmentManagement';
import QuizExamManagement from './pages/admin/QuizExamManagement';
import AdminExamResults from './pages/admin/AdminExamResults';
import Reports from './pages/admin/Reports';
import Notifications from './pages/admin/Notifications';
import Settings from './pages/admin/Settings';
import AdminLeaveManagement from './pages/admin/AdminLeaveManagement';
import AdminAttendanceManagement from './pages/admin/AdminAttendanceManagement';
import AdminFeedbackManagement from './pages/admin/AdminFeedbackManagement';
import AdminMessages from './pages/admin/AdminMessages';

// Lecturer Pages
import LecturerDashboard from './pages/lecturer/LecturerDashboard';
import RiskAndAnalysis from './pages/lecturer/RiskAndAnalysis';
import LeaveManagement from './pages/lecturer/LeaveManagement';
import Messages from './pages/lecturer/Messages';
import LecturerReports from './pages/lecturer/LecturerReports';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentAssessments from './pages/student/StudentAssessments';
import StudentProgress from './pages/student/StudentProgress';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentMessages from './pages/student/StudentMessages';
import StudentNotifications from './pages/student/StudentNotifications';
import StudentSettings from './pages/student/StudentSettings';
import StudentLeaveManagement from './pages/student/StudentLeaveManagement';

// Common Pages
import FeedbackSubmission from './pages/common/FeedbackSubmission';
import UserNotifications from './pages/common/UserNotifications';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Layout role="admin" /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="lecturers" element={<LecturerManagement />} />
            <Route path="departments" element={<DepartmentManagement />} />
            <Route path="lecture-halls" element={<LectureHallManagement />} />
            <Route path="batches" element={<BatchManagement />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="course-modules" element={<CourseModules />} />
            <Route path="timetable" element={<TimetableManagement />} />
            <Route path="events" element={<EventManagement />} />
            <Route path="assignments" element={<AssignmentManagement />} />
            <Route path="quizzes" element={<QuizExamManagement />} />
            <Route path="exam-results" element={<AdminExamResults />} />
            <Route path="risk-analysis" element={<RiskAndAnalysis />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="leaves" element={<AdminLeaveManagement />} />
            <Route path="attendance" element={<AdminAttendanceManagement />} />
            <Route path="feedback" element={<AdminFeedbackManagement />} />
            <Route path="messages" element={<AdminMessages />} />
          </Route>

          {/* Lecturer Routes */}
          <Route path="/lecturer" element={<ProtectedRoute allowedRoles={['lecturer']}><Layout role="lecturer" /></ProtectedRoute>}>
            <Route index element={<LecturerDashboard />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="attendance" element={<AdminAttendanceManagement />} />
            <Route path="assignments" element={<AssignmentManagement />} />
            <Route path="quizzes" element={<QuizExamManagement />} />
            <Route path="risk-analysis" element={<RiskAndAnalysis />} />
            <Route path="leave" element={<LeaveManagement />} />
            <Route path="messages" element={<Messages />} />
            <Route path="feedback" element={<FeedbackSubmission />} />
            <Route path="notifications" element={<UserNotifications />} />
            <Route path="reports" element={<LecturerReports />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><Layout role="student" /></ProtectedRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="assignments" element={<StudentAssignments />} />
            <Route path="assessments" element={<StudentAssessments />} />
            <Route path="progress" element={<StudentProgress />} />
            <Route path="timetable" element={<StudentTimetable />} />
            <Route path="messages" element={<StudentMessages />} />
            <Route path="feedback" element={<FeedbackSubmission />} />
            <Route path="notifications" element={<UserNotifications />} />
            <Route path="settings" element={<StudentSettings />} />
            <Route path="leave" element={<StudentLeaveManagement />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
