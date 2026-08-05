import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-100 min-w-[140px] text-xs">
        <p className="font-semibold text-slate-800 mb-1">{label}</p>
        <p className="text-indigo-600 font-medium flex justify-between gap-4">
          <span>Avg Score:</span> <span>{payload[0].value}%</span>
        </p>
        {payload[1] && (
          <p className="text-emerald-600 font-medium flex justify-between gap-4">
            <span>Pass Rate:</span> <span>{payload[1].value}%</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

const PerformanceTrendChart = ({ data }) => {
  const defaultData = [
    { batch: 'Batch 2021', avgScore: 78, passRate: 85 },
    { batch: 'Batch 2022', avgScore: 82, passRate: 90 },
    { batch: 'Batch 2023', avgScore: 75, passRate: 82 },
    { batch: 'Batch 2024', avgScore: 88, passRate: 95 },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <div className="w-full h-full min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={26}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="batch" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
          <Bar dataKey="avgScore" name="Avg Score" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="passRate" name="Pass Rate" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceTrendChart;
