import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-100 text-xs">
        <p className="font-semibold text-slate-800">{payload[0].payload.department}</p>
        <p className="font-bold text-indigo-600 mt-1">
          {payload[0].value}% Avg Attendance
        </p>
      </div>
    );
  }
  return null;
}

const DepartmentComparisonChart = ({ data }) => {
  const defaultData = [
    { department: 'Dept A', avgAttendance: 0 }
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <div className="w-full h-full min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
          <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis dataKey="department" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
          <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
          <Bar dataKey="avgAttendance" radius={[0, 4, 4, 0]} barSize={20} fill="#6366f1">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.isMyDept ? '#4f46e5' : '#c7d2fe'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DepartmentComparisonChart;
