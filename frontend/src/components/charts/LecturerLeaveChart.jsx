import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-100 text-xs">
        <p className="font-semibold text-slate-800">{payload[0].name}</p>
        <p className="font-bold text-slate-600 mt-1">
          {payload[0].value} Requests
        </p>
      </div>
    );
  }
  return null;
}

const LecturerLeaveChart = ({ data }) => {
  const defaultData = [
    { name: 'Approved', value: 0 },
    { name: 'Pending', value: 0 },
    { name: 'Rejected', value: 0 }
  ];

  const chartData = data && data.length > 0 ? data : defaultData;
  const COLORS = ['#10b981', '#f59e0b', '#ef4444']; // Emerald, Amber, Red

  return (
    <div className="w-full h-full min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LecturerLeaveChart;
