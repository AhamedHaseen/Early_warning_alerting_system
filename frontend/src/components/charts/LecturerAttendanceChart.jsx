import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-100 text-xs">
        <p className="font-semibold text-slate-800 uppercase tracking-wider">{payload[0].payload.status}</p>
        <p className="font-bold text-slate-600 mt-1">
          {payload[0].value} Days
        </p>
      </div>
    );
  }
  return null;
}

const LecturerAttendanceChart = ({ data }) => {
  const defaultData = [
    { status: 'Present', count: 0 },
    { status: 'Absent', count: 0 },
    { status: 'Late', count: 0 },
    { status: 'Excused', count: 0 }
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  const getBarColor = (status) => {
    switch(status.toLowerCase()) {
      case 'present': return '#10b981'; // emerald
      case 'absent': return '#ef4444'; // red
      case 'late': return '#f59e0b'; // amber
      case 'excused': return '#3b82f6'; // blue
      default: return '#94a3b8'; // slate
    }
  };

  return (
    <div className="w-full h-full min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
          <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LecturerAttendanceChart;
