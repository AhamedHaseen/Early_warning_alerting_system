import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-100 min-w-[140px] text-xs">
        <p className="font-semibold text-slate-800 mb-1">{label}</p>
        <p className="text-indigo-600 font-bold flex justify-between gap-4">
          <span>Enrolled Students:</span> <span>{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const DepartmentEnrollmentChart = ({ data }) => {
  const defaultData = [
    { department: 'Computing', students: 450, color: '#3b82f6' },
    { department: 'Business', students: 380, color: '#8b5cf6' },
    { department: 'Engineering', students: 290, color: '#10b981' }
  ];

  const chartData = data !== undefined ? data : defaultData;
  
  if (chartData.length === 0) {
    return (
      <div className="w-full h-full min-h-[280px] flex items-center justify-center">
        <p className="text-slate-400 text-sm font-medium">No enrollment data available</p>
      </div>
    );
  }

  // Pre-defined colors for departments
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

  return (
    <div className="w-full h-full min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="department" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 11 }} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 11 }} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="students" radius={[4, 4, 0, 0]}>
             {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
             ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DepartmentEnrollmentChart;
