import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, BookOpen, CalendarDays, Activity, Settings, Calendar, Filter, CheckCircle, Info } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const UserNotifications = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`) // Fetch user-specific and system-wide notifications
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      if (!error) {
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Marked all as read', showConfirmButton: false, timer: 1500 });
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAsRead = async (id, isRead) => {
    if (isRead) return; // Already read
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
        
      if (!error) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const filteredNotifications = notifications.filter(n => filter === 'all' || n.type === filter);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIconData = (type) => {
    switch (type) {
      case 'warning': return { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' };
      case 'error': return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
      case 'success': return { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' };
      case 'info':
      default: return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' };
    }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <Bell className="w-6 h-6 mr-3 text-blue-600" /> Notifications
          {unreadCount > 0 && (
            <span className="ml-4 bg-red-100 text-red-600 text-sm py-1 px-3 rounded-full font-bold">
              {unreadCount} Unread
            </span>
          )}
        </h1>
        <div className="flex space-x-3">
          <button onClick={markAllAsRead} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center shadow-sm">
            <CheckCircle className="w-4 h-4 mr-2" /> Mark all as read
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
          <div className="p-8 text-center text-slate-500">Loading notifications...</div>
        ) : filteredNotifications.map(notification => {
          const { icon: Icon, color, bg, border } = getIconData(notification.type);
          return (
            <div 
              key={notification.id} 
              onClick={() => markAsRead(notification.id, notification.is_read)}
              className={`bg-white rounded-2xl border ${notification.is_read ? 'border-slate-100' : 'border-blue-200 shadow-sm'} p-5 flex items-start space-x-4 transition-all hover:shadow-md cursor-pointer group`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-bold text-slate-800 ${!notification.is_read && 'text-blue-900'}`}>{notification.title}</h3>
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-4">{formatTime(notification.created_at)}</span>
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

export default UserNotifications;
