import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-100 text-xs">
        <p className="font-semibold text-slate-800">{label}</p>
        <p className="font-bold text-indigo-600 mt-1">Avg GPA: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const AreaProgressionChart = ({ data }) => {
  const defaultData = [
    { semester: 'Sem 1 (2022)', gpa: 3.05 },
    { semester: 'Sem 2 (2022)', gpa: 3.12 },
    { semester: 'Sem 1 (2023)', gpa: 3.25 },
    { semester: 'Sem 2 (2023)', gpa: 3.18 },
    { semester: 'Sem 1 (2024)', gpa: 3.38 },
    { semester: 'Sem 2 (2024)', gpa: 3.45 },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <div className="w-full h-full min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="semester" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
          <YAxis domain={[2.0, 4.0]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="gpa" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#gpaGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AreaProgressionChart;
