import React from 'react';
import { Calendar, CheckCircle2, Clock, AlertTriangle, FileText, UserPlus } from 'lucide-react';

const TimelineActivityChart = ({ activities }) => {
  const defaultActivities = [
    { id: 1, title: 'Final Exam Timetable Published', time: '10 mins ago', type: 'event', icon: Calendar, color: 'text-blue-500 bg-blue-50' },
    { id: 2, title: '25 New Students Registered (Batch 2024)', time: '45 mins ago', type: 'user', icon: UserPlus, color: 'text-emerald-500 bg-emerald-50' },
    { id: 3, title: 'Software Engineering Assignment Due', time: '2 hours ago', type: 'assignment', icon: FileText, color: 'text-amber-500 bg-amber-50' },
    { id: 4, title: 'Attendance Alert: 5 Students < 50%', time: '4 hours ago', type: 'alert', icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
    { id: 5, title: 'Lecturer Consultation Scheduled', time: 'Yesterday', type: 'event', icon: CheckCircle2, color: 'text-purple-500 bg-purple-50' },
  ];

  const items = activities && activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="w-full h-full space-y-3 overflow-y-auto max-h-[320px] pr-1">
      {items.map((item) => {
        const Icon = item.icon || Clock;
        return (
          <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 transition-colors border border-slate-100">
            <div className={`p-2 rounded-lg shrink-0 ${item.color || 'bg-indigo-50 text-indigo-600'}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{item.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineActivityChart;
