import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', attendance: 85, activity: 65 },
  { name: 'Tue', attendance: 88, activity: 72 },
  { name: 'Wed', attendance: 92, activity: 85 },
  { name: 'Thu', attendance: 90, activity: 78 },
  { name: 'Fri', attendance: 95, activity: 90 },
  { name: 'Sat', attendance: 65, activity: 40 },
  { name: 'Sun', attendance: 50, activity: 30 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-slate-100/50 min-w-[150px]">
        <p className="font-semibold text-slate-800 mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm font-medium text-emerald-600 flex items-center justify-between">
            <span>Attendance</span>
            <span>{payload[0].value}%</span>
          </p>
          <p className="text-sm font-medium text-blue-600 flex items-center justify-between">
            <span>Activity</span>
            <span>{payload[1].value}%</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const ActivityTrendChart = () => {
  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey="attendance"
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorAttendance)"
            animationDuration={1500}
          />
          <Area
            type="monotone"
            dataKey="activity"
            stroke="#3b82f6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorActivity)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivityTrendChart;
