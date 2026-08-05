import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-100 min-w-[140px] text-xs">
        <p className="font-semibold text-slate-800 mb-2">{label}</p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex justify-between gap-4 py-0.5">
            <span className="font-medium" style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-bold text-slate-700">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const StackedBarChart = ({ data }) => {
  const defaultData = [
    { batch: 'Batch 2021', submitted: 120, pending: 25, overdue: 10 },
    { batch: 'Batch 2022', submitted: 145, pending: 15, overdue: 5 },
    { batch: 'Batch 2023', submitted: 90, pending: 35, overdue: 20 },
    { batch: 'Batch 2024', submitted: 160, pending: 10, overdue: 2 },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="batch" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
          <Bar dataKey="submitted" name="Submitted" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
          <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
          <Bar dataKey="overdue" name="Overdue" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StackedBarChart;
