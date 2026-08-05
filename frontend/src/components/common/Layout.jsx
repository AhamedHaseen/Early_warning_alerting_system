import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut,
  Bell,
  Search,
  AlertTriangle,
  Building2,
  Calendar,
  CalendarDays,
  FileText,
  HelpCircle,
  FileBarChart,
  PieChart,
  MessageSquare,
  Activity,
  UserPlus,
  Layers,
  BookMarked,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import AdminChatbot from '../admin/AdminChatbot';
import Swal from 'sweetalert2';

const Layout = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Fetch initial unread notifications count
    const fetchUnreadNotifications = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .eq('is_read', false);
      if (!error && count !== null) {
        setUnreadNotifications(count);
      }
    };
    
    // Fetch initial unread messages count
    const fetchUnreadMessages = async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      if (!error && count !== null) {
        setUnreadMessages(count);
      }
    };
    
    fetchUnreadNotifications();
    fetchUnreadMessages();

    const messageSubscription = supabase
      .channel('layout_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, payload => {
        // If a new message arrives, fetch the count again to be safe, or just increment
        setUnreadMessages(prev => prev + 1);
        
        // Let's fetch the sender's profile to show a nice toast
        supabase.from('profiles').select('full_name').eq('id', payload.new.sender_id).single().then(({ data }) => {
          const senderName = data?.full_name || 'Someone';
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          
          Toast.fire({
            icon: 'info',
            title: `New Message from ${senderName}`
          });
        });
      })
      .subscribe();

    const notifSubscription = supabase
      .channel('layout_notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications'
      }, payload => {
        if (payload.new.user_id === user.id || payload.new.user_id === null) {
          setUnreadNotifications(prev => prev + 1);
          
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          
          Toast.fire({
            icon: 'info',
            title: payload.new.title || 'New Notification'
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
      supabase.removeChannel(notifSubscription);
    };
  }, [user]);

  // Reset unread count when visiting the respective pages
  useEffect(() => {
    if (location.pathname.includes('/messages')) {
      setUnreadMessages(0);
    }
    if (location.pathname.includes('/notifications')) {
      setUnreadNotifications(0);
    }
  }, [location.pathname]);

  const getNavItems = () => {
    switch(role) {
      case 'admin':
        return [
          { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
          { name: 'Students', icon: Users, path: '/admin/students' },
          { name: 'Lecturers', icon: Users, path: '/admin/lecturers' },
          { name: 'Attendance', icon: CalendarDays, path: '/admin/attendance' },
          { name: 'Departments', icon: Building2, path: '/admin/departments' },
          { name: 'Lecture Halls', icon: Building2, path: '/admin/lecture-halls' },
          { name: 'Courses', icon: BookOpen, path: '/admin/courses' },
          { name: 'Course Modules', icon: BookMarked, path: '/admin/course-modules' },
          { name: 'Batches', icon: Layers, path: '/admin/batches' },
          { name: 'Timetable', icon: Calendar, path: '/admin/timetable' },
          { name: 'Events', icon: CalendarDays, path: '/admin/events' },
          { name: 'Assignments', icon: FileText, path: '/admin/assignments' },
          { name: 'Quizzes & Exams', icon: HelpCircle, path: '/admin/quizzes' },
          { name: 'Exam Results', icon: Award, path: '/admin/exam-results' },
          { name: 'Risk & Analysis', icon: Activity, path: '/admin/risk-analysis' },
          { name: 'Leave Requests', icon: CalendarDays, path: '/admin/leaves' },
          { name: 'Messages', icon: MessageSquare, path: '/admin/messages' },
          { name: 'Feedback & Complaints', icon: MessageSquare, path: '/admin/feedback' },
          { name: 'Notifications', icon: Bell, path: '/admin/notifications' },
          { name: 'Settings', icon: Settings, path: '/admin/settings' },
        ];
      case 'lecturer':
        return [
          { name: 'Dashboard', icon: LayoutDashboard, path: '/lecturer' },
          { name: 'Students', icon: Users, path: '/lecturer/students' },
          { name: 'Attendance', icon: Users, path: '/lecturer/attendance' },
          { name: 'Assignments', icon: BookOpen, path: '/lecturer/assignments' },
          { name: 'Quizzes & Exams', icon: HelpCircle, path: '/lecturer/quizzes' },
          { name: 'Risk & Analysis', icon: Activity, path: '/lecturer/risk-analysis' },
          { name: 'Leave Management', icon: CalendarDays, path: '/lecturer/leave' },
          { name: 'Messages', icon: MessageSquare, path: '/lecturer/messages' },
          { name: 'Feedback & Complaints', icon: AlertTriangle, path: '/lecturer/feedback' },
          { name: 'Reports', icon: FileBarChart, path: '/lecturer/reports' },
          { name: 'Notifications', icon: Bell, path: '/lecturer/notifications' },
        ];
      case 'student':
        return [
          { name: 'Dashboard', icon: LayoutDashboard, path: '/student' },
          { name: 'Attendance', icon: CalendarDays, path: '/student/attendance' },
          { name: 'Assignments', icon: BookOpen, path: '/student/assignments' },
          { name: 'Results', icon: Award, path: '/student/assessments' },
          { name: 'Progress & Risk', icon: Activity, path: '/student/progress' },
          { name: 'Timetable & Events', icon: Calendar, path: '/student/timetable' },
          { name: 'Messages', icon: MessageSquare, path: '/student/messages' },
          { name: 'Feedback & Complaints', icon: AlertTriangle, path: '/student/feedback' },
          { name: 'Leave Management', icon: CalendarDays, path: '/student/leave' },
          { name: 'Notifications', icon: Bell, path: '/student/notifications' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10">
        <div className="min-h-[4rem] flex items-center px-6 border-b border-slate-200 py-3">
          <div className="flex flex-col">
            <span className="text-[1.1rem] leading-tight font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Early Warning
            </span>
            <span className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-400 font-bold mt-0.5">
              Academic System
            </span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            
            let badge = null;
            if (item.name === 'Messages' && unreadMessages > 0) {
              badge = <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadMessages}</span>;
            } else if (item.name === 'Notifications' && unreadNotifications > 0) {
              badge = <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadNotifications}</span>;
            }

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.name}
                {badge}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button 
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="flex items-center w-full px-3 py-2.5 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 text-slate-400 group-hover:text-red-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center w-96">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100/50 border-transparent rounded-full focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={() => navigate(`/${role}/notifications`)} className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                  {unreadNotifications}
                </span>
              )}
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center font-medium text-sm">
              {role.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </main>

      {/* Admin Chatbot Floating Widget */}
      {role === 'admin' && <AdminChatbot />}
    </div>
  );
};

export default Layout;
