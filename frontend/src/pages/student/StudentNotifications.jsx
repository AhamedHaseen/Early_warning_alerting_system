import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, BookOpen, CalendarDays, Activity, Settings, Calendar, Filter, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';

const StudentNotifications = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [dbNotifications, setDbNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setDbNotifications(data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      setDbNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const getAlertStyle = (title) => {
    if (!title) return { type: 'info', icon: 'Bell', colorClass: 'text-blue-500 bg-blue-50 border-blue-100' };
    const t = title.toLowerCase();
    
    if (t.includes('warning') || t.includes('absence') || t.includes('critical') || t.includes('risk')) {
      return { type: 'error', icon: 'AlertTriangle', colorClass: 'text-red-500 bg-red-50 border-red-100' };
    }
    if (t.includes('deadline')) {
      return { type: 'warning', icon: 'AlertCircle', colorClass: 'text-orange-500 bg-orange-50 border-orange-100' };
    }
    if (t.includes('leave') || t.includes('approved')) {
      return { type: 'success', icon: 'CheckCircle', colorClass: 'text-emerald-500 bg-emerald-50 border-emerald-100' };
    }
    if (t.includes('assignment')) {
      return { type: 'info', icon: 'BookOpen', colorClass: 'text-blue-500 bg-blue-50 border-blue-100' };
    }
    if (t.includes('timetable') || t.includes('event')) {
      return { type: 'info', icon: 'CalendarDays', colorClass: 'text-purple-500 bg-purple-50 border-purple-100' };
    }
    return { type: 'info', icon: 'Bell', colorClass: 'text-blue-500 bg-blue-50 border-blue-100' };
  };

  const processedNotifications = dbNotifications.map(n => ({
    ...n,
    style: getAlertStyle(n.title)
  }));

  const filteredNotifications = processedNotifications.filter(n => filter === 'all' || n.style.type === filter);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <Bell className="w-6 h-6 mr-3 text-blue-600" /> Notifications
        </h1>
        <div className="flex space-x-3">
          <button onClick={markAllAsRead} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center shadow-sm">
            <CheckCircle className="w-4 h-4 mr-2" /> Mark all as read
          </button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center shadow-sm">
            <Settings className="w-4 h-4 mr-2" /> Preferences
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'info', 'warning', 'success', 'error'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
              filter === type 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : filteredNotifications.map(notification => {
          const style = notification.style;
          return (
            <div 
              key={notification.id} 
              className={`bg-white rounded-2xl border ${notification.is_read ? 'border-slate-100' : 'border-blue-200 shadow-sm'} p-5 flex items-start space-x-4 transition-all hover:shadow-md cursor-pointer group`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.colorClass}`}>
                {style.icon === 'AlertTriangle' ? <AlertTriangle className="w-6 h-6" /> : 
                 style.icon === 'AlertCircle' ? <AlertCircle className="w-6 h-6" /> :
                 style.icon === 'BookOpen' ? <BookOpen className="w-6 h-6" /> :
                 style.icon === 'CalendarDays' ? <CalendarDays className="w-6 h-6" /> :
                 style.icon === 'CheckCircle' ? <CheckCircle className="w-6 h-6" /> :
                 <Bell className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-bold text-slate-800 ${!notification.is_read && 'text-blue-900'}`}>{notification.title}</h3>
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-4">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed pr-8">{notification.message}</p>
              </div>
              {!notification.is_read && (
                <div className="w-3 h-3 bg-blue-600 rounded-full mt-2 shrink-0"></div>
              )}
            </div>
          );
        })}
        
        {!loading && filteredNotifications.length === 0 && (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center flex flex-col items-center">
            <Bell className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No notifications</h3>
            <p className="text-sm text-slate-500">You don't have any notifications of this type right now.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default StudentNotifications;
